#!/usr/bin/env node

/**
 * Apply Config Table Migration
 * 
 * This script creates the config table for storing application settings
 * Run this script to add the config table to your database
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

async function applyConfigMigration() {
  console.log('🚀 Applying config table migration...');
  
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
      console.log('📋 Creating config table...');
      const migrationSQL = readFileSync(
        join(__dirname, 'add_config_table.sql'), 
        'utf-8'
      );
      
      await client.query(migrationSQL);
      console.log('✅ Migration applied successfully');
      console.log('   - Created config table');
      console.log('   - Created index on config.key');
      console.log('   - Inserted default WhatsApp phone number');
      console.log('');
      console.log('⚠️  Please update the WhatsApp phone number in the config table:');
      console.log('   UPDATE config SET value = \'YOUR_PHONE_NUMBER\' WHERE key = \'whatsapp_phone\';');
    } finally {
      client.release();
    }
    
    await pool.end();
    console.log('🎉 Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

applyConfigMigration();

