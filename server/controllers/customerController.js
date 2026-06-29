const supabase = require('../services/supabaseClient')
const { resolveShopId, assertShopAccess } = require('../utils/shopAccess')

exports.list = async (req, res, next) => {
  try {
    const shopId = resolveShopId(req)
    if (!assertShopAccess(req.appUser, shopId, res)) return

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('shop_id', shopId)
      .order('name')

    if (error) return next(error)
    res.json({ customers: data })
  } catch (err) {
    next(err)
  }
}

exports.getOne = async (req, res, next) => {
  try {
    const { id } = req.params
    const shopId = resolveShopId(req)
    if (!assertShopAccess(req.appUser, shopId, res)) return

    const { data: customer, error: supErr } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single()
    if (supErr) {
      if (supErr.code === 'PGRST116') {
         return res.status(404).json({ error: 'Customer not found' })
      }
      return next(supErr)
    }
    if (!assertShopAccess(req.appUser, customer.shop_id, res)) return

    // Fetch ledger transactions for this customer
    const { data: ledger, error: ledgerErr } = await supabase
      .from('ledger_transactions')
      .select('*')
      .eq('shop_id', customer.shop_id)
      .eq('party_type', 'customer')
      .eq('party_id', id)
      .order('created_at', { ascending: false })

    if (ledgerErr) return next(ledgerErr)

    res.json({ customer, ledger: ledger || [] })
  } catch (err) {
    next(err)
  }
}

exports.create = async (req, res, next) => {
  try {
    const shopId = resolveShopId(req)
    if (!assertShopAccess(req.appUser, shopId, res)) return

    const { name, phone, email, address } = req.body
    if (!name) return res.status(400).json({ error: 'Name is required' })

    const { data, error } = await supabase
      .from('customers')
      .insert({ shop_id: shopId, name, phone, email, address })
      .select()
      .single()

    if (error) return next(error)
    res.status(201).json({ customer: data })
  } catch (err) {
    next(err)
  }
}

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params
    const { name, phone, email, address } = req.body

    const { data: existing, error: fetchError } = await supabase
      .from('customers')
      .select('shop_id')
      .eq('id', id)
      .single()

    if (fetchError) return next(fetchError)
    if (!assertShopAccess(req.appUser, existing.shop_id, res)) return

    const payload = { updated_at: new Date().toISOString() }
    if (name !== undefined) payload.name = name
    if (phone !== undefined) payload.phone = phone
    if (email !== undefined) payload.email = email
    if (address !== undefined) payload.address = address

    const { data, error } = await supabase
      .from('customers')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) return next(error)
    res.json({ customer: data })
  } catch (err) {
    next(err)
  }
}

exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params

    const { data: existing, error: fetchError } = await supabase
      .from('customers')
      .select('shop_id')
      .eq('id', id)
      .single()

    if (fetchError) return next(fetchError)
    if (!assertShopAccess(req.appUser, existing.shop_id, res)) return

    const { error } = await supabase.from('customers').delete().eq('id', id)
    if (error) return next(error)
    res.json({ deleted: true })
  } catch (err) {
    next(err)
  }
}
