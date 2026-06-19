const { body, param, query } = require('express-validator')

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((v) => v.run(req)))
    const { validationResult } = require('express-validator')
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    next()
  }
}

const shopIdQuery = query('shop_id').isUUID().withMessage('Valid shop_id is required')
const shopIdBody = body('shop_id').isUUID().withMessage('Valid shop_id is required')
const idParam = param('id').isUUID().withMessage('Invalid ID parameter')

exports.listSuppliers = validate([shopIdQuery])
exports.createSupplier = validate([
  shopIdBody,
  body('name').trim().notEmpty().withMessage('Supplier name is required')
])
exports.updateSupplier = validate([
  idParam,
  body('name').optional().trim().notEmpty().withMessage('Supplier name cannot be empty')
])

exports.listPurchases = validate([shopIdQuery])
exports.getPurchase = validate([idParam])
exports.createPurchase = validate([
  shopIdBody,
  body('items').isArray({ min: 1 }).withMessage('Items array is required')
])

exports.listTransfers = validate([
  query('shop_id').optional().isUUID().withMessage('Invalid shop_id query param')
])
exports.getTransfer = validate([idParam])
exports.createTransfer = validate([
  body('from_shop_id').isUUID().withMessage('Valid from_shop_id is required'),
  body('to_shop_id').isUUID().withMessage('Valid to_shop_id is required'),
  body('items').isArray({ min: 1 }).withMessage('Items array is required')
])
exports.updateTransferStatus = validate([
  idParam,
  body('status').isIn(['shipped', 'received', 'cancelled']).withMessage('Invalid status')
])

exports.listCustomers = validate([shopIdQuery])
exports.createCustomer = validate([
  shopIdBody,
  body('name').trim().notEmpty().withMessage('Customer name is required')
])
exports.updateCustomer = validate([
  idParam,
  body('name').optional().trim().notEmpty().withMessage('Customer name cannot be empty')
])

exports.listSales = validate([shopIdQuery])
exports.getSale = validate([idParam])
exports.createSale = validate([
  shopIdBody,
  body('items').isArray({ min: 1 }).withMessage('Items array is required')
])

exports.listReturns = validate([shopIdQuery])
exports.getReturn = validate([idParam])
exports.createReturn = validate([
  shopIdBody,
  body('sale_id').isUUID().withMessage('Valid sale_id is required'),
  body('items').isArray({ min: 1 }).withMessage('Items array is required')
])

exports.listExpenses = validate([shopIdQuery])
exports.createExpense = validate([
  shopIdBody,
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive number'),
  body('category').trim().notEmpty().withMessage('Category is required')
])
exports.updateExpense = validate([
  idParam,
  body('amount').optional().isFloat({ min: 0.01 }).withMessage('Amount must be positive number')
])

exports.listInvoices = validate([shopIdQuery])
exports.getInvoice = validate([idParam])
exports.updateInvoiceStatus = validate([
  idParam,
  body('status').isIn(['draft', 'sent', 'paid', 'cancelled']).withMessage('Invalid status')
])

exports.listQuotations = validate([shopIdQuery])
exports.getQuotation = validate([idParam])
exports.createQuotation = validate([
  shopIdBody,
  body('quote_number').trim().notEmpty().withMessage('Quote number is required'),
  body('items').isArray({ min: 1 }).withMessage('Items array is required')
])
exports.updateQuotation = validate([
  idParam,
  body('status').optional().isIn(['draft', 'sent', 'accepted', 'rejected', 'expired']).withMessage('Invalid status')
])

exports.reportQuery = validate([shopIdQuery])
