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
    res.json({ quotations: data })
  } catch (err) {
    next(err)
  }
}

exports.getOne = async (req, res, next) => {
  try {
    const { id } = req.params

    const { data: quotation, error } = await supabase
      .from('quotations')
      .select('*, quotation_items(*, products(*))')
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

    const { quote_number, valid_until, items } = req.body
    if (!quote_number) return res.status(400).json({ error: 'Quote number is required' })
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Quotation items are required' })
    }

    // 1. Create quotation
    const { data: quotation, error: quoteErr } = await supabase
      .from('quotations')
      .insert({
        shop_id: shopId,
        quote_number,
        status: 'draft',
        valid_until: valid_until || null
      })
      .select()
      .single()

    if (quoteErr) return next(quoteErr)

    // 2. Insert items
    const quoteItemsPayload = items.map(item => ({
      quotation_id: quotation.id,
      product_id: item.product_id || null,
      description: item.description || 'Item',
      quantity: parseInt(item.quantity, 10),
      unit_price: parseFloat(item.unit_price),
      subtotal: parseInt(item.quantity, 10) * parseFloat(item.unit_price)
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
    const { status, valid_until } = req.body

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

    const { error } = await supabase.from('quotations').delete().eq('id', id)
    if (error) return next(error)
    res.json({ deleted: true })
  } catch (err) {
    next(err)
  }
}
