/**
 * Script to ingest letter head data from letterHead.json
 * Run with: npx tsx scripts/ingest-letter-head.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { query } from '../lib/db/index';
import letterHeadData from '../data/products/letterHead.json';

interface LetterHead {
  productCode: string;
  productName: string;
  category: string;
  subCategory: string | null;
  imageSrc: string;
  attributes: Record<string, string>;
}

async function ingestLetterHead() {
  console.log('Starting letter head data ingestion...\n');

  let insertedCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  for (const item of letterHeadData as LetterHead[]) {
    try {
      // Create a default base_price_model for letter head
      // Pricing based on typical letter head production costs
      const basePriceModel = {
        base_price: 30.00,
        price_tiers: [
          { min_quantity: 100, max_quantity: 499, price_per_unit: 0.30 },
          { min_quantity: 500, max_quantity: 999, price_per_unit: 0.25 },
          { min_quantity: 1000, max_quantity: 4999, price_per_unit: 0.20 },
          { min_quantity: 5000, max_quantity: null, price_per_unit: 0.15 }
        ]
      };

      // Check if product already exists by product_code and category
      const existingProduct = await query(
        `SELECT id FROM products 
         WHERE product_code = $1 AND category = $2`,
        [item.attributes['Product Code'], item.category]
      );

      if (existingProduct.rows.length > 0) {
        // Update existing product
        await query(
          `UPDATE products 
           SET name = $1,
               description = $2,
               image_urls = $3,
               attributes = $4,
               sub_category = $5,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $6`,
          [
            item.productName,
            `${item.productName} - Professional letter head printing`,
            [item.imageSrc],
            JSON.stringify(item.attributes),
            item.subCategory,
            existingProduct.rows[0].id
          ]
        );
        console.log(`✓ Updated: ${item.productName}`);
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
            item.attributes['Product Code'],
            item.productName,
            `${item.productName} - Professional letter head printing`,
            item.category,
            item.subCategory,
            JSON.stringify(basePriceModel),
            [item.imageSrc],
            JSON.stringify(item.attributes),
            1000, // Default stock quantity
            3, // Default estimated delivery days (based on production time in data)
            true // is_active
          ]
        );
        console.log(`+ Inserted: ${item.productName}`);
        insertedCount++;
      }
    } catch (error) {
      console.error(`✗ Error processing ${item.productName}:`, error);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Ingestion Summary:');
  console.log('='.repeat(60));
  console.log(`Total records processed: ${letterHeadData.length}`);
  console.log(`Inserted: ${insertedCount}`);
  console.log(`Updated: ${updatedCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log('='.repeat(60));
}

// Run the ingestion
ingestLetterHead()
  .then(() => {
    console.log('\n✓ Ingestion completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Ingestion failed:', error);
    process.exit(1);
  });

