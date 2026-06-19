const supabase = require('../services/supabaseClient')
const { resolveShopId, assertShopAccess } = require('../utils/shopAccess')

exports.getProfitLoss = async (req, res, next) => {
  try {
    const shopId = resolveShopId(req)
    if (!assertShopAccess(req.appUser, shopId, res)) return

    const { start_date, end_date } = req.query

    // 1. Query Sales
    let salesQuery = supabase
      .from('sales')
      .select('total')
      .eq('shop_id', shopId)
      .eq('status', 'completed')

    if (start_date) salesQuery = salesQuery.gte('created_at', start_date)
    if (end_date) salesQuery = salesQuery.lte('created_at', end_date)

    const { data: sales, error: salesErr } = await salesQuery
    if (salesErr) return next(salesErr)
    const revenue = (sales || []).reduce((acc, row) => acc + parseFloat(row.total || 0), 0)

    // 2. Query Expenses
    let expQuery = supabase
      .from('expenses')
      .select('amount')
      .eq('shop_id', shopId)

    if (start_date) expQuery = expQuery.gte('created_at', start_date)
    if (end_date) expQuery = expQuery.lte('created_at', end_date)

    const { data: expenses, error: expErr } = await expQuery
    if (expErr) return next(expErr)
    const expensesTotal = (expenses || []).reduce((acc, row) => acc + parseFloat(row.amount || 0), 0)

    // 3. Query Purchases (COGS)
    let purchQuery = supabase
      .from('purchases')
      .select('total_amount')
      .eq('shop_id', shopId)
      .eq('status', 'received')

    if (start_date) purchQuery = purchQuery.gte('created_at', start_date)
    if (end_date) purchQuery = purchQuery.lte('created_at', end_date)

    const { data: purchases, error: purchErr } = await purchQuery
    if (purchErr) return next(purchErr)
    const purchasesTotal = (purchases || []).reduce((acc, row) => acc + parseFloat(row.total_amount || 0), 0)

    const netProfit = revenue - (expensesTotal + purchasesTotal)

    res.json({
      revenue,
      expenses: expensesTotal,
      purchases: purchasesTotal,
      net_profit: netProfit
    })
  } catch (err) {
    next(err)
  }
}
