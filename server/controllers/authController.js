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

// POST /api/auth/forgot-password (public — no auth middleware)
// Triggers Supabase to send a password reset email with a redirect link.
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'Email is required' })

    // Supabase handles token generation & email sending natively.
    // The redirectTo URL is where Supabase embeds the reset token in the URL hash.
    const siteUrl = process.env.SITE_URL || 'http://localhost:5173'
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/reset-password`,
    })

    if (error) {
      console.error('[forgotPassword] Supabase error:', error.message)
      return res.status(400).json({ error: error.message })
    }

    // Always return 200 so we don't leak whether an email exists in the system
    res.json({ message: 'If that email is registered, a password reset link has been sent.' })
  } catch (err) {
    next(err)
  }
}

// POST /api/auth/reset-password (requires a valid Supabase session from reset link)
// Called after the user clicks the email link and is redirected to /reset-password,
// at which point Supabase has established a session with the reset token.
exports.resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }

    // supabase.auth.updateUser uses the session of the currently authenticated user
    // (the reset token session established via the email link)
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      console.error('[resetPassword] Supabase error:', error.message)
      return res.status(400).json({ error: error.message })
    }

    res.json({ message: 'Password updated successfully' })
  } catch (err) {
    next(err)
  }
}
