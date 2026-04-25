# 🏛️ ARISE BUSINESS OS v10.1 (Diamond)

**Next-Generation AI-Powered Business Intelligence Platform**

> *"The Synthetic Architect" - OuroborusAI Intelligence Engine*

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com)
[![Protocol](https://img.shields.io/badge/Protocol-v61_Interactive-orange)](https://github.com/arise/diamond)

---

## 📋 ÍNDICE

1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Flujos Principales](#flujos-principales)
5. [Configuración](#configuración)
6. [Despliegue](#despliegue)

---

## 🏗️ ARQUITECTURA DEL SISTEMA

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ARISE BUSINESS OS v10.1                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐            │
│  │   Frontend   │◄───►│   Backend    │◄───►│   External   │            │
│  │   Next.js 16 │     │   Supabase   │     │   Services   │            │
│  │   React 19   │     │   Edge Func  │     │   WhatsApp   │            │
│  └──────────────┘     └──────────────┘     └──────────────┘            │
│         │                    │                    │                     │
│         ▼                    ▼                    ▼                     │
│  ┌────────────────────────────────────────────────────────────┐        │
│  │                    Data Layer                               │        │
│  │  Postgres + Realtime + RLS (Multi-tenant)                  │        │
│  └────────────────────────────────────────────────────────────┘        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Componentes Principales

| Componente | Tecnología | Propósito |
|------------|------------|-----------|
| **Frontend** | Next.js 16 + React 19 | UI/UX responsive con App Router |
| **Backend** | Supabase Edge Functions | Serverless functions con Deno |
| **Database** | PostgreSQL + Supabase | DB relacional con realtime |
| **AI Engine** | Gemini 2.5 Flash-Lite | Procesamiento de lenguaje natural |
| **Messaging** | WhatsApp Business API | Comunicación con usuarios |
| **Payments** | MercadoPago | Procesamiento de pagos |

---

## 💻 STACK TECNOLÓGICO

### Core
- **Framework:** Next.js 16.2.4 (App Router)
- **Lenguaje:** TypeScript 5.x
- **UI Library:** React 19.2.4
- **Estilos:** TailwindCSS 4.x

### Backend & Data
- **BaaS:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Edge Functions:** Deno runtime
- **ORM:** Supabase JS Client v2.103.3

### IA & Messaging
- **LLM:** Google Gemini 2.5 Flash-Lite
- **WhatsApp:** Meta WhatsApp Business Cloud API
- **PDF:** Puppeteer + Handlebars

### Pagos
- **Gateway:** MercadoPago SDK v2.12.0

---

## 📁 ESTRUCTURA DEL PROYECTO

```
ouroborus-ai/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API Routes (Next.js)
│   │   │   ├── neural-processor/ # Ejecuta acciones de IA
│   │   │   ├── ocr-processor/    # Procesa imágenes con Gemini Vision
│   │   │   ├── pdf/              # Genera PDFs con Puppeteer
│   │   │   ├── whatsapp/send/    # Envía mensajes WhatsApp
│   │   │   └── webhook/whatsapp/ # Webhook de Meta
│   │   ├── dashboard/            # Vista general del sistema
│   │   ├── crm/                  # Gestión de contactos y clientes
│   │   ├── inventory/            # Control de inventario
│   │   ├── messages/             # Centro de mensajes
│   │   ├── studio/               # Configuración de IA y prompts
│   │   ├── vault/                # Documentos y archivos
│   │   ├── billing/              # Facturación y pagos
│   │   ├── team/                 # Gestión de equipo
│   │   ├── company/              # Configuración de empresa
│   │   ├── users/                # Gestión de usuarios
│   │   └── auth/login/           # Autenticación
│   │
│   ├── components/               # Componentes React
│   │   ├── ui/                   # Componentes base (MetricSmall, etc.)
│   │   ├── crm/                  # Componentes específicos de CRM
│   │   ├── inventory/            # Componentes específicos de Inventario
│   │   ├── studio/               # Componentes de Studio
│   │   ├── Sidebar.tsx           # Navegación principal
│   │   ├── MobileNav.tsx         # Navegación móvil
│   │   └── CompanySelector.tsx   # Selector multi-empresa
│   │
│   ├── contexts/                 # React Contexts
│   │   ├── AuthContext.tsx       # Estado de autenticación
│   │   └── ActiveCompanyContext.tsx  # Empresa activa (multi-tenant)
│   │
│   ├── lib/                      # Utilidades y servicios
│   │   ├── design-tokens.ts      # Sistema de diseño unificado
│   │   ├── whatsapp-types.ts     # Tipos TypeScript para WhatsApp
│   │   ├── whatsapp-parser.ts    # Parser de mensajes interactivos
│   │   ├── supabase.ts           # Cliente Supabase
│   │   └── pdf/templates.ts      # Templates de PDF
│   │
│   ├── types/                    # Tipos TypeScript
│   │   ├── api.ts                # Tipos de APIs
│   │   └── database.ts           # Tipos generados de Supabase
│   │
│   └── utils/                    # Utilidades SSR/Server
│       └── supabase/
│           ├── server.ts         # Cliente para Server Components
│           ├── client.ts         # Cliente para Client Components
│           └── middleware.ts     # Middleware de auth
│
├── supabase/
│   └── functions/                # Edge Functions (Deno)
│       ├── whatsapp-webhook/     # Webhook principal de WhatsApp
│       ├── document-processor/   # Procesa documentos subidos
│       ├── whatsapp-responder/   # Respuestas automáticas
│       ├── mercadopago-webhook/  # Webhook de pagos
│       └── arise-neural-engine/  # Motor de IA (Diamond v10.1)
│
├── scripts/                      # Scripts de desarrollo y auditoría
│   ├── code-audit.ts             # Auditoría de código estático
│   ├── dependency-check.ts       # Verifica imports y dependencias
│   ├── schema-validator.ts       # Valida schema de Supabase
│   ├── auto-cleanup.ts           # Corrige inconsistencias automáticamente
│   └── neural_diagnostic.ts      # Test end-to-end de WhatsApp
│
├── public/                       # Assets estáticos
├── package.json
├── tsconfig.json
└── next.config.ts
```

---

## 🔄 FLUJOS PRINCIPALES

### 1. Flujo de Mensaje WhatsApp → IA → Respuesta

```
Usuario ──► WhatsApp Cloud API ──► Webhook (Deno) ──► Supabase (Insert)
                                                              │
                                                              ▼
Usuario ◄── WhatsApp Send API ◄── Gemini 2.5 Flash-Lite ◄── Supabase (Select)
```

**Pasos detallados:**

1. **Ingesta:** Usuario envía mensaje → WhatsApp Cloud API → Webhook Deno
2. **Persistencia:** Webhook guarda mensaje en `messages` table
3. **Identidad:** Resuelve `company_id` y `contact_id` (multi-tenant routing)
4. **Contexto:** Obtiene prompt personalizado de `ai_prompts` table
5. **Inferencia:** Llama a Gemini 2.5 Flash-Lite con contexto del usuario
6. **Parseo Diamond v61:** Detecta inteligentemente formato `---` y `|` para generar Listas y Botones dinámicos
7. **Respuesta Interactiva:** Envía payload `list` o `button` por WhatsApp API
8. **Acción:** Si hay bloques `[[...]]`, trigger a `/api/neural-processor`

### 2. Flujo de Acción Neural ([[...]])

```
IA Genera [[{action}]] ──► Neural Processor API ──► Ejecuta Acción
                                                        │
           ┌────────────────────────────────────────────┼────────────────────────────────────────────┐
           ▼                                            ▼                                            ▼
    inventory_create/add                          task_create                                 pdf_generate
```

**Acciones soportadas:**

| Acción | Descripción | Tablas afectadas |
|--------|-------------|------------------|
| `inventory_create` | Crea nuevo ítem | `inventory_items`, `inventory_transactions` |
| `inventory_add` | Suma stock existente | `inventory_transactions` |
| `inventory_remove` | Resta stock existente | `inventory_transactions` |
| `task_create` | Crea tarea/recordatorio | `service_requests` |
| `pdf_generate` | Genera y envía PDF | `messages` (log) |

### 3. Flujo Multi-Tenant (Company Isolation)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     ActiveCompanyContext                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │  Company A  │  │  Company B  │  │   Global    │                 │
│  │  (isolated) │  │  (isolated) │  │  (all data) │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    RLS Policies (Supabase)                          │
│  company_id = current_setting('app.current_company_id')            │
└─────────────────────────────────────────────────────────────────────┘
```

**Niveles de aislamiento:**

1. **Frontend:** `ActiveCompanyContext` provee `activeCompanyId`
2. **Query:** Todas las queries filtran por `company_id`
3. **Database:** RLS policies previenen acceso cruzado
4. **Global:** Usuario `ouroborusai@gmail.com` ve todos los datos

---

## ⚙️ CONFIGURACIÓN

### Variables de Entorno

Crear `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=EAA...
WHATSAPP_PHONE_NUMBER_ID=1234567890
WHATSAPP_VERIFY_TOKEN=arise_verify_2026

# Google Gemini AI
GEMINI_API_KEY=AIzaSy...

# App URL (production)
APP_URL=https://your-domain.com

# MercadoPago (opcional)
MP_ACCESS_TOKEN=APP_USR-...
MP_PUBLIC_KEY=APP_USR-...
```

### Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo
npm run build            # Build de producción
npm run start            # Iniciar servidor de producción

# Auditoría y calidad
npm run audit            # Analizar código en busca de problemas
npm run deps             # Verificar imports y dependencias
npm run cleanup          # Corregir inconsistencias automáticamente
npm run analyze          # Audit + deps combinados
npm run diagnostic       # Test end-to-end de WhatsApp
```

---

## 🚀 DESPLIEGUE

### 1. Vercel (Recomendado)

```bash
# Conectar repo a Vercel
vercel link

# Deploy a production
vercel --prod
```

**Variables en Vercel:**
- Configurar todas las variables de `.env.local` en Vercel Dashboard
- Habilitar `Serverless Functions` para APIs routes

### 2. Supabase Edge Functions

```bash
# Login a Supabase
supabase login

# Link al proyecto
supabase link --project-ref your-project-ref

# Deploy de funciones
supabase functions deploy mercadopago-webhook
supabase functions deploy arise-neural-engine
supabase functions deploy mercadopago-webhook
```

### 3. WhatsApp Webhook

Configurar en Meta Developers Dashboard:

```
Webhook URL: https://your-project.supabase.co/functions/v1/whatsapp-webhook
Verify Token: (el que configuraste en WHATSAPP_VERIFY_TOKEN)
```

**Suscribirse a eventos:**
- `messages`
- `message_deliveries`
- `message_reads`

---

## 📊 MÉTRICAS Y TELEMETRÍA

El sistema registra automáticamente:

| Métrica | Tabla | Propósito |
|---------|-------|-----------|
| Tokens IA | `ai_api_telemetry` | Costos y uso de Gemini |
| Latencia | `ai_api_telemetry` | Performance de respuestas |
| Mensajes | `messages` | Historial de conversaciones |
| Transacciones | `inventory_transactions` | Kardex de inventario |
| Pagos | `subscriptions` | Estado de suscripciones |

---

## 🛡️ SEGURIDAD

### Row Level Security (RLS)

Todas las tablas tienen RLS habilitado:

```sql
-- Ejemplo: contacts table
CREATE POLICY "Company isolation" ON contacts
  FOR ALL USING (company_id = current_setting('app.current_company_id')::uuid);
```

### Multi-Tenant Isolation

1. **Frontend:** `ActiveCompanyContext` inyecta `company_id` en cada query
2. **Backend:** Edge Functions usan `SUPABASE_SERVICE_ROLE_KEY` con RLS
3. **Database:** Policies previenen acceso cruzado entre empresas

### API Keys & Secrets

- **Nunca** exponer `SUPABASE_SERVICE_ROLE_KEY` en cliente
- **Nunca** exponer `GEMINI_API_KEY` en cliente
- Usar `/api/*` routes como proxy seguro

---

## 📖 DOCUMENTACIÓN ADICIONAL

| Documento | Ubicación |
|-----------|-----------|
| Design System | `src/components/ui/README.md` |
| Design Tokens | `src/lib/design-tokens.ts` |
| WhatsApp Types | `src/lib/whatsapp-types.ts` |
| WhatsApp Parser | `src/lib/whatsapp-parser.ts` |
| API Types | `src/types/api.ts` |

---

## 🤝 CONTRIBUCIÓN

### Comandos de Desarrollo

```bash
# Antes de commitear
npm run audit              # Verificar problemas
npm run cleanup            # Auto-corregir si es posible
npm run deps               # Verificar imports

# Para nuevas features
# 1. Crear rama feature/nueva-funcionalidad
# 2. Desarrollar con tipos TypeScript estrictos
# 3. Actualizar documentación si cambia arquitectura
```

### Convención de Commits

```
feat: Nueva funcionalidad
fix: Corrección de bug
docs: Cambios en documentación
style: Cambios de estilo (formato, semicolones)
refactor: Refactorización de código
test: Agregar/modificar tests
chore: Cambios en build/config
```

---

## 📞 SOPORTE

**Equipo:** Arise Intelligence  
**Versión:** v10.1 Diamond Protocol (Robust v61)  
**Última actualización:** 2026-04-25

---

*Arise Business OS - The Synthetic Architect*
