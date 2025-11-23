/**
 * Script to ingest visiting cards data from visitingCards.json
 * Run with: npx tsx scripts/ingest-visiting-cards.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { query } from '../lib/db/index';
import visitingCardsData from '../data/products/visitingCards.json';

interface VisitingCard {
  productCode: string;
  productName: string;
  category: string;
  subCategory: string;
  imageSrc: string;
  attributes: Record<string, string | undefined>;
}

async function ingestVisitingCards() {
  console.log('Starting visiting cards data ingestion...\n');

  let insertedCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  for (const card of visitingCardsData as VisitingCard[]) {
    // Filter out undefined values from attributes
    const cleanedAttributes = Object.fromEntries(
      Object.entries(card.attributes).filter(([_, value]) => value !== undefined)
    ) as Record<string, string>;
    try {
      // Create a default base_price_model for visiting cards
      // You may want to customize this based on your pricing needs
      const basePriceModel = {
        base_price: 50.00,
        price_tiers: [
          { min_quantity: 100, max_quantity: 499, price_per_unit: 0.50 },
          { min_quantity: 500, max_quantity: 999, price_per_unit: 0.40 },
          { min_quantity: 1000, max_quantity: 4999, price_per_unit: 0.30 },
          { min_quantity: 5000, max_quantity: null, price_per_unit: 0.25 }
        ]
      };

      // Check if product already exists by product_code and sub_category
      const existingProduct = await query(
        `SELECT id FROM products 
         WHERE product_code = $1 AND sub_category = $2 AND category = $3`,
        [card.productCode, card.subCategory, card.category]
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
            card.productName,
            `${card.productName} - ${card.subCategory}`,
            [card.imageSrc],
            JSON.stringify(cleanedAttributes),
            existingProduct.rows[0].id
          ]
        );
        console.log(`✓ Updated: ${card.productName} (${card.subCategory})`);
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
            card.productCode,
            card.productName,
            `${card.productName} - ${card.subCategory}`,
            card.category,
            card.subCategory,
            JSON.stringify(basePriceModel),
            [card.imageSrc],
            JSON.stringify(cleanedAttributes),
            1000, // Default stock quantity
            3, // Default estimated delivery days
            true // is_active
          ]
        );
        console.log(`+ Inserted: ${card.productName} (${card.subCategory})`);
        insertedCount++;
      }
    } catch (error) {
      console.error(`✗ Error processing ${card.productName}:`, error);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Ingestion Summary:');
  console.log('='.repeat(60));
  console.log(`Total records processed: ${visitingCardsData.length}`);
  console.log(`Inserted: ${insertedCount}`);
  console.log(`Updated: ${updatedCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log('='.repeat(60));
}

// Run the ingestion
ingestVisitingCards()
  .then(() => {
    console.log('\n✓ Ingestion completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Ingestion failed:', error);
    process.exit(1);
  });

