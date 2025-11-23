-- Seed data for B2B Printing E-Commerce Platform

-- Insert sample products
INSERT INTO products (name, description, category, base_price_model, image_urls, stock_quantity, estimated_delivery_days, is_active) VALUES
(
    'Business Cards',
    'Professional business cards for your company',
    'cards',
    '{
        "base_price": 20.00,
        "price_tiers": [
            {"min_quantity": 100, "max_quantity": 499, "price_per_unit": 0.20},
            {"min_quantity": 500, "max_quantity": 999, "price_per_unit": 0.15},
            {"min_quantity": 1000, "max_quantity": 4999, "price_per_unit": 0.10},
            {"min_quantity": 5000, "max_quantity": null, "price_per_unit": 0.08}
        ],
        "material_options": {
            "standard_matte": 0,
            "standard_glossy": 2,
            "premium_matte": 5,
            "premium_glossy": 7,
            "ultra_thick": 10
        },
        "finishing_options": {
            "double_sided": 5,
            "rounded_corners": 3,
            "spot_uv": 15,
            "foil_stamping": 25
        }
    }',
    ARRAY['https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1611162616305-c69b3037c2b3?w=800&h=600&fit=crop'],
    500,
    2,
    true
),
(
    'Brochures',
    'High-quality brochures for marketing campaigns',
    'marketing',
    '{
        "base_price": 50.00,
        "price_tiers": [
            {"min_quantity": 50, "max_quantity": 249, "price_per_unit": 1.50},
            {"min_quantity": 250, "max_quantity": 499, "price_per_unit": 1.20},
            {"min_quantity": 500, "max_quantity": 999, "price_per_unit": 0.90},
            {"min_quantity": 1000, "max_quantity": null, "price_per_unit": 0.70}
        ],
        "size_options": {
            "a4": 0,
            "a5": -5,
            "dl": -8,
            "custom": 10
        },
        "paper_options": {
            "100gsm_glossy": 0,
            "150gsm_glossy": 5,
            "200gsm_glossy": 10,
            "150gsm_matte": 5,
            "200gsm_matte": 10
        },
        "fold_options": {
            "no_fold": 0,
            "half_fold": 2,
            "tri_fold": 3,
            "z_fold": 3,
            "gate_fold": 5
        },
        "finishing_options": {
            "lamination": 10,
            "spot_uv": 20
        }
    }',
    ARRAY['https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&h=600&fit=crop'],
    300,
    3,
    true
),
(
    'Flyers',
    'Eye-catching flyers for promotions and events',
    'marketing',
    '{
        "base_price": 30.00,
        "price_tiers": [
            {"min_quantity": 100, "max_quantity": 499, "price_per_unit": 0.50},
            {"min_quantity": 500, "max_quantity": 999, "price_per_unit": 0.35},
            {"min_quantity": 1000, "max_quantity": 4999, "price_per_unit": 0.25},
            {"min_quantity": 5000, "max_quantity": null, "price_per_unit": 0.18}
        ],
        "size_options": {
            "a4": 0,
            "a5": -3,
            "a6": -5,
            "dl": -4
        },
        "paper_options": {
            "100gsm": 0,
            "150gsm": 3,
            "200gsm": 6,
            "250gsm": 9
        },
        "finishing_options": {
            "double_sided": 5,
            "lamination": 8
        }
    }',
    ARRAY['https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&h=600&fit=crop'],
    750,
    3,
    true
),
(
    'Posters',
    'Large format posters for displays and presentations',
    'large_format',
    '{
        "base_price": 15.00,
        "price_tiers": [
            {"min_quantity": 1, "max_quantity": 9, "price_per_unit": 15.00},
            {"min_quantity": 10, "max_quantity": 49, "price_per_unit": 12.00},
            {"min_quantity": 50, "max_quantity": 99, "price_per_unit": 9.00},
            {"min_quantity": 100, "max_quantity": null, "price_per_unit": 7.00}
        ],
        "size_options": {
            "a3": 0,
            "a2": 5,
            "a1": 10,
            "a0": 20,
            "custom": 15
        },
        "material_options": {
            "standard_paper": 0,
            "photo_paper": 5,
            "canvas": 15,
            "vinyl": 20
        },
        "finishing_options": {
            "lamination": 10,
            "mounting": 15
        }
    }',
    ARRAY['https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1598520106830-8c45c2035460?w=800&h=600&fit=crop'],
    200,
    4,
    true
),
(
    'Banners',
    'Durable banners for indoor and outdoor use',
    'large_format',
    '{
        "base_price": 50.00,
        "price_tiers": [
            {"min_quantity": 1, "max_quantity": 4, "price_per_unit": 8.00},
            {"min_quantity": 5, "max_quantity": 9, "price_per_unit": 7.00},
            {"min_quantity": 10, "max_quantity": 19, "price_per_unit": 6.00},
            {"min_quantity": 20, "max_quantity": null, "price_per_unit": 5.00}
        ],
        "size_options": {
            "2x4_ft": 0,
            "3x6_ft": 10,
            "4x8_ft": 25,
            "custom": 20
        },
        "material_options": {
            "vinyl_13oz": 0,
            "vinyl_18oz": 10,
            "mesh": 15,
            "fabric": 20
        },
        "finishing_options": {
            "grommets": 5,
            "pole_pockets": 8,
            "hemming": 10
        }
    }',
    ARRAY['https://images.unsplash.com/photo-1579548122080-c35fd6820ecb?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&h=600&fit=crop'],
    150,
    5,
    true
),
(
    'Letterheads',
    'Professional letterheads for business correspondence',
    'stationery',
    '{
        "base_price": 25.00,
        "price_tiers": [
            {"min_quantity": 100, "max_quantity": 249, "price_per_unit": 0.40},
            {"min_quantity": 250, "max_quantity": 499, "price_per_unit": 0.30},
            {"min_quantity": 500, "max_quantity": 999, "price_per_unit": 0.22},
            {"min_quantity": 1000, "max_quantity": null, "price_per_unit": 0.18}
        ],
        "paper_options": {
            "80gsm": 0,
            "100gsm": 2,
            "120gsm": 4,
            "premium_linen": 8
        },
        "printing_options": {
            "single_sided": 0,
            "double_sided": 5
        }
    }',
    ARRAY['https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&h=600&fit=crop'],
    600,
    2,
    true
);

-- Insert default configuration
INSERT INTO config (key, value, description) VALUES
('whatsapp_phone', '+1234567890', 'WhatsApp business phone number for customer support')
ON CONFLICT (key) DO NOTHING;

-- Insert category filter configurations
INSERT INTO category_config (category, filters, description) VALUES
(
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
                {"id": "die-19", "name": "DIE-19", "shape": "label"},
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

-- Note: Do not insert test users here. Users should be created through the signup process.

