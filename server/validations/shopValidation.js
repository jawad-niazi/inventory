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

exports.createShop = validate([
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').optional({ nullable: true }).isEmail().withMessage('Invalid email'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive'),
])

exports.updateShop = validate([
  param('id').isUUID().withMessage('Invalid shop id'),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional({ nullable: true }).isEmail().withMessage('Invalid email'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive'),
])
