const supabase = require('../services/supabaseClient')
const { resolveShopId, assertShopAccess } = require('../utils/shopAccess')

exports.list = async (req, res, next) => {
  try {
    const shopId = resolveShopId(req)
    if (!assertShopAccess(req.appUser, shopId, res)) return

    const { data, error } = await supabase
      .from('sales')
      .select('*, customers(id, name), app_users(id, email)')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[salesController.list] Supabase error:', error.message)
      return next(error)
    }
    // Always return an array — never null — so the frontend never crashes on .map()
    res.json({ sales: data ?? [] })
  } catch (err) {
    next(err)
  }
}

exports.getOne = async (req, res, next) => {
  try {
    const { id } = req.params

    const { data: sale, error } = await supabase
      .from('sales')
      .select('*, customers(*), sale_items(*, products(name, sku, model_name, product_code))')
      .eq('id', id)
      .single()

    if (error) return next(error)
    if (!assertShopAccess(req.appUser, sale.shop_id, res)) return

    res.json({ sale })
  } catch (err) {
    next(err)
  }
}

exports.create = async (req, res, next) => {
  try {
    const shopId = resolveShopId(req)
    if (!assertShopAccess(req.appUser, shopId, res)) return

    const { customer_id, total, items, total_profit, paid_amount } = req.body
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Sale items are required' })
    }

    // Optionally log frontend-calculated total_profit for auditing (DB RPC computes canonical profit)
    if (total_profit !== undefined) {
      console.log(`[sales.create] frontend total_profit=${total_profit} for shop=${shopId} by user=${req.appUser?.id}`)
    }

    // Prepare items payload format for PostgreSQL jsonb
    // {product_id, quantity, unit_price, subtotal, product_name}
    // We add product_name so the PG RPC can print it in its exception if stock is low
    const formattedItems = items.map(item => ({
      product_id: item.product_id,
      quantity: parseInt(item.quantity, 10),
      unit_price: parseFloat(item.unit_price),
      subtotal: parseInt(item.quantity, 10) * parseFloat(item.unit_price),
      product_name: item.name || 'Product'
    }))

    // Call PostgreSQL RPC function to do atomic stock checking and deduction
    const { data: rpcData, error: rpcError } = await supabase.rpc('create_sale_transaction', {
      p_shop_id: shopId,
      p_customer_id: customer_id || null,
      p_created_by: req.appUser.id,
      p_total: parseFloat(total),
      p_items: formattedItems
    })

    if (rpcError) {
      console.error('RPC Error:', rpcError)
      if (rpcError.message && rpcError.message.includes('insufficient_stock:')) {
        const parts = rpcError.message.split('insufficient_stock:')
        const productName = parts[1] || 'one of the items'
        return res.status(400).json({ error: `Insufficient stock for product: ${productName}` })
      }
      return res.status(400).json({ error: rpcError.message })
    }

    // Normalize RPC return value to a single uuid string
    let saleId = null
    const raw = rpcData
    if (!raw) {
      return res.status(500).json({ error: 'Sale RPC returned no data' })
    }
    if (typeof raw === 'string') {
      saleId = raw
    } else if (Array.isArray(raw)) {
      const first = raw[0]
      if (!first) saleId = null
      else if (typeof first === 'string') saleId = first
      else if (first.id) saleId = first.id
      else if (first.create_sale_transaction) saleId = first.create_sale_transaction
      else saleId = Object.values(first)[0]
    } else if (typeof raw === 'object') {
      saleId = raw.id || raw.create_sale_transaction || Object.values(raw)[0]
    } else {
      saleId = String(raw)
    }

    if (!saleId) return res.status(500).json({ error: 'Failed to determine created sale id' })

    // If customer owes money (we received less than total), update customer balance and ledger
    const paidAmt = parseFloat(paid_amount || 0) || 0
    const due_amount = Math.max(0, parseFloat(total || 0) - paidAmt)
    if (customer_id && due_amount > 0) {
      // Increase customer current_balance (they owe us)
      const { data: custData, error: custErr } = await supabase
        .from('customers')
        .select('id, current_balance')
        .eq('id', customer_id)
        .single()
      if (custErr) return next(custErr)

      const newBal = (parseFloat(custData.current_balance || 0) + Number(due_amount))
      const { error: updCustErr } = await supabase
        .from('customers')
        .update({ current_balance: newBal, updated_at: new Date().toISOString() })
        .eq('id', customer_id)
      if (updCustErr) return next(updCustErr)

      // Insert ledger transaction
      const { error: ledgerErr } = await supabase
        .from('ledger_transactions')
        .insert({
          shop_id: shopId,
          party_type: 'customer',
          party_id: customer_id,
          amount: Number(due_amount),
          direction: 'credit',
          reference_type: 'sale',
          reference_id: saleId,
          note: `Sale created, due amount recorded`,
          created_by: req.appUser.id
        })
      if (ledgerErr) return next(ledgerErr)
    }

    // Persist paid_amount on sale header if provided
    if (paidAmt > 0) {
      const { error: updSaleErr } = await supabase
        .from('sales')
        .update({ paid_amount: paidAmt })
        .eq('id', saleId)
      if (updSaleErr) console.warn('[sales.create] failed to persist paid_amount', updSaleErr)
    }

    res.status(201).json({ sale_id: saleId, message: 'Sale created successfully' })
  } catch (err) {
    next(err)
  }
}
