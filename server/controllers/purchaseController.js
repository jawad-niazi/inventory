const supabase = require('../services/supabaseClient')
const { resolveShopId, assertShopAccess } = require('../utils/shopAccess')

exports.list = async (req, res, next) => {
  try {
    const shopId = resolveShopId(req)
    if (!assertShopAccess(req.appUser, shopId, res)) return

    const { data, error } = await supabase
      .from('purchases')
      .select('*, suppliers(id, company_name, phone, address), app_users(id, email)')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false })

    if (error) return next(error)
    res.json({ purchases: data })
  } catch (err) {
    next(err)
  }
}

exports.getOne = async (req, res, next) => {
  try {
    const { id } = req.params

    const { data: purchase, error } = await supabase
      .from('purchases')
      .select('*, suppliers(id, company_name, phone, address), purchase_items(*, products(name, sku, model_name, product_code))')
      .eq('id', id)
      .single()

    if (error) return next(error)
    if (!assertShopAccess(req.appUser, purchase.shop_id, res)) return

    res.json({ purchase })
  } catch (err) {
    next(err)
  }
}

exports.create = async (req, res, next) => {
  try {
    const shopId = resolveShopId(req)
    if (!assertShopAccess(req.appUser, shopId, res)) return

    const { supplier_id, total_amount, status, items } = req.body
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Purchase items are required' })
    }

    // 1. Create Purchase
    const { data: purchase, error: purchaseErr } = await supabase
      .from('purchases')
      .insert({
        shop_id: shopId,
        supplier_id: supplier_id || null,
        total_amount: total_amount || 0,
        status: status || 'received',
        created_by: req.appUser.id
      })
      .select()
      .single()

    if (purchaseErr) return next(purchaseErr)

    // 2. Insert Purchase Items and Update Stock if received
    const purchaseItemsPayload = items.map(item => {
      const qty = parseInt(item.quantity, 10)
      const price = parseFloat(item.purchase_price ?? item.unit_cost ?? 0)
      return {
        purchase_id: purchase.id,
        product_id: item.product_id,
        quantity: qty,
        unit_cost: price,
        purchase_price: price,
        subtotal: qty * price
      }
    })

    const { error: itemsErr } = await supabase
      .from('purchase_items')
      .insert(purchaseItemsPayload)

    if (itemsErr) return next(itemsErr)

    // If purchase is received, increase inventory
    if (status === 'received' || !status) {
      for (const item of items) {
        const qty = parseInt(item.quantity, 10)
        const prodId = item.product_id

        // Update products.current_stock (denormalized count)
        const { data: prodData, error: prodErr } = await supabase
          .from('products')
          .select('id, current_stock')
          .eq('id', prodId)
          .single()
        if (prodErr) return next(prodErr)

        const newStock = (prodData.current_stock || 0) + qty
        await supabase.from('products').update({ current_stock: newStock, updated_at: new Date().toISOString() }).eq('id', prodId)

        // Also keep the inventory table in sync for existing logic
        const { data: currentInv, error: invFetchErr } = await supabase
          .from('inventory')
          .select('*')
          .eq('shop_id', shopId)
          .eq('product_id', prodId)
          .maybeSingle()

        if (invFetchErr) return next(invFetchErr)

        if (currentInv) {
          // Update
          await supabase
            .from('inventory')
            .update({ quantity: currentInv.quantity + qty, updated_at: new Date().toISOString() })
            .eq('id', currentInv.id)
        } else {
          // Insert
          await supabase
            .from('inventory')
            .insert({ shop_id: shopId, product_id: prodId, quantity: qty })
        }

        // Log adjustment
        await supabase
          .from('inventory_adjustments')
          .insert({
            shop_id: shopId,
            product_id: prodId,
            quantity_change: qty,
            reason: `Purchase order: ${purchase.id}`,
            adjusted_by: req.appUser.id
          })
      }
    }

    res.status(201).json({ purchase })
  } catch (err) {
    next(err)
  }
}

// PUT /api/purchases/:id/status
// Body: { status: 'received' }
exports.updateStatus = async (req, res, next) => {
  try {
    const shopId = resolveShopId(req)
    if (!assertShopAccess(req.appUser, shopId, res)) return

    const { id } = req.params
    const { status } = req.body

    if (!status) return res.status(400).json({ error: 'status is required' })

    // Fetch existing purchase and ensure we have the latest status
    const { data: purchase, error: fetchErr } = await supabase
      .from('purchases')
      .select('id, status, shop_id')
      .eq('id', id)
      .single()

    if (fetchErr) return next(fetchErr)
    if (!assertShopAccess(req.appUser, purchase.shop_id, res)) return

    // Idempotency guard: if already received, abort
    if ((purchase.status || 'received') === 'received' && status === 'received') {
      return res.status(400).json({ error: 'This purchase has already been marked as received. Stock cannot be duplicated.' })
    }

    // If marking as received, delegate to a DB-side RPC which performs all updates atomically.
    if (status === 'received') {
      // Call Postgres function mark_purchase_received(p_purchase_id uuid, p_processed_by uuid)
      // The function should update purchases.status, increment product stock, upsert inventory,
      // and insert inventory_adjustments within a single transaction.
      try {
        const { data: rpcData, error: rpcErr } = await supabase.rpc('mark_purchase_received', {
          p_purchase_id: id,
          p_processed_by: req.appUser.id,
        })

        if (rpcErr) {
          const msg = (rpcErr.message || rpcErr.details || '').toString()
          console.error('[purchaseController.updateStatus] RPC error:', rpcErr)
          if (msg.includes('already_received')) {
            return res.status(400).json({ error: 'This purchase has already been processed and received. Stock updates are locked.' })
          }
          return next(rpcErr)
        }

        // rpcData is expected to contain the updated purchase row (or a JSON representation)
        return res.json({ purchase: rpcData })
      } catch (err) {
        const msg = (err && err.message) ? String(err.message) : ''
        console.error('[purchaseController.updateStatus] RPC threw an exception:', err)
        if (msg.includes('already_received')) {
          return res.status(400).json({ error: 'This purchase has already been processed and received. Stock updates are locked.' })
        }
        return next(err)
      }
    }

    // For other status changes, just update the row
    const { data: updated, error: updErr } = await supabase
      .from('purchases')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (updErr) return next(updErr)
    res.json({ purchase: updated })
  } catch (err) {
    next(err)
  }
}
