# AriseChatbot - 01. Estructura de Base de Datos

## 1. Tabla: `contacts` (Contactos)

| # | Columna | Tipo | Descripción |
|---|--------|------|------------|
| 1 | id | uuid | Identificador único |
| 2 | phone_number | text | Número WhatsApp (único) |
| 3 | name | text | Nombre del contacto |
| 4 | email | text | Correo electrónico |
| 5 | segment | text | Segmento: "cliente", "prospecto" |
| 6 | location | text | Ubicación |
| 7 | tags | text[] | Etiquetas |
| 8 | notes | text | Notas |
| 9 | is_blocked | boolean | Bloqueado |
| 10 | last_message_at | timestamptz | Último mensaje |
| 11 | created_at | timestamptz | Fecha creación |
| 12 | updated_at | timestamptz | Fecha actualización |
| 13 | purchase_history | jsonb | Historial de compras |
| 14 | metadata | jsonb | Metadatos extra |

## 2. Tabla: `companies` (Empresas/Razones Sociales)

| # | Columna | Tipo | Descripción |
|---|--------|------|------------|
| 1 | id | uuid | Identificador único |
| 2 | legal_name | text | Razón social |
| 3 | rut | text | RUT |
| 4 | segment | text | Segmento |
| 5 | metadata | jsonb | Metadatos |
| 6 | created_at | timestamptz | Fecha creación |
| 7 | updated_at | timestamptz | Fecha actualización |

## 3. Tabla: `contact_companies` (Relación N:N)

| # | Columna | Tipo | Descripción |
|---|--------|------|------------|
| 1 | contact_id | uuid | FK a contacts |
| 2 | company_id | uuid | FK a companies |
| 3 | role | text | Rol: "dueño", "rrhh", "contabilidad" |
| 4 | is_primary | boolean | Empresa principal |
| 5 | created_at | timestamptz | Fecha creación |
| 6 | PRIMARY KEY | (contact_id, company_id) | Clave compuesta |

## 4. Tabla: `conversations` (Conversaciones)

| # | Columna | Tipo | Descripción |
|---|--------|------|------------|
| 1 | id | uuid | Identificador único |
| 2 | phone_number | text | Número WhatsApp |
| 3 | contact_id | uuid | FK a contacts |
| 4 | active_company_id | uuid | FK a companies |
| 5 | is_open | boolean | Abierta |
| 6 | chatbot_enabled | boolean | Chatbot activo |
| 7 | first_response_at | timestamptz | Primera respuesta |
| 8 | last_response_at | timestamptz | Última respuesta |
| 9 | message_count | int | Cantidad mensajes |
| 10 | created_at | timestamptz | Fecha creación |
| 11 | updated_at | timestamptz | Fecha actualización |

## 5. Tabla: `messages` (Mensajes)

| # | Columna | Tipo | Descripción |
|---|--------|------|------------|
| 1 | id | uuid | Identificador único |
| 2 | conversation_id | uuid | FK a conversations |
| 3 | role | text | "user" o "assistant" |
| 4 | content | text | Contenido |
| 5 | created_at | timestamptz | Fecha creación |

## 6. Tabla: `client_documents` (Documentos)

| # | Columna | Tipo | Descripción |
|---|--------|------|------------|
| 1 | id | uuid | Identificador único |
| 2 | contact_id | uuid | FK a contacts |
| 3 | company_id | uuid | FK a companies |
| 4 | title | text | Título |
| 5 | description | text | Descripción |
| 6 | file_name | text | Nombre archivo |
| 7 | file_url | text | URL |
| 8 | storage_bucket | text | Bucket |
| 9 | storage_path | text | Path en storage |
| 10 | file_type | text | Tipo: "iva", "renta", "balance", "liquidacion", "contrato" |
| 11 | created_at | timestamptz | Fecha creación |

## 7. Tabla: `service_requests` (Solicitudes/Tickets)

| # | Columna | Tipo | Descripción |
|---|--------|------|------------|
| 1 | id | uuid | Identificador único |
| 2 | request_code | text | Código único |
| 3 | contact_id | uuid | FK a contacts |
| 4 | conversation_id | uuid | FK a conversations |
| 5 | company_id | uuid | FK a companies |
| 6 | request_type | text | Tipo: "quote", "document", "support" |
| 7 | description | text | Descripción |
| 8 | status | text | Estado: "pending", "in_progress", "completed", "cancelled" |
| 9 | result_url | text | URL resultado |
| 10 | assigned_to | text | Asignado a |
| 11 | created_at | timestamptz | Fecha creación |
| 12 | updated_at | timestamptz | Fecha actualización |

## 8. Tabla: `templates` (Plantillas)

| # | Columna | Tipo | Descripción |
|---|--------|------|------------|
| 1 | id | text | Identificador |
| 2 | name | text | Nombre |
| 3 | content | text | Contenido mensaje |
| 4 | category | text | Categoría |
| 5 | service_type | text | Tipo servicio |
| 6 | trigger | text | Palabras trigger |
| 7 | actions | jsonb | Acciones JSON |
| 8 | is_active | boolean | Activo |
| 9 | priority | int | Prioridad (0-100) |
| 10 | segment | text | Segmento destino |
| 11 | workflow | text | Workflow |
| 12 | created_at | timestamptz | Fecha creación |
| 13 | updated_at | timestamptz | Fecha actualización |

## 9. Tabla: `client_access_codes` (Códigos Acceso)

| # | Columna | Tipo | Descripción |
|---|--------|------|------------|
| 1 | id | uuid | Identificador único |
| 2 | phone_number | text | Número WhatsApp |
| 3 | code | text | Código |
| 4 | expires_at | timestamptz | Expiración |
| 5 | used_at | timestamptz | Uso |
| 6 | created_at | timestamptz | Fecha creación |

## 10. Índices

```sql
idx_service_requests_contact_id ON service_requests(contact_id)
idx_service_requests_conversation_id ON service_requests(conversation_id)
idx_service_requests_status ON service_requests(status)
idx_client_documents_contact_id ON client_documents(contact_id)
idx_client_documents_company_id ON client_documents(company_id)
idx_contacts_phone ON contacts(phone_number)
idx_conversations_phone ON conversations(phone_number)
idx_messages_conversation_id ON messages(conversation_id)
idx_companies_legal_name ON companies(legal_name)
idx_contact_companies_company_id ON contact_companies(company_id)
idx_templates_category ON templates(category)
idx_templates_priority ON templates(priority)
idx_templates_is_active ON templates(is_active)
idx_templates_workflow ON templates(workflow)
idx_client_access_codes_phone ON client_access_codes(phone_number)
idx_client_access_codes_code ON client_access_codes(code)
```