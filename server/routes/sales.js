const router = require('express').Router()
const ctrl = require('../controllers/salesController')
const loadProfile = require('../middleware/loadProfile')
const { listSales, getSale, createSale } = require('../validations/newModulesValidation')

router.use(loadProfile)

router.get('/', listSales, ctrl.list)
router.get('/:id', getSale, ctrl.getOne)
router.post('/', createSale, ctrl.create)

module.exports = router
