// Auth middleware: validates Bearer token with Supabase and attaches user
const supabase = require('../services/supabaseClient')

module.exports = async function auth(req, res, next) {
  const authHeader = req.headers.authorization || ''
  console.log('auth middleware: path', req.path, 'authHeader present?', !!authHeader)
  const token = authHeader.replace('Bearer ', '') || null
  if (!token) {
    return res.status(401).json({ error: 'Missing or invalid token' })
  }

  try {
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid token' })
    }
    req.user = data.user
    next()
  } catch (err) {
    next(err)
  }
}
