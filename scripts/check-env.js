#!/usr/bin/env node

/**
 * Environment Configuration Checker
 * Run this to diagnose local setup issues
 */

import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env.local' });
const { Pool } = pg;

async function checkEnvironment() {
  console.log('\n🔍 Checking Local Environment Configuration...\n');
  
  let hasErrors = false;

  // Check DATABASE_URL
  console.log('1️⃣  Checking DATABASE_URL...');
  if (!process.env.DATABASE_URL) {
    console.log('   ❌ DATABASE_URL is NOT set in .env.local');
    console.log('   💡 Add this to your .env.local:');
    console.log('      DATABASE_URL=postgresql://postgres:your_password@localhost:5432/b2b_db_ehde\n');
    hasErrors = true;
  } else {
    console.log('   ✅ DATABASE_URL is configured');
    console.log(`   📍 ${process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@')}\n`);
    
    // Try to connect
    console.log('2️⃣  Testing database connection...');
    try {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      
      const result = await pool.query('SELECT NOW()');
      console.log('   ✅ Database connection successful');
      console.log(`   ⏰ Server time: ${result.rows[0].now}\n`);
      
      // Check if tables exist
      console.log('3️⃣  Checking database tables...');
      const tables = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      
      if (tables.rows.length === 0) {
        console.log('   ⚠️  No tables found in database');
        console.log('   💡 Run: node lib/db/init.js\n');
        hasErrors = true;
      } else {
        console.log(`   ✅ Found ${tables.rows.length} tables:`);
        tables.rows.forEach(row => {
          console.log(`      - ${row.table_name}`);
        });
        console.log('');
      }
      
      await pool.end();
    } catch (error) {
      console.log('   ❌ Database connection failed');
      console.log(`   Error: ${error.message}`);
      console.log('\n   💡 Troubleshooting:');
      console.log('      - Is PostgreSQL running? brew services start postgresql@15');
      console.log('      - Does the database exist? createdb b2b_db_ehde');
      console.log('      - Is the password correct in DATABASE_URL?\n');
      hasErrors = true;
    }
  }

  // Check JWT_SECRET
  console.log('4️⃣  Checking JWT_SECRET...');
  if (!process.env.JWT_SECRET) {
    console.log('   ⚠️  JWT_SECRET not set (using default)');
    console.log('   💡 Add to .env.local: JWT_SECRET=your-secret-key\n');
  } else {
    console.log('   ✅ JWT_SECRET is configured\n');
  }

  // Check NEXT_PUBLIC_APP_URL
  console.log('5️⃣  Checking NEXT_PUBLIC_APP_URL...');
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    console.log('   ⚠️  NEXT_PUBLIC_APP_URL not set');
    console.log('   💡 Add to .env.local: NEXT_PUBLIC_APP_URL=http://localhost:3000\n');
  } else {
    console.log(`   ✅ NEXT_PUBLIC_APP_URL: ${process.env.NEXT_PUBLIC_APP_URL}\n`);
  }

  // Summary
  console.log('═══════════════════════════════════════════════');
  if (hasErrors) {
    console.log('❌ Configuration issues found - please fix them above');
  } else {
    console.log('✅ All checks passed! Your environment is ready.');
  }
  console.log('═══════════════════════════════════════════════\n');
  
  process.exit(hasErrors ? 1 : 0);
}

checkEnvironment().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});

