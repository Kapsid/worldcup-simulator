import mongoose from 'mongoose'
import World from '../models/World.js'
import connectDB from '../config/database.js'

/**
 * Script to clean up duplicate Lebanon entries in existing world documents.
 * 
 * The correct Lebanon entry should have:
 * - name: "Lebanon"
 * - code: "LBN" 
 * - confederation: "afc"
 * 
 * Any duplicate with code "LIB" should be removed.
 */

async function cleanLebanonDuplicates() {
  try {
    console.log('🔌 Connecting to MongoDB...')
    await connectDB()
    
    console.log('🔍 Finding worlds with duplicate Lebanon entries...')
    
    // Find all worlds that have country rankings
    const worlds = await World.find({
      'countryRankings.0': { $exists: true }
    })
    
    console.log(`📊 Found ${worlds.length} worlds to check`)
    
    let totalWorldsUpdated = 0
    let totalDuplicatesRemoved = 0
    
    for (const world of worlds) {
      const countryRankings = world.countryRankings
      
      // Find Lebanon entries
      const lebanonEntries = countryRankings.filter(country => 
        country.name === 'Lebanon' || 
        country.code === 'LBN' || 
        country.code === 'LIB'
      )
      
      if (lebanonEntries.length > 1) {
        console.log(`\n🇱🇧 Found ${lebanonEntries.length} Lebanon entries in world "${world.name}":`)
        lebanonEntries.forEach((entry, index) => {
          console.log(`   ${index + 1}. Name: "${entry.name}", Code: "${entry.code}", Confederation: "${entry.confederation}", Rank: ${entry.rank}`)
        })
        
        // Find the correct Lebanon entry (code: LBN, confederation: afc)
        const correctLebanon = lebanonEntries.find(entry => 
          entry.code === 'LBN' && entry.confederation === 'afc'
        )
        
        if (!correctLebanon) {
          console.log(`   ⚠️  No correct Lebanon entry found (LBN/afc). Skipping world "${world.name}"`)
          continue
        }
        
        // Find duplicate entries to remove
        const duplicatesToRemove = lebanonEntries.filter(entry => 
          entry._id.toString() !== correctLebanon._id.toString()
        )
        
        if (duplicatesToRemove.length > 0) {
          console.log(`   ✅ Keeping correct Lebanon: "${correctLebanon.name}" (${correctLebanon.code}/${correctLebanon.confederation})`)
          console.log(`   🗑️  Removing ${duplicatesToRemove.length} duplicate(s):`)
          
          duplicatesToRemove.forEach(duplicate => {
            console.log(`      - "${duplicate.name}" (${duplicate.code}/${duplicate.confederation})`)
          })
          
          // Remove duplicates from countryRankings array
          world.countryRankings = countryRankings.filter(country => 
            !duplicatesToRemove.some(duplicate => 
              duplicate._id.toString() === country._id.toString()
            )
          )
          
          // Recalculate ranks after removal
          world.countryRankings.sort((a, b) => b.points - a.points)
          world.countryRankings.forEach((country, index) => {
            const newRank = index + 1
            country.rank = newRank
          })
          
          await world.save()
          
          totalWorldsUpdated++
          totalDuplicatesRemoved += duplicatesToRemove.length
          
          console.log(`   💾 Updated world "${world.name}" - removed ${duplicatesToRemove.length} duplicates`)
        }
      }
    }
    
    console.log('\n📈 Cleanup Summary:')
    console.log(`   - Worlds checked: ${worlds.length}`)
    console.log(`   - Worlds updated: ${totalWorldsUpdated}`)
    console.log(`   - Duplicate Lebanon entries removed: ${totalDuplicatesRemoved}`)
    
    if (totalWorldsUpdated === 0) {
      console.log('   ✨ No duplicate Lebanon entries found. All worlds are clean!')
    } else {
      console.log('   ✅ Successfully cleaned up all duplicate Lebanon entries!')
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    throw error
  } finally {
    console.log('🔌 Disconnecting from MongoDB...')
    await mongoose.disconnect()
  }
}

async function verifyCleanup() {
  try {
    console.log('\n🔍 Verifying cleanup...')
    await connectDB()
    
    const worlds = await World.find({
      'countryRankings.0': { $exists: true }
    })
    
    let duplicatesFound = 0
    
    for (const world of worlds) {
      const lebanonEntries = world.countryRankings.filter(country => 
        country.name === 'Lebanon' || 
        country.code === 'LBN' || 
        country.code === 'LIB'
      )
      
      if (lebanonEntries.length > 1) {
        duplicatesFound++
        console.log(`   ⚠️  World "${world.name}" still has ${lebanonEntries.length} Lebanon entries`)
      }
    }
    
    if (duplicatesFound === 0) {
      console.log('   ✅ Verification passed: No duplicate Lebanon entries found!')
    } else {
      console.log(`   ❌ Verification failed: ${duplicatesFound} worlds still have duplicates`)
    }
    
  } catch (error) {
    console.error('❌ Error during verification:', error)
  } finally {
    await mongoose.disconnect()
  }
}

// Main execution
async function main() {
  console.log('🧹 Lebanon Duplicates Cleanup Script')
  console.log('=====================================\n')
  
  try {
    await cleanLebanonDuplicates()
    await verifyCleanup()
    
    console.log('\n🎉 Script completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('\n💥 Script failed:', error.message)
    process.exit(1)
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { cleanLebanonDuplicates, verifyCleanup }