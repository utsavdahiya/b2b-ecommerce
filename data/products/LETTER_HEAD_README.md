# Letter Head Products - Ingestion Guide

## Overview
This document describes the Letter Head products data extraction and ingestion setup.

## Files Created

### 1. Data File: `data/products/letterHead.json`
Contains 5 Letter Head products extracted from the HTML:
- **LH-1**: 70 GSM, Maplitho Paper (For Official Use, 3 day production)
- **LH-2**: 90 GSM, Sunshine Paper (For Official Use, 3 day production)
- **LH-3**: 100 GSM, Bond Paper (For Official Use, 3 day production)
- **LH-4**: 100 GSM, Deo Paper (For Office Letters, 4 day production)
- **LH-5**: 115 GSM, Sunshine Paper (For Office Letters, 4 day production)

Each product includes:
- `productCode`: Original product ID (172-176)
- `productName`: Display name
- `category`: "Letter Head"
- `subCategory`: null (no sub-categories for letter heads)
- `imageSrc`: Full URL to product image
- `attributes`: Product details including Product Code, Paper Quality, Utility, and Production Time

### 2. Ingestion Script: `scripts/ingest-letter-head.ts`
TypeScript script that:
- Reads data from `letterHead.json`
- Creates a base price model for letter head products:
  - Base price: $30.00
  - Price tiers based on quantity:
    - 100-499 units: $0.30/unit
    - 500-999 units: $0.25/unit
    - 1000-4999 units: $0.20/unit
    - 5000+ units: $0.15/unit
- Inserts or updates products in the database
- Uses Product Code (LH-1 to LH-5) as unique identifier
- Provides detailed console output with summary

### 3. NPM Script: Updated `package.json`
Added new script command:
```bash
npm run ingest:letter-head
```

## How to Run

### Prerequisites
1. Ensure your `.env.local` file has the correct database connection string
2. Database should have the products table with all required columns

### Running the Ingestion

```bash
# Run the letter head ingestion script
npm run ingest:letter-head

# Or use npx tsx directly
npx tsx scripts/ingest-letter-head.ts
```

### Expected Output
```
Starting letter head data ingestion...

+ Inserted: 70 GSM, Maplitho Paper
+ Inserted: 90 GSM, Sunshine Paper
+ Inserted: 100 GSM, Bond Paper
+ Inserted: 100 GSM, Deo Paper
+ Inserted: 115 GSM, Sunshine Paper

============================================================
Ingestion Summary:
============================================================
Total records processed: 5
Inserted: 5
Updated: 0
Errors: 0
============================================================

✓ Ingestion completed successfully!
```

## Database Schema
Products will be inserted with:
- `product_code`: LH-1 through LH-5
- `category`: "Letter Head"
- `sub_category`: null
- `stock_quantity`: 1000 (default)
- `estimated_delivery_days`: 3 (default, based on production time)
- `is_active`: true

## Product Attributes
Each product includes these attributes in the `attributes` JSONB field:
- **Product Code**: Internal code (LH-1 to LH-5)
- **Paper Quality**: GSM and paper type
- **Utility**: Use case description
- **Production Time**: Manufacturing time

## Image URLs
All images are hosted at: `https://printersclub.in/images/cat-images/`
- 70 GSM M.png
- 90 GSM S.png
- 100 GSM B.png
- 100 GSM D.png
- n115 S.jpg

## Notes
- Products have no sub-categories (subCategory is null)
- All products in "Letter Head" category will appear in "Others" section on the products page (since they have no sub-category)
- To add sub-categories later, simply update the JSON file and re-run the ingestion

