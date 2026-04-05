-- Safe migration: Agrega solo lo que falta en conversations y contacts

-- 1. Agregar columnas faltantes a conversations (si no existen)
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;

ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT true;

ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMPTZ;

ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS last_response_at TIMESTAMPTZ;

ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS message_count INT DEFAULT 0;

-- 2. Crear índices faltantes
CREATE INDEX IF NOT EXISTS idx_conversations_contact ON conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_conversations_is_open ON conversations(is_open);

-- 3. Agregar columnas faltantes a contacts (si no existen)
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS name TEXT;

ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS segment TEXT;

ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS location TEXT;

ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS purchase_history JSONB DEFAULT '[]'::jsonb;

ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ;

ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4. Crear índices en contacts si no existen
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone_number);
CREATE INDEX IF NOT EXISTS idx_contacts_segment ON contacts(segment);
CREATE INDEX IF NOT EXISTS idx_contacts_updated ON contacts(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_created ON contacts(created_at DESC);

-- 5. Enable realtime si no está habilitado
-- Nota: Si tabla ya existe en publicación, esto generará un error que es normal
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE contacts;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- 6. Crear función de trigger si no existe
CREATE OR REPLACE FUNCTION update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Crear trigger si no existe
DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_contacts_updated_at();

-- 8. RLS Policies (if not already set)
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can do everything on contacts" ON contacts;
CREATE POLICY "Service role can do everything on contacts"
    ON contacts
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can read contacts" ON contacts;
CREATE POLICY "Authenticated users can read contacts"
    ON contacts
    FOR SELECT
    TO authenticated
    USING (true);

-- Done!
SELECT 'Migration completed successfully' as status;
