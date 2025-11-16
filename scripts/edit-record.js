#!/usr/bin/env node

/**
 * Simple script to edit database records
 * Works with managed databases like Render PostgreSQL
 * 
 * Usage:
 *   node scripts/edit-record.js <table> <id> <field> <value>
 * 
 * Examples:
 *   node scripts/edit-record.js products 1 name "New Product Name"
 *   node scripts/edit-record.js products 1 stock_quantity 200
 *   node scripts/edit-record.js config 1 value "new config value"
 * 
 * To view records first:
 *   node scripts/edit-record.js <table>
 */

import { config } from 'dotenv';
import { Pool } from 'pg';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables
config({ path: '.env.local' });

async function main() {
  const [,, table, id, field, ...valueParts] = process.argv;
  const value = valueParts.join(' ');

  if (!table) {
    console.log('Usage: node scripts/edit-record.js <table> [id] [field] [value]');
    console.log('\nExamples:');
    console.log('  node scripts/edit-record.js products                    # List all products');
    console.log('  node scripts/edit-record.js products 1                  # Show product with id 1');
    console.log('  node scripts/edit-record.js products 1 name "New Name"  # Update product name');
    console.log('  node scripts/edit-record.js config 1 value "new value"  # Update config value');
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    if (!id) {
      // List all records
      const result = await pool.query(`SELECT * FROM ${table} ORDER BY id LIMIT 100`);
      
      if (result.rows.length === 0) {
        console.log(`\n📭 No records found in table "${table}"`);
      } else {
        console.log(`\n📋 Records in table "${table}" (showing first 100):\n`);
        console.table(result.rows);
        console.log(`\n💡 To edit a record: node scripts/edit-record.js ${table} <id> <field> <value>`);
      }
    } else if (!field || !value) {
      // Show specific record
      const result = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
      
      if (result.rows.length === 0) {
        console.error(`❌ No record found with id ${id} in table "${table}"`);
        process.exit(1);
      }

      console.log(`\n📋 Record (id: ${id}):\n`);
      console.table([result.rows[0]]);
      console.log(`\n💡 To edit: node scripts/edit-record.js ${table} ${id} <field> <value>`);
    } else {
      // Update record
      // First, get the current record to validate
      const currentResult = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
      
      if (currentResult.rows.length === 0) {
        console.error(`❌ No record found with id ${id} in table "${table}"`);
        process.exit(1);
      }

      const currentRecord = currentResult.rows[0];
      
      // Check if field exists
      if (!(field in currentRecord)) {
        console.error(`❌ Field "${field}" does not exist in table "${table}"`);
        console.log(`\nAvailable fields: ${Object.keys(currentRecord).join(', ')}`);
        process.exit(1);
      }

      // Get column type to parse value correctly
      const columnInfo = await pool.query(`
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = $2
      `, [table, field]);

      if (columnInfo.rows.length === 0) {
        console.error(`❌ Could not get column info for "${field}"`);
        process.exit(1);
      }

      const dataType = columnInfo.rows[0].data_type;
      let parsedValue = value;

      // Parse based on data type
      if (dataType === 'integer' || dataType === 'bigint') {
        parsedValue = parseInt(value);
        if (isNaN(parsedValue)) {
          console.error(`❌ Invalid integer value: ${value}`);
          process.exit(1);
        }
      } else if (dataType === 'numeric' || dataType === 'decimal' || dataType === 'real' || dataType === 'double precision') {
        parsedValue = parseFloat(value);
        if (isNaN(parsedValue)) {
          console.error(`❌ Invalid number value: ${value}`);
          process.exit(1);
        }
      } else if (dataType === 'boolean') {
        parsedValue = value.toLowerCase() === 'true' || value === '1' || value === 't';
      } else if (dataType === 'jsonb' || dataType === 'json') {
        try {
          parsedValue = JSON.parse(value);
        } catch (e) {
          console.error(`❌ Invalid JSON: ${value}`);
          console.error(`   Error: ${e.message}`);
          process.exit(1);
        }
      } else if (dataType === 'ARRAY' || dataType.includes('[]')) {
        try {
          parsedValue = JSON.parse(value);
        } catch (e) {
          // Try comma-separated
          parsedValue = value.split(',').map(s => s.trim()).filter(s => s);
        }
      }

      // Update the record
      await pool.query(
        `UPDATE ${table} SET ${field} = $1 WHERE id = $2`,
        [parsedValue, id]
      );

      console.log(`\n✅ Updated ${field} for record id ${id} in table "${table}"`);
      console.log(`   Old value: ${JSON.stringify(currentRecord[field])}`);
      console.log(`   New value: ${JSON.stringify(parsedValue)}`);

      // Show updated record
      const updatedResult = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
      console.log('\n📋 Updated record:\n');
      console.table([updatedResult.rows[0]]);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error(`   Code: ${error.code}`);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();

