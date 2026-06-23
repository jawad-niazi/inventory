const supabase = require('../services/supabaseClient')
const { resolveShopId, assertShopAccess } = require('../utils/shopAccess')

exports.list = async (req, res, next) => {
  try {
    const shopId = resolveShopId(req)
    if (!assertShopAccess(req.appUser, shopId, res)) return

    const { data, error } = await supabase
      .from('quotations')
      .select('*')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false })

    if (error) return next(error)
    res.json({ quotations: data ?? [] })
  } catch (err) {
    next(err)
  }
}

exports.getOne = async (req, res, next) => {
  try {
    const { id } = req.params

    const { data: quotation, error } = await supabase
      .from('quotations')
      .select('*, quotation_items(*, products(id, name, sku, model_name, price))')
      .eq('id', id)
      .single()

    if (error) return next(error)
    if (!assertShopAccess(req.appUser, quotation.shop_id, res)) return

    res.json({ quotation })
  } catch (err) {
    next(err)
  }
}

exports.create = async (req, res, next) => {
  try {
    const shopId = resolveShopId(req)
    if (!assertShopAccess(req.appUser, shopId, res)) return

    const { customer_name, notes, valid_until, items } = req.body
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Quotation items are required' })
    }

    // Auto-generate a quote number: QT-YYYYMMDD-XXXX
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const randPart = Math.random().toString(36).slice(-4).toUpperCase()
    const quote_number = `QT-${datePart}-${randPart}`

    // Calculate total
    const total = items.reduce(
      (sum, item) => sum + (parseInt(item.quantity, 10) || 0) * (parseFloat(item.unit_price) || 0),
      0
    )

    // 1. Create quotation header
    const { data: quotation, error: quoteErr } = await supabase
      .from('quotations')
      .insert({
        shop_id: shopId,
        quote_number,
        status: 'draft',
        customer_name: customer_name || null,
        notes: notes || null,
        total,
        valid_until: valid_until || null,
      })
      .select()
      .single()

    if (quoteErr) return next(quoteErr)

    // 2. Insert items (no stock deduction)
    const quoteItemsPayload = items.map((item) => ({
      quotation_id: quotation.id,
      product_id: item.product_id || null,
      description: item.description || item.name || 'Item',
      quantity: parseInt(item.quantity, 10),
      unit_price: parseFloat(item.unit_price),
      subtotal: parseInt(item.quantity, 10) * parseFloat(item.unit_price),
    }))

    const { error: itemsErr } = await supabase
      .from('quotation_items')
      .insert(quoteItemsPayload)

    if (itemsErr) return next(itemsErr)

    res.status(201).json({ quotation })
  } catch (err) {
    next(err)
  }
}

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status, valid_until, customer_name, notes } = req.body

    const { data: existing, error: fetchError } = await supabase
      .from('quotations')
      .select('shop_id')
      .eq('id', id)
      .single()

    if (fetchError) return next(fetchError)
    if (!assertShopAccess(req.appUser, existing.shop_id, res)) return

    const payload = {}
    if (status !== undefined) payload.status = status
    if (valid_until !== undefined) payload.valid_until = valid_until
    if (customer_name !== undefined) payload.customer_name = customer_name
    if (notes !== undefined) payload.notes = notes

    const { data, error } = await supabase
      .from('quotations')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) return next(error)
    res.json({ quotation: data })
  } catch (err) {
    next(err)
  }
}

exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params

    const { data: existing, error: fetchError } = await supabase
      .from('quotations')
      .select('shop_id')
      .eq('id', id)
      .single()

    if (fetchError) return next(fetchError)
    if (!assertShopAccess(req.appUser, existing.shop_id, res)) return

    await supabase.from('quotation_items').delete().eq('quotation_id', id)
    const { error } = await supabase.from('quotations').delete().eq('id', id)
    if (error) return next(error)
    res.json({ deleted: true })
  } catch (err) {
    next(err)
  }
}

// POST /api/quotations/:id/convert
// Converts a draft/sent quotation into a finalized sale via the DB RPC.
exports.convertToSale = async (req, res, next) => {
  try {
    const { id } = req.params

    const { data: quotation, error: fetchError } = await supabase
      .from('quotations')
      .select('shop_id, status')
      .eq('id', id)
      .single()

    if (fetchError) return next(fetchError)
    if (!assertShopAccess(req.appUser, quotation.shop_id, res)) return

    if (!['draft', 'sent'].includes(quotation.status)) {
      return res.status(400).json({
        error: `Quotation cannot be converted — current status is "${quotation.status}"`,
      })
    }
    // Convert quotation into a sale WITHOUT adjusting inventory counts.
    // This will create a sale header and sale_items records but will not call
    // the stock-deducting RPC. This behavior keeps the "draft" pipeline
    // from removing inventory until a separate stock-commit action is taken.

    // 1. Fetch quotation items (linked products)
    const { data: itemsData, error: itemsErr } = await supabase
      .from('quotation_items')
      .select('id, product_id, description, quantity, unit_price, subtotal')
      .eq('quotation_id', id)

    if (itemsErr) return next(itemsErr)

    // 2. Insert sale header
    const { data: sale, error: saleErr } = await supabase
      .from('sales')
      .insert({
        shop_id: quotation.shop_id,
        customer_id: null,
        total: itemsData.reduce((s, it) => s + (parseFloat(it.subtotal) || 0), 0),
        status: 'completed',
        created_by: req.appUser.id,
      })
      .select()
      .single()

    if (saleErr) return next(saleErr)

    // 3. Insert sale_items rows without changing inventory
    const saleItemsPayload = (itemsData || []).map((it) => ({
      sale_id: sale.id,
      product_id: it.product_id || null,
      quantity: parseInt(it.quantity, 10) || 0,
      unit_price: parseFloat(it.unit_price) || 0,
      subtotal: parseFloat(it.subtotal) || 0,
    }))

    if (saleItemsPayload.length > 0) {
      const { error: insertItemsErr } = await supabase
        .from('sale_items')
        .insert(saleItemsPayload)

      if (insertItemsErr) return next(insertItemsErr)
    }

    // 4. Mark quotation as accepted
    const { error: updErr } = await supabase
      .from('quotations')
      .update({ status: 'accepted' })
      .eq('id', id)

    if (updErr) return next(updErr)

    res.json({ sale_id: sale.id, message: 'Quotation converted to sale (no stock change)' })
  } catch (err) {
    next(err)
  }
}
