const router = require('express').Router()
const ctrl = require('../controllers/inventoryController')
const loadProfile = require('../middleware/loadProfile')
const {
  listInventory,
  lowStock,
  history,
  adjust,
} = require('../validations/inventoryValidation')

router.use(loadProfile)

router.get('/', listInventory, ctrl.list)
router.get('/low-stock', lowStock, ctrl.lowStock)
router.get('/history', history, ctrl.history)
router.post('/adjust', adjust, ctrl.adjust)

module.exports = router
