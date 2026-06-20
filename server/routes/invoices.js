const router = require('express').Router()
const ctrl = require('../controllers/invoiceController')
const loadProfile = require('../middleware/loadProfile')
const { listInvoices, getInvoice, updateInvoiceStatus } = require('../validations/newModulesValidation')

router.use(loadProfile)

router.get('/', listInvoices, ctrl.list)
router.get('/:id', getInvoice, ctrl.getOne)
router.put('/:id/status', updateInvoiceStatus, ctrl.updateStatus)
router.get('/:id/pdf', getInvoice, ctrl.generatePDF)

module.exports = router
