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

// CORS configuration: whitelist allowed frontend origins
// CORS configuration: whitelist allowed frontend origins
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) return callback(null, true);
    
    // Clean trailing slashes for consistent comparison
    const cleanOrigin = origin.replace(/\/$/, '');
    
    const allowed = [
      'http://localhost:5173',
      'http://localhost:3000',
      process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : null
    ].filter(Boolean);
    
    if (allowed.includes(cleanOrigin)) {
      return callback(null, true);
    }
    
    console.error(`[CORS Error] Blocked origin: ${origin}. Allowed:`, allowed);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
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
