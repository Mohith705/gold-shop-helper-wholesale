export type Customer = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
};

export type GoldTransaction = {
  id: string;
  customer_id: string;
  item_name: string;
  weight_grams: number;
  wastage_percentage: number;
  gold_rate_per_gram: number;
  making_charges: number;
  hsn_code: string;
  net_weight: number;
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  total_amount: number;
  is_lump_sum?: boolean;
  gst_included?: boolean;
  invoice_number?: number;
  image_url?: string;
  created_at: string;
  customers?: Customer; // Joined relation
};

export type Payment = {
  id: string;
  transaction_id: string;
  amount_paid: number;
  payment_method: string;
  payment_date: string;
};

export type StockItem = {
  id: string;
  item_name: string;
  gross_weight: number;
  net_weight: number;
  touch_percentage: number;
  quantity: number;
  created_at: string;
  updated_at: string;
};

export type WholesaleTransaction = {
  id: string;
  customer_id: string;
  item_name: string;
  gross_weight: number;
  net_weight: number;
  touch_percentage: number;
  fine_gold: number;
  rate_amount: number | null;
  total_amount: number | null;
  transaction_type: 'SALE' | 'RECEIPT';
  invoice_number?: number;
  image_url?: string;
  created_at: string;
  customers?: Customer;
};
