const router = require('express').Router()
const ctrl = require('../controllers/userController')
const requireSuperAdmin = require('../middleware/authorize')
const { createUser, updateUser } = require('../validations/userValidation')

router.get('/', requireSuperAdmin, ctrl.list)
router.post('/', requireSuperAdmin, createUser, ctrl.create)
router.put('/:id', requireSuperAdmin, updateUser, ctrl.update)
router.delete('/:id', requireSuperAdmin, ctrl.remove)

module.exports = router
