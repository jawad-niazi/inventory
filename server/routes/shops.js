const router = require('express').Router()
const ctrl = require('../controllers/shopController')
const requireSuperAdmin = require('../middleware/authorize')
const loadProfile = require('../middleware/loadProfile')
const { createShop, updateShop } = require('../validations/shopValidation')

// GET /api/shops — readable by ALL authenticated users (staff, managers, super_admins)
// They need it to populate shop dropdowns in POS, Transfers, Purchases, etc.
router.get('/', loadProfile, ctrl.list)

// Write operations remain super_admin only
router.post('/', requireSuperAdmin, createShop, ctrl.create)
router.put('/:id', requireSuperAdmin, updateShop, ctrl.update)
router.delete('/:id', requireSuperAdmin, ctrl.remove)

module.exports = router
