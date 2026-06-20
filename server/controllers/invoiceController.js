const supabase = require('../services/supabaseClient')
const { resolveShopId, assertShopAccess } = require('../utils/shopAccess')
const PDFDocument = require('pdfkit')

exports.list = async (req, res, next) => {
  try {
    const shopId = resolveShopId(req)
    if (!assertShopAccess(req.appUser, shopId, res)) return

    const { data, error } = await supabase
      .from('invoices')
      .select('*, sales(id, total, created_at)')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false })

    if (error) return next(error)
    res.json({ invoices: data })
  } catch (err) {
    next(err)
  }
}

exports.getOne = async (req, res, next) => {
  try {
    const { id } = req.params

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*, sales(*, customers(*), sale_items(*, products(*))), invoice_items(*)')
      .eq('id', id)
      .single()

    if (error) return next(error)
    if (!assertShopAccess(req.appUser, invoice.shop_id, res)) return

    res.json({ invoice })
  } catch (err) {
    next(err)
  }
}

exports.updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const { data: existing, error: fetchError } = await supabase
      .from('invoices')
      .select('shop_id')
      .eq('id', id)
      .single()

    if (fetchError) return next(fetchError)
    if (!assertShopAccess(req.appUser, existing.shop_id, res)) return

    if (!['draft', 'sent', 'paid', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const { data, error } = await supabase
      .from('invoices')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) return next(error)
    res.json({ invoice: data })
  } catch (err) {
    next(err)
  }
}

exports.generatePDF = async (req, res, next) => {
  try {
    const { id } = req.params

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*, sales(*, customers(*), sale_items(*, products(*))), invoice_items(*)')
      .eq('id', id)
      .single()

    if (error) return next(error)
    if (!assertShopAccess(req.appUser, invoice.shop_id, res)) return

    const { data: shop } = await supabase
      .from('shops')
      .select('*')
      .eq('id', invoice.shop_id)
      .single()

    const doc = new PDFDocument({ margin: 50 })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoice_number}.pdf"`)

    doc.pipe(res)

    // Invoice Header Title
    doc.fillColor('#0f172a').fontSize(24).font('Helvetica-Bold').text('INVOICE', { align: 'right' })
    doc.moveUp(1.5)

    // Shop Info
    const shopName = shop ? shop.name : 'Shop Name'
    const shopAddress = shop ? shop.address : 'Shop Address'
    const shopPhone = shop ? shop.phone : 'Shop Phone'
    const shopEmail = shop ? shop.email : 'Shop Email'

    doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold').text(shopName, 50, 50)
    doc.fontSize(9).font('Helvetica').fillColor('#64748b')
    if (shopAddress) doc.text(shopAddress)
    if (shopPhone) doc.text(`Phone: ${shopPhone}`)
    if (shopEmail) doc.text(`Email: ${shopEmail}`)
    doc.moveDown(2)

    const invoiceY = doc.y

    // Left Column: Bill To
    const sale = invoice.sales
    const customer = sale?.customers
    const custName = customer ? customer.name : 'Walk-in Customer'
    const custPhone = customer ? customer.phone : ''
    const custEmail = customer ? customer.email : ''
    const custAddr = customer ? customer.address : ''

    doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text('BILL TO:', 50, invoiceY)
    doc.fontSize(9).font('Helvetica').fillColor('#334155')
    doc.text(custName)
    if (custAddr) doc.text(custAddr)
    if (custPhone) doc.text(`Phone: ${custPhone}`)
    if (custEmail) doc.text(`Email: ${custEmail}`)

    // Right Column: Invoice Details
    doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text('INVOICE DETAILS:', 340, invoiceY)
    doc.fontSize(9).font('Helvetica').fillColor('#334155')
    doc.text(`Invoice No: ${invoice.invoice_number}`, 340)
    doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`)
    doc.text(`Status: ${invoice.status.toUpperCase()}`)
    doc.moveDown(2)

    // Table
    const tableTop = doc.y + 10
    doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold')
    doc.text('Item Description', 50, tableTop)
    doc.text('Quantity', 250, tableTop, { width: 80, align: 'right' })
    doc.text('Unit Price', 340, tableTop, { width: 80, align: 'right' })
    doc.text('Subtotal', 430, tableTop, { width: 80, align: 'right' })

    doc.moveTo(50, tableTop + 15).lineTo(510, tableTop + 15).strokeColor('#cbd5e1').stroke()

    let currentY = tableTop + 25
    doc.font('Helvetica').fillColor('#334155')

    const items = sale?.sale_items || invoice.invoice_items || []
    items.forEach(item => {
      const desc = item.products?.name || item.description || 'Product Item'
      const qty = item.quantity
      const price = item.unit_price || 0
      const subtotal = item.subtotal || (qty * price)

      doc.text(desc, 50, currentY, { width: 190 })
      doc.text(qty.toString(), 250, currentY, { width: 80, align: 'right' })
      doc.text(`$${Number(price).toFixed(2)}`, 340, currentY, { width: 80, align: 'right' })
      doc.text(`$${Number(subtotal).toFixed(2)}`, 430, currentY, { width: 80, align: 'right' })

      currentY += 20
    })

    doc.moveTo(50, currentY + 5).lineTo(510, currentY + 5).strokeColor('#cbd5e1').stroke()

    const total = sale ? sale.total : (items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0))
    doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold')
    doc.text('Total Amount Due:', 310, currentY + 15, { width: 110, align: 'right' })
    doc.text(`$${Number(total).toFixed(2)}`, 430, currentY + 15, { width: 80, align: 'right' })

    doc.end()
  } catch (err) {
    next(err)
  }
}

