const supabase = require('../services/supabaseClient')
const { resolveShopId, assertShopAccess } = require('../utils/shopAccess')

exports.list = async (req, res, next) => {
  try {
    const shopId = resolveShopId(req)
    if (!assertShopAccess(req.appUser, shopId, res)) return

    const { data, error } = await supabase
      .from('purchases')
      .select('*, suppliers(id, name), app_users(id, email)')
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
      .select('*, suppliers(id, name, email, phone, address), purchase_items(*, products(name, sku))')
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
    const purchaseItemsPayload = items.map(item => ({
      purchase_id: purchase.id,
      product_id: item.product_id,
      quantity: parseInt(item.quantity, 10),
      unit_cost: parseFloat(item.unit_cost),
      subtotal: parseInt(item.quantity, 10) * parseFloat(item.unit_cost)
    }))

    const { error: itemsErr } = await supabase
      .from('purchase_items')
      .insert(purchaseItemsPayload)

    if (itemsErr) return next(itemsErr)

    // If purchase is received, increase inventory
    if (status === 'received' || !status) {
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
