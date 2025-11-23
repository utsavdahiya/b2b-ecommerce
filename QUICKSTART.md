# 🚀 Quick Start Guide - Local Development

Get your B2B E-Commerce platform running locally in 5 minutes!

## Prerequisites

- Node.js 18 or higher
- PostgreSQL installed and running
- npm or yarn

## Step 1: Install PostgreSQL (if not already installed)

### macOS (using Homebrew)
```bash
brew install postgresql@15
brew services start postgresql@15
```

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Windows
Download and install from: https://www.postgresql.org/download/windows/

## Step 2: Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE b2b_db_ehde;

# Exit psql
\q
```

Or use the command line:
```bash
createdb b2b_db_ehde
```

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Configure Environment Variables

Create `.env.local` file in the project root:

```bash
# Copy the example
cp .env.local.example .env.local
```

Edit `.env.local` with your settings:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/b2b_db_ehde
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important**: Update `your_password` with your PostgreSQL password!

## Step 5: Initialize Database

```bash
node lib/db/init.js
```

This will:
- ✅ Create all tables (users, products, orders, etc.)
- ✅ Set up indexes and triggers
- ✅ Seed 6 sample products (Business Cards, Brochures, Flyers, Posters, Banners, Letterheads)

You should see:
```
🚀 Initializing database...
📋 Creating schema...
✅ Schema created successfully
🌱 Seeding data...
✅ Data seeded successfully
🎉 Database initialization complete!
```

## Step 6: Start Development Server

```bash
npm run dev
```

Open http://localhost:3000

## 🎉 You're Ready!

### Try These First:

1. **Sign Up** (http://localhost:3000/auth/signup)
   - Create a B2B account with company details
   - Company Name: "Test Company"
   - Email: test@company.com
   - Password: testpassword123

2. **Browse Products** (http://localhost:3000/products)
   - View all 6 seeded products
   - Filter by category

3. **Configure a Product** (Click any product)
   - Select quantity (watch price update in real-time!)
   - Choose materials, sizes, finishing
   - Add to cart

4. **Shopping Cart** (http://localhost:3000/cart)
   - Review configured items
   - Proceed to checkout

5. **Place an Order** (http://localhost:3000/checkout)
   - Enter shipping address
   - Complete order

6. **View Dashboard**
   - Orders: http://localhost:3000/user/orders

## 📁 Project Structure

```
/
├── app/
│   ├── api/              # API routes (thin layer)
│   ├── products/         # Product pages
│   ├── cart/             # Cart page
│   ├── checkout/         # Checkout page
│   ├── user/             # User dashboard
│   └── auth/             # Login/Signup
├── lib/
│   ├── db/               # Database connection
│   └── services/         # Business logic (portable!)
├── components/           # React components
├── middleware.ts         # Route protection
└── README.md             # Full documentation
```

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Reinitialize database (⚠️ destroys all data)
node lib/db/init.js
```

## 🐛 Troubleshooting

### "Connection refused" error
- PostgreSQL not running: `brew services start postgresql@15`
- Wrong DATABASE_URL in .env.local

### "JWT_SECRET not defined" error
- Missing .env.local file
- Copy from .env.local.example

### "Table doesn't exist" error
- Database not initialized
- Run: `node lib/db/init.js`

### Port 3000 already in use
- Change port: `PORT=3001 npm run dev`
- Or kill existing process: `lsof -ti:3000 | xargs kill`

## 🎨 Customization

### Add More Products
Edit `lib/db/seed.sql` and re-run `node lib/db/init.js`

### Change Styling
All styles use Tailwind CSS - modify in component files

### Modify Pricing Logic
Edit `lib/services/productService.ts` → `calculatePrice()` function

## 📚 Learn More

- [Full Documentation](./README.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Database Schema](./lib/db/schema.sql)

## 🚀 Next Steps

1. ✅ Test all features locally
2. ✅ Customize products and pricing
3. ✅ Deploy to Render (see DEPLOYMENT.md)
4. ✅ Add your branding and content

---

**Having issues?** Check the logs in your terminal for error messages.

**Need help?** Review the [Full README](./README.md) for detailed architecture information.

Happy coding! 💻

