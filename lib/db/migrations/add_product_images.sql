-- Migration: Add image_urls column to products table
-- This column stores an array of image URLs for product galleries

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

-- Add comment to the column
COMMENT ON COLUMN products.image_urls IS 'Array of image URLs for product gallery carousel';

-- Update existing products with placeholder images
UPDATE products SET image_urls = ARRAY[
    'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1611162616305-c69b3037c2b3?w=800&h=600&fit=crop'
] WHERE id = 1 AND name = 'Business Cards';

UPDATE products SET image_urls = ARRAY[
    'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1598520106830-8c45c2035460?w=800&h=600&fit=crop'
] WHERE id = 2 AND name = 'Brochures';

UPDATE products SET image_urls = ARRAY[
    'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&h=600&fit=crop'
] WHERE id = 3 AND name = 'Flyers';

UPDATE products SET image_urls = ARRAY[
    'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1598520106830-8c45c2035460?w=800&h=600&fit=crop'
] WHERE id = 4 AND name = 'Posters';

UPDATE products SET image_urls = ARRAY[
    'https://images.unsplash.com/photo-1579548122080-c35fd6820ecb?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&h=600&fit=crop'
] WHERE id = 5 AND name = 'Banners';

UPDATE products SET image_urls = ARRAY[
    'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&h=600&fit=crop'
] WHERE id = 6 AND name = 'Letterheads';

