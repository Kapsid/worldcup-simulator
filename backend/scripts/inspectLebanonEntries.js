import mongoose from 'mongoose'
import World from '../models/World.js'
import connectDB from '../config/database.js'

/**
 * Script to inspect Lebanon entries in the database without making changes.
 * This helps us understand the current state before cleanup.
 */

async function inspectLebanonEntries() {
  try {
    console.log('🔌 Connecting to MongoDB...')
    await connectDB()
    
    console.log('🔍 Inspecting Lebanon entries in all worlds...')
    
    // Find all worlds that have country rankings
    const worlds = await World.find({
      'countryRankings.0': { $exists: true }
    }).select('name countryRankings createdAt')
    
    console.log(`📊 Found ${worlds.length} worlds with country rankings\n`)
    
    let totalLebanonEntries = 0
    let worldsWithLebanon = 0
    let worldsWithDuplicates = 0
    
    for (const world of worlds) {
      // Find Lebanon entries in this world
      const lebanonEntries = world.countryRankings.filter(country => 
        country.name === 'Lebanon' || 
        country.code === 'LBN' || 
        country.code === 'LIB'
      )
      
      if (lebanonEntries.length > 0) {
        worldsWithLebanon++
        totalLebanonEntries += lebanonEntries.length
        
        console.log(`🌍 World: "${world.name}" (Created: ${world.createdAt?.toISOString().split('T')[0]})`)
        console.log(`   Lebanon entries: ${lebanonEntries.length}`)
        
        lebanonEntries.forEach((entry, index) => {
          console.log(`   ${index + 1}. Name: "${entry.name}", Code: "${entry.code}", Confederation: "${entry.confederation}"`)
          console.log(`      Rank: ${entry.rank}, Points: ${entry.points}`)
        })
        
        if (lebanonEntries.length > 1) {
          worldsWithDuplicates++
          console.log(`   ⚠️  This world has ${lebanonEntries.length} Lebanon entries (DUPLICATES DETECTED)`)
        } else {
          const entry = lebanonEntries[0]
          if (entry.code === 'LBN' && entry.confederation === 'afc') {
            console.log(`   ✅ This world has the correct Lebanon entry`)
          } else {
            console.log(`   🔄 This world has Lebanon but with incorrect data (code: ${entry.code}, conf: ${entry.confederation})`)
          }
        }
        console.log('')
      }
    }
    
    console.log('📈 Summary:')
    console.log(`   - Total worlds: ${worlds.length}`)
    console.log(`   - Worlds with Lebanon entries: ${worldsWithLebanon}`)
    console.log(`   - Worlds with duplicate Lebanon entries: ${worldsWithDuplicates}`)
    console.log(`   - Total Lebanon entries across all worlds: ${totalLebanonEntries}`)
    
    if (worldsWithDuplicates > 0) {
      console.log(`\n🔧 Action needed: ${worldsWithDuplicates} worlds have duplicate Lebanon entries that should be cleaned up.`)
      console.log('   Run the cleanLebanonDuplicates.js script to fix these duplicates.')
    } else {
      console.log('\n✨ No duplicate Lebanon entries found! All worlds are clean.')
    }
    
  } catch (error) {
    console.error('❌ Error during inspection:', error)
    throw error
  } finally {
    console.log('\n🔌 Disconnecting from MongoDB...')
    await mongoose.disconnect()
  }
}

// Main execution
async function main() {
  console.log('🔍 Lebanon Entries Inspection Script')
  console.log('====================================\n')
  
  try {
    await inspectLebanonEntries()
    console.log('\n🎉 Inspection completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('\n💥 Inspection failed:', error.message)
    process.exit(1)
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { inspectLebanonEntries }