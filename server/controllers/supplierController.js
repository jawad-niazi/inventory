const supabase = require('../services/supabaseClient')
const { resolveShopId, assertShopAccess } = require('../utils/shopAccess')

exports.list = async (req, res, next) => {
  try {
    const shopId = resolveShopId(req)
    if (!assertShopAccess(req.appUser, shopId, res)) return

    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('shop_id', shopId)
      .order('company_name')

    if (error) return next(error)
    res.json({ suppliers: data })
  } catch (err) {
    next(err)
  }
}

exports.getOne = async (req, res, next) => {
  try {
    const { id } = req.params
    const shopId = resolveShopId(req)
    if (!assertShopAccess(req.appUser, shopId, res)) return

    const { data: supplier, error: supErr } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single()
    if (supErr) return next(supErr)
    if (!assertShopAccess(req.appUser, supplier.shop_id, res)) return

    // Fetch ledger transactions for this supplier
    const { data: ledger, error: ledgerErr } = await supabase
      .from('ledger_transactions')
      .select('*')
      .eq('shop_id', supplier.shop_id)
      .eq('party_type', 'supplier')
      .eq('party_id', id)
      .order('created_at', { ascending: false })

    if (ledgerErr) return next(ledgerErr)

    // Enrich ledger with actual purchase amounts
    const ledgerData = ledger || []
    const purchaseIds = ledgerData.filter(l => l.reference_type === 'purchase' && l.reference_id).map(l => l.reference_id)

    if (purchaseIds.length > 0) {
      const { data: purchases } = await supabase
        .from('purchases')
        .select('id, total_amount, paid_amount')
        .in('id', purchaseIds)

      if (purchases) {
        const pMap = {}
        purchases.forEach(p => pMap[p.id] = p)
        ledgerData.forEach(l => {
          if (l.reference_type === 'purchase' && pMap[l.reference_id]) {
            const p = pMap[l.reference_id]
            l.total_amount = Number(p.total_amount || 0)
            l.paid_amount = Number(p.paid_amount || 0)
            l.due_amount = Math.max(0, l.total_amount - l.paid_amount)
          }
        })
      }
    }

    res.json({ supplier, ledger: ledgerData })
  } catch (err) {
    next(err)
  }
}

exports.create = async (req, res, next) => {
  try {
    const shopId = resolveShopId(req)
    if (!assertShopAccess(req.appUser, shopId, res)) return

    const { company_name, phone, address } = req.body
    if (!company_name) return res.status(400).json({ error: 'Company name is required' })

    const { data, error } = await supabase
      .from('suppliers')
      .insert({ shop_id: shopId, company_name, phone, address })
      .select()
      .single()

    if (error) return next(error)
    res.status(201).json({ supplier: data })
  } catch (err) {
    next(err)
  }
}

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params
    const { company_name, phone, address } = req.body

    const { data: existing, error: fetchError } = await supabase
      .from('suppliers')
      .select('shop_id')
      .eq('id', id)
      .single()

    if (fetchError) return next(fetchError)
    if (!assertShopAccess(req.appUser, existing.shop_id, res)) return

    const payload = { updated_at: new Date().toISOString() }
    if (company_name !== undefined) payload.company_name = company_name
    if (phone !== undefined) payload.phone = phone
    if (address !== undefined) payload.address = address

    const { data, error } = await supabase
      .from('suppliers')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) return next(error)
    res.json({ supplier: data })
  } catch (err) {
    next(err)
  }
}

exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params

    const { data: existing, error: fetchError } = await supabase
      .from('suppliers')
      .select('shop_id')
      .eq('id', id)
      .single()

    if (fetchError) return next(fetchError)
    if (!assertShopAccess(req.appUser, existing.shop_id, res)) return

    const { error } = await supabase.from('suppliers').delete().eq('id', id)
    if (error) return next(error)
    res.json({ deleted: true })
  } catch (err) {
    next(err)
  }
}
