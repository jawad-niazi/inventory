const router = require('express').Router()
const ctrl = require('../controllers/returnController')
const loadProfile = require('../middleware/loadProfile')
const { listReturns, getReturn, createReturn } = require('../validations/newModulesValidation')

router.use(loadProfile)

router.get('/', listReturns, ctrl.list)
router.get('/:id', getReturn, ctrl.getOne)
router.post('/', createReturn, ctrl.create)

module.exports = router
