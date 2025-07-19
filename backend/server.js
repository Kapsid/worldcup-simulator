import express from 'express'
import cors from 'cors'
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

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Connect to MongoDB only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  connectDB()
  
  app.listen(PORT, () => {
    console.log(`🏆 World Cup Simulator API running on port ${PORT}`)
    console.log(`📍 Health check: http://localhost:${PORT}/health`)
    console.log(`📍 API endpoints: http://localhost:${PORT}/api`)
  })
}

// Export for testing
export default app