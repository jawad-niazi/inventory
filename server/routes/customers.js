const router = require('express').Router()
const ctrl = require('../controllers/customerController')
const loadProfile = require('../middleware/loadProfile')
const { listCustomers, createCustomer, updateCustomer } = require('../validations/newModulesValidation')

router.use(loadProfile)

router.get('/', listCustomers, ctrl.list)
router.post('/', createCustomer, ctrl.create)
router.put('/:id', updateCustomer, ctrl.update)
router.delete('/:id', ctrl.remove)

module.exports = router
