# 🗄️ Esquema de Base de Datos SSOT (AriseChatbot)
*Última actualización: 12 de Abril, 2026*

Este documento contiene la estructura oficial de la base de datos que debe respetarse para todas las operaciones de código.

## Tablas Principales

### `contacts`
Almacena el número de WhatsApp y la información de segmentación del cliente.
- `phone_number` (text, UNIQUE): Identificador principal.
- `segment` (text): p.ej. "cliente", "prospecto".
- `metadata` (jsonb): Datos adicionales del contacto.

### `companies`
Almacena las razones sociales de los clientes.
- `legal_name` (text, NOT NULL): Nombre de la empresa.
- `rut` (text): RUT de la empresa.
- `metadata` (jsonb): **CAMPO CRÍTICO.** Contiene `financial_summary` con los datos contables inyectados.

### `contact_companies`
Relación N:N entre contactos (personas) y empresas.
- `is_primary` (boolean): Define si es el contacto principal para la empresa.

### `client_documents`
Almacena la referencia a los libros PDF y otros archivos.
- `contact_id` (uuid, NOT NULL): Referencia a `contacts`.
- `company_id` (uuid): Referencia a `companies`.
- `file_url` (text): URL pública en Supabase Storage.
- `file_type` (text): p.ej. "compras", "ventas", "iva".

### `templates`
Configuración de las respuestas del chatbot.
- `trigger` (text): Palabras clave para activar la plantilla.
- `actions` (jsonb): Botones o listas interactivas.
- `segment` (text): "todos", "cliente", "prospecto".

### `appointments`
Gestión de citas agendadas por el bot.
- `contact_id` (uuid): Referencia al cliente.
- `company_id` (uuid): Referencia a la empresa (opcional).
- `appointment_date` (date): Fecha de la cita.
- `appointment_time` (time): Hora de la cita.
- `status` (text): p.ej. "pending", "confirmed".

---
> [!IMPORTANT]
> **INTEGRIDAD:** No se deben permitir documentos sin un `contact_id`. En caso de ingesta masiva sin contacto asignado, utilizar el contacto de sistema "MTZ ARCHIVOS" (ID vinculado al phone '0').
