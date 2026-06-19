const router = require('express').Router()
const ctrl = require('../controllers/expenseController')
const loadProfile = require('../middleware/loadProfile')
const { listExpenses, createExpense, updateExpense } = require('../validations/newModulesValidation')

router.use(loadProfile)

router.get('/', listExpenses, ctrl.list)
router.post('/', createExpense, ctrl.create)
router.put('/:id', updateExpense, ctrl.update)
router.delete('/:id', ctrl.remove)

module.exports = router
