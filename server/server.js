const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') })
const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const apiRoutes = require('./routes')
const authRoutes = require('./routes/auth')
const errorHandler = require('./middleware/errorHandler')
const authMiddleware = require('./middleware/auth')

const app = express()

app.use(cors())
app.use(morgan('dev'))
app.use(express.json())

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

// Public auth routes (signup/login)
app.use('/api/auth', authRoutes)

// Protected API routes (require auth)
app.use('/api', authMiddleware, apiRoutes)

// Error handler (should be after routes)
app.use(errorHandler)

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})
