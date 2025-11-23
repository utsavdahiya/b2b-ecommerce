/**
 * Script to ingest pamphlet/poster products data from pamphlet.json
 * Run with: npx tsx scripts/ingest-pamphlets.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { query } from '../lib/db/index';
import pamphletData from '../data/products/pamphlet.json';

interface PamphletProduct {
  productCode: string;
  productName: string;
  category: string;
  subCategory: string;
  imageSrc: string;
  attributes: Record<string, string | undefined>;
}

async function ingestPamphlets() {
  console.log('Starting pamphlet/poster products data ingestion...\n');

  let insertedCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  for (const product of pamphletData as PamphletProduct[]) {
    // Filter out undefined values from attributes
    const cleanedAttributes = Object.fromEntries(
      Object.entries(product.attributes).filter(([_, value]) => value !== undefined)
    ) as Record<string, string>;
    try {
      // Create a base price model for pamphlets/posters
      // Customize based on product type
      const basePriceModel = {
        base_price: 100.00,
        price_tiers: [
          { min_quantity: 100, max_quantity: 499, price_per_unit: 1.00 },
          { min_quantity: 500, max_quantity: 999, price_per_unit: 0.80 },
          { min_quantity: 1000, max_quantity: 4999, price_per_unit: 0.60 },
          { min_quantity: 5000, max_quantity: null, price_per_unit: 0.50 }
        ]
      };

      // Check if product already exists by product_code and sub_category
      const existingProduct = await query(
        `SELECT id FROM products 
         WHERE product_code = $1 AND sub_category = $2 AND category = $3`,
        [product.productCode, product.subCategory, product.category]
      );

      if (existingProduct.rows.length > 0) {
        // Update existing product
        await query(
          `UPDATE products 
           SET name = $1,
               description = $2,
               image_urls = $3,
               attributes = $4,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $5`,
          [
            product.productName,
            `${product.productName} - ${product.subCategory}`,
            [product.imageSrc],
            JSON.stringify(cleanedAttributes),
            existingProduct.rows[0].id
          ]
        );
        console.log(`✓ Updated: ${product.productName} (${product.subCategory})`);
        updatedCount++;
      } else {
        // Insert new product
        await query(
          `INSERT INTO products (
            product_code,
            name,
            description,
            category,
            sub_category,
            base_price_model,
            image_urls,
            attributes,
            stock_quantity,
            estimated_delivery_days,
            is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            product.productCode,
            product.productName,
            `${product.productName} - ${product.subCategory}`,
            product.category,
            product.subCategory,
            JSON.stringify(basePriceModel),
            [product.imageSrc],
            JSON.stringify(cleanedAttributes),
            1000, // Default stock quantity
            2, // Default estimated delivery days (48 hours)
            true // is_active
          ]
        );
        console.log(`+ Inserted: ${product.productName} (${product.subCategory})`);
        insertedCount++;
      }
    } catch (error) {
      console.error(`✗ Error processing ${product.productName}:`, error);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Ingestion Summary:');
  console.log('='.repeat(60));
  console.log(`Total records processed: ${pamphletData.length}`);
  console.log(`Inserted: ${insertedCount}`);
  console.log(`Updated: ${updatedCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log('='.repeat(60));
}

// Run the ingestion
ingestPamphlets()
  .then(() => {
    console.log('\n✓ Ingestion completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Ingestion failed:', error);
    process.exit(1);
  });




