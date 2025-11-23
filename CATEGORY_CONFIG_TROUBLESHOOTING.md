# Category Config Filters - Troubleshooting Guide

## Issue: Filters Not Showing on Visiting Card Products

If you're not seeing the category config filters (Printing, UV, Foil, Die Shape) on visiting card product pages, follow these steps:

## Step 1: Check if Category Config Table Exists

Run this SQL query to check if the table exists and what data it has:

```sql
-- Check if table exists and see all category configs
SELECT * FROM category_config;

-- Check specifically for Visiting Card category
SELECT category, description FROM category_config WHERE category LIKE '%Visit%';
```

## Step 2: Fix Category Name Mismatch

The products use category name **"Visiting Card"** (singular), but the initial migration may have created it as **"Visiting Cards"** (plural).

### Option A: Update Existing Record (if migration already ran)

Run this SQL to fix the category name:

```sql
UPDATE category_config 
SET category = 'Visiting Card'
WHERE category = 'Visiting Cards';
```

Or use the fix script:

```bash
psql $DATABASE_URL -f lib/db/migrations/fix_category_config_name.sql
```

### Option B: Re-run Migration (if table doesn't exist or is empty)

```bash
node lib/db/migrations/apply_category_config_migration.js
```

## Step 3: Verify Category Config is Loaded

1. Open your browser's Developer Console (F12)
2. Navigate to a Visiting Card product page
3. Check the console for these messages:
   - ✅ `Category config loaded:` - means it found the config
   - ⚠️ `No category config found for category: Visiting Card` - means category name mismatch
   - ⚠️ `Failed to fetch category config` - means API error

## Step 4: Test the API Directly

Test if the API returns the category config:

```bash
# Test with correct category name (singular)
curl "http://localhost:3000/api/category-config?category=Visiting%20Card"

# Test with plural (if you had that)
curl "http://localhost:3000/api/category-config?category=Visiting%20Cards"
```

Expected response:
```json
{
  "data": {
    "id": 1,
    "category": "Visiting Card",
    "filters": {
      "printing": {...},
      "uv": {...},
      "foil": {...},
      "dieShape": {...}
    }
  }
}
```

## Step 5: Check Product Category

Verify that your products actually have the category set:

```sql
-- Check what categories your products have
SELECT DISTINCT category FROM products;

-- Check visiting card products specifically
SELECT id, name, category FROM products WHERE category LIKE '%Visit%' LIMIT 5;
```

## Step 6: Where to See the Filters

Once fixed, the filters will appear on the product details page:

1. Go to `/products` page
2. Click on any **Visiting Card** product
3. Scroll down past the **Quantity** section
4. You should see these filter sections:
   - **Printing** (Single Side / Both Side)
   - **UV** (Front / Back / Both / NA)
   - **Foil** (Front / Back / Both / NA)
   - **Die Shape** (Visual selector with 36 shapes)

The filters appear **after the Quantity section** and **before the Material Options** section.

## Common Issues

### Issue 1: Category Name Mismatch
**Symptom:** Console shows "No category config found"
**Solution:** Run the fix SQL above (Step 2, Option A)

### Issue 2: Migration Not Run
**Symptom:** API returns 404 or empty result
**Solution:** Run the migration script (Step 2, Option B)

### Issue 3: Products Have Wrong Category
**Symptom:** Products don't have "Visiting Card" as category
**Solution:** Update products or create config for the actual category name

### Issue 4: Filters Not Visible
**Symptom:** Config loads but filters don't render
**Solution:** 
- Check browser console for errors
- Verify DieShapeSelector component is imported correctly
- Check that categoryConfig state is set

## Quick Fix Commands

```bash
# 1. Fix category name in database
psql $DATABASE_URL -c "UPDATE category_config SET category = 'Visiting Card' WHERE category = 'Visiting Cards';"

# 2. Or re-run migration (will create if doesn't exist, update if exists)
node lib/db/migrations/apply_category_config_migration.js

# 3. Verify it worked
psql $DATABASE_URL -c "SELECT category, description FROM category_config;"
```

## Still Not Working?

1. Check browser console for JavaScript errors
2. Verify the API endpoint is accessible: `http://localhost:3000/api/category-config?category=Visiting%20Card`
3. Check network tab to see if the API call is being made
4. Verify the product page is actually calling the API (check the fetchProduct function)

