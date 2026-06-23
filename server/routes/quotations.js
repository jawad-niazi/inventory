const router = require('express').Router()
const ctrl = require('../controllers/quotationController')
const loadProfile = require('../middleware/loadProfile')
const { listQuotations, getQuotation, createQuotation, updateQuotation } = require('../validations/newModulesValidation')

router.use(loadProfile)

router.get('/', listQuotations, ctrl.list)
router.get('/:id', getQuotation, ctrl.getOne)
router.post('/', createQuotation, ctrl.create)
router.put('/:id', updateQuotation, ctrl.update)
router.delete('/:id', ctrl.remove)
router.post('/:id/convert', ctrl.convertToSale)

module.exports = router
