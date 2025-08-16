import PlayerGenerationService from './backend/services/PlayerGenerationService.js'
import mongoose from 'mongoose'

async function testPlayerGeneration() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/worldcup')
    console.log('Connected to MongoDB')

    // Test generating a squad
    const players = await PlayerGenerationService.generateSquad(
      'BRA', // Brazil
      null, // No tournament ID
      'test-world-id', // Test world ID
      2024, // Current year
      false // Don't preserve existing
    )

    console.log(`Generated ${players.length} players successfully`)
    console.log('Sample player:', players[0])

  } catch (error) {
    console.error('Error in test:', error)
  } finally {
    await mongoose.disconnect()
  }
}

testPlayerGeneration()