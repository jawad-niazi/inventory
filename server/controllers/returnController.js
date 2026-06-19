const supabase = require('../services/supabaseClient')
const { resolveShopId, assertShopAccess } = require('../utils/shopAccess')

exports.list = async (req, res, next) => {
  try {
    const shopId = resolveShopId(req)
    if (!assertShopAccess(req.appUser, shopId, res)) return

    const { data, error } = await supabase
      .from('returns')
      .select('*, sales(id, total, created_at), app_users(id, email)')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false })

    if (error) return next(error)
    res.json({ returns: data })
  } catch (err) {
    next(err)
  }
}

exports.getOne = async (req, res, next) => {
  try {
    const { id } = req.params

    const { data: ret, error } = await supabase
      .from('returns')
      .select('*, sales(*, customers(*)), return_items(*, products(name, sku))')
      .eq('id', id)
      .single()

    if (error) return next(error)
    if (!assertShopAccess(req.appUser, ret.shop_id, res)) return

    res.json({ return: ret })
  } catch (err) {
    next(err)
  }
}

exports.create = async (req, res, next) => {
  try {
    const shopId = resolveShopId(req)
    if (!assertShopAccess(req.appUser, shopId, res)) return

    const { sale_id, total_refunded, reason, items } = req.body
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Return items are required' })
    }

    // 1. Create Return record
    const { data: ret, error: returnErr } = await supabase
      .from('returns')
      .insert({
        shop_id: shopId,
        sale_id: sale_id || null,
        total_refunded: total_refunded || 0,
        reason: reason || null,
        created_by: req.appUser.id
      })
      .select()
      .single()

    if (returnErr) return next(returnErr)

    // 2. Insert return items
    const returnItemsPayload = items.map(item => ({
      return_id: ret.id,
      product_id: item.product_id,
      quantity: parseInt(item.quantity, 10),
      refund_amount: parseFloat(item.refund_amount)
    }))

    const { error: itemsErr } = await supabase
      .from('return_items')
      .insert(returnItemsPayload)

    if (itemsErr) return next(itemsErr)

    // 3. Reinstate stock in inventory
    for (const item of items) {
      const qty = parseInt(item.quantity, 10)
      const prodId = item.product_id

      // Fetch current inventory
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
          reason: `Return: ${ret.id}`,
          adjusted_by: req.appUser.id
        })
    }

    res.status(201).json({ return: ret })
  } catch (err) {
    next(err)
  }
}
