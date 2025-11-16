# Visiting Cards Data Migration and Ingestion

This guide explains how to update your database schema and ingest the visiting cards data.

## Overview

The visiting cards update adds the following fields to the `products` table:

**Core visiting card fields:**
- `product_code`: Product SKU/code (VARCHAR)
- `sub_category`: More granular product categorization (VARCHAR)
- `attributes`: Flexible JSONB field for product-specific attributes

**Additional required fields (added if not already present):**
- `image_urls`: Array of product image URLs (TEXT[])
- `stock_quantity`: Available stock (INTEGER)
- `estimated_delivery_days`: Estimated delivery time (INTEGER)

The migration uses `ADD COLUMN IF NOT EXISTS`, so it's safe to run even if some columns already exist.

## Step 1: Run the Database Migration

Apply the migration to add the new columns to your products table:

```bash
# Using psql
psql -d your_database_name -f lib/db/migrations/add_visiting_card_fields.sql

# Or if you have a migration runner, use that instead
```

This migration will:
- Add all necessary columns to the products table (if they don't already exist)
  - `image_urls`, `stock_quantity`, `estimated_delivery_days`
  - `product_code`, `sub_category`, `attributes`
- Create appropriate indexes for better query performance
- Add column comments for documentation
- Safe to run multiple times (uses `IF NOT EXISTS`)

## Step 2: Ingest Visiting Cards Data

**Prerequisites:**
- Make sure you have a `.env.local` file with your `DATABASE_URL` set
- The script will automatically load environment variables from `.env.local`

Run the ingestion script to populate the database with visiting cards data:

```bash
# Option 1: Using npm script (recommended)
npm run ingest:visiting-cards

# Option 2: Using tsx directly
npx tsx scripts/ingest-visiting-cards.ts
```

The script will:
- Read data from `data/products/visitingCards.json`
- Insert new products or update existing ones (based on product_code + sub_category + category)
- Display a summary of inserted/updated/failed records

### What the script does:

1. **Creates products with default pricing**: Each visiting card gets a default B2B pricing model with volume tiers
2. **Preserves attributes**: All product-specific attributes from the JSON are stored in the `attributes` JSONB field
3. **Updates existing products**: If a product with the same code/category/sub-category exists, it updates the data
4. **Sets reasonable defaults**: 
   - Stock quantity: 1000
   - Estimated delivery: 3 days
   - Active status: true

### Customizing Pricing

The ingestion script uses a default pricing model. To customize pricing for visiting cards, edit the `basePriceModel` object in `scripts/ingest-visiting-cards.ts` before running it.

## Step 3: Verify the Data

Check that the data was ingested correctly:

```sql
-- Count visiting cards
SELECT COUNT(*) FROM products WHERE category = 'Visiting Card';

-- View sample products with attributes
SELECT 
  id, 
  product_code, 
  name, 
  sub_category, 
  attributes 
FROM products 
WHERE category = 'Visiting Card' 
LIMIT 5;

-- Check unique sub-categories
SELECT DISTINCT sub_category 
FROM products 
WHERE category = 'Visiting Card';
```

Expected sub-categories:
- METAL VISITING CARDS
- 800 GSM VISITING CARDS
- 500 GSM CARDS
- NT / PVC VISITING CARDS
- REGULAR VISITING CARDS
- 50% Discount cards
- 100% Discount cards

## Frontend Updates

The following pages have been updated to display the new fields:

### Product List Page (`app/products/page.tsx`)
- Shows product images from `image_urls`
- Displays `sub_category` as a badge
- Shows `product_code` 
- Lists up to 3 key attributes with a "more" indicator

### Product Details Page (`app/products/[id]/page.tsx`)
- Displays `sub_category` as a prominent badge
- Shows `product_code` in header
- Renders all product attributes in a styled specifications grid

## Database Schema

```sql
-- Columns added/ensured in products table
image_urls TEXT[] DEFAULT '{}'        -- Product image URLs
stock_quantity INTEGER DEFAULT 100    -- Available stock
estimated_delivery_days INTEGER DEFAULT 3  -- Delivery estimate
product_code VARCHAR(50)              -- Product SKU/code
sub_category VARCHAR(255)             -- Sub-category name
attributes JSONB DEFAULT '{}'         -- Product specifications

-- New indexes
idx_products_product_code             -- For product code lookups
idx_products_sub_category             -- For filtering by sub-category
idx_products_attributes (GIN)         -- For JSON queries on attributes
```

## TypeScript Interfaces

The `Product` interface has been updated across the codebase:

```typescript
interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  sub_category?: string;           // NEW
  product_code?: string;            // NEW
  base_price_model: any;
  image_urls?: string[];
  stock_quantity?: number;
  estimated_delivery_days?: number;
  attributes?: Record<string, string>; // NEW
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
```

## Troubleshooting

### DATABASE_URL not found
If you get `Error: DATABASE_URL environment variable is not set`:
- Ensure you have a `.env.local` file in the project root
- Verify `DATABASE_URL` is set in `.env.local`
- The script now automatically loads from `.env.local` (no need to export to system environment)
- Format: `DATABASE_URL=postgresql://username:password@host:port/database`

### Migration Fails
- Ensure your database connection is working
- Check that you have the necessary permissions
- Verify the products table exists

### Ingestion Script Errors
- Make sure `data/products/visitingCards.json` exists and is valid JSON
- Check database connection settings in `.env.local`
- Verify the migration has been run first
- Ensure tsx is installed: `npm install -D tsx`

### Images Not Showing
- The image URLs in the JSON may need updating if they're broken
- A fallback SVG icon will display if images fail to load
- Check browser console for image loading errors

## Next Steps

After successful ingestion:
1. Review the products in your admin panel (if you have one)
2. Test the product list and detail pages
3. Verify that filtering and search work correctly
4. Update any custom queries to handle the new fields
5. Consider adding image optimization for the product images

## Data Structure Example

Each visiting card in the database will have this structure:

```json
{
  "id": 123,
  "product_code": "2",
  "name": "800 GSM+Velvet",
  "category": "Visiting Card",
  "sub_category": "800 GSM VISITING CARDS",
  "attributes": {
    "Lamination Type": "Velvet",
    "UV Option": "Available",
    "Foil Option": "Available (5 Types)",
    "Die Cut Option": "Available (36 Types)",
    "Production Time": "3 days"
  },
  "image_urls": ["https://..."],
  "base_price_model": { ... }
}
```

