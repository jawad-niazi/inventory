const router = require('express').Router()
const ctrl = require('../controllers/shopController')
const requireSuperAdmin = require('../middleware/authorize')
const { createShop, updateShop } = require('../validations/shopValidation')

router.get('/', requireSuperAdmin, ctrl.list)
router.post('/', requireSuperAdmin, createShop, ctrl.create)
router.put('/:id', requireSuperAdmin, updateShop, ctrl.update)
router.delete('/:id', requireSuperAdmin, ctrl.remove)

module.exports = router
