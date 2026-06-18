const supabase = require('../services/supabaseClient')

// POST /api/auth/register — ensure app_users row exists without overwriting role
exports.register = async (req, res, next) => {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ error: 'Unauthorized' })

    const email = user.email

    const { data: existing, error: selectError } = await supabase
      .from('app_users')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (selectError) return res.status(500).json({ error: selectError })

    if (existing) {
      if (existing.email !== email) {
        const { data, error } = await supabase
          .from('app_users')
          .update({ email })
          .eq('user_id', user.id)
          .select()
          .single()
        if (error) return res.status(500).json({ error })
        return res.json({ user: data })
      }
      return res.json({ user: existing })
    }

    const role = email === 'admin@gmail.com' ? 'super_admin' : 'staff'
    const { data, error } = await supabase
      .from('app_users')
      .insert({ user_id: user.id, email, role, shop_id: null })
      .select()
      .single()

    if (error) return res.status(500).json({ error })
    res.status(201).json({ user: data })
  } catch (err) {
    next(err)
  }
}

// GET /api/auth/me
exports.me = async (req, res, next) => {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ error: 'Unauthorized' })

    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) return res.status(500).json({ error })

    res.json({ auth_user: user, profile: data || null })
  } catch (err) {
    next(err)
  }
}

exports.logout = async (req, res) => {
  res.json({ message: 'logout ok' })
}
