# GST Number Feature - Implementation Guide

## Overview

This feature adds support for capturing and storing GST (Goods and Services Tax) numbers during checkout. The GST number is optional and stored with each order for tax documentation purposes.

## What Was Changed

### 1. Database Changes

#### Schema Updates
- **File**: `lib/db/schema.sql`
- Added `gst_number VARCHAR(50)` column to the `orders` table
- Added index `idx_orders_gst_number` for faster GST number lookups

#### Migration
- **File**: `lib/db/migrations/add_gst_number.sql`
- SQL migration script to add the GST number column to existing databases
- Includes index creation for performance
- Safe to run multiple times (uses `IF NOT EXISTS`)

### 2. Backend Changes

#### Order Service (`lib/services/orderService.ts`)
- Updated `Order` interface to include optional `gst_number?: string` field
- Modified `createOrderFromCart()` function to accept and store GST number:
  - Added `gstNumber?: string` parameter
  - Updated INSERT query to include `gst_number` column
  - GST number is stored as NULL if not provided

#### Orders API (`app/api/orders/route.ts`)
- Updated POST endpoint to extract `gstNumber` from request body
- Passes GST number to `createOrderFromCart()` service function

### 3. Frontend Changes

#### Checkout Page (`app/checkout/page.tsx`)
- Added new state: `const [gstNumber, setGstNumber] = useState('')`
- Added "Tax Information" section with GST number input field:
  - Optional field with clear labeling
  - Helpful placeholder and description text
  - Integrated with form submission
- Updated `handleSubmit()` to include GST number in order creation request

#### Orders Page (`app/user/orders/page.tsx`)
- Updated `Order` interface to include `gst_number?: string`
- Added GST number display in order details:
  - Shows GST number section only when present
  - Styled consistently with other order information
  - Positioned below shipping address

## How to Apply This Update

### For Existing Databases

Run the migration script to add the GST number column:

```bash
node lib/db/migrations/apply_gst_migration.js
```

This will:
- ✅ Add the `gst_number` column to the `orders` table
- ✅ Create an index on the column for performance
- ✅ Safely handle cases where the column already exists

### For New Database Installations

No action needed! The GST number field is included in the base schema (`lib/db/schema.sql`), so running `node lib/db/init.js` will create it automatically.

## User Experience

### At Checkout
1. User fills in shipping address as usual
2. New "Tax Information" section appears below shipping address
3. Optional GST number field with clear labeling:
   - Label: "GST Number (Optional)"
   - Placeholder: "Enter your GST number"
   - Help text: "If you have a GST number, enter it here for tax purposes."
4. GST number is submitted with the order (can be empty)

### Viewing Orders
1. GST number appears in order details if provided
2. Shows in a dedicated section below shipping address
3. Clean, consistent styling with other order information
4. Not displayed if GST number wasn't provided

## Technical Details

### Database Schema
```sql
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS gst_number VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_orders_gst_number ON orders(gst_number);
```

### TypeScript Interface
```typescript
export interface Order {
  id: number;
  user_id: number;
  total_price: number;
  shipping_address: any;
  gst_number?: string;  // Optional GST number
  status: string;
  items?: OrderItem[];
  created_at: Date;
  updated_at: Date;
}
```

### API Contract
```typescript
// POST /api/orders
{
  shippingAddress: {
    street: string;
    city: string;
    state?: string;
    postal_code?: string;
    country?: string;
    phone?: string;
  },
  gstNumber?: string  // Optional
}
```

## Testing

### Manual Testing Steps

1. **Test with GST Number**
   - Go to checkout page
   - Fill in shipping address
   - Enter a GST number (e.g., "22AAAAA0000A1Z5")
   - Complete order
   - Verify GST number appears in order details

2. **Test without GST Number**
   - Go to checkout page
   - Fill in shipping address
   - Leave GST number blank
   - Complete order
   - Verify order is created successfully
   - Verify GST number section doesn't appear in order details

3. **Test Database**
   - Query the orders table: `SELECT id, gst_number FROM orders;`
   - Verify GST numbers are stored correctly
   - Verify NULL values for orders without GST numbers

## Backward Compatibility

✅ **Fully backward compatible**
- Existing orders without GST numbers continue to work
- GST number field is optional (nullable)
- No changes to existing API contracts (GST number is optional)
- Migration is safe to run on production databases

## Future Enhancements

Potential improvements for future versions:
1. GST number format validation (country-specific patterns)
2. Save GST number to user profile for auto-fill
3. GST number verification via external API
4. Tax calculation based on GST status
5. Export GST information for tax reporting

## Files Modified

### Database
- `lib/db/schema.sql` - Base schema
- `lib/db/migrations/add_gst_number.sql` - Migration SQL
- `lib/db/migrations/apply_gst_migration.js` - Migration runner

### Backend
- `lib/services/orderService.ts` - Service layer
- `app/api/orders/route.ts` - API endpoint

### Frontend
- `app/checkout/page.tsx` - Checkout UI
- `app/user/orders/page.tsx` - Order display

## Support

If you encounter any issues:
1. Check that the migration ran successfully
2. Verify DATABASE_URL is set correctly
3. Check browser console for frontend errors
4. Check server logs for backend errors
5. Ensure all TypeScript types are up to date

---

**Version**: 1.0.0  
**Date**: November 15, 2025  
**Author**: AI Assistant

