const router = require('express').Router()
const ctrl = require('../controllers/authController')
const authMiddleware = require('../middleware/auth')

// register: client signs up with Supabase client, then calls this endpoint
router.post('/register', authMiddleware, ctrl.register)
router.get('/me', authMiddleware, ctrl.me)
router.post('/logout', authMiddleware, ctrl.logout)

// Password reset — forgot-password is PUBLIC (no auth middleware needed)
router.post('/forgot-password', ctrl.forgotPassword)
// reset-password requires the session established by the Supabase email link
router.post('/reset-password', authMiddleware, ctrl.resetPassword)

module.exports = router
