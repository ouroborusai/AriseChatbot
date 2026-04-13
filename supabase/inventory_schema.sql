-- TABLA: Catálogo de Inventario
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sku TEXT,
    unit TEXT DEFAULT 'unidades',
    current_stock DECIMAL(12,2) DEFAULT 0,
    last_purchase_price DECIMAL(12,2),
    min_stock_alert DECIMAL(12,2),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- TABLA: Bitácora de Movimientos
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('in', 'out', 'adjustment')),
    quantity DECIMAL(12,2) NOT NULL,
    source_type TEXT DEFAULT 'manual',
    source_id TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_inventory_company ON inventory_items(company_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item ON inventory_transactions(item_id);

-- Habilitar Realtime para estas tablas
ALTER PUBLICATION supabase_realtime ADD TABLE inventory_items;
ALTER PUBLICATION supabase_realtime ADD TABLE inventory_transactions;
