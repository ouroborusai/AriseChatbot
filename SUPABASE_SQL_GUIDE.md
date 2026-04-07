# Guía SQL Supabase - AriseChatbot

## ⚠️ Errores comunes y cómo evitarlos

### 1. **Publication "supabase_realtime" no existe**

❌ **Error:**
```
ERROR: 42704: publication "supabase_realtime" does not exist
```

❌ **Problema:** Intentar usar `ALTER PUBLICATION supabase_realtime` en Supabase limpio.

✅ **Solución:**
```sql
-- NO HAGAS ESTO en Supabase limpio:
ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts;

-- EN SU LUGAR: Deja comentado o ejecuta DESPUÉS de habilitar Realtime
-- 1. Ve a Supabase Dashboard > Project Settings > Realtime
-- 2. Habilita "Realtime" en tu proyecto
-- 3. Entonces sí ejecuta el ALTER PUBLICATION
```

### 2. **CREATE POLICY IF NOT EXISTS no existe**

❌ **Error:**
```
ERROR: 42601: syntax error at or near "NOT"
```

❌ **Problema:** PostgreSQL **no tiene** sintaxis `CREATE POLICY IF NOT EXISTS`.

✅ **Solución:**
```sql
-- SIEMPRE usa DROP ... IF EXISTS primero:
DROP POLICY IF EXISTS "policy_name" ON table_name;
CREATE POLICY "policy_name" ON table_name
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
```

### 3. **Function triggers rotos por dependencia**

❌ **Error:**
```
ERROR: 2BP01: cannot drop function ... because other objects depend on it
```

✅ **Solución:**
```sql
-- Elimina triggers ANTES que la función:
DROP TRIGGER IF EXISTS trigger_name ON table_name;
DROP FUNCTION IF EXISTS function_name() CASCADE;

-- Luego recrea todo:
CREATE FUNCTION function_name() ...
CREATE TRIGGER trigger_name ON table_name ...
```

## ✅ Checklist antes de ejecutar SQL en Supabase

- [ ] ¿Estoy en una **copia limpia** de Supabase (no producción)?
- [ ] ¿Todas las líneas de `ALTER PUBLICATION` están después de crear tablas?
- [ ] ¿Estoy usando `DROP ... IF EXISTS` antes de crear policies/triggers?
- [ ] ¿He revisado que `CREATE TABLE IF NOT EXISTS` sea válido (no `CREATE TABLE IF NOT EXISTS ... IF NOT EXISTS`)?
- [ ] ¿Las referencias de foreign keys apuntan a tablas que ya existen?

## 📞 Normalización de teléfonos (IMPORTANTE)

- **Regla:** en base de datos guardamos `contacts.phone_number` como **solo dígitos**, sin espacios, sin `+`, sin guiones.
- **Formato recomendado (Chile WhatsApp):** `56` + `9` + `XXXXXXXX` → ejemplo: `56920137573`.
- **Código:** ya se normaliza con `digitsOnly()` antes de guardar/buscar (API y webhook).

## Recomendaciones

1. **Ejecuta en partes:** Crea primero tablas, luego índices, luego políticas.
2. **Usa transacciones:** Envuelve en `BEGIN; ... COMMIT;` para rollback si falla.
3. **Comenta bloques opcionales:** Marca con `-- OPCIONAL:` lo que depende de configuración.
4. **Valida en dev antes:** Usa Supabase proyecto de desarrollo, NO producción.

## Estructura limpia de SQL

```sql
-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. TABLAS (siempre IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

-- 3. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_users_id ON public.users(id);

-- 4. RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 5. POLICIES (DROP + CREATE)
DROP POLICY IF EXISTS "read_users" ON public.users;
CREATE POLICY "read_users" ON public.users FOR SELECT USING (true);

-- 6. TRIGGERS (DROP primero)
DROP TRIGGER IF EXISTS update_ts ON public.users;
CREATE TRIGGER update_ts BEFORE UPDATE ON public.users ...

-- 7. REALTIME (SOLO SI ESTÁ HABILITADO)
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
```
