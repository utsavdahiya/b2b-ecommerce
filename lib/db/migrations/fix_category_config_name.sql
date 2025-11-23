-- Fix category name mismatch: Update "Visiting Cards" to "Visiting Card" to match product categories
-- Run this if you already ran the migration with the wrong category name

UPDATE category_config 
SET category = 'Visiting Card'
WHERE category = 'Visiting Cards';

-- Verify the update
SELECT category, description FROM category_config WHERE category = 'Visiting Card';

