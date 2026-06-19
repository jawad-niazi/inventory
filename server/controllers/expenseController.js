const supabase = require('../services/supabaseClient')
const { resolveShopId, assertShopAccess } = require('../utils/shopAccess')

exports.list = async (req, res, next) => {
  try {
    const shopId = resolveShopId(req)
    if (!assertShopAccess(req.appUser, shopId, res)) return

    const { data, error } = await supabase
      .from('expenses')
      .select('*, app_users(id, email)')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false })

    if (error) return next(error)
    res.json({ expenses: data })
  } catch (err) {
    next(err)
  }
}

exports.create = async (req, res, next) => {
  try {
    const shopId = resolveShopId(req)
    if (!assertShopAccess(req.appUser, shopId, res)) return

    const { amount, category, description } = req.body
    if (!amount || isNaN(parseFloat(amount))) {
      return res.status(400).json({ error: 'Valid amount is required' })
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        shop_id: shopId,
        amount: parseFloat(amount),
        category: category || 'general',
        description: description || null,
        created_by: req.appUser.id
      })
      .select()
      .single()

    if (error) return next(error)
    res.status(201).json({ expense: data })
  } catch (err) {
    next(err)
  }
}

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params
    const { amount, category, description } = req.body

    const { data: existing, error: fetchError } = await supabase
      .from('expenses')
      .select('shop_id')
      .eq('id', id)
      .single()

    if (fetchError) return next(fetchError)
    if (!assertShopAccess(req.appUser, existing.shop_id, res)) return

    const payload = {}
    if (amount !== undefined) payload.amount = parseFloat(amount)
    if (category !== undefined) payload.category = category
    if (description !== undefined) payload.description = description

    const { data, error } = await supabase
      .from('expenses')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) return next(error)
    res.json({ expense: data })
  } catch (err) {
    next(err)
  }
}

exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params

    const { data: existing, error: fetchError } = await supabase
      .from('expenses')
      .select('shop_id')
      .eq('id', id)
      .single()

    if (fetchError) return next(fetchError)
    if (!assertShopAccess(req.appUser, existing.shop_id, res)) return

    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) return next(error)
    res.json({ deleted: true })
  } catch (err) {
    next(err)
  }
}
