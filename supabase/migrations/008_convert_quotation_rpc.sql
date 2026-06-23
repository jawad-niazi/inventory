-- Migration 008: RPC to convert a quotation into a finalized sale
-- Run this in your Supabase SQL Editor AFTER migration 007 and 006.

create or replace function public.convert_quotation_to_sale(
  p_quotation_id uuid,
  p_shop_id      uuid,
  p_created_by   uuid
) returns uuid as $$
declare
  v_quotation   record;
  v_items       jsonb;
  v_item        record;
  v_total       numeric := 0;
  v_sale_id     uuid;
begin
  -- 1. Fetch the quotation and validate it belongs to the shop
  select * into v_quotation
  from public.quotations
  where id = p_quotation_id and shop_id = p_shop_id;

  if not found then
    raise exception 'Quotation not found or access denied';
  end if;

  if v_quotation.status not in ('draft', 'sent') then
    raise exception 'Quotation has already been converted or expired (status: %)', v_quotation.status;
  end if;

  -- 2. Build the items jsonb array from quotation_items
  select jsonb_agg(
    jsonb_build_object(
      'product_id',   qi.product_id,
      'quantity',     qi.quantity,
      'unit_price',   qi.unit_price,
      'subtotal',     qi.subtotal,
      'product_name', coalesce(p.name, qi.description)
    )
  ) into v_items
  from public.quotation_items qi
  left join public.products p on p.id = qi.product_id
  where qi.quotation_id = p_quotation_id
    and qi.product_id is not null;  -- Only items with linked products can decrement stock

  if v_items is null or jsonb_array_length(v_items) = 0 then
    raise exception 'No valid product-linked items found in this quotation to convert';
  end if;

  -- 3. Calculate total
  select coalesce(sum((qi.quantity * qi.unit_price)), 0) into v_total
  from public.quotation_items qi
  where qi.quotation_id = p_quotation_id
    and qi.product_id is not null;

  -- 4. Call the existing create_sale_transaction RPC
  select public.create_sale_transaction(
    p_shop_id,
    null,           -- customer_id (not tracked on quotation convert)
    p_created_by,
    v_total,
    v_items
  ) into v_sale_id;

  -- 5. Mark the quotation as accepted
  update public.quotations
  set status = 'accepted'
  where id = p_quotation_id;

  return v_sale_id;
end;
$$ language plpgsql;
