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
    const { data, error } = await supabase
      .from('shops')
      .insert([{ name, address, phone, email, status: status || 'active' }])
      .select()
      .single()
    if (error) return next(error)
    res.status(201).json({ shop: data })
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
