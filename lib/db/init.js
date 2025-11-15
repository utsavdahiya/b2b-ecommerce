#!/usr/bin/env node

/**
 * Database initialization script
 * Run this to set up your database schema and seed data
 * Usage: node lib/db/init.js
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getPool } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function initializeDatabase() {
  console.log('🚀 Initializing database...');
  
  try {
    const pool = getPool();
    
    // Read and execute schema
    console.log('📋 Creating schema...');
    const schemaSQL = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
    await pool.query(schemaSQL);
    console.log('✅ Schema created successfully');
    
    // Read and execute seed data
    console.log('🌱 Seeding data...');
    const seedSQL = readFileSync(join(__dirname, 'seed.sql'), 'utf-8');
    await pool.query(seedSQL);
    console.log('✅ Data seeded successfully');
    
    console.log('🎉 Database initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initializeDatabase();

