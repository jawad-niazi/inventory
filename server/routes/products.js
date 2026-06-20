const router = require('express').Router()
const ctrl = require('../controllers/productController')
const loadProfile = require('../middleware/loadProfile')
const upload = require('../config/upload')
const {
  listProducts,
  createProduct,
  updateProduct,
} = require('../validations/inventoryValidation')

router.use(loadProfile)

router.get('/', listProducts, ctrl.list)
// IMPORTANT: specific sub-routes must come BEFORE the generic '/:id' route
router.get('/:id/image', ctrl.serveImage)
router.get('/:id', ctrl.getOne)
router.post('/', createProduct, ctrl.create)
router.put('/:id', updateProduct, ctrl.update)
router.delete('/:id', ctrl.remove)
router.post('/:id/image', (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) return next(err)
    ctrl.uploadImage(req, res, next)
  })
})

module.exports = router
