-- SQL script to define the atomic sale transaction RPC.
-- Execute this script in your Supabase SQL Editor.

create or replace function public.create_sale_transaction(
  p_shop_id uuid,
  p_customer_id uuid,
  p_created_by uuid,
  p_total numeric,
  p_items jsonb -- array of {product_id, quantity, unit_price, subtotal}
) returns uuid as $$
declare
  v_sale_id uuid;
  v_item jsonb;
  v_curr_qty int;
begin
  -- 1. Insert sale record
  insert into public.sales (shop_id, customer_id, total, status, created_by)
  values (p_shop_id, p_customer_id, p_total, 'completed', p_created_by)
  returning id into v_sale_id;

  -- 2. Loop through items and deduct stock atomically
  for v_item in select * from jsonb_array_elements(p_items) loop
    -- Lock inventory row for this product/shop to prevent race conditions
    select quantity into v_curr_qty
    from public.inventory
    where shop_id = p_shop_id and product_id = (v_item->>'product_id')::uuid
    for update;

    -- If no inventory record exists or there is insufficient stock, raise an exception
    if v_curr_qty is null or v_curr_qty < (v_item->>'quantity')::int then
      raise exception 'insufficient_stock:%', (v_item->>'product_name');
    end if;

    -- Update quantity in stock
    update public.inventory
    set quantity = quantity - (v_item->>'quantity')::int, updated_at = now()
    where shop_id = p_shop_id and product_id = (v_item->>'product_id')::uuid;

    -- Log inventory adjustment history
    insert into public.inventory_adjustments (shop_id, product_id, quantity_change, reason, adjusted_by)
    values (p_shop_id, (v_item->>'product_id')::uuid, -(v_item->>'quantity')::int, 'Sale: ' || v_sale_id, p_created_by);

    -- Insert sale item record
    insert into public.sale_items (sale_id, product_id, quantity, unit_price, subtotal)
    values (v_sale_id, (v_item->>'product_id')::uuid, (v_item->>'quantity')::int, (v_item->>'unit_price')::numeric, (v_item->>'subtotal')::numeric);
  end loop;

  -- 3. Automatically create an invoice for this sale
  insert into public.invoices (shop_id, sale_id, invoice_number, status)
  values (p_shop_id, v_sale_id, 'INV-' || upper(substring(v_sale_id::text, 1, 8)), 'paid');

  return v_sale_id;
end;
$$ language plpgsql;
