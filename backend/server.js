import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import connectDB from './config/database.js'
import authRoutes from './routes/auth.js'
import tournamentRoutes from './routes/tournament.js'
import teamsRoutes from './routes/teams.js'
import drawRoutes from './routes/draw.js'
import matchesRoutes from './routes/matches.js'
import knockoutRoutes from './routes/knockout.js'
import profileRoutes from './routes/profile.js'
import qualificationRoutes from './routes/qualification.js'
import worldsRoutes from './routes/worlds.js'
import newsRoutes from './routes/news.js'
import playersRoutes from './routes/players.js'
import membershipRoutes from './routes/membership.js'
import adminRoutes from './routes/admin.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now()
  console.log(`📨 ${req.method} ${req.path} - ${req.ip}`)
  
  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`✅ ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`)
  })
  
  next()
})

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Serve static files from Vue build in production
if (process.env.NODE_ENV === 'production') {
  const staticPath = path.join(__dirname, '../frontend/dist')
  app.use(express.static(staticPath))
}

// Root endpoint - serve Vue app in production, API info in development
app.get('/', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'))
  } else {
    res.json({
      message: 'World Cup Simulator API',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        api: '/api',
        auth: '/api/login, /api/register',
        tournaments: '/api/tournaments',
        teams: '/api/teams',
        matches: '/api/matches'
      },
      environment: process.env.NODE_ENV || 'development',
      port: PORT
    })
  }
})

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const healthcheck = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      port: PORT,
      memory: process.memoryUsage(),
      mongodb: 'checking...'
    }
    
    // Check MongoDB connection
    if (app.locals.db) {
      try {
        await app.locals.db.admin().ping()
        healthcheck.mongodb = 'connected'
      } catch (err) {
        healthcheck.mongodb = 'disconnected'
        healthcheck.status = 'DEGRADED'
      }
    } else {
      healthcheck.mongodb = 'not initialized'
      healthcheck.status = 'DEGRADED'
    }
    
    res.json(healthcheck)
  } catch (error) {
    res.status(503).json({ 
      status: 'ERROR', 
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

// Routes
app.use('/api', authRoutes)
app.use('/api/worlds', worldsRoutes)
app.use('/api/tournaments', tournamentRoutes)
app.use('/api/teams', teamsRoutes)
app.use('/api/draw', drawRoutes)
app.use('/api/matches', matchesRoutes)
app.use('/api/knockout', knockoutRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/qualification', qualificationRoutes)
app.use('/api/news', newsRoutes)
app.use('/api/players', playersRoutes)
app.use('/api/membership', membershipRoutes)
app.use('/api/admin', adminRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

// 404 handler - serve Vue app for client-side routing in production
app.use('*', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'))
  } else {
    res.status(404).json({ error: 'Route not found' })
  }
})

// Startup logging
console.log('🚀 Starting World Cup Simulator API...')
console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
console.log(`🔌 Port: ${PORT}`)
console.log(`🌐 CORS enabled for all origins`)

// Connect to MongoDB only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  // Connect to database first
  connectDB().then((connection) => {
    // Store MongoDB connection for health checks
    if (connection && connection.connection) {
      app.locals.db = connection.connection.db
    }
    
    // Start server only after DB connection
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('✅ Server started successfully!')
      console.log(`🏆 World Cup Simulator API running on port ${PORT}`)
      console.log(`📍 Health check: ${process.env.RAILWAY_STATIC_URL || `http://localhost:${PORT}`}/health`)
      console.log(`📍 API endpoints: ${process.env.RAILWAY_STATIC_URL || `http://localhost:${PORT}`}/api`)
      console.log(`🔗 MongoDB: ${process.env.MONGODB_URL ? 'Connected to Railway DB' : 'Using local DB'}`)
    })
    
    // Handle server errors
    server.on('error', (error) => {
      console.error('❌ Server error:', error)
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`)
      }
      process.exit(1)
    })
  }).catch(err => {
    console.error('Failed to connect to database:', err)
    // Still start the server but without DB
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`⚠️  Server running on port ${PORT} without database connection`)
    })
  })
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...')
  console.error(err.name, err.message)
  console.error(err.stack)
  process.exit(1)
})

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...')
  console.error(err.name, err.message)
  console.error(err.stack)
  process.exit(1)
})

// Export for testing
export default app