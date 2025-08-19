// Environment configuration
export const config = {
  // Server
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database - Railway uses MONGODB_URL, not MONGODB_URI
  mongoUrl: process.env.MONGODB_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/worldcup',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  
  // Frontend URL for CORS
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  // Railway specific
  isRailway: !!process.env.RAILWAY_ENVIRONMENT,
  railwayUrl: process.env.RAILWAY_STATIC_URL,
  
  // Feature flags
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production'
}

// Log configuration on startup (hide sensitive data)
export const logConfig = () => {
  console.log('🔧 Configuration loaded:')
  console.log(`   Environment: ${config.nodeEnv}`)
  console.log(`   Port: ${config.port}`)
  console.log(`   MongoDB: ${config.mongoUrl.includes('localhost') ? 'Local' : 'Remote'}`)
  console.log(`   Railway: ${config.isRailway ? 'Yes' : 'No'}`)
  console.log(`   Frontend URL: ${config.frontendUrl}`)
}