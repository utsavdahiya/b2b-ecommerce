-- Migration: Add fields for visiting cards data
-- Adds product_code, sub_category, attributes, and ensures image_urls, stock_quantity, estimated_delivery_days exist

-- Add image_urls column if it doesn't exist (for product images)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

-- Add stock_quantity column if it doesn't exist
ALTER TABLE products
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 100;

-- Add estimated_delivery_days column if it doesn't exist
ALTER TABLE products
ADD COLUMN IF NOT EXISTS estimated_delivery_days INTEGER DEFAULT 3;

-- Add product_code column (can be non-unique as some products share codes across categories)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS product_code VARCHAR(50);

-- Add sub_category column for more granular categorization
ALTER TABLE products
ADD COLUMN IF NOT EXISTS sub_category VARCHAR(255);

-- Add attributes column to store flexible product attributes as JSON
ALTER TABLE products
ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}';

-- Create index on product_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_product_code ON products(product_code);

-- Create index on sub_category for filtering
CREATE INDEX IF NOT EXISTS idx_products_sub_category ON products(sub_category);

-- Create GIN index on attributes for JSON queries
CREATE INDEX IF NOT EXISTS idx_products_attributes ON products USING GIN (attributes);

-- Add column comments for documentation
COMMENT ON COLUMN products.image_urls IS 'Array of image URLs for product gallery carousel';
COMMENT ON COLUMN products.stock_quantity IS 'Available stock quantity for the product';
COMMENT ON COLUMN products.estimated_delivery_days IS 'Estimated delivery time in days';
COMMENT ON COLUMN products.product_code IS 'Product code/SKU - may be shared across different product variants';
COMMENT ON COLUMN products.sub_category IS 'Sub-category for more specific product classification';
COMMENT ON COLUMN products.attributes IS 'Flexible JSON field for product-specific attributes (e.g., lamination type, UV options, production time)';

