const { body, param } = require('express-validator')

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

exports.createUser = validate([
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['super_admin', 'staff', 'shop_manager'])
    .withMessage('Invalid role'),
  body('shop_id').optional({ nullable: true }).isUUID().withMessage('Invalid shop id'),
])

exports.updateUser = validate([
  param('id').isUUID().withMessage('Invalid user id'),
  body('email').optional().trim().isEmail().withMessage('Invalid email'),
  body('role')
    .optional()
    .isIn(['super_admin', 'staff', 'shop_manager'])
    .withMessage('Invalid role'),
  body('shop_id').optional({ nullable: true }).isUUID().withMessage('Invalid shop id'),
])
