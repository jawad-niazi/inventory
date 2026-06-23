-- Migration: 012_mark_purchase_received_cleanup.sql
-- Drops any overloaded mark_purchase_received functions and creates a single definitive version

DROP FUNCTION IF EXISTS public.mark_purchase_received(UUID, VARCHAR);
DROP FUNCTION IF EXISTS public.mark_purchase_received(UUID, UUID);

CREATE OR REPLACE FUNCTION public.mark_purchase_received(
  p_purchase_id UUID,
  p_processed_by UUID
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
  -- Lock the purchase row to prevent concurrent processing
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

  -- Update purchase status
  UPDATE purchases
  SET status = 'received', updated_at = NOW()
  WHERE id = p_purchase_id;

  -- Process each purchase item and update stock/inventory atomically
  FOR v_item IN
    SELECT product_id, quantity
    FROM purchase_items
    WHERE purchase_id = p_purchase_id
  LOOP
    -- Update denormalized product stock
    UPDATE products
    SET current_stock = COALESCE(current_stock, 0) + v_item.quantity,
        updated_at = NOW()
    WHERE id = v_item.product_id;

    -- Upsert inventory row for shop/product
    INSERT INTO inventory (shop_id, product_id, quantity, updated_at)
    VALUES (v_shop_id, v_item.product_id, v_item.quantity, NOW())
    ON CONFLICT (shop_id, product_id) DO UPDATE
      SET quantity = inventory.quantity + EXCLUDED.quantity,
          updated_at = NOW();

    -- Insert adjustment record (use adjusted_by to match schema)
    INSERT INTO inventory_adjustments (shop_id, product_id, quantity_change, reason, adjusted_by, created_at)
    VALUES (v_shop_id, v_item.product_id, v_item.quantity, 'Purchase Received', p_processed_by, NOW());
  END LOOP;

  RETURN json_build_object('success', true, 'purchase_id', p_purchase_id);
END;
$$;

-- Force PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';
