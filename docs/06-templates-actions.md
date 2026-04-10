# AriseChatbot - 06. Templates y Actions

## 1. Estructura de Plantillas

**Tabla:** `templates`

```sql
CREATE TABLE public.templates (
  id text PRIMARY KEY,
  name text NOT NULL,
  content text NOT NULL,
  category text DEFAULT 'general',
  service_type text,
  trigger text,
  actions jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  priority int DEFAULT 50,
  segment text DEFAULT 'todos',
  workflow text DEFAULT 'general',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

---

## 2. Estructura de Actions (JSONB)

```typescript
type Action = {
  // Identificación
  type: 'button' | 'list' | 'show_document' | 'show_request' 
       | 'redirect' | 'show_message';
  id?: string;
  title?: string;
  content?: string;
  description?: string;
  
  // Navegación
  next_template_id?: string;
  
  // Condiciones
  condition?: {
    requires_document?: boolean;
    required_document_type?: string;  // iva, renta, balance, liquidacion, contrato
    requires_company?: boolean;
    requires_segment?: string;
  };
  
  // Solicitudes
  request_type?: 'quote' | 'document' | 'support';
  
  // Mensaje alternativo (else)
  else_action?: {
    type: 'show_message';
    message: string;
  };
};
```

---

## 3. Búsqueda de Templates

### 3.1 Por Trigger (palabras clave)

**Archivo:** `lib/webhook-handler.ts`

```typescript
async function findTemplateByTrigger(
  text: string, 
  segment?: string | null
): Promise<Template | null> {
  const lowerText = text.toLowerCase().trim();

  const { data: templates } = await getSupabaseAdmin()
    .from('templates')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: false })
    .limit(10);

  for (const t of templates) {
    if (!t.trigger) continue;
    
    const triggers = t.trigger.split(',').map((s: string) => s.trim().toLowerCase());
    if (triggers.some((tr: string) => lowerText.includes(tr))) {
      if (t.segment && t.segment !== 'todos' && t.segment !== segment) continue;
      return t as Template;
    }
  }
  return null;
}
```

### 3.2 Por ID (navegación)

```typescript
async function findTemplateById(
  id: string, 
  segment?: string | null
): Promise<Template | null> {
  const { data: template } = await getSupabaseAdmin()
    .from('templates')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!template) return null;
  if (template.segment && template.segment !== 'todos' && template.segment !== segment) {
    return null;
  }
  
  return template as Template;
}
```

### 3.3 Por Acción (botón)

```typescript
async function findTemplateByActionId(
  actionId: string,
  segment?: string | null
): Promise<Template | null> {
  const { data: templates } = await getSupabaseAdmin()
    .from('templates')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: false })
    .limit(20);

  for (const t of templates) {
    if (!t.actions || t.actions.length === 0) continue;
    if (t.segment && t.segment !== 'todos' && t.segment !== segment) continue;

    const matchedAction = t.actions.find((a: any) => a.id === actionId);
    if (matchedAction && matchedAction.next_template_id) {
      return await findTemplateById(matchedAction.next_template_id, segment);
    }
  }
  return null;
}
```

---

## 4. Condition Engine (Evaluación de Condiciones)

**Archivo:** `lib/condition-engine.ts`

```typescript
interface TemplateContext {
  contact: Contact;
  companies: Company[];
  activeCompanyId: string | null;
  documents: TypedDocument[];
  conversationHistory: ConversationTurn[];
  redirectCount: number;
  customVariables?: Record<string, any>;
}

interface EvaluateResult {
  isVisible: boolean;
  action: Action;
  elseAction?: Action;
  redirectTemplateId?: string;
}

/**
 * Evalúa condiciones de cada acción
 */
export function getFinalActions(
  actions: Action[],
  context: TemplateContext
): {
  buttons: Action[];
  listAction?: Action;
  elseActions: Action[];
  redirectTemplateId?: string;
} {
  const results = actions.map(action => evaluateAction(action, context));
  
  const buttons = results
    .filter(r => r.isVisible && r.action.type === 'button')
    .map(r => r.action);
    
  const listAction = results.find(
    r => r.isVisible && r.action.type === 'list'
  )?.action;
  
  const elseActions = results
    .filter(r => r.elseAction)
    .map(r => r.elseAction!);
  
  const redirectTemplateId = results.find(
    r => r.redirectTemplateId
  )?.redirectTemplateId;

  return { buttons, listAction, elseActions, redirectTemplateId };
}

/**
 * Evalúa condición individual
 */
