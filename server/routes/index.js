const express = require('express')
const router = express.Router()

router.use('/users', require('./users'))
router.use('/categories', require('./categories'))
router.use('/products', require('./products'))
router.use('/inventory', require('./inventory'))
router.use('/shops', require('./shops'))

module.exports = router
