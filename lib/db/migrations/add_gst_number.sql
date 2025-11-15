-- Add GST number field to orders table
-- This migration adds a field to store the customer's GST number on orders

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS gst_number VARCHAR(50);

-- Add an index for faster GST number lookups
CREATE INDEX IF NOT EXISTS idx_orders_gst_number ON orders(gst_number);

-- Add a comment to document the column
COMMENT ON COLUMN orders.gst_number IS 'Customer GST (Goods and Services Tax) number for tax purposes';

