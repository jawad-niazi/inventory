const router = require('express').Router()
const ctrl = require('../controllers/categoryController')
const loadProfile = require('../middleware/loadProfile')
const {
  listCategories,
  createCategory,
  updateCategory,
} = require('../validations/inventoryValidation')

router.use(loadProfile)

router.get('/', listCategories, ctrl.list)
router.post('/', createCategory, ctrl.create)
router.put('/:id', updateCategory, ctrl.update)
router.delete('/:id', ctrl.remove)

module.exports = router
