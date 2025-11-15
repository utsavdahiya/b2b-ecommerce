#!/usr/bin/env node

/**
 * Apply GST Number Migration
 * 
 * This script adds the gst_number field to the orders table
 * Run this script to update your existing database
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

async function applyGstMigration() {
  console.log('🚀 Applying GST number migration...');
  
  try {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    const client = await pool.connect();
    
    try {
      console.log('📋 Adding gst_number column to orders table...');
      const migrationSQL = readFileSync(
        join(__dirname, 'add_gst_number.sql'), 
        'utf-8'
      );
      
      await client.query(migrationSQL);
      console.log('✅ Migration applied successfully');
      console.log('   - Added gst_number column to orders table');
      console.log('   - Created index on gst_number for faster lookups');
    } finally {
      client.release();
    }
    
    await pool.end();
    console.log('🎉 Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('');
    console.error('If the column already exists, this is safe to ignore.');
    process.exit(1);
  }
}

applyGstMigration();

