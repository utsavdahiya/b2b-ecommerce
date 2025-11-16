# 📝 Database Editing Guide

This guide explains how to edit records in your PostgreSQL database, especially when using managed databases like Render PostgreSQL where some tools may have permission limitations.

## 🔧 Solutions for Editing Database Records

### Option 1: Use the Edit Script (Recommended)

The simplest way to edit records is using the provided script:

```bash
# View all records in a table
npm run db:edit products

# View a specific record
npm run db:edit products 1

# Edit a record
npm run db:edit products 1 name "New Product Name"
npm run db:edit products 1 stock_quantity 200
npm run db:edit config 1 value "new config value"
```

**Examples:**
```bash
# Update product name
node scripts/edit-record.js products 1 name "Premium Business Cards"

# Update stock quantity
node scripts/edit-record.js products 1 stock_quantity 500

# Update config value (JSON)
node scripts/edit-record.js config 1 value '{"key": "value"}'

# Update boolean field
node scripts/edit-record.js products 1 is_active true
```

### Option 2: Use SQL Query Script

For more complex queries or bulk updates:

```bash
# Run a single query
npm run db:query "SELECT * FROM products WHERE id = 1"

# Update records
npm run db:query "UPDATE products SET stock_quantity = 100 WHERE id = 1"

# Interactive mode
npm run db:query
```

### Option 3: Fix DBCode/SQLTools Extension

The DBCode extension error occurs because it tries to access system tables that require superuser privileges. I've updated your `.vscode/settings.json` to:

1. Set `rejectUnauthorized: false` for SSL (Render uses self-signed certificates)
2. Added explicit connection parameters
3. Limited to `public` schema

**To use SQLTools after the fix:**

1. **Reload VS Code** or restart the SQLTools extension
2. In VS Code, open the SQLTools sidebar
3. Connect to "b2b-commerce-PROD"
4. You should now be able to:
   - Browse tables in the `public` schema
   - Run queries
   - Edit records directly

**Note:** If you still get permission errors, you can:
- Use the scripts above (they work reliably)
- Use `psql` command line tool (see Option 4)
- Use a desktop client like pgAdmin or DBeaver

### Option 4: Use psql Command Line

If you have `psql` installed locally:

```bash
# Connect to your Render database
psql "postgresql://b2b_db_ehde_user:GHSCHhCPqgYreTmBAtgfvdU74EOW2lT6@dpg-d4c101f5r7bs73a3n020-a.oregon-postgres.render.com/b2b_db_ehde?sslmode=require"

# Then run SQL commands
SELECT * FROM products;
UPDATE products SET name = 'New Name' WHERE id = 1;
```

### Option 5: Use Desktop Database Clients

Popular options that work well with managed databases:

1. **pgAdmin** (Free, Open Source)
   - Download: https://www.pgadmin.org/
   - Connect using your connection string

2. **DBeaver** (Free, Open Source)
   - Download: https://dbeaver.io/
   - Works great with managed databases

3. **TablePlus** (Paid, macOS/Windows)
   - Download: https://tableplus.com/
   - Beautiful UI, great for quick edits

## 🎯 Quick Reference

### Common Edit Operations

```bash
# Products
npm run db:edit products 1 name "New Name"
npm run db:edit products 1 stock_quantity 100
npm run db:edit products 1 is_active false

# Config
npm run db:edit config 1 value "new value"

# Users (be careful!)
npm run db:edit users 1 company_name "New Company"

# Orders
npm run db:edit orders 1 status "completed"
```

### View Records

```bash
# List all products
npm run db:edit products

# Show specific product
npm run db:edit products 1

# List all config entries
npm run db:edit config

# List all users
npm run db:edit users
```

### Complex Queries

```bash
# Find products by category
npm run db:query "SELECT * FROM products WHERE category = 'business-cards'"

# Update multiple records
npm run db:query "UPDATE products SET stock_quantity = 0 WHERE is_active = false"

# Count records
npm run db:query "SELECT COUNT(*) FROM orders WHERE status = 'pending'"
```

## ⚠️ Important Notes

1. **Always backup before bulk updates** - Use the query script to export data first
2. **Test on a single record first** - Make sure your update works before applying to many records
3. **JSON fields** - When updating JSONB fields, provide valid JSON:
   ```bash
   npm run db:edit products 1 base_price_model '{"base": 10, "per_unit": 0.5}'
   ```
4. **Arrays** - For array fields, use JSON array format:
   ```bash
   npm run db:edit products 1 image_urls '["url1", "url2"]'
   ```

## 🐛 Troubleshooting

### "DATABASE_URL is not set"
- Make sure you have a `.env.local` file with `DATABASE_URL` set
- The scripts automatically load from `.env.local`

### "Permission denied" errors
- Managed databases (like Render) don't allow access to system tables
- Use the scripts provided - they only access your application tables
- The SQLTools extension may still have limitations

### SSL connection errors
- The scripts handle SSL automatically with `rejectUnauthorized: false`
- If using `psql`, add `?sslmode=require` to your connection string

### "Table does not exist"
- Make sure you're using the correct table name (case-sensitive in some cases)
- Check that your database is initialized: `node lib/db/init.js`

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Render PostgreSQL Docs](https://render.com/docs/databases)
- [pg Library Documentation](https://node-postgres.com/)

