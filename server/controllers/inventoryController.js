const supabase = require('../services/supabaseClient')
const { resolveShopId, assertShopAccess } = require('../utils/shopAccess')

exports.list = async (req, res, next) => {
  try {
    const shopId = resolveShopId(req)
    if (!assertShopAccess(req.appUser, shopId, res)) return

    const { data, error } = await supabase
      .from('inventory')
      .select('*, products(id, name, sku, low_stock_threshold, status, image_url, categories(name))')
      .eq('shop_id', shopId)
      .order('updated_at', { ascending: false })

    if (error) return next(error)
    res.json({ inventory: data })
  } catch (err) {
    next(err)
  }
}

exports.lowStock = async (req, res, next) => {
  try {
    const shopId = resolveShopId(req)
    if (!assertShopAccess(req.appUser, shopId, res)) return

    const { data, error } = await supabase
      .from('inventory')
      .select('*, products(id, name, sku, low_stock_threshold, image_url)')
      .eq('shop_id', shopId)

    if (error) return next(error)

    const alerts = (data || []).filter((row) => {
      const threshold = row.products?.low_stock_threshold ?? 0
      return threshold > 0 && row.quantity <= threshold
    })

    res.json({ alerts, count: alerts.length })
  } catch (err) {
    next(err)
  }
}

exports.adjust = async (req, res, next) => {
  try {
    const shopId = resolveShopId(req)
    if (!assertShopAccess(req.appUser, shopId, res)) return

    const { product_id, quantity_change, reason } = req.body
    const change = parseInt(quantity_change, 10)
    if (!product_id || isNaN(change) || change === 0) {
      return res.status(400).json({ error: 'product_id and non-zero quantity_change required' })
    }

    const { data: product, error: prodError } = await supabase
      .from('products')
      .select('id, shop_id, name')
      .eq('id', product_id)
      .eq('shop_id', shopId)
      .single()

    if (prodError) return res.status(404).json({ error: 'Product not found in this shop' })

    const { data: inv, error: invFetchError } = await supabase
      .from('inventory')
      .select('*')
      .eq('shop_id', shopId)
      .eq('product_id', product_id)
      .maybeSingle()

    if (invFetchError) return next(invFetchError)

    const currentQty = inv?.quantity ?? 0
    const newQty = currentQty + change
    if (newQty < 0) {
      return res.status(400).json({ error: 'Insufficient stock for this adjustment' })
    }

    let updatedInv
    if (inv) {
      const { data, error } = await supabase
        .from('inventory')
        .update({ quantity: newQty, updated_at: new Date().toISOString() })
        .eq('id', inv.id)
        .select('*, products(id, name, sku)')
        .single()
      if (error) return next(error)
      updatedInv = data
    } else {
      const { data, error } = await supabase
        .from('inventory')
        .insert({ shop_id: shopId, product_id, quantity: newQty })
        .select('*, products(id, name, sku)')
        .single()
      if (error) return next(error)
      updatedInv = data
    }

    const { data: adjustment, error: adjError } = await supabase
      .from('inventory_adjustments')
      .insert({
        shop_id: shopId,
        product_id,
        quantity_change: change,
        reason: reason || null,
        adjusted_by: req.appUser.id,
      })
      .select('*, app_users(email), products(name)')
      .single()

    if (adjError) return next(adjError)

    res.json({ inventory: updatedInv, adjustment })
  } catch (err) {
    next(err)
  }
}

exports.history = async (req, res, next) => {
  try {
    const shopId = resolveShopId(req)
    if (!assertShopAccess(req.appUser, shopId, res)) return

    let query = supabase
      .from('inventory_adjustments')
      .select('*, products(id, name, sku), app_users(email)')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (req.query.product_id) {
      query = query.eq('product_id', req.query.product_id)
    }

    const { data, error } = await query
    if (error) return next(error)
    // Attach supplier company_name for adjustments created by purchases
    const purchaseIds = []
    data.forEach((h) => {
      if (h.reason && typeof h.reason === 'string') {
        const m = h.reason.match(/Purchase order: ([0-9a-fA-F-]{36})/)
        if (m) purchaseIds.push(m[1])
      }
    })

    let supplierMap = {}
    if (purchaseIds.length > 0) {
      const { data: purchases, error: pErr } = await supabase
        .from('purchases')
        .select('id, supplier_id, suppliers(company_name)')
        .in('id', purchaseIds)
      if (!pErr && purchases) {
        purchases.forEach((p) => {
          supplierMap[p.id] = p.suppliers?.company_name || null
        })
      }
    }

    const enriched = (data || []).map((h) => {
      if (h.reason && typeof h.reason === 'string') {
        const m = h.reason.match(/Purchase order: ([0-9a-fA-F-]{36})/)
        if (m) {
          h.purchase_supplier_company = supplierMap[m[1]] || null
        }
      }
      return h
    })

    res.json({ history: enriched })
  } catch (err) {
    next(err)
  }
}
