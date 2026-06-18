const supabase = require('../services/supabaseClient')

module.exports = async function loadProfile(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('user_id', req.user.id)
      .single()

    if (error || !data) {
      return res.status(403).json({ error: 'Profile not found' })
    }

    req.appUser = data
    next()
  } catch (err) {
    next(err)
  }
}
