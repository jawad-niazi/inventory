function canAccessShop(appUser, shopId) {
  if (!appUser || !shopId) return false
  if (appUser.role === 'super_admin') return true
  return appUser.shop_id === shopId
}

function resolveShopId(req) {
  return (
    req.query.shop_id ||
    req.body?.shop_id ||
    req.params?.shopId ||
    req.params?.shop_id ||
    null
  )
}

function assertShopAccess(appUser, shopId, res) {
  if (!shopId) {
    res.status(400).json({ error: 'shop_id is required' })
    return false
  }
  if (!canAccessShop(appUser, shopId)) {
    res.status(403).json({ error: 'Forbidden: no access to this shop' })
    return false
  }
  return true
}

module.exports = { canAccessShop, resolveShopId, assertShopAccess }
