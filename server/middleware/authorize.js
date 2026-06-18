const supabase = require('../services/supabaseClient')

module.exports = async function requireSuperAdmin(req, res, next) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ error: 'Unauthorized' })

    const { data, error } = await supabase.from('app_users').select('role').eq('user_id', user.id).limit(1).single()
    if (error && error.code !== 'PGRST116') return res.status(403).json({ error: 'Forbidden' })
    const role = data?.role || null
    if (role !== 'super_admin') return res.status(403).json({ error: 'Forbidden: super_admin only' })
    next()
  } catch (err) {
    next(err)
  }
}
