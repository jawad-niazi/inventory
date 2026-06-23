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
    const { name, address, phone, email, status, admin_email, admin_password } = req.body

    if (!admin_email) {
      return res.status(400).json({ error: 'admin_email is required to create a shop' })
    }
    if (!admin_password || admin_password.length < 8) {
      return res.status(400).json({ error: 'admin_password must be at least 8 characters' })
    }

    // 1. Create the shop record
    const { data: shopData, error: shopError } = await supabase
      .from('shops')
      .insert([{ name, address, phone, email, status: status || 'active' }])
      .select()
      .single()
    if (shopError) return next(shopError)

    // 2. Create the admin auth user with provided credentials
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: admin_email,
      password: admin_password,
      email_confirm: true,
    })

    if (authError) {
      // Rollback shop
      await supabase.from('shops').delete().eq('id', shopData.id)
      return res.status(400).json({ error: `Failed to create shop admin account: ${authError.message}` })
    }

    // 3. Insert app_users profile row
    const { error: profileError } = await supabase
      .from('app_users')
      .insert({
        user_id: authUser.user.id,
        email: admin_email,
        role: 'shop_manager',
        shop_id: shopData.id,
      })

    if (profileError) {
      // Rollback auth user and shop
      await supabase.auth.admin.deleteUser(authUser.user.id)
      await supabase.from('shops').delete().eq('id', shopData.id)
      return res.status(400).json({ error: `Failed to create shop admin profile: ${profileError.message}` })
    }

    res.status(201).json({
      shop: shopData,
      credentials: {
        email: admin_email,
        role: 'shop_manager',
      },
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

    // ----------------------------------------------------------------
    // Cascading cleanup: delete all linked rows before removing shop.
    // Most tables use ON DELETE CASCADE on shop_id, but app_users and
    // auth.users do not cascade automatically — handle them explicitly.
    // ----------------------------------------------------------------

    // 1. Find all app_users for this shop (to delete their auth accounts)
    const { data: shopUsers } = await supabase
      .from('app_users')
      .select('user_id')
      .eq('shop_id', id)

    // 2. Delete inventory_adjustments (no cascade on some installs)
    await supabase.from('inventory_adjustments').delete().eq('shop_id', id)

    // 3. Delete purchase_items via purchases
    const { data: purchases } = await supabase
      .from('purchases')
      .select('id')
      .eq('shop_id', id)
    if (purchases && purchases.length > 0) {
      const purchaseIds = purchases.map((p) => p.id)
      await supabase.from('purchase_items').delete().in('purchase_id', purchaseIds)
    }
    await supabase.from('purchases').delete().eq('shop_id', id)

    // 4. Delete quotation_items via quotations
    const { data: quotations } = await supabase
      .from('quotations')
      .select('id')
      .eq('shop_id', id)
    if (quotations && quotations.length > 0) {
      const quotationIds = quotations.map((q) => q.id)
      await supabase.from('quotation_items').delete().in('quotation_id', quotationIds)
    }
    await supabase.from('quotations').delete().eq('shop_id', id)

    // 5. Delete invoice_items via invoices
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id')
      .eq('shop_id', id)
    if (invoices && invoices.length > 0) {
      const invoiceIds = invoices.map((i) => i.id)
      await supabase.from('invoice_items').delete().in('invoice_id', invoiceIds)
    }
    await supabase.from('invoices').delete().eq('shop_id', id)

    // 6. Delete sale_items via sales
    const { data: sales } = await supabase
      .from('sales')
      .select('id')
      .eq('shop_id', id)
    if (sales && sales.length > 0) {
      const saleIds = sales.map((s) => s.id)
      await supabase.from('sale_items').delete().in('sale_id', saleIds)
    }
    await supabase.from('sales').delete().eq('shop_id', id)

    // 7. Delete expenses, suppliers, inventory, customers, products, categories
    await supabase.from('expenses').delete().eq('shop_id', id)
    await supabase.from('suppliers').delete().eq('shop_id', id)
    await supabase.from('inventory').delete().eq('shop_id', id)
    await supabase.from('customers').delete().eq('shop_id', id)
    await supabase.from('products').delete().eq('shop_id', id)
    await supabase.from('categories').delete().eq('shop_id', id)

    // 8. Delete app_users profile rows for this shop
    await supabase.from('app_users').delete().eq('shop_id', id)

    // 9. Delete Supabase Auth accounts for those users
    if (shopUsers && shopUsers.length > 0) {
      for (const u of shopUsers) {
        if (u.user_id) {
          await supabase.auth.admin.deleteUser(u.user_id).catch((e) =>
            console.warn(`Could not delete auth user ${u.user_id}:`, e.message)
          )
        }
      }
    }

    // 10. Finally, delete the shop itself
    const { error } = await supabase.from('shops').delete().eq('id', id)
    if (error) {
      console.error('[shopController.remove] delete error code=%s message=%s', error.code, error.message || error.details || JSON.stringify(error))
      if (error.code === '23503' || (error.details && String(error.details).toLowerCase().includes('foreign key'))) {
        return res.status(400).json({ error: 'Cannot delete this shop because related records exist. Clean up linked data first (invoices, sales, inventory).' })
      }
      return next(error)
    }

    res.json({ deleted: true })
  } catch (err) {
    next(err)
  }
}
