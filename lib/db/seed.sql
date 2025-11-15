-- Seed data for B2B Printing E-Commerce Platform

-- Insert sample products
INSERT INTO products (name, description, category, base_price_model, is_active) VALUES
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
    true
);

-- Note: Do not insert test users here. Users should be created through the signup process.

