const express = require('express')
const router = express.Router()

router.use('/users', require('./users'))
router.use('/categories', require('./categories'))
router.use('/products', require('./products'))
router.use('/inventory', require('./inventory'))
router.use('/shops', require('./shops'))
router.use('/sales', require('./sales'))
router.use('/purchases', require('./purchases'))
router.use('/transfers', require('./transfers'))
router.use('/expenses', require('./expenses'))
router.use('/suppliers', require('./suppliers'))
router.use('/customers', require('./customers'))
router.use('/returns', require('./returns'))
router.use('/invoices', require('./invoices'))
router.use('/quotations', require('./quotations'))

module.exports = router
