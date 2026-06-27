const router = require('express').Router()
const ctrl = require('../controllers/supplierController')
const loadProfile = require('../middleware/loadProfile')
const { listSuppliers, createSupplier, updateSupplier } = require('../validations/newModulesValidation')

router.use(loadProfile)

router.get('/', listSuppliers, ctrl.list)
router.get('/:id', ctrl.getOne)
router.post('/', createSupplier, ctrl.create)
router.put('/:id', updateSupplier, ctrl.update)
router.delete('/:id', ctrl.remove)

module.exports = router
