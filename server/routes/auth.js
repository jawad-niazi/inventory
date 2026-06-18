const router = require('express').Router()
const ctrl = require('../controllers/authController')
const authMiddleware = require('../middleware/auth')

// register: client signs up with Supabase client, then calls this endpoint
router.post('/register', authMiddleware, ctrl.register)
router.get('/me', authMiddleware, ctrl.me)
router.post('/logout', authMiddleware, ctrl.logout)

module.exports = router
