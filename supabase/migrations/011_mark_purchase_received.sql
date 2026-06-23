-- Migration: 011_mark_purchase_received.sql
-- Creates the mark_purchase_received RPC to atomically mark a purchase as received
-- and apply inventory updates.

CREATE OR REPLACE FUNCTION mark_purchase_received(
  p_purchase_id UUID,
  p_processed_by VARCHAR
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_status VARCHAR;
  v_shop_id UUID;
  v_item RECORD;
BEGIN
  SELECT status, shop_id INTO v_current_status, v_shop_id
  FROM purchases
  WHERE id = p_purchase_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'purchase_not_found';
  END IF;

  IF v_current_status = 'received' THEN
    RAISE EXCEPTION 'already_received';
  END IF;

  UPDATE purchases
  SET status = 'received'
  WHERE id = p_purchase_id;

  FOR v_item IN 
    SELECT product_id, quantity, price 
    FROM purchase_items 
    WHERE purchase_id = p_purchase_id
  LOOP
    UPDATE products
    SET current_stock = COALESCE(current_stock, 0) + v_item.quantity
    WHERE id = v_item.product_id;

    INSERT INTO inventory (shop_id, product_id, quantity, updated_at)
    VALUES (v_shop_id, v_item.product_id, v_item.quantity, NOW())
    ON CONFLICT (shop_id, product_id) 
    DO UPDATE SET 
      quantity = inventory.quantity + EXCLUDED.quantity,
      updated_at = NOW();

    INSERT INTO inventory_adjustments (shop_id, product_id, quantity, reason, created_by, created_at)
    VALUES (v_shop_id, v_item.product_id, v_item.quantity, 'Purchase Received', p_processed_by, NOW());
  END LOOP;

  RETURN json_build_object('success', true);
END;
$$;

-- Force PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
