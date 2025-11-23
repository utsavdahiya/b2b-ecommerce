# B2B Printing E-Commerce Platform

A modern, mobile-first B2B e-commerce platform for printing services built with Next.js, PostgreSQL, and Tailwind CSS.

## 🚀 Features

- **Authentication & User Management**: Email/password authentication with B2B user profiles
- **Product Catalog**: Browse printing products with categorization
- **Dynamic Product Configurator**: Real-time price calculation based on:
  - Quantity tiers
  - Material options
  - Size selections
  - Paper types
  - Finishing options
  - And more!
- **Shopping Cart**: Persistent cart with server-side price validation
- **Order Processing**: Complete checkout with order tracking
- **User Dashboard**: View orders history

## 🏗️ Architecture

This application follows a **future-proof architecture** designed for easy separation into frontend and backend services:

```
/
├── components/          # Reusable React UI components (mobile-first)
├── lib/
│   ├── db/              # Database connection and utilities
│   └── services/        # 🔑 PORTABLE BUSINESS LOGIC
│       ├── authService.ts
│       ├── productService.ts
│       ├── cartService.ts
│       └── orderService.ts
├── app/
│   ├── api/             # Thin API routes (call services)
│   │   ├── auth/
│   │   ├── products/
│   │   ├── cart/
│   │   └── orders/
│   ├── products/        # Product pages
│   ├── cart/            # Cart page
│   ├── checkout/        # Checkout page
│   ├── user/            # User dashboard
│   └── auth/            # Authentication pages
└── middleware.ts        # Route protection
```

### Key Architectural Principles

1. **Service Layer Portability**: All business logic in `lib/services/` is framework-agnostic and can be moved to a separate Node.js/Express backend
2. **Thin API Layer**: API routes in `app/api/` contain minimal logic, just request/response handling
3. **Mobile-First Design**: Every component built with mobile responsiveness as priority
4. **Server-Side Validation**: All critical operations (pricing, orders) validated server-side

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**

```bash
cd /path/to/b2b-ecommerce
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/b2b_db_ehde

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Storage Configuration (for file uploads)

# Option 1: AWS S3
AWS_S3_ACCESS_KEY_ID=your-aws-access-key-id
AWS_S3_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_S3_BUCKET_NAME=your-bucket-name
AWS_S3_REGION=us-east-1

# Option 2: Supabase Storage (S3-compatible, recommended)
SUPABASE_STORAGE_UPLOAD_ENDPOINT=https://your-project-id.storage.supabase.co/storage/v1/s3
SUPABASE_STORAGE_ACCESS_KEY=your-supabase-access-key
SUPABASE_STORAGE_SECRET_KEY=your-supabase-secret-key
SUPABASE_STORAGE_BUCKET=your-bucket-name
SUPABASE_PUBLIC_ENDPOINT=https://your-project-id.supabase.co
AWS_S3_REJECT_UNAUTHORIZED=false
```

4. **Set up the database**

Create a PostgreSQL database:

```bash
createdb b2b_db_ehde
```

Run the database initialization script:

```bash
node lib/db/init.js
```

This will:
- Create all necessary tables
- Set up indexes and triggers
- Seed sample products

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
```

Visit `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

## 📦 Deployment to Render

### Prerequisites on Render:

1. **PostgreSQL Database**:
   - Create a new PostgreSQL instance (Free 1GB plan available)
   - Copy the "Internal Database URL"

2. **Web Service**:
   - Create a new Web Service
   - Connect your GitHub repository
   - Set the following:
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
     - **Environment**: Node

3. **Environment Variables** (in Render dashboard):
   ```
   DATABASE_URL=<your-render-postgres-internal-url>
   JWT_SECRET=<generate-a-secure-random-string>
   JWT_EXPIRES_IN=7d
   NEXT_PUBLIC_APP_URL=<your-render-app-url>
   NODE_ENV=production
   ```

4. **Database Initialization**:
   After first deployment, run in Render Shell:
   ```bash
   node lib/db/init.js
   ```

## 🎨 Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS (mobile-first)
- **Database**: PostgreSQL with pg driver
- **Authentication**: JWT with HTTP-only cookies
- **Password Hashing**: bcryptjs

## 📱 Mobile-First Design

All UI components are designed mobile-first using Tailwind CSS breakpoints:

- Default (0px+): Mobile phones
- `sm:` (640px+): Large phones, small tablets
- `md:` (768px+): Tablets
- `lg:` (1024px+): Desktops
- `xl:` (1280px+): Large desktops

## 🔐 Authentication Flow

1. User signs up with company details
2. JWT token generated and stored in HTTP-only cookie
3. Middleware protects routes requiring authentication
4. Token verified on each protected request

## 💰 Pricing Logic

The pricing system uses a **dual-layer approach**:

1. **Client-Side**: Instant price updates as user configures product
2. **Server-Side**: Authoritative price calculation when adding to cart/creating orders

This ensures:
- Great UX with instant feedback
- Security through server-side validation
- Price accuracy for all transactions

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - List all products
- `GET /api/products?id=X` - Get product by ID
- `POST /api/products/calculate-price` - Calculate price for configuration

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart` - Update cart item
- `DELETE /api/cart?itemId=X` - Remove cart item

### Orders
- `GET /api/orders` - Get user's orders
- `POST /api/orders` - Create order from cart
- `DELETE /api/orders?id=X` - Cancel order

## 🔧 Database Schema

See `lib/db/schema.sql` for complete schema.

Key tables:
- `users` - B2B user accounts with company details
- `products` - Printing products with pricing models (JSON)
- `carts` & `cart_items` - Shopping cart data
- `orders` & `order_items` - Completed orders

## 🚧 Future Enhancements

The architecture supports easy expansion:

1. **Separate Backend**: Move `lib/services/` to standalone Node.js/Express API
2. **Payment Integration**: Add Stripe/PayPal for payment processing
3. **File Upload**: Allow customers to upload artwork
4. **Admin Panel**: Dashboard for managing products and orders
5. **Email Notifications**: Order confirmations and updates
6. **Advanced Analytics**: Track user behavior and sales

## 📄 License

This project is private and proprietary.

## 🤝 Support

For issues or questions, please contact the development team.

---

Built with ❤️ using Next.js, TypeScript, and Tailwind CSS

