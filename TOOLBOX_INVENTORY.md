# 🛠️ INVENTARIO DE HERRAMIENTAS Y TECNOLOGÍAS - AriseChatbot

## 📦 DEPENDENCIAS DEL PROYECTO

### Framework & Runtime
```json
{
  "next": "14.2.15",              // Framework fullstack React
  "react": "^18",                 // UI Library
  "react-dom": "^18",             // React DOM rendering
  "typescript": "^5"              // Lenguaje: TypeScript
}
```

### Backend & Database
```json
{
  "@supabase/supabase-js": "^2.45.4",  // Cliente Supabase (queries)
  "@supabase/ssr": "^0.5.2"            // Server-side rendering seguro
}
```

### AI & Machine Learning
```json
{
  "@google/generative-ai": "^0.24.1",  // Google Gemini AI
  "openai": "^4.77.0"                  // OpenAI ChatGPT
}
```

### Styling
```json
{
  "tailwindcss": "^3.4.19",     // CSS utility framework
  "autoprefixer": "^10.4.27",   // Vendor prefixes automático
  "postcss": "^8.5.8"           // CSS processor
}
```

### Dev Dependencies
```json
{
  "@types/node": "^20",         // Node.js types
  "@types/react": "^18",        // React types
  "@types/react-dom": "^18"     // React DOM types
}
```

**Total de dependencias:** ~10 librerías principales

---

## 🌐 APIs EXTERNAS

| API | Proveedor | Propósito | Version | Autenticación |
|-----|-----------|----------|---------|---------------|
| **WhatsApp Cloud** | Meta | Enviar/recibir mensajes | v25.0 | Bearer Token (WHATSAPP_ACCESS_TOKEN) |
| **Google Gemini** | Google | IA generativa | Latest | API Key (GEMINI_API_KEY) |
| **OpenAI ChatGPT** | OpenAI | IA generativa | Latest | API Key (OPENAI_API_KEY) |
| **Supabase REST** | Supabase | Database CRUD | v1 | JWT Token (SUPABASE_ANON_KEY) |
| **Ollama (opcional)** | Local | IA local alternative | - | No auth (localhost:11434) |

---

## 🗄️ INFRAESTRUCTURA

### Base de Datos: Supabase PostgreSQL
```
Proveedor:       Supabase (PostgreSQL managed)
Tablas:          3 (contacts, conversations, messages)
Indexes:         3 (phone-based para queries rápidas)
Triggers:        2 (updated_at automático)
RLS:             DESHABILITADO (desarrollo - ACTIVAR para prod)
Backups:         Supabase automático (ver planes)
```

### Hosting: Vercel (recomendado para Next.js)
```
Framework:       Next.js 14
Deployment:      Vercel / otro (agnostic)
Endpoints:       /api/* (serverless functions)
Environment:     Node.js 18+
```

### Webhooks: Meta
```
Endpoint:        POST /api/webhook
Verificación:    GET /api/webhook (verification token)
Formato:         JSON
Max Payload:     ~1MB
Reintentos:      Meta reintenta 5 veces en 5 min
```

---

## ⚙️ HERRAMIENTAS DE DESARROLLO

### Desarrollo Local
```bash
npm run dev       # Next.js dev server (port 3000)
npm run build     # Build para producción
npm run start     # Inicia servidor de producción
npm run lint      # ESLint check
```

### Testing & Debugging
```bash
test-webhook.json     # Ejemplo de payload de webhook
test-ai.js           # Test script para Gemini/OpenAI
test-message.js      # Test completo (guardar + responder)
test-gemini.js       # Test específico de Gemini
test-webhook-meta.js # Simulación de webhook
```

### Database Management
```
Supabase Console    # GUI para ver tablas/datos
SQL Editor          # Ejecutar migrations
API Inspector       # Ver requests/responses
```

---

## 🗂️ ARCHIVOS CONFIG

### Configuración Node/Next
```
tsconfig.json              TypeScript config
next.config.js             Next.js config (minimal)
package.json               Dependencies manifest
next-env.d.ts              Auto-generated Next.js types
```

### Configuración Styling
```
tailwind.config.ts         Tailwind CSS customization
postcss.config.mjs         PostCSS plugins
```

### Configuración Middleware
```
middleware.ts              Next.js middleware (auth protection)
```

### Archivos de Documentación
```
ANALYSIS_PLAN.md                Plan de análisis completo
WHATSAPP_ASSISTANT_SKILL.md     Este skill para el asistente
AGENT_PROMPT.md                 Prompt del sistema IA
SUPABASE_SQL_GUIDE.md           Guía de SQL
README.md                       Overview del proyecto
```

### Archivos SQL
```
supabase/schema.sql              Schema inicial (3 tablas)
supabase/cleanup-database.sql    Script para limpiar datos
disable-rls.sql                  Deshabilitador de RLS
setup-new-supabase.sql           Setup de Supabase nuevo
```

---

## 📋 AMBIENTE & VARIABLES