function evaluateAction(action: Action, context: TemplateContext): EvaluateResult {
  const condition = action.condition;
  
  if (!condition) {
    return { isVisible: true, action };
  }

  // Requiere documento específico
  if (condition.requires_document) {
    if (!context.documents || context.documents.length === 0) {
      return {
        isVisible: false,
        action,
        elseAction: action.else_action
      };
    }
    
    if (condition.required_document_type) {
      const hasType = context.documents.some(d => 
        d.document_type === condition.required_document_type ||
        d.title?.toLowerCase().includes(condition.required_document_type.toLowerCase())
      );
      
      if (!hasType) {
        return {
          isVisible: false,
          action,
          elseAction: action.else_action,
          redirectTemplateId: action.next_template_id
        };
      }
    }
  }

  // Requiere empresa
  if (condition.requires_company) {
    if (!context.activeCompanyId) {
      return {
        isVisible: false,
        action,
        elseAction: action.else_action
      };
    }
  }

  return { isVisible: true, action };
}
```

---

## 5. Ejemplos de Templates

### 5.1 Template con Botones

```json
{
  "id": "welcome_menu",
  "name": "Menú de Bienvenida",
  "content": "Bienvenido a MTZ. ¿En qué puedo ayudarte?",
  "category": "onboarding",
  "trigger": "hola,buenos,hola,start",
  "is_active": true,
  "priority": 100,
  "segment": "todos",
  "actions": [
    {
      "type": "button",
      "id": "btn_existing_docs",
      "title": "📄 Mis Documentos",
      "next_template_id": "menu_documents"
    },
    {
      "type": "button",
      "id": "btn_new_quote",
      "title": "💼 Cotizar Servicios",
      "next_template_id": "menu_quotes"
    },
    {
      "type": "button",
      "id": "btn_human",
      "title": "📞 Hablar con Asesor"
    }
  ]
}
```

### 5.2 Template con Condiciones

```json
{
  "id": "menu_documents",
  "name": "Menú de Documentos",
  "content": "Selecciona una categoría:",
  "category": "documents",
  "is_active": true,
  "priority": 90,
  "segment": "cliente",
  "actions": [
    {
      "type": "button",
      "id": "btn_doc_iva",
      "title": "🧾 Declaración IVA",
      "condition": {
        "requires_document": true,
        "required_document_type": "iva"
      }
    },
    {
      "type": "button",
      "id": "btn_doc_renta",
      "title": "📊 Declaración Renta",
      "condition": {
        "requires_document": true,
        "required_document_type": "renta"
      }
    },
    {
      "type": "button",
      "id": "btn_request_doc",
      "title": "📝 Solicitar Documento",
      "request_type": "document"
    }
  ]
}
```

### 5.3 Template con Lista

```json
{
  "id": "company_select",
  "name": "Seleccionar Empresa",
  "content": "Selecciona tu empresa:",
  "category": "company",
  "is_active": true,
  "priority": 80,
  "actions": [
    {
      "type": "list",
      "title": "Ver empresas",
      "description": "[\n  {\"id\": \"emp_1\", \"title\": \"Empresa A\", \"description\": \"RUT: 12345678\"},\n  {\"id\": \"emp_2\", \"title\": \"Empresa B\", \"description\": \"RUT: 87654321\"}\n]"
    }
  ]
}
```

### 5.4 Template de Redirección

```json
{
  "id": "redirect_to_iva",
  "name": "Redirección IVA",
  "content": "Aquí están tus declaraciones IVA:",
  "category": "documents",
  "trigger": "iva,declaración",
  "is_active": true,
  "priority": 95,
  "actions": [
    {
      "type": "show_document",
      "document_type": "iva"
    }
  ]
}
```

---

## 6. Botones del Sistema

| # | ID | Descripción |
|---|-----|-------------|
| 1 | btn_is_client_yes | "Soy cliente" |
| 2 | btn_is_client_no | "No soy cliente" |
| 3 | btn_existing_docs | "Mis documentos" |
| 4 | btn_existing_request_doc | "Solicitar documento" |
| 5 | btn_existing_tax | "Impuestos" |
| 6 | btn_existing_human | "Hablar con persona" |
| 7 | btn_new_quote | "Cotizar servicios" |
| 8 | btn_new_info | "Más información" |
| 9 | btn_new_human | "Hablar con persona" |
| 10 | btn_doc_cat_tax | "Impuestos" |
| 11 | btn_doc_iva | "Declaración IVA" |
| 12 | btn_doc_renta | "Declaración Renta" |
| 13 | btn_doc_balance | "Balance" |

---

## 7. Segmentos

| # | Segmento | Descripción |
|---|----------|-------------|
| 1 | cliente | Cliente existente |
| 2 | prospecto | Prospecto (no cliente) |
| 3 | todos | Todos los segmentos |

---

## 8. Workflows

| # | Workflow | Descripción |
|---|----------|-------------|
| 1 | general | Flujo general |
| 2 | onboarding | Bienvenida |
| 3 | documents | Documentos |
| 4 | quotes | Cotizaciones |