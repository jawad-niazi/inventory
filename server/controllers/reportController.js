const supabase = require('../services/supabaseClient')
const { resolveShopId, assertShopAccess } = require('../utils/shopAccess')

exports.getSalesReport = async (req, res, next) => {
  try {
    const shopId = resolveShopId(req)
    if (!assertShopAccess(req.appUser, shopId, res)) return

    // 1. Fetch sales trend (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: sales, error: salesErr } = await supabase
      .from('sales')
      .select('total, created_at')
      .eq('shop_id', shopId)
      .eq('status', 'completed')
      .gte('created_at', thirtyDaysAgo.toISOString())

    if (salesErr) return next(salesErr)

    // Group by date
    const trend = {}
    ;(sales || []).forEach(s => {
      const date = new Date(s.created_at).toLocaleDateString()
      trend[date] = (trend[date] || 0) + parseFloat(s.total)
    })

    const trendData = Object.entries(trend).map(([date, total]) => ({ date, total }))

    // 2. Fetch top products
    const { data: items, error: itemsErr } = await supabase
      .from('sale_items')
      .select('quantity, subtotal, product_id, products(name)')
      .eq('sale_id.shop_id', shopId) // Join filter

    // Wait! Can we filter by sale_id.shop_id like this?
    // Supabase JS doesn't support nested filtering like 'sale_id.shop_id' directly unless we filter through an inner join.
    // A cleaner way is to select sale_items and filter them by querying sales first, OR select them directly:
    const { data: salesList, error: listErr } = await supabase
      .from('sales')
      .select('id')
      .eq('shop_id', shopId)
      .eq('status', 'completed')

    if (listErr) return next(listErr)
    const saleIds = (salesList || []).map(s => s.id)

    let topProducts = []
    if (saleIds.length > 0) {
      const { data: saleItems, error: sItemsErr } = await supabase
        .from('sale_items')
        .select('quantity, subtotal, products(id, name)')
        .in('sale_id', saleIds)

      if (sItemsErr) return next(sItemsErr)

      const productTotals = {}
      ;(saleItems || []).forEach(item => {
        const prod = item.products
        if (!prod) return
        if (!productTotals[prod.id]) {
          productTotals[prod.id] = { name: prod.name, quantity: 0, revenue: 0 }
        }
        productTotals[prod.id].quantity += parseInt(item.quantity, 10)
        productTotals[prod.id].revenue += parseFloat(item.subtotal)
      })

      topProducts = Object.values(productTotals)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5)
    }

    res.json({ trend: trendData, topProducts })
  } catch (err) {
    next(err)
  }
}

exports.getInventoryReport = async (req, res, next) => {
  try {
    const shopId = resolveShopId(req)
    if (!assertShopAccess(req.appUser, shopId, res)) return

    const { data: inventory, error } = await supabase
      .from('inventory')
      .select('*, products(id, name, price, low_stock_threshold)')
      .eq('shop_id', shopId)

    if (error) return next(error)

    let totalItems = 0
    let totalValue = 0
    let lowStockCount = 0

    ;(inventory || []).forEach(row => {
      const qty = row.quantity
      const price = parseFloat(row.products?.price || 0)
      const threshold = row.products?.low_stock_threshold || 0

      totalItems += qty
      totalValue += qty * price
      if (threshold > 0 && qty <= threshold) {
        lowStockCount++
      }
    })

    res.json({
      total_items: totalItems,
      total_value: totalValue,
      low_stock_count: lowStockCount,
      items: inventory
    })
  } catch (err) {
    next(err)
  }
}

exports.getPurchaseReport = async (req, res, next) => {
  try {
    const shopId = resolveShopId(req)
    if (!assertShopAccess(req.appUser, shopId, res)) return

    const { data: purchases, error } = await supabase
      .from('purchases')
      .select('*, suppliers(id, name)')
      .eq('shop_id', shopId)
      .eq('status', 'received')
      .order('created_at', { ascending: false })

    if (error) return next(error)

    // Calculate total spend
    const totalSpend = (purchases || []).reduce((acc, p) => acc + parseFloat(p.total_amount), 0)

    // Group spend by supplier
    const supplierSpend = {}
    ;(purchases || []).forEach(p => {
      const name = p.suppliers?.name || 'Unknown Supplier'
      supplierSpend[name] = (supplierSpend[name] || 0) + parseFloat(p.total_amount)
    })

    const supplierSpendData = Object.entries(supplierSpend).map(([name, total]) => ({ name, total }))

    res.json({
      total_spend: totalSpend,
      purchases,
      supplierSpend: supplierSpendData
    })
  } catch (err) {
    next(err)
  }
}
