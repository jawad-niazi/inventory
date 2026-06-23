-- Migration 010: Wholesale/Retail schema adjustments + updated sale RPC

-- PRODUCTS: add product_code (unique) and current_stock
alter table public.products
  add column if not exists product_code text,
  add column if not exists current_stock integer default 0;

create unique index if not exists idx_products_product_code on public.products(product_code);

-- PURCHASE ITEMS: add purchase_price (vendor-specific cost)
alter table public.purchase_items
  add column if not exists purchase_price numeric(12,2);

-- SALES: add customer_name, total_amount, total_profit
alter table public.sales
  add column if not exists customer_name text,
  add column if not exists total_amount numeric(12,2),
  add column if not exists total_profit numeric(12,2) default 0;

-- SALE ITEMS: add sale_price and cost_price_at_sale (snapshot)
alter table public.sale_items
  add column if not exists sale_price numeric(12,2),
  add column if not exists cost_price_at_sale numeric(12,2);

-- Replace/upgrade the atomic sale RPC to snapshot cost price and compute profit
create or replace function public.create_sale_transaction(
  p_shop_id uuid,
  p_customer_id uuid,
  p_created_by uuid,
  p_total numeric,
  p_items jsonb
) returns uuid as $$
declare
  v_sale_id uuid;
  v_item jsonb;
  v_curr_qty int;
  v_unit numeric;
  v_qty int;
  v_sub numeric;
  v_cost numeric;
  v_total_profit numeric := 0;
begin
  -- 1. Insert sale header (store both total and total_amount for compatibility)
  insert into public.sales (shop_id, customer_id, total, total_amount, status, created_by)
  values (p_shop_id, p_customer_id, p_total, p_total, 'completed', p_created_by)
  returning id into v_sale_id;

  -- 2. Loop items, check stock, deduct and insert sale_items with cost snapshot
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::int;
    v_unit := (v_item->>'unit_price')::numeric;
    v_sub := (v_item->>'subtotal')::numeric;

    -- Lock inventory row
    select quantity into v_curr_qty
    from public.inventory
    where shop_id = p_shop_id and product_id = (v_item->>'product_id')::uuid
    for update;

    if v_curr_qty is null or v_curr_qty < v_qty then
      raise exception 'insufficient_stock:%', (v_item->>'product_name');
    end if;

    -- Deduct inventory
    update public.inventory
    set quantity = quantity - v_qty, updated_at = now()
    where shop_id = p_shop_id and product_id = (v_item->>'product_id')::uuid;

    -- Also update products.current_stock (keep denormalized count)
    update public.products
    set current_stock = coalesce(current_stock,0) - v_qty, updated_at = now()
    where id = (v_item->>'product_id')::uuid;

    -- Log inventory adjustment
    insert into public.inventory_adjustments (shop_id, product_id, quantity_change, reason, adjusted_by)
    values (p_shop_id, (v_item->>'product_id')::uuid, -v_qty, 'Sale: ' || v_sale_id, p_created_by);

    -- Determine cost price at sale: weighted average of historical purchase_items, fallback to product.price
    select coalesce(
      (select sum(quantity * coalesce(purchase_price, unit_cost))::numeric / nullif(sum(quantity),0) from public.purchase_items where product_id = (v_item->>'product_id')::uuid),
      (select price from public.products where id = (v_item->>'product_id')::uuid),
      0
    ) into v_cost;

    -- Insert sale item with cost snapshot
    insert into public.sale_items (sale_id, product_id, quantity, unit_price, subtotal, sale_price, cost_price_at_sale)
    values (v_sale_id, (v_item->>'product_id')::uuid, v_qty, v_unit, v_sub, v_unit, v_cost);

    -- Accumulate profit
    v_total_profit := v_total_profit + ((v_unit - v_cost) * v_qty);
  end loop;

  -- 3. Update total_profit on sale
  update public.sales set total_profit = coalesce(v_total_profit,0) where id = v_sale_id;

  -- 4. Create invoice for this sale
  insert into public.invoices (shop_id, sale_id, invoice_number, status)
  values (p_shop_id, v_sale_id, 'INV-' || upper(substring(v_sale_id::text, 1, 8)), 'paid');

  return v_sale_id;
end;
$$ language plpgsql;
