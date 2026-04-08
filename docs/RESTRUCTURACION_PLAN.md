# Plan de Reestructuración del Webhook Handler

## 📊 Estado Actual
- **Archivo**: `lib/webhook-handler.ts`
- **Líneas**: ~1027 líneas (muy grande)
- **Problema**: Funciones mezcladas, lógica repetida, difícil mantener

---

## 🎯 Estructura Propuesta

### Separar en módulos específicos:

```
lib/
├── handlers/
│   ├── webhook-handler.ts       (Solo orchestration - ~100 líneas)
│   ├── classification-handler.ts (Clasificación cliente/prospecto)
│   ├── documents-handler.ts    (Documentos, PDF, IVAs)
│   ├── company-handler.ts      (Selección de empresas)
│   ├── menu-handler.ts         (Menús interactivos)
│   └── ai-handler.ts           (Gemini fallback)
│
├── services/
│   ├── whatsapp-service.ts     (Envío de mensajes - ya existe)
│   ├── database-service.ts      (DB - ya existe)
│   └── ai-service.ts           (Gemini - ya existe)
│
└── types/
    └── webhook-types.ts        (Types interfaces)
```

---

## 🔧 Estructura del webhook-handler.ts (reducido)

```typescript
// lib/handlers/webhook-handler.ts (~150 líneas)

// IMPORTS
import { handleClassification } from './classification-handler';
import { handleDocuments } from './documents-handler';
import { handleCompanies } from './company-handler';
import { handleMenu } from './menu-handler';
import { handleAI } from './ai-handler';

// CONSTANTS - Solo IDs de botones
const BUTTONS = {
  CLIENT: { YES: 'btn_is_client_yes', NO: 'btn_is_client_no' },
  MENU: { DOCS: 'btn_existing_docs', TAX: 'btn_existing_tax', ... },
  DOCS: { IVA: 'btn_doc_iva', RENTA: 'btn_doc_renta', ... },
};

// MAIN FUNCTION
export async function handleInboundUserMessage(data) {
  // 1. Setup básico (contact, conversation, chatbot status)
  const { contact, conversation } = await setup(data);
  
  // 2. Guardar mensaje del usuario
  await saveUserMessage(conversation, data);
  
  // 3. Si es botón interactivo → handler específico
  if (data.interactive) {
    return handleInteractive(data, contact, conversation);
  }
  
  // 4. Clasificación automática (si no tiene segment)
  if (!contact.segment) {
    await autoClassifyAsProspect(contact);
  }
  
  // 5. Si es saludo → enviar menú apropiado
  if (isGreeting(data.text) && contact.segment) {
    await sendWelcomeMenu(data.from, contact);
    return;
  }
  
  // 6. Router de última acción (períodos, solicitudes)
  const lastAction = await getLastAction(conversation);
  if (lastAction) {
    const response = await handleLastAction(lastAction, data.text, contact);
    if (response) return response;
  }
  
  // 7. Fallback a IA
  await handleAI(contact, conversation, data.text);
}
```

---

## 📋 Handlers Separados

### 1. classification-handler.ts
```typescript
// Maneja clasificación cliente/prospecto
export async function handleClassification(interactive, contact) {
  if (interactive === BUTTONS.CLIENT.YES) {
    await updateSegment(contact.id, 'cliente');
    return { type: 'menu_cliente', name: contact.name };
  }
  if (interactive === BUTTONS.CLIENT.NO) {
    await updateSegment(contact.id, 'prospect');
    return { type: 'menu_prospecto' };
  }
  return null;
}

export async function autoClassifyAsProspect(contact) {
  await updateSegment(contact.id, 'prospect');
  contact.segment = 'prospect';
}
```

### 2. documents-handler.ts
```typescript
// Maneja documentos, IVAs, PDFs
export async function handleDocuments(interactive, contact, companyId) {
  // Botones de documentos específicos (iva_xxx, renta_xxx)
  if (interactive.startsWith('iva_')) {
    return await sendDocumentById(interactive.replace('iva_', ''));
  }
  // ... etc
}

export async function handleLastPeriodAction(lastBtn, text, contact, companyId) {
  if (lastBtn === 'btn_doc_iva') {
    return await sendIVA(text, contact, companyId);
  }
  // ... etc
}
```

### 3. company-handler.ts
```typescript
// Selección de empresa
export async function handleCompanySelection(interactive, text, companies) {
  // Botón de empresa específica
  // Texto libre para buscar empresa
}
```

### 4. menu-handler.ts
```typescript
// Envío de menús interactivos
export async function sendWelcomeMenu(phoneNumber, contact) {
  if (contact.segment === 'cliente') {
    return sendClientMenu(phoneNumber, contact);
  }
  return sendProspectMenu(phoneNumber);
}

export async function sendClientMenu(phoneNumber, contact) {
  // Construir botones según documentos disponibles
}

export async function sendProspectMenu(phoneNumber) {
  // Botones: Cotizar, Info, Estado solicitud, Asesor
}
```

### 5. ai-handler.ts
```typescript
// Gemini fallback
export async function handleAI(contact, conversation, userMessage) {
  // Build prompt, call Gemini, send response
}
```

---

## ✅ Beneficios

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Líneas por archivo** | ~1000 | ~150 |
| **Mantenimiento** | Difícil | Fácil por módulo |
| **Testing** | Impossible | Por handler |
| **Errores** | Difícil rastrear | Fácil identificar |
| **Nuevas funciones** | Agregar al final | Crear handler nuevo |

---

## 📝 Plan de Implementación

1. **Crear carpeta** `lib/handlers/`
2. **Crear archivo de tipos** `lib/types/webhook.ts`
3. **Extraer funciones** una por una (no cambiar lógica, solo mover)
4. **Mantener compatibilidad** mientras se refactoriza
5. **Probar cada módulo** antes de mover al siguiente

---

## 🚀 Ejecución Recomendada

**Fase 1**: Crear estructura de carpetas y tipos
**Fase 2**: Mover classification-handler
**Fase 3**: Mover menu-handler  
**Fase 4**: Mover documents-handler
**Fase 5**: Mover company-handler
**Fase 6**: Mover ai-handler
**Fase 7**: Limpiar webhook-handler.ts principal
**Fase 8**: Testing completo

¿Quieres que inicie con la implementación?