### Variables Requeridas de WhatsApp
```
WHATSAPP_ACCESS_TOKEN          Obligatorio    Token Meta
WHATSAPP_PHONE_NUMBER_ID       Obligatorio    ID del número
WHATSAPP_VERIFY_TOKEN          Obligatorio    Para webhook verification
WHATSAPP_IGNORE_INBOUND_FROM   Opcional       Filtrar números
```

### Variables Requeridas de IA (al menos UNA)
```
GEMINI_API_KEY                 Opcional*      Google Gemini
OPENAI_API_KEY                 Opcional*      OpenAI
OLLAMA_API_URL                 Opcional       Local Ollama
OLLAMA_MODEL                   Opcional       Default: llama2
AI_BACKEND                     Opcional       Fuerza: gemini|openai|ollama
OPENAI_MODEL                   Opcional       Default: gpt-4
```
*Se necesita al menos UNA para que funcione

### Variables Requeridas de Supabase
```
SUPABASE_URL                   Obligatorio    https://xxxx.supabase.co
SUPABASE_ANON_KEY              Obligatorio    JWT público
```

### Variables Opcionales del Sistema
```
NODE_ENV                       development | production
```

**Total de variables:** ~13 (¡NO guardar en código!)

---

## 🔌 INTEGRACIONES

### ✅ Integradas
- [x] **WhatsApp Cloud API** - Envío/recepción de mensajes
- [x] **Google Gemini AI** - Generación de respuestas
- [x] **OpenAI ChatGPT** - Alternativa de IA
- [x] **Supabase PostgreSQL** - Storage de contactos/mensajes
- [x] **Ollama (local)** - Alternative local IA

### 🔄 Opcionalmente Integrable
- [ ] **Versionamiento de respuestas** - Historial de cambios
- [ ] **Análisis de sentimientos** - NLP adicional
- [ ] **Webhooks salientes** - Notificaciones a otros sistemas
- [ ] **SMS alternativo** - Twilio/Nexmo
- [ ] **Multi-canal** - Telegram, Facebook, Web

### ❌ No Integradas (Pero planificables)
- [ ] Cache (Redis)
- [ ] Queue system (Bull, RabbitMQ)
- [ ] Analytics (Mixpanel, Segment)
- [ ] CRM integration (Salesforce, HubSpot)
- [ ] Payment system (Stripe)

---

## 🏗️ ARQUITECTURA ACTUAL

### Serverless Functions
```
/api/webhook          POST/GET    Procesa mensajes WhatsApp
/api/contacts         GET/POST    CRUD de contactos
/api/test-ai          POST        Test de IA
/api/test-message     POST        Test completo
/api/metrics          GET         Estadísticas
/api/health           GET         Health check
```

### Backend Services (lib/)
```
whatsapp-service.ts   Envío a Meta API
ai-service.ts         Orquestación de IA
database-service.ts   CRUD de BD
webhook-handler.ts    Procesamiento core
supabase-admin.ts     Cliente Supabase
gemini-model.ts       Config de Gemini
utils.ts              Utilidades comunes
```

### Frontend (app/)
```
layout.tsx            Layout base
page.tsx              Página inicio
dashboard/            Dashboards
  - page.tsx          Dashboard principal
  - metrics/          Páginas de métricas
login/                Login page
components/           Componentes reutilizables
```

---

## 🚀 ESCALABILIDAD - HOJA DE RUTA

### Corto Plazo (Ya hecho)
- [x] Integración WhatsApp
- [x] Backend IA flexible
- [x] Base de datos estructurada
- [x] Webhooks seguros

### Mediano Plazo (Recomendado)
- [ ] **Queue system** - Para procesar muchos mensajes
- [ ] **Cache layer** - Para historial/prompts
- [ ] **Rate limiting** - Protección contra abuse
- [ ] **Better logging** - Centralizado (Supabase, LogRocket)
- [ ] **Monitoring** - Uptime, errors (Sentry)

### Largo Plazo (Escalabilidad)
- [ ] **Multi-región** - Replicación de BD
- [ ] **CDN** - Para assets estáticos
- [ ] **Load balancing** - Multiple instances
- [ ] **Microservicios** - Separar IA/BD/Webhooks
- [ ] **Message queue** - Rabbitmq, Bull

---

## 📊 SERVICIOS EXTERNOS - CHECKLIST

### Para funcionamiento MÍNIMO necesitas:
- [ ] Cuenta Supabase (gratis)
- [ ] Meta Business Account (para WhatsApp)
- [ ] Gemini API Key (gratis, limitado) O OpenAI (pago)
- [ ] Dominio propio (para webhook URL)

### Para PRODUCCIÓN recomendado:
- [ ] Supabase Pro/Business
- [ ] Meta Business Manager verificado
- [ ] OpenAI plan medio+ (mayor cuota)
- [ ] Dominio con SSL
- [ ] Monitoring (Sentry, Better Stack, etc)

---

## 🎛️ CONFIGURACIÓN RECOMENDADA (Dev → Prod)

### Development
```
AI_BACKEND=gemini         (gratis, rápido)
NODE_ENV=development
RLS=disabled
```

### Staging
```
AI_BACKEND=openai         (más consistente)
NODE_ENV=production
RLS=partially enabled
```

