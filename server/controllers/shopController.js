const supabase = require('../services/supabaseClient')

exports.list = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return next(error)
    res.json({ shops: data })
  } catch (err) {
    next(err)
  }
}

exports.create = async (req, res, next) => {
  try {
    const { name, address, phone, email, status } = req.body
    const { data: shopData, error } = await supabase
      .from('shops')
      .insert([{ name, address, phone, email, status: status || 'active' }])
      .select()
      .single()
    if (error) return next(error)

    // Automatically generate a corresponding tenant user account (role = shop_manager)
    const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';
    const sanitizedShopName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const tempEmail = `admin_${sanitizedShopName}_${Math.floor(Math.random() * 1000)}@example.com`;

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: tempEmail,
      password: tempPassword,
      email_confirm: true
    })

    if (authError) {
      await supabase.from('shops').delete().eq('id', shopData.id)
      return res.status(400).json({ error: `Failed to create shop admin account: ${authError.message}` })
    }

    const { error: profileError } = await supabase
      .from('app_users')
      .insert({
        user_id: authUser.user.id,
        email: tempEmail,
        role: 'shop_manager',
        shop_id: shopData.id
      })

    if (profileError) {
      await supabase.auth.admin.deleteUser(authUser.user.id)
      await supabase.from('shops').delete().eq('id', shopData.id)
      return res.status(400).json({ error: `Failed to create shop admin profile: ${profileError.message}` })
    }

    res.status(201).json({
      shop: shopData,
      credentials: {
        email: tempEmail,
        password: tempPassword,
        role: 'shop_manager'
      }
    })
  } catch (err) {
    next(err)
  }
}

exports.update = async (req, res, next) => {
  try {
    const id = req.params.id
    const { name, address, phone, email, status } = req.body
    const payload = { updated_at: new Date().toISOString() }
    if (name !== undefined) payload.name = name
    if (address !== undefined) payload.address = address
    if (phone !== undefined) payload.phone = phone
    if (email !== undefined) payload.email = email
    if (status !== undefined) payload.status = status

    const { data, error } = await supabase
      .from('shops')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) return next(error)
    res.json({ shop: data })
  } catch (err) {
    next(err)
  }
}

exports.remove = async (req, res, next) => {
  try {
    const id = req.params.id
    const { error } = await supabase.from('shops').delete().eq('id', id)
    if (error) return next(error)
    res.json({ deleted: true })
  } catch (err) {
    next(err)
  }
}
