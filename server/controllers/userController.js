const supabase = require('../services/supabaseClient')

exports.list = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('app_users')
      .select('*, shops(id, name)')
      .order('created_at', { ascending: false })
    if (error) return next(error)
    res.json({ users: data })
  } catch (err) {
    next(err)
  }
}

exports.create = async (req, res, next) => {
  try {
    const { email, password, role, shop_id } = req.body

    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

    if (authError) {
      return res.status(400).json({ error: authError.message })
    }

    const { data, error } = await supabase
      .from('app_users')
      .insert({
        user_id: authData.user.id,
        email,
        role: role || 'staff',
        shop_id: shop_id || null,
      })
      .select('*, shops(id, name)')
      .single()

    if (error) return next(error)
    res.status(201).json({ user: data })
  } catch (err) {
    next(err)
  }
}

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params
    const { role, shop_id, email } = req.body
    const payload = {}
    if (role !== undefined) payload.role = role
    if (shop_id !== undefined) payload.shop_id = shop_id
    if (email !== undefined) payload.email = email

    const { data, error } = await supabase
      .from('app_users')
      .update(payload)
      .eq('id', id)
      .select('*, shops(id, name)')
      .single()

    if (error) return next(error)
    res.json({ user: data })
  } catch (err) {
    next(err)
  }
}

exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params

    const { data: profile, error: fetchError } = await supabase
      .from('app_users')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError) return next(fetchError)

    const { error: deleteError } = await supabase.auth.admin.deleteUser(
      profile.user_id
    )
    if (deleteError) return next(deleteError)

    res.json({ deleted: true })
  } catch (err) {
    next(err)
  }
}
