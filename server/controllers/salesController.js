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

    if (error) return next(error)
    res.json({ sales: data })
  } catch (err) {
    next(err)
  }
}

exports.getOne = async (req, res, next) => {
  try {
    const { id } = req.params

    const { data: sale, error } = await supabase
      .from('sales')
      .select('*, customers(*), sale_items(*, products(name, sku))')
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

    const { customer_id, total, items } = req.body
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Sale items are required' })
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
    const { data: saleId, error: rpcError } = await supabase.rpc('create_sale_transaction', {
      p_shop_id: shopId,
      p_customer_id: customer_id || null,
      p_created_by: req.appUser.id,
      p_total: parseFloat(total),
      p_items: formattedItems
    })

    if (rpcError) {
      console.error('RPC Error:', rpcError)
      // Check if it's our custom PL/pgSQL assertion error
      if (rpcError.message && rpcError.message.includes('insufficient_stock:')) {
        const parts = rpcError.message.split('insufficient_stock:')
        const productName = parts[1] || 'one of the items'
        return res.status(400).json({ error: `Insufficient stock for product: ${productName}` })
      }
      return res.status(400).json({ error: rpcError.message })
    }

    res.status(201).json({ sale_id: saleId, message: 'Sale created successfully' })
  } catch (err) {
    next(err)
  }
}
