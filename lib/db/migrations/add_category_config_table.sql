-- Add category_config table for storing category-specific filter configurations
-- This table stores filter options that are available for each product category

CREATE TABLE IF NOT EXISTS category_config (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) UNIQUE NOT NULL,
    filters JSONB NOT NULL DEFAULT '{}',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups by category
CREATE INDEX IF NOT EXISTS idx_category_config_category ON category_config(category);

-- Create updated_at trigger for category_config
DROP TRIGGER IF EXISTS update_category_config_updated_at ON category_config;
CREATE TRIGGER update_category_config_updated_at BEFORE UPDATE ON category_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default filter configuration for Visiting Cards category
INSERT INTO category_config (category, filters, description)
VALUES (
    'Visiting Card',
    '{
        "printing": {
            "label": "Printing",
            "type": "select",
            "options": ["Single Side", "Both Side"],
            "required": true
        },
        "uv": {
            "label": "UV",
            "type": "select",
            "options": ["Front", "Back", "Both", "NA"],
            "required": true,
            "default": "NA"
        },
        "foil": {
            "label": "Foil",
            "type": "select",
            "options": ["Front", "Back", "Both", "NA"],
            "required": true,
            "default": "NA"
        },
        "dieShape": {
            "label": "Die Shape",
            "type": "die_shape_selector",
            "options": [
                {"id": "die-1", "name": "DIE-1", "shape": "rectangle"},
                {"id": "die-2", "name": "DIE-2", "shape": "rounded-rectangle"},
                {"id": "die-3", "name": "DIE-3", "shape": "rounded-corners"},
                {"id": "die-4", "name": "DIE-4", "shape": "rounded-top"},
                {"id": "die-5", "name": "DIE-5", "shape": "angled-corner"},
                {"id": "die-6", "name": "DIE-6", "shape": "tab-right"},
                {"id": "die-7", "name": "DIE-7", "shape": "tab-left"},
                {"id": "die-8", "name": "DIE-8", "shape": "oval"},
                {"id": "die-9", "name": "DIE-9", "shape": "ellipse"},
                {"id": "die-10", "name": "DIE-10", "shape": "rounded-badge"},
                {"id": "die-11", "name": "DIE-11", "shape": "house"},
                {"id": "die-12", "name": "DIE-12", "shape": "ticket"},
                {"id": "die-13", "name": "DIE-13", "shape": "label"},
                {"id": "die-14", "name": "DIE-14", "shape": "cloud"},
                {"id": "die-15", "name": "DIE-15", "shape": "rounded-label"},
                {"id": "die-16", "name": "DIE-16", "shape": "diamond"},
                {"id": "die-17", "name": "DIE-17", "shape": "arrow"},
                {"id": "die-18", "name": "DIE-18", "shape": "rounded-pill"},
                {"id": "die-19", "name": "DIE-19", "shape": "simple-tab"},
                {"id": "die-20", "name": "DIE-20", "shape": "angled-tab"},
                {"id": "die-21", "name": "DIE-21", "shape": "wave"},
                {"id": "die-22", "name": "DIE-22", "shape": "hexagon"},
                {"id": "die-23", "name": "DIE-23", "shape": "organic"},
                {"id": "die-24", "name": "DIE-24", "shape": "curved"},
                {"id": "die-25", "name": "DIE-25", "shape": "tag"},
                {"id": "die-26", "name": "DIE-26", "shape": "banner"},
                {"id": "die-27", "name": "DIE-27", "shape": "rounded-banner"},
                {"id": "die-28", "name": "DIE-28", "shape": "shield"},
                {"id": "die-29", "name": "DIE-29", "shape": "bookmark"},
                {"id": "die-30", "name": "DIE-30", "shape": "curved-tab"},
                {"id": "die-31", "name": "DIE-31", "shape": "tab-corner"},
                {"id": "die-32", "name": "DIE-32", "shape": "scalloped"},
                {"id": "die-33", "name": "DIE-33", "shape": "angled-scalloped"},
                {"id": "die-34", "name": "DIE-34", "shape": "octagon"},
                {"id": "die-35", "name": "DIE-35", "shape": "pentagon"},
                {"id": "die-36", "name": "DIE-36", "shape": "rounded-pentagon"}
            ],
            "required": false,
            "default": "die-1"
        }
    }'::jsonb,
    'Filter configuration for Visiting Cards category including printing options, UV coating, foil stamping, and die shape selection'
)
ON CONFLICT (category) DO NOTHING;


