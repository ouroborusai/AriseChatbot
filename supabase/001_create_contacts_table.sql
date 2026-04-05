-- Create contacts table to store person/customer information
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number TEXT UNIQUE NOT NULL,
    name TEXT,
    email TEXT,
    segment TEXT,  -- 'cliente', 'prospect', 'soporte', 'vip', etc
    location TEXT,
    purchase_history JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,  -- Extra fields
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_contacts_phone ON contacts(phone_number);
CREATE INDEX idx_contacts_segment ON contacts(segment);
CREATE INDEX idx_contacts_updated ON contacts(updated_at DESC);
CREATE INDEX idx_contacts_created ON contacts(created_at DESC);

-- Enable realtime on contacts
ALTER PUBLICATION supabase_realtime ADD TABLE contacts;

-- Enable Row Level Security
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contacts
CREATE POLICY "Service role can do everything on contacts"
    ON contacts
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users can read contacts"
    ON contacts
    FOR SELECT
    TO authenticated
    USING (true);

-- Function to update updated_at timestamp for contacts
CREATE OR REPLACE FUNCTION update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for contacts
CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_contacts_updated_at();

-- Modify conversations table to reference contacts
ALTER TABLE conversations 
ADD COLUMN contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;

ALTER TABLE conversations 
ADD COLUMN is_open BOOLEAN DEFAULT true;

-- Create index for contact_id
CREATE INDEX idx_conversations_contact ON conversations(contact_id);

-- Update conversations to have better metadata
ALTER TABLE conversations 
ADD COLUMN first_response_at TIMESTAMPTZ,
ADD COLUMN last_response_at TIMESTAMPTZ,
ADD COLUMN message_count INT DEFAULT 0;
