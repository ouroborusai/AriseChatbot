# 🛡️ POLÍTICAS DE SEGURIDAD RLS Y ROLES (Diamond v10.1)

Todas las tablas en el esquema 'public' están protegidas por RLS para asegurar el aislamiento multi-tenant por 'company_id'.

## 👥 REGLAS MAESTRAS
- **authenticated**: Usuarios con sesión activa en Supabase.
- **service_role**: Bypass de RLS para procesos internos de sistema (IA y Scripts).

## 🔒 POLÍTICAS POR TABLA
1. **inventory_items**: Solo visible si `auth.uid()` tiene acceso a `company_id`.
2. **messages**: Acceso restringido a la conversación perteneciente a la empresa del usuario.
3. **document_templates**: Lectura pública para 'authenticated', escritura solo para 'service_role'.
4. **financial_summaries**: Aislamiento estricto por `company_id`.

## 🔄 HANDSHAKE DE ROLES
El sistema valida el rol del usuario en la tabla 'user_company_access' antes de permitir cualquier acción neural [[ ]].
