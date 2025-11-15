# 🔧 Local Environment Setup - Fix for 400 Bad Request

## Problem
Signup works in production but returns `400 Bad Request` locally.

## Root Cause
**DATABASE_URL is not configured in `.env.local`**

## Solution

### Step 1: Add DATABASE_URL to .env.local

Open your `.env.local` file and add these lines:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/b2b_db_ehde
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important:** Replace `your_password` with your actual PostgreSQL password!

### Step 2: Ensure PostgreSQL is Running

```bash
# Start PostgreSQL (macOS with Homebrew)
brew services start postgresql@15

# Check if it's running
brew services list | grep postgresql
```

### Step 3: Create the Database (if it doesn't exist)

```bash
createdb b2b_db_ehde
```

### Step 4: Initialize Database Schema and Seed Data

```bash
node lib/db/init.js
```

You should see:
```
🚀 Initializing database...
📋 Creating schema...
✅ Schema created successfully
🌱 Seeding data...
✅ Data seeded successfully
🎉 Database initialization complete!
```

### Step 5: Restart Your Dev Server

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

### Step 6: Test Signup Again

Go to http://localhost:3000/auth/signup and try creating an account!

## Verify Your Setup

Run the diagnostic script anytime to check your configuration:

```bash
node scripts/check-env.js
```

This will verify:
- ✅ DATABASE_URL is set
- ✅ Database connection works
- ✅ All tables exist
- ✅ JWT_SECRET is configured
- ✅ NEXT_PUBLIC_APP_URL is set

## Why This Happened

In production (on Render), environment variables are set through the Render dashboard. Locally, you need to configure them in `.env.local`, which Next.js automatically loads.

The signup endpoint tries to connect to the database, and without DATABASE_URL, the connection fails, resulting in the 400 Bad Request error.

## Need Help?

If you're still having issues:

1. Check PostgreSQL is running: `psql -l`
2. Verify database exists: `psql -l | grep b2b_db_ehde`
3. Test connection manually: `psql postgresql://postgres:your_password@localhost:5432/b2b_db_ehde`
4. Check server logs in your terminal for detailed error messages

---

**Created:** To help diagnose and fix local development environment issues  
**Related Files:** `.env.local`, `scripts/check-env.js`, `QUICKSTART.md`

