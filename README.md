# MTZ Chatbot - Agente de Atención WhatsApp

Chatbot WhatsApp con IA (Gemini/OpenAI), dashboard admin y Supabase para despacho contable.

## 🚀 Stack

- **Next.js 14** - Framework fullstack
- **React 18** - UI
- **Supabase** - Database + Auth
- **Gemini/OpenAI** - IA generativa
- **Tailwind CSS** - Estilos
- **TypeScript** - Type safety

## 📦 Instalación

```bash
npm install
cp .env.local.example .env.local
# Rellenar .env.local con tus credenciales
npm run dev
```

## 🔗 Endpoints API

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/webhook` | POST | Webhook de WhatsApp (procesa mensajes) |
| `/api/test-ai` | POST | Test de IA sin WhatsApp |
| `/api/test-message` | POST | Test completo (guardar + responder) |
| `/api/contacts` | GET/POST | Listar/crear contactos |
| `/api/companies` | GET/POST | Listar/crear empresas |
| `/api/client-documents` | GET/POST | Listar/crear documentos de cliente |
| `/api/templates` | GET/POST | Listar/crear plantillas de mensajes |
| `/api/metrics` | GET | Estadísticas del sistema |
| `/api/check-env` | GET | Verificar variables de entorno |

## 📱 Dashboard Admin

El dashboard incluye las siguientes secciones:

| Ruta | Descripción |
|------|-------------|
| `/dashboard` | Chat en tiempo real - Responde a clientes directamente |
| `/dashboard/companies` | Gestión de empresas y documentos (IVA, Sueldos, Libros) |
| `/dashboard/clients` | Gestión de clientes, envío de mensajes y documentos |
| `/dashboard/templates` | Editor de plantillas con botones y listas |
| `/dashboard/metrics` | Métricas y estadísticas del chatbot |

### Pestañas de Empresas (`/dashboard/companies`)
- **IVA** - Grid de 12 meses por año con documentos de declaración
- **Sueldos** - Liquidaciones de personal
- **Libros** - Libros contables
- **Otros** - Documentos adicionales

### Editor de Plantillas (`/dashboard/templates`)
- **Botones** - Hasta 3 botones interactivos por mensaje
- **Listas** - List Messages con hasta 10 opciones (para menús grandes)
- **Triggers** - Palabras clave que disparan la plantilla
- **Navegación** - Conectar plantillas con `next_template_id`

## 🗄️ Base de datos

### Tablas principales

```sql
-- Contactos (clientes y prospectos)
contacts: id, phone_number, name, email, segment, metadata, ...

-- Empresas vinculadas a contactos
companies: id, contact_id, legal_name, rut, ...

-- Conversaciones
conversations: id, phone_number, contact_id, active_company_id, chatbot_enabled, ...

-- Mensajes del historial
messages: id, conversation_id, role (user/assistant), content, ...

-- Documentos de clientes
client_documents: id, contact_id, company_id, title, file_url, ...

-- Plantillas de mensajes
templates: id, name, content, trigger, actions (JSON), segment, priority, ...
```

### Relaciones
- `contacts` 1:N `companies`
- `contacts` 1:N `conversations`
- `conversations` 1:N `messages`
- `contacts` 1:N `client_documents`
- `companies` 1:N `client_documents`

## 🔐 Configuración de entorno

Ver [.env.local.example](.env.local.example) para variables requeridas.

**Variables obligatorias:**
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`
- Una de: `GEMINI_API_KEY`, `OPENAI_API_KEY`

**Nota:** `.env.local` nunca se sube a git.

## 🧪 Desarrollo

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run lint     # Lint
```

## 📱 WhatsApp Setup

1. Crear app en Meta Developer Console
2. Configurar webhook en `/api/webhook`
3. Obtener: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`
4. Agregar a `.env.local`
5. Si el token expira, regenerar en Meta y actualizar en `.env.local`

## 📚 Documentación adicional

- [PROMPT_CONTINUAR.md](PROMPT_CONTINUAR.md) - Estado del proyecto e integración de List Messages
- [SUPABASE_SQL_GUIDE.md](SUPABASE_SQL_GUIDE.md) - Guía de SQL para Supabase
- [AGENT_PROMPT.md](AGENT_PROMPT.md) - Prompt del sistema de IA
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Guía rápida de referencia

## ⚙️ Despliegue (Vercel)

```bash
git push origin main
# Vercel auto-deploya
```

Habilitar variables de entorno en Vercel Project Settings.

---

**Creado:** 2026 | **Stack:** Next.js + Supabase + Gemini