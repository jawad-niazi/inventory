const router = require('express').Router()
const ctrl = require('../controllers/transferController')
const loadProfile = require('../middleware/loadProfile')
const { listTransfers, getTransfer, createTransfer, updateTransferStatus } = require('../validations/newModulesValidation')

router.use(loadProfile)

router.get('/', listTransfers, ctrl.list)
router.get('/:id', getTransfer, ctrl.getOne)
router.post('/', createTransfer, ctrl.create)
router.put('/:id/status', updateTransferStatus, ctrl.updateStatus)

module.exports = router
