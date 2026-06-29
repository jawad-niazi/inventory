const supabase = require('../services/supabaseClient')

const { resolveShopId, assertShopAccess } = require('../utils/shopAccess')

const PRODUCT_BUCKET = 'product-images'

exports.list = async (req, res, next) => {
  try {
    const shopId = resolveShopId(req)
    if (!assertShopAccess(req.appUser, shopId, res)) return

    const q = req.query.q
    let query = supabase
      .from('products')
      .select('*, categories(id, name), inventory(quantity)')
      .eq('shop_id', shopId)

    if (q) {
      query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%,product_code.ilike.%${q}%,model_name.ilike.%${q}%`)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) return next(error)

    const products = (data || []).map((p) => ({
      ...p,
      quantity: p.current_stock ?? p.inventory?.[0]?.quantity ?? 0,
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
        quantity: data.current_stock ?? data.inventory?.[0]?.quantity ?? 0,
        inventory: undefined,
      },
    })
  } catch (err) {
    next(err)
  }
}

// GET /api/products/:id/image
// Returns the product's public image URL as a redirect, or 404 if none exists.
// This prevents the request from accidentally matching getOne and crashing.
exports.serveImage = async (req, res, next) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('products')
      .select('image_url, shop_id')
      .eq('id', id)
      .single()

    if (error || !data) {
      return res.status(404).json({ error: 'Product not found' })
    }
    if (!assertShopAccess(req.appUser, data.shop_id, res)) return

    if (!data.image_url) {
      // No image uploaded — return 404 rather than crashing with 500
      return res.status(404).json({ error: 'No image available for this product' })
    }

    // Redirect the browser/client directly to the Supabase Storage public URL
    return res.redirect(data.image_url)
  } catch (err) {
    next(err)
  }
}

// GET /api/products/:id/cost
// Returns latest purchase cost for the product (purchase_price or unit_cost), or fallback to product.price
exports.getCost = async (req, res, next) => {
  try {
    const { id } = req.params
    const { data: latest, error: latestErr } = await supabase
      .from('purchase_items')
      .select('purchase_price, unit_cost, created_at')
      .eq('product_id', id)
      .order('created_at', { ascending: false })
      .limit(1)

    if (latestErr) return next(latestErr)

    if (latest && latest.length > 0) {
      const row = latest[0]
      const cost = row.purchase_price ?? row.unit_cost ?? null
      return res.json({ product_id: id, latest_cost: cost })
    }

    // fallback to product.price
    const { data: product, error: prodErr } = await supabase
      .from('products')
      .select('price')
      .eq('id', id)
      .single()
    if (prodErr) return next(prodErr)
    return res.json({ product_id: id, latest_cost: product?.price ?? 0 })
  } catch (err) {
    next(err)
  }
}

const cloudinary = require('../config/cloudinary')
const streamifier = require('streamifier')

function uploadToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error)
      resolve(result)
    })
    streamifier.createReadStream(buffer).pipe(uploadStream)
  })
}

exports.create = async (req, res, next) => {
  try {
    const shopId = resolveShopId(req)
    if (!assertShopAccess(req.appUser, shopId, res)) return

    const {
      name,
      sku,
      product_code,
      model_name,
      description,
      price,
      category_id,
      low_stock_threshold,
      status,
    } = req.body

    // Prevent duplicate products for same shop by name + model_name
    if (name && model_name) {
      const { data: existing, error: dupErr } = await supabase
        .from('products')
        .select('id')
        .eq('shop_id', shopId)
        .eq('name', name)
        .eq('model_name', model_name)
        .maybeSingle()
      if (dupErr) return next(dupErr)
      if (existing) {
        return res.status(400).json({ error: 'Product with this name and model already exists.' })
      }
    }

    const { data: product, error } = await supabase
      .from('products')
      .insert({
        shop_id: shopId,
        name,
        sku: sku || null,
        product_code: product_code || sku || null,
        model_name: model_name || null,
        description: description || null,
        price: price ?? 0,
        category_id: category_id || null,
        low_stock_threshold: low_stock_threshold ?? 0,
        status: status || 'active',
      })
      .select('*, categories(id, name)')
      .single()

    if (error) return next(error)

    // Products are created as registry-only. Stock starts at 0 and is
    // increased via Purchase Orders when marked received.
    const qty = 0
    const { error: invError } = await supabase.from('inventory').insert({
      shop_id: shopId,
      product_id: product.id,
      quantity: qty,
    })

    // set denormalized current_stock on product
    await supabase.from('products').update({ current_stock: qty }).eq('id', product.id)

    if (invError) return next(invError)

    // No adjustment recorded because initial qty is zero

    // If an image file was uploaded, push to Cloudinary and update the product
    if (req.file && req.file.buffer) {
      try {
        const uploadResult = await uploadToCloudinary(req.file.buffer, {
          folder: `products/${shopId}`,
          public_id: `${product.id}`,
          overwrite: true,
          resource_type: 'image',
        })

        const image_url = uploadResult.secure_url
        if (image_url) {
          const { data: updated, error: updErr } = await supabase
            .from('products')
            .update({ image_url, updated_at: new Date().toISOString() })
            .eq('id', product.id)
            .select('*, categories(id, name)')
            .single()
          if (updErr) return next(updErr)
          return res.status(201).json({ product: { ...updated, quantity: qty } })
        }
      } catch (uploadErr) {
        return next(uploadErr)
      }
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
      .select('shop_id, image_url')
      .eq('id', id)
      .single()

    if (fetchError) return next(fetchError)
    if (!assertShopAccess(req.appUser, existing.shop_id, res)) return

    const payload = { updated_at: new Date().toISOString() }
    const fields = [
      'name',
      'sku',
      'product_code',
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

    // If a file was uploaded, send it to Cloudinary and set image_url in payload
    if (req.file && req.file.buffer) {
      try {
        const uploadResult = await uploadToCloudinary(req.file.buffer, {
          folder: `products/${existing.shop_id}`,
          public_id: `${id}`,
          overwrite: true,
          resource_type: 'image',
        })
        if (uploadResult && uploadResult.secure_url) payload.image_url = uploadResult.secure_url
      } catch (uploadErr) {
        return next(uploadErr)
      }
    }

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
    if (error) {
      console.error('[productController.remove] delete error code=%s message=%s', error.code, error.message || error.details || JSON.stringify(error))
      // Postgres foreign key violation code is 23503
      if (error.code === '23503' || (error.details && String(error.details).toLowerCase().includes('foreign key'))) {
        return res.status(400).json({ error: 'Cannot delete this product because it is linked to existing transactions or history. Remove related records first.' })
      }
      return next(error)
    }

    res.json({ deleted: true })
  } catch (err) {
    next(err)
  }
}

exports.uploadImage = async (req, res, next) => {
  const fs = require('fs');
  try {
    const { id } = req.params;

    // Database Fallback: no file provided
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('shop_id, image_url')
      .eq('id', id)
      .single();

    if (fetchError) {
      // Safely handle missing product without crashing
      return res.status(404).json({ error: 'Product not found or database error' });
    }

    if (!assertShopAccess(req.appUser, product.shop_id, res)) {
      return;
    }

    let image_url;

    try {
      if (req.file.path) {
        // Direct Cloudinary Upload (Disk storage)
        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
          folder: "product-images",
          public_id: `${id}`, // Overwrites the existing image automatically in Cloudinary
          overwrite: true
        });
        image_url = uploadResult.secure_url;
      } else if (req.file.buffer) {
        // Fallback: Memory storage (in case multer wasn't updated)
        const uploadResult = await uploadToCloudinary(req.file.buffer, {
          folder: "product-images",
          public_id: `${id}`,
          overwrite: true,
          resource_type: 'image'
        });
        image_url = uploadResult.secure_url;
      } else {
        return res.status(400).json({ error: 'Invalid file upload format' });
      }

      // Database Update: Save new secure_url
      const { data, error } = await supabase
        .from('products')
        .update({ image_url, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*, categories(id, name)')
        .single();

      if (error) {
        return res.status(500).json({ error: 'Failed to update product with image url' });
      }

      // Return 200 with the updated product object
      return res.status(200).json({ product: data });
    } finally {
      // Local File Cleanup
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkErr) {
          console.error("Failed to delete temp file:", unlinkErr);
        }
      }
    }
  } catch (err) {
    const fs = require('fs');
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkErr) {
        // Ignore unlink errors in catch block
      }
    }
    next(err);
  }
};
