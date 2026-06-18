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

const shopIdQuery = query('shop_id').isUUID().withMessage('Valid shop_id query param is required')
const shopIdBody = body('shop_id').isUUID().withMessage('Valid shop_id is required')

exports.listCategories = validate([shopIdQuery])
exports.createCategory = validate([
  shopIdBody,
  body('name').trim().notEmpty().withMessage('Category name is required'),
])
exports.updateCategory = validate([
  param('id').isUUID().withMessage('Invalid category id'),
  body('name').trim().notEmpty().withMessage('Category name is required'),
])

exports.listProducts = validate([shopIdQuery])
exports.createProduct = validate([
  shopIdBody,
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be >= 0'),
  body('category_id').optional({ nullable: true }).isUUID().withMessage('Invalid category id'),
  body('low_stock_threshold').optional().isInt({ min: 0 }).withMessage('Threshold must be >= 0'),
  body('initial_quantity').optional().isInt({ min: 0 }).withMessage('Initial quantity must be >= 0'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
])
exports.updateProduct = validate([
  param('id').isUUID().withMessage('Invalid product id'),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be >= 0'),
  body('category_id').optional({ nullable: true }).isUUID().withMessage('Invalid category id'),
  body('low_stock_threshold').optional().isInt({ min: 0 }).withMessage('Threshold must be >= 0'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
])

exports.listInventory = validate([shopIdQuery])
exports.lowStock = validate([shopIdQuery])
exports.history = validate([
  shopIdQuery,
  query('product_id').optional().isUUID().withMessage('Invalid product_id'),
])
exports.adjust = validate([
  shopIdBody,
  body('product_id').isUUID().withMessage('Valid product_id is required'),
  body('quantity_change').isInt().withMessage('quantity_change must be an integer'),
  body('reason').optional().trim(),
])