### Production
```
AI_BACKEND=openai         (o modelo custom)
NODE_ENV=production
RLS=fully enabled
Rate limiting=enabled
Monitoring=enabled
```

---

## 🔐 SEGURIDAD - TOOLBOX

### Herramientas/Prácticas Actuales
- [x] TypeScript (type safety)
- [x] Environment variables (.env.local)
- [x] Error handling centralizado
- [x] Validaciones de entrada
- [x] HTTPS/TLS (requiredo para webhooks)

### Herramientas Recomendadas a Agregar
- [ ] **Sentry** - Error tracking
- [ ] **Supabase Auth** - Proteger endpoints
- [ ] **OWASP validator** - Input sanitization
- [ ] **Rate limiting** - DDoS/abuse protection
- [ ] **Secrets manager** - AWS Secrets, Vault

---

## 📈 MONITOREO & LOGGING

### Logs Actuales
```
Prefijo [Componente]    - Identificar fuente
4 niveles: log, warn, error, debug
Rutos en terminal (npm run dev)
```

### Mejoras Recomendadas
```
Centralizado:    Supabase (tabla logs), Sentry, Datadog
Alertas:         Cuando IA falla, token expira, DB error
Dashboard:       Métricas en tiempo real
Retención:       30 días mínimo
```

---

## 🧪 TESTING - ESTADO ACTUAL

### Tests Manuales Disponibles
```
test-webhook.json          - Payload de ejemplo
test-ai.js                 - Script de test IA
test-message.js            - Test completo
test-gemini.js             - Test Gemini especifico
test-webhook-meta.js       - Simulación webhook
```

### Recomendado a Agregar
```
unit tests (Jest)          - database-service, ai-service
integration tests          - Flujo completo webhook → BD → IA → WhatsApp
e2e tests                  - Desde WhatsApp hasta respuesta
load tests                 - Cuántos mensajes/seg aguanta
```

---

## 🎓 VERSIONES DE LIBRERIAS

| Librería | Versión | Última | Estado |
|----------|---------|--------|--------|
| Next.js | 14.2.15 | 14.x | ✅ Actual |
| React | 18.x | 18.x | ✅ Actual |
| Gemini | 0.24.1 | Latest | ✅ Actual |
| OpenAI | 4.77.0 | 4.x | ✅ Actual |
| Supabase | 2.45.4 | 2.x | ✅ Actual |
| Tailwind | 3.4.19 | 3.x | ✅ Actual |
| TypeScript | 5.x | 5.x | ✅ Actual |

**Recomendación:** Actualizaciones cada 2-3 meses

---

## 📞 STACK SUMMARY

```
┌─────────────────────────────────────────────────────┐
│               ARISECHATBOT TECH STACK               │
├─────────────────────────────────────────────────────┤
│ Frontend:        React 18 + Tailwind CSS             │
│ Backend:         Next.js 14 (serverless functions) │
│ Language:        TypeScript 5                        │
│ Database:        Supabase (PostgreSQL)              │
│ IA:              Gemini + OpenAI + Ollama (optional)│
│ Messaging:       WhatsApp Cloud API (Meta)          │
│ Deployment:      Vercel (recommended)               │
│ Authentication:  JWT (Supabase)                     │
│ Styling:         Tailwind CSS + PostCSS             │
├─────────────────────────────────────────────────────┤
│ Total External APIs:     3-4 (WhatsApp, IA, Supabase)
│ Total Dependencies NPM:  ~10 principales             │
│ Total Endpoint API:      6 rutas                     │
│ Total Database Tables:   3 (simple pero extensible) │
│ Total Env Variables:     ~13 (seguras)               │
└─────────────────────────────────────────────────────┘
```

---

## ✅ CHECKLIST: ¿Qué Hay?

### Código
- [x] Estructura modular (separado por componente)
- [x] Type safety completo (TypeScript)
- [x] Error handling robusto
- [x] Logging con prefijos identificables
- [x] Validaciones en inputs (teléfono, credenciales)
- [x] Soporta 3 backends de IA

### Arquitectura
- [x] Serverless (escalable)
- [x] Database normalizada (3 tablas bien diseñadas)
- [x] Webhooks seguros (verificación de token)
- [x] Historial conversacional (contexto para IA)
- [x] Deduplicación de contactos (por phone_number)

### Admin
- [x] Dashboard UI (Tailwind + componentes)
- [x] Documentación inicial (README.md)
- [x] SQL files para setup (schema.sql)
- [x] Scripts de test (test-*.js)
- [x] Ejemplos de payload (.json)

### Faltaría para Producción
- [ ] Tests automatizados (unit + integration)
- [ ] Rate limiting / DDoS protection
- [ ] Monitoring centralizado (Sentry, etc)
- [ ] RLS habilitado en Supabase
- [ ] Ci/CD pipeline (GitHub Actions)
- [ ] Backup strategy documentado
- [ ] SLA / disaster recovery plan

---

**Documento actualizado:** 2026-04-05
**Versión:** 1.0
**Aplicable a:** AriseChatbot v0.1.0
