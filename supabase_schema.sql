-- supabase_schema.sql

-- Enable uuid-ossp for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Customers Table
CREATE TABLE customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Gold Transactions Table
CREATE TABLE gold_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  item_name VARCHAR(255) NOT NULL,
  weight_grams NUMERIC(10, 3) NOT NULL,
  wastage_percentage NUMERIC(5, 2) NOT NULL,
  gold_rate_per_gram NUMERIC(10, 2) NOT NULL,
  making_charges NUMERIC(10, 2) DEFAULT 0,
  hsn_code VARCHAR(20) DEFAULT '7113',
  
  -- Calculated Fields (can also be calculated on frontend, but good to store)
  net_weight NUMERIC(10, 3) NOT NULL,
  taxable_amount NUMERIC(12, 2) NOT NULL,
  cgst_amount NUMERIC(10, 2) NOT NULL, -- 1.5%
  sgst_amount NUMERIC(10, 2) NOT NULL, -- 1.5%
  total_amount NUMERIC(12, 2) NOT NULL,
  
  invoice_number SERIAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Payment History Table
CREATE TABLE payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  transaction_id UUID REFERENCES gold_transactions(id) ON DELETE CASCADE,
  amount_paid NUMERIC(12, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE gold_transactions ADD COLUMN is_lump_sum BOOLEAN DEFAULT FALSE;
ALTER TABLE gold_transactions ADD COLUMN gst_included BOOLEAN DEFAULT FALSE;

-- Stock Items Table
CREATE TABLE stock_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_name VARCHAR(255) NOT NULL,
  gross_weight NUMERIC(10, 3) NOT NULL,
  net_weight NUMERIC(10, 3) NOT NULL,
  touch_percentage NUMERIC(5, 2) NOT NULL,
  quantity INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Wholesale Transactions Table
CREATE TABLE wholesale_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  item_name VARCHAR(255) NOT NULL,
  gross_weight NUMERIC(10, 3) NOT NULL,
  net_weight NUMERIC(10, 3) NOT NULL,
  touch_percentage NUMERIC(5, 2) NOT NULL,
  fine_gold NUMERIC(10, 3) NOT NULL, -- Calculated: net_weight * touch_percentage / 100
  rate_amount NUMERIC(12, 2),
  total_amount NUMERIC(12, 2),
  transaction_type VARCHAR(20) DEFAULT 'SALE' NOT NULL, -- 'SALE' or 'RECEIPT'
  invoice_number SERIAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
