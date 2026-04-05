# AriseChatbot

Chatbot WhatsApp con IA (Gemini/OpenAI), dashboard admin y Supabase.

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
| `/api/metrics` | GET | Estadísticas del sistema |
| `/api/check-env` | GET | Verificar variables de entorno |

## 📚 Documentación importante

- [SUPABASE_SQL_GUIDE.md](SUPABASE_SQL_GUIDE.md) - Guía de SQL para Supabase
- [AGENT_PROMPT.md](AGENT_PROMPT.md) - Prompt del sistema de IA

## 🗄️ Base de datos

### Tablas principales
- `contacts` - Datos de clientes
- `conversations` - Historial de chat
- `messages` - Mensajes individuales

Ejecutar migración inicial:
```sql
-- En Supabase SQL Editor, abrir supabase/schema.sql
```

## 🔐 Configuración de entorno

Ver [.env.local.example](.env.local.example) para variables requeridas.

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
4a. Si el token expira, regenera un nuevo `WHATSAPP_ACCESS_TOKEN` en Meta y actualiza la variable en el entorno.

## ⚙️ Despliegue (Vercel)

```bash
git push origin main
# Vercel auto-deploya
```

Habilitar variables de entorno en Vercel Project Settings.

---

**Creado:** 2026 | **Stack:** Next.js + Supabase + Gemini
