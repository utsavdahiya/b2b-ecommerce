#!/usr/bin/env node

/**
 * Execute SQL queries directly on the database
 * Works with managed databases like Render PostgreSQL
 * 
 * Usage:
 *   node scripts/query-db.js "SELECT * FROM products"
 *   node scripts/query-db.js "UPDATE products SET name = 'New Name' WHERE id = 1"
 * 
 * Or run interactively:
 *   node scripts/query-db.js
 */

import { config } from 'dotenv';
import { Pool } from 'pg';
import readline from 'readline';

// Load environment variables
config({ path: '.env.local' });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function executeQuery(pool, sql) {
  try {
    const result = await pool.query(sql);
    
    if (result.command === 'SELECT' || result.command === 'WITH') {
      if (result.rows.length === 0) {
        console.log('\n📭 No rows returned');
      } else {
        console.log(`\n✅ ${result.rows.length} row(s) returned:\n`);
        console.table(result.rows);
      }
    } else {
      console.log(`\n✅ Query executed successfully`);
      if (result.rowCount !== null) {
        console.log(`   Rows affected: ${result.rowCount}`);
      }
    }
    
    return result;
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    if (error.code) {
      console.error(`   Code: ${error.code}`);
    }
    throw error;
  }
}

async function main() {
  const sql = process.argv[2];

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
    if (sql) {
      // Execute provided SQL
      await executeQuery(pool, sql);
    } else {
      // Interactive mode
      console.log('💡 SQL Query Runner (type "exit" or "quit" to exit)\n');
      
      while (true) {
        const input = await question('SQL> ');
        
        if (!input.trim() || input.trim().toLowerCase() === 'exit' || input.trim().toLowerCase() === 'quit') {
          break;
        }

        try {
          await executeQuery(pool, input);
        } catch (error) {
          // Error already logged in executeQuery
        }
        
        console.log(''); // Empty line for readability
      }
    }
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
    rl.close();
  }
}

main();

