const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key);

async function inspect() {
  const shopId = 'f15117eb-a82a-424b-976a-28b794628ef4'; // Use the previous shop ID or any UUID
  const tables = [
    'categories', 'products', 'inventory', 'inventory_adjustments',
    'sales', 'sale_items', 'expenses', 'invoices', 'invoice_items', 'quotations', 'quotation_items',
    'suppliers', 'purchases', 'purchase_items', 'stock_transfers', 'stock_transfer_items',
    'customers', 'returns', 'return_items'
  ];

  for (const table of tables) {
    const { data, error } = await supabase.from(table).insert({ shop_id: shopId }).select();
    if (error) {
      console.log(`Table ${table} error code: ${error.code}, message: ${error.message}`);
    } else {
      console.log(`Table ${table} inserted successfully, columns:`, Object.keys(data[0] || {}));
    }
  }
}

inspect();
