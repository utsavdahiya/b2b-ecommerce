-- Add config table for storing key-value configuration settings
-- This table stores application configuration like WhatsApp phone number

CREATE TABLE IF NOT EXISTS config (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_config_key ON config(key);

-- Insert default WhatsApp phone number (can be updated later)
INSERT INTO config (key, value, description)
VALUES ('whatsapp_phone', '+1234567890', 'WhatsApp business phone number for customer support')
ON CONFLICT (key) DO NOTHING;

-- Create updated_at trigger
DROP TRIGGER IF EXISTS update_config_updated_at ON config;
CREATE TRIGGER update_config_updated_at BEFORE UPDATE ON config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

