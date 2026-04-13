-- Tabla para seguimiento de telemetría de IA
CREATE TABLE IF NOT EXISTS ai_api_telemetry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_index INT NOT NULL,
    key_name TEXT NOT NULL,
    tokens_input INT DEFAULT 0,
    tokens_output INT DEFAULT 0,
    latency_ms INT DEFAULT 0,
    status TEXT NOT NULL, -- success, quota_exceeded, error
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Vista para el Dashboard: Resumen de uso diario por llave
CREATE OR REPLACE VIEW ai_api_usage_today AS
SELECT 
    key_index,
    key_name,
    COUNT(*) as total_requests,
    SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_requests,
    SUM(CASE WHEN status = 'quota_exceeded' THEN 1 ELSE 0 END) as quota_fails,
    SUM(tokens_input + tokens_output) as total_tokens,
    MAX(created_at) as last_used
FROM ai_api_telemetry
WHERE created_at >= CURRENT_DATE
GROUP BY key_index, key_name
ORDER BY key_index ASC;

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_telemetry_created_at ON ai_api_telemetry(created_at);
CREATE INDEX IF NOT EXISTS idx_telemetry_key_index ON ai_api_telemetry(key_index);
