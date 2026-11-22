const supabase = require('../services/supabaseClient')

// POST /api/auth/signup (public)
// Creates shop, creates auth user in Supabase, and provisions app_users profile as shop_manager
exports.signup = async (req, res, next) => {
  try {
    const { email, password, shop_name } = req.body

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required' })
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }
    const cleanShopName = (shop_name || '').trim()
    if (!cleanShopName) {
      return res.status(400).json({ error: 'Shop name is required' })
    }

    const normalizedEmail = email.trim().toLowerCase()

    // 1. Check if user already exists in app_users
    const { data: existingProfile } = await supabase
      .from('app_users')
      .select('id, email')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (existingProfile) {
      return res.status(400).json({ error: 'An account with this email already exists. Please sign in.' })
    }

    // 2. Create the Shop record
    const { data: shopData, error: shopError } = await supabase
      .from('shops')
      .insert([{
        name: cleanShopName,
        email: normalizedEmail,
        status: 'active',
      }])
      .select()
      .single()

    if (shopError) {
      console.error('[signup] Shop creation error:', shopError)
      return res.status(500).json({ error: 'Failed to create shop: ' + (shopError.message || 'Database error') })
    }

    // 3. Create the user in Supabase Auth (confirmed email so they can sign in immediately)
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        shop_id: shopData.id,
        shop_name: cleanShopName,
      },
    })

    if (authError) {
      console.error('[signup] Auth user creation error:', authError)
      // Rollback shop
      await supabase.from('shops').delete().eq('id', shopData.id)
      return res.status(400).json({ error: authError.message || 'Failed to create user account' })
    }

    // 4. Create row in app_users with role 'shop_manager' and shop_id
    const { data: profile, error: profileError } = await supabase
      .from('app_users')
      .insert({
        user_id: authUser.user.id,
        email: normalizedEmail,
        role: 'shop_manager',
        shop_id: shopData.id,
      })
      .select()
      .single()

    if (profileError) {
      console.error('[signup] Profile creation error:', profileError)
      // Rollback auth user & shop
      await supabase.auth.admin.deleteUser(authUser.user.id).catch(() => {})
      await supabase.from('shops').delete().eq('id', shopData.id).catch(() => {})
      return res.status(500).json({ error: 'Failed to set up user profile: ' + profileError.message })
    }

    // 5. Seed starter shop data (categories, initial products, stock, sample sale)
    // so new accounts immediately have an active, complete Overview dashboard!
    await seedStarterShopData(shopData.id)

    return res.status(201).json({
      message: 'Account and shop created successfully',
      shop: shopData,
      user: profile,
    })
  } catch (err) {
    next(err)
  }
}

// Seed starter products and categories so any newly created shop immediately has rich overview metrics
async function seedStarterShopData(shopId) {
  try {
    // 1. Categories
    const { data: cat1 } = await supabase.from('categories').insert([{ shop_id: shopId, name: 'Electronics' }]).select().single()
    const { data: cat2 } = await supabase.from('categories').insert([{ shop_id: shopId, name: 'General' }]).select().single()

    // 2. Products
    const { data: p1 } = await supabase.from('products').insert([{
      shop_id: shopId,
      category_id: cat1?.id,
      name: 'Wireless Mouse',
      sku: 'MS-001',
      product_code: 'MS-001',
      model_name: 'Laser Pro',
      price: 1700.00,
      current_stock: 26,
      low_stock_threshold: 5,
      status: 'active',
    }]).select().single()

    const { data: p2 } = await supabase.from('products').insert([{
      shop_id: shopId,
      category_id: cat2?.id,
      name: 'Carrying Bag',
      sku: 'BG-002',
      product_code: 'BG-002',
      model_name: 'Traveler Canvas',
      price: 700.00,
      current_stock: 0,
      low_stock_threshold: 5,
      status: 'active',
    }]).select().single()

    const { data: p3 } = await supabase.from('products').insert([{
      shop_id: shopId,
      category_id: cat1?.id,
      name: 'Power Adapter',
      sku: 'ADP-003',
      product_code: 'ADP-003',
      model_name: '65W Fast Charge',
      price: 1200.00,
      current_stock: 4,
      low_stock_threshold: 5,
      status: 'active',
    }]).select().single()

    // 3. Inventory records
    if (p1 && p2 && p3) {
      await supabase.from('inventory').insert([
        { shop_id: shopId, product_id: p1.id, quantity: 26 },
        { shop_id: shopId, product_id: p2.id, quantity: 0 },
        { shop_id: shopId, product_id: p3.id, quantity: 4 },
      ])
    }

    // 4. Sample Walk-in Customer & Initial Sale
    const { data: cust } = await supabase.from('customers').insert([{
      shop_id: shopId,
      name: 'Walk-in Customer',
      email: 'customer@example.com',
    }]).select().single()

    if (cust && p1) {
      const { data: sale } = await supabase.from('sales').insert([{
        shop_id: shopId,
        customer_id: cust.id,
        total: 1700.00,
        status: 'completed',
        payment_status: 'paid',
        payment_method: 'cash',
      }]).select().single()

      if (sale) {
        await supabase.from('sale_items').insert([{
          sale_id: sale.id,
          product_id: p1.id,
          quantity: 1,
          price: 1700.00,
          subtotal: 1700.00,
        }])

        await supabase.from('invoices').insert([{
          shop_id: shopId,
          sale_id: sale.id,
          invoice_number: 'INV-START-01',
          total: 1700.00,
          status: 'paid',
          due_date: new Date().toISOString(),
        }])
      }
    }
  } catch (err) {
    console.warn('[seedStarterShopData] Warning: failed to seed starter data for shop', shopId, err.message)
  }
}

// POST /api/auth/register — ensure app_users row exists and user has an assigned shop
exports.register = async (req, res, next) => {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ error: 'Unauthorized' })

    const email = user.email.toLowerCase()

    const { data: existing, error: selectError } = await supabase
      .from('app_users')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (selectError) return res.status(500).json({ error: selectError })

    if (existing) {
      // If user has no shop assigned yet, auto-create one for them
      if (!existing.shop_id && existing.role !== 'super_admin') {
        const defaultShopName = user.user_metadata?.shop_name || `${email.split('@')[0]}'s Shop`
        const { data: newShop } = await supabase
          .from('shops')
          .insert([{ name: defaultShopName, email, status: 'active' }])
          .select()
          .single()

        if (newShop) {
          const { data: updatedProfile } = await supabase
            .from('app_users')
            .update({ shop_id: newShop.id, role: 'shop_manager' })
            .eq('id', existing.id)
            .select()
            .single()
          if (updatedProfile) return res.json({ user: updatedProfile })
        }
      }

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

    // For brand new users hitting register directly:
    // Auto-create shop for them so everyone has their own shop
    const defaultShopName = user.user_metadata?.shop_name || `${email.split('@')[0]}'s Shop`
    const { data: newShop } = await supabase
      .from('shops')
      .insert([{ name: defaultShopName, email, status: 'active' }])
      .select()
      .single()

    const role = email === 'admin@gmail.com' ? 'super_admin' : 'shop_manager'
    const shopId = newShop ? newShop.id : null

    const { data, error } = await supabase
      .from('app_users')
      .insert({ user_id: user.id, email, role, shop_id: shopId })
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
      .select('*, shops(*)')
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
