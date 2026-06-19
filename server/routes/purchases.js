const router = require('express').Router()
const ctrl = require('../controllers/purchaseController')
const loadProfile = require('../middleware/loadProfile')
const { listPurchases, getPurchase, createPurchase } = require('../validations/newModulesValidation')

router.use(loadProfile)

router.get('/', listPurchases, ctrl.list)
router.get('/:id', getPurchase, ctrl.getOne)
router.post('/', createPurchase, ctrl.create)

module.exports = router
