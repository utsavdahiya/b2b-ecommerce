#!/usr/bin/env node

/**
 * Migration script to add category_config table
 * Run this script to apply the migration: node lib/db/migrations/apply_category_config_migration.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function applyMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Starting category_config table migration...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'add_category_config_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Execute migration
    await client.query(migrationSQL);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('✓ Successfully created category_config table');
    console.log('✓ Added indexes and triggers');
    console.log('✓ Inserted default Visiting Cards filter configuration');
    console.log('\nMigration completed successfully!');
    
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('✗ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
applyMigration();

