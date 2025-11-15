#!/usr/bin/env node

/**
 * Database initialization script
 * Run this to set up your database schema and seed data
 * Usage: node lib/db/init.js
 */

import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
const { Pool } = pkg;

// Load environment variables from .env.local
config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function initializeDatabase() {
  console.log('🚀 Initializing database...');
  
  try {
    // Create pool directly in this script
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
    
    // Read and execute schema
    console.log('📋 Creating schema...');
    const schemaSQL = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
    
    // Get a client for executing multiple statements
    const client = await pool.connect();
    try {
      await client.query(schemaSQL);
      console.log('✅ Schema created successfully');
      
      // Read and execute seed data
      console.log('🌱 Seeding data...');
      const seedSQL = readFileSync(join(__dirname, 'seed.sql'), 'utf-8');
      await client.query(seedSQL);
      console.log('✅ Data seeded successfully');
    } finally {
      client.release();
    }
    
    await pool.end();
    console.log('🎉 Database initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initializeDatabase();

