const supabase = require('../services/supabaseClient')
const { resolveShopId, assertShopAccess, canAccessShop } = require('../utils/shopAccess')

exports.list = async (req, res, next) => {
  try {
    const shopId = resolveShopId(req)
    
    // Scoping check: users must have access to the requested shop, or if super_admin they can list all or filter by shop
    if (req.appUser.role !== 'super_admin') {
      if (!shopId) {
        return res.status(400).json({ error: 'shop_id is required' })
      }
      if (!canAccessShop(req.appUser, shopId)) {
        return res.status(403).json({ error: 'Forbidden: no access to this shop' })
      }
    }

    let query = supabase
      .from('stock_transfers')
      .select('*, from_shop:from_shop_id(id, name), to_shop:to_shop_id(id, name), app_users(id, email)')
      .order('created_at', { ascending: false })

    if (shopId) {
      query = query.or(`from_shop_id.eq.${shopId},to_shop_id.eq.${shopId}`)
    }

    const { data, error } = await query
    if (error) return next(error)
    res.json({ transfers: data })
  } catch (err) {
    next(err)
  }
}

exports.getOne = async (req, res, next) => {
  try {
    const { id } = req.params

    const { data: transfer, error } = await supabase
      .from('stock_transfers')
      .select('*, from_shop:from_shop_id(id, name), to_shop:to_shop_id(id, name), stock_transfer_items(*, products(name, sku))')
      .eq('id', id)
      .single()

    if (error) return next(error)

    // User must have access to either the source or destination shop
    const userRole = req.appUser.role
    if (userRole !== 'super_admin') {
      const hasFromAccess = canAccessShop(req.appUser, transfer.from_shop_id)
      const hasToAccess = canAccessShop(req.appUser, transfer.to_shop_id)
      if (!hasFromAccess && !hasToAccess) {
        return res.status(403).json({ error: 'Forbidden: no access to this transfer' })
      }
    }

    res.json({ transfer })
  } catch (err) {
    next(err)
  }
}

exports.create = async (req, res, next) => {
  try {
    const { from_shop_id, to_shop_id, status, items } = req.body

    // Ensure permissions
    if (req.appUser.role !== 'super_admin') {
      if (!canAccessShop(req.appUser, from_shop_id)) {
        return res.status(403).json({ error: 'Forbidden: no access to source shop' })
      }
    }

    if (!to_shop_id || from_shop_id === to_shop_id) {
      return res.status(400).json({ error: 'Valid and distinct destination shop is required' })
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Transfer items are required' })
    }

    // 1. Create Transfer record
    const targetStatus = status || 'pending'
    const { data: transfer, error: transErr } = await supabase
      .from('stock_transfers')
      .insert({
        from_shop_id,
        to_shop_id,
        status: targetStatus,
        created_by: req.appUser.id
      })
      .select()
      .single()

    if (transErr) return next(transErr)

    // 2. Insert items
    const transferItemsPayload = items.map(item => ({
      transfer_id: transfer.id,
      product_id: item.product_id,
      quantity: parseInt(item.quantity, 10)
    }))

    const { error: itemsErr } = await supabase
      .from('stock_transfer_items')
      .insert(transferItemsPayload)

    if (itemsErr) return next(itemsErr)

    // If initial status is shipped or received, trigger inventory adjustments
    if (targetStatus === 'shipped' || targetStatus === 'received') {
      await handleInventoryDeduction(from_shop_id, items, transfer.id, req.appUser.id)
    }
    if (targetStatus === 'received') {
      await handleInventoryAddition(to_shop_id, items, transfer.id, req.appUser.id)
    }

    res.status(201).json({ transfer })
  } catch (err) {
    next(err)
  }
}

exports.updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const { data: transfer, error: fetchError } = await supabase
      .from('stock_transfers')
      .select('*, stock_transfer_items(*)')
      .eq('id', id)
      .single()

    if (fetchError) return next(fetchError)

    // Check permissions: need access to from_shop to ship, and to_shop to receive
    if (req.appUser.role !== 'super_admin') {
      if (status === 'shipped' && !canAccessShop(req.appUser, transfer.from_shop_id)) {
        return res.status(403).json({ error: 'Forbidden: no permission to ship from this shop' })
      }
      if (status === 'received' && !canAccessShop(req.appUser, transfer.to_shop_id)) {
        return res.status(403).json({ error: 'Forbidden: no permission to receive in this shop' })
      }
    }

    if (transfer.status === status) {
      return res.status(400).json({ error: `Transfer is already in '${status}' status` })
    }

    // Logic transitions
    if (status === 'shipped') {
      // Must not be already shipped or received
      if (transfer.status !== 'pending') {
        return res.status(400).json({ error: 'Only pending transfers can be shipped' })
      }
      await handleInventoryDeduction(transfer.from_shop_id, transfer.stock_transfer_items, transfer.id, req.appUser.id)
    } else if (status === 'received') {
      // Must be pending or shipped
      if (transfer.status === 'cancelled' || transfer.status === 'received') {
        return res.status(400).json({ error: 'Cannot receive cancelled or already completed transfers' })
      }
      
      // If it was pending, we need to ship it (deduct from origin) AND receive it (add to destination)
      if (transfer.status === 'pending') {
        await handleInventoryDeduction(transfer.from_shop_id, transfer.stock_transfer_items, transfer.id, req.appUser.id)
      }
      await handleInventoryAddition(transfer.to_shop_id, transfer.stock_transfer_items, transfer.id, req.appUser.id)
    }

    const { data: updatedTransfer, error: updateErr } = await supabase
      .from('stock_transfers')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (updateErr) return next(updateErr)
    res.json({ transfer: updatedTransfer })
  } catch (err) {
    next(err)
  }
}

// Helpers
async function handleInventoryDeduction(shopId, items, transferId, userId) {
  for (const item of items) {
    const qty = parseInt(item.quantity, 10)
    const prodId = item.product_id

    const { data: inv, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('shop_id', shopId)
      .eq('product_id', prodId)
      .maybeSingle()

    const currentQty = inv?.quantity ?? 0
    // Deduct stock
    if (inv) {
      await supabase
        .from('inventory')
        .update({ quantity: currentQty - qty, updated_at: new Date().toISOString() })
        .eq('id', inv.id)
    } else {
      await supabase
        .from('inventory')
        .insert({ shop_id: shopId, product_id: prodId, quantity: -qty })
    }

    // Log adjustment
    await supabase
      .from('inventory_adjustments')
      .insert({
        shop_id: shopId,
        product_id: prodId,
        quantity_change: -qty,
        reason: `Transfer OUT: ${transferId}`,
        adjusted_by: userId
      })
  }
}

async function handleInventoryAddition(shopId, items, transferId, userId) {
  for (const item of items) {
    const qty = parseInt(item.quantity, 10)
    const prodId = item.product_id

    const { data: inv, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('shop_id', shopId)
      .eq('product_id', prodId)
      .maybeSingle()

    const currentQty = inv?.quantity ?? 0
    // Add stock
    if (inv) {
      await supabase
        .from('inventory')
        .update({ quantity: currentQty + qty, updated_at: new Date().toISOString() })
        .eq('id', inv.id)
    } else {
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
        reason: `Transfer IN: ${transferId}`,
        adjusted_by: userId
      })
  }
}
