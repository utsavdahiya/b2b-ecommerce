#!/usr/bin/env node

/**
 * Migration script to add category_config table
 * Run this script to apply the migration: node lib/db/migrations/apply_category_config_migration.js
 */

import { config } from 'dotenv';
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env.local
config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function applyMigration() {
  console.log('🚀 Applying category_config table migration...');
  
  try {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    console.log('🔌 Connecting to database...');
    const pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000, // Increased timeout
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    // Test connection first
    const client = await pool.connect();
    
    try {
      console.log('✅ Database connection established');
      console.log('📋 Testing database connection...');
      await client.query('SELECT NOW()');
      console.log('✅ Database is responsive');
      
      console.log('📋 Creating category_config table...');
      
      // Read the migration SQL file
      const migrationSQL = readFileSync(
        join(__dirname, 'add_category_config_table.sql'),
        'utf-8'
      );
      
      // Begin transaction
      await client.query('BEGIN');
      
      // Execute migration
      await client.query(migrationSQL);
      
      // Commit transaction
      await client.query('COMMIT');
      
      console.log('✅ Migration applied successfully');
      console.log('   - Created category_config table');
      console.log('   - Added indexes and triggers');
      console.log('   - Inserted default Visiting Cards filter configuration');
      console.log('');
      console.log('🎉 Migration complete!');
    } catch (error) {
      // Rollback on error
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        // Ignore rollback errors if transaction wasn't started
        console.warn('⚠️  Could not rollback transaction:', rollbackError.message);
      }
      throw error;
    } finally {
      client.release();
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('');
    
    if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED') {
      console.error('💡 Connection issue detected. Please check:');
      console.error('   1. Is your database server running?');
      console.error('   2. Is DATABASE_URL correct in .env.local?');
      console.error('   3. Can you reach the database from this machine?');
      console.error('   4. Are firewall/network settings correct?');
    } else if (error.code === 'ENOTFOUND') {
      console.error('💡 DNS resolution failed. Please check:');
      console.error('   1. Is the database hostname correct?');
      console.error('   2. Is your network connection working?');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('💡 Connection timeout. Please check:');
      console.error('   1. Is the database server accessible?');
      console.error('   2. Are the connection settings correct?');
    }
    
    console.error('');
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run migration
applyMigration();

