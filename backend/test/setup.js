import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

let mongoServer

export const setupTestDB = async () => {
  mongoServer = await MongoMemoryServer.create()
  const mongoUri = mongoServer.getUri()
  
  await mongoose.disconnect()
  await mongoose.connect(mongoUri)
}

export const teardownTestDB = async () => {
  if (mongoose.connection.readyState) {
    await mongoose.disconnect()
  }
  if (mongoServer) {
    await mongoServer.stop()
  }
}

export const clearTestDB = async () => {
  const collections = mongoose.connection.collections
  for (const key in collections) {
    await collections[key].deleteMany()
  }
}

// Global test hooks
export const mochaHooks = {
  beforeAll: async function() {
    this.timeout(30000)
    await setupTestDB()
  },
  
  afterEach: async function() {
    await clearTestDB()
  },
  
  afterAll: async function() {
    await teardownTestDB()
  }
}