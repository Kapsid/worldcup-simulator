import mongoose from 'mongoose'

const connectDB = async () => {
  try {
    // Railway provides MongoDB URL as MONGODB_URL (not MONGODB_URI)
    const mongoUrl = process.env.MONGODB_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/worldcup'
    
    console.log('Attempting to connect to MongoDB...')
    console.log('Connection string:', mongoUrl.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')) // Hide credentials in logs
    
    const conn = await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // 30 seconds timeout
      socketTimeoutMS: 45000,
    })

    console.log(`MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message)
    // Don't exit immediately in production, retry connection
    if (process.env.NODE_ENV === 'production') {
      console.log('Retrying MongoDB connection in 5 seconds...')
      setTimeout(connectDB, 5000)
    } else {
      process.exit(1)
    }
  }
}

export default connectDB