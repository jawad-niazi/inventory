const supabase = require('../services/supabaseClient')
const { resolveShopId, assertShopAccess } = require('../utils/shopAccess')

const PRODUCT_BUCKET = 'product-images'

exports.list = async (req, res, next) => {
  try {
    const shopId = resolveShopId(req)
    if (!assertShopAccess(req.appUser, shopId, res)) return

    const { data, error } = await supabase
      .from('products')
      .select('*, categories(id, name), inventory(quantity)')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false })

    if (error) return next(error)

    const products = (data || []).map((p) => ({
      ...p,
      quantity: p.inventory?.[0]?.quantity ?? 0,
      inventory: undefined,
    }))

    res.json({ products })
  } catch (err) {
    next(err)
  }
}

exports.getOne = async (req, res, next) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('products')
      .select('*, categories(id, name), inventory(quantity)')
      .eq('id', id)
      .single()

    if (error) return next(error)
    if (!assertShopAccess(req.appUser, data.shop_id, res)) return

    res.json({
      product: {
        ...data,
        quantity: data.inventory?.[0]?.quantity ?? 0,
        inventory: undefined,
      },
    })
  } catch (err) {
    next(err)
  }
}

exports.create = async (req, res, next) => {
  try {
    const shopId = resolveShopId(req)
    if (!assertShopAccess(req.appUser, shopId, res)) return

    const {
      name,
      sku,
      description,
      price,
      category_id,
      low_stock_threshold,
      status,
      initial_quantity,
    } = req.body

    const { data: product, error } = await supabase
      .from('products')
      .insert({
        shop_id: shopId,
        name,
        sku: sku || null,
        description: description || null,
        price: price ?? 0,
        category_id: category_id || null,
        low_stock_threshold: low_stock_threshold ?? 0,
        status: status || 'active',
      })
      .select('*, categories(id, name)')
      .single()

    if (error) return next(error)

    const qty = parseInt(initial_quantity, 10) || 0
    const { error: invError } = await supabase.from('inventory').insert({
      shop_id: shopId,
      product_id: product.id,
      quantity: qty,
    })

    if (invError) return next(invError)

    if (qty !== 0) {
      await supabase.from('inventory_adjustments').insert({
        shop_id: shopId,
        product_id: product.id,
        quantity_change: qty,
        reason: 'Initial stock',
        adjusted_by: req.appUser.id,
      })
    }

    res.status(201).json({ product: { ...product, quantity: qty } })
  } catch (err) {
    next(err)
  }
}

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params

    const { data: existing, error: fetchError } = await supabase
      .from('products')
      .select('shop_id')
      .eq('id', id)
      .single()

    if (fetchError) return next(fetchError)
    if (!assertShopAccess(req.appUser, existing.shop_id, res)) return

    const payload = { updated_at: new Date().toISOString() }
    const fields = [
      'name',
      'sku',
      'description',
      'price',
      'category_id',
      'low_stock_threshold',
      'status',
      'image_url',
    ]
    fields.forEach((f) => {
      if (req.body[f] !== undefined) payload[f] = req.body[f]
    })

    const { data, error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', id)
      .select('*, categories(id, name)')
      .single()

    if (error) return next(error)
    res.json({ product: data })
  } catch (err) {
    next(err)
  }
}

exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params

    const { data: existing, error: fetchError } = await supabase
      .from('products')
      .select('shop_id, image_url')
      .eq('id', id)
      .single()

    if (fetchError) return next(fetchError)
    if (!assertShopAccess(req.appUser, existing.shop_id, res)) return

    if (existing.image_url) {
      const path = existing.image_url.split(`${PRODUCT_BUCKET}/`)[1]
      if (path) await supabase.storage.from(PRODUCT_BUCKET).remove([path])
    }

    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) return next(error)
    res.json({ deleted: true })
  } catch (err) {
    next(err)
  }
}

exports.uploadImage = async (req, res, next) => {
  try {
    const { id } = req.params
    if (!req.file) return res.status(400).json({ error: 'No image file provided' })

    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('shop_id, image_url')
      .eq('id', id)
      .single()

    if (fetchError) return next(fetchError)
    if (!assertShopAccess(req.appUser, product.shop_id, res)) return

    const ext = req.file.originalname.split('.').pop() || 'jpg'
    const filePath = `${product.shop_id}/${id}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(PRODUCT_BUCKET)
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      })

    if (uploadError) return next(uploadError)

    const { data: urlData } = supabase.storage
      .from(PRODUCT_BUCKET)
      .getPublicUrl(filePath)

    const image_url = urlData.publicUrl

    if (product.image_url && product.image_url !== image_url) {
      const oldPath = product.image_url.split(`${PRODUCT_BUCKET}/`)[1]
      if (oldPath) await supabase.storage.from(PRODUCT_BUCKET).remove([oldPath])
    }

    const { data, error } = await supabase
      .from('products')
      .update({ image_url, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, categories(id, name)')
      .single()

    if (error) return next(error)
    res.json({ product: data })
  } catch (err) {
    next(err)
  }
}
