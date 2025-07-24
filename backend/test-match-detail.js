#!/usr/bin/env node

import mongoose from 'mongoose'
import MatchDetail from './models/MatchDetail.js'
import Match from './models/Match.js'

const MATCH_ID = '6882b0f1477b45b55bf20081'

async function testMatchDetailQueries() {
  try {
    // Connect to the same database as the application
    const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/worldcup'
    console.log(`🔗 Connecting to MongoDB: ${connectionString}`)
    
    await mongoose.connect(connectionString)
    console.log('✅ Connected to MongoDB')
    
    console.log(`\n🔍 Testing queries for match ID: ${MATCH_ID}`)
    console.log(`📏 Match ID length: ${MATCH_ID.length}`)
    console.log(`🔤 Match ID type: ${typeof MATCH_ID}`)
    
    // Test 1: Direct string query
    console.log('\n--- TEST 1: Direct string query ---')
    const stringResult = await MatchDetail.findOne({ match: MATCH_ID })
    console.log(`String query result: ${stringResult ? 'FOUND' : 'NOT FOUND'}`)
    if (stringResult) {
      console.log(`✅ Found record with _id: ${stringResult._id}`)
      console.log(`📋 Match field value: ${stringResult.match}`)
      console.log(`🏷️ Match field type: ${typeof stringResult.match}`)
      console.log(`📊 Match type: ${stringResult.matchType}`)
    }
    
    // Test 2: ObjectId query
    console.log('\n--- TEST 2: ObjectId query ---')
    let objectIdResult = null
    try {
      const { ObjectId } = await import('mongodb')
      if (ObjectId.isValid(MATCH_ID)) {
        console.log(`✅ ${MATCH_ID} is a valid ObjectId format`)
        const objectIdQuery = new ObjectId(MATCH_ID)
        console.log(`🔍 ObjectId query object: ${objectIdQuery}`)
        objectIdResult = await MatchDetail.findOne({ match: objectIdQuery })
        console.log(`ObjectId query result: ${objectIdResult ? 'FOUND' : 'NOT FOUND'}`)
        if (objectIdResult) {
          console.log(`✅ Found record with _id: ${objectIdResult._id}`)
          console.log(`📋 Match field value: ${objectIdResult.match}`)
          console.log(`🏷️ Match field type: ${typeof objectIdResult.match}`)
          console.log(`📊 Match type: ${objectIdResult.matchType}`)
        }
      } else {
        console.log(`❌ ${MATCH_ID} is NOT a valid ObjectId format`)
      }
    } catch (error) {
      console.log(`❌ ObjectId query failed: ${error.message}`)
    }
    
    // Test 3: Find all MatchDetails to see what exists
    console.log('\n--- TEST 3: All MatchDetail records ---')
    const allMatches = await MatchDetail.find({}).limit(10)
    console.log(`📊 Total MatchDetail records found: ${allMatches.length}`)
    
    if (allMatches.length > 0) {
      console.log('\n🔍 Sample records:')
      allMatches.forEach((match, index) => {
        console.log(`  ${index + 1}. _id: ${match._id}`)
        console.log(`     match: ${match.match} (type: ${typeof match.match})`)
        console.log(`     matchType: ${match.matchType}`)
        console.log(`     createdAt: ${match.createdAt}`)
        console.log('')
      })
    }
    
    // Test 4: Search for similar IDs (partial matches)
    console.log('\n--- TEST 4: Search for similar match IDs ---')
    const partialMatch = MATCH_ID.substring(0, 10)
    console.log(`🔍 Searching for match IDs starting with: ${partialMatch}`)
    
    const similarMatches = await MatchDetail.find({
      match: new RegExp(`^${partialMatch}`, 'i')
    }).limit(5)
    
    console.log(`📊 Similar matches found: ${similarMatches.length}`)
    similarMatches.forEach((match, index) => {
      console.log(`  ${index + 1}. match: ${match.match} (type: ${typeof match.match})`)
      console.log(`     _id: ${match._id}`)
      console.log(`     matchType: ${match.matchType}`)
    })
    
    // Test 5: Check if the exact value exists but stored differently
    console.log('\n--- TEST 5: Raw collection query ---')
    const collection = mongoose.connection.db.collection('matchdetails')
    const rawResult = await collection.findOne({ match: MATCH_ID })
    console.log(`Raw collection string query: ${rawResult ? 'FOUND' : 'NOT FOUND'}`)
    
    if (!rawResult) {
      try {
        const { ObjectId } = await import('mongodb')
        const rawObjectIdResult = await collection.findOne({ match: new ObjectId(MATCH_ID) })
        console.log(`Raw collection ObjectId query: ${rawObjectIdResult ? 'FOUND' : 'NOT FOUND'}`)
        
        if (rawObjectIdResult) {
          console.log(`✅ Raw record found:`)
          console.log(`   _id: ${rawObjectIdResult._id}`)
          console.log(`   match: ${rawObjectIdResult.match}`)
          console.log(`   match type: ${typeof rawObjectIdResult.match}`)
          console.log(`   matchType: ${rawObjectIdResult.matchType}`)
        }
      } catch (error) {
        console.log(`❌ Raw ObjectId query failed: ${error.message}`)
      }
    } else {
      console.log(`✅ Raw record found:`)
      console.log(`   _id: ${rawResult._id}`)
      console.log(`   match: ${rawResult.match}`)
      console.log(`   match type: ${typeof rawResult.match}`)
      console.log(`   matchType: ${rawResult.matchType}`)
    }
    
    // Test 6: Check all documents in the collection to see patterns
    console.log('\n--- TEST 6: All documents analysis ---')
    const allDocs = await collection.find({}).limit(20).toArray()
    console.log(`📊 Total documents in collection: ${allDocs.length}`)
    
    const stringMatches = allDocs.filter(doc => typeof doc.match === 'string')
    const objectIdMatches = allDocs.filter(doc => doc.match && typeof doc.match === 'object')
    
    console.log(`📋 String match fields: ${stringMatches.length}`)
    console.log(`🆔 ObjectId match fields: ${objectIdMatches.length}`)
    
    if (stringMatches.length > 0) {
      console.log('\n📋 Sample string matches:')
      stringMatches.slice(0, 3).forEach(doc => {
        console.log(`   ${doc.match} (length: ${doc.match.length})`)
      })
    }
    
    if (objectIdMatches.length > 0) {
      console.log('\n🆔 Sample ObjectId matches:')
      objectIdMatches.slice(0, 3).forEach(doc => {
        console.log(`   ${doc.match} (${doc.match.constructor.name})`)
      })
    }
    
    // Test 7: Check if the match exists in the regular Match collection
    console.log('\n--- TEST 7: Check if match exists in Match collection ---')
    let tournamentMatch = null
    try {
      const { ObjectId } = mongoose.Types
      if (ObjectId.isValid(MATCH_ID)) {
        tournamentMatch = await Match.findById(MATCH_ID)
        console.log(`Tournament match query result: ${tournamentMatch ? 'FOUND' : 'NOT FOUND'}`)
        if (tournamentMatch) {
          console.log(`✅ Found tournament match:`)
          console.log(`   _id: ${tournamentMatch._id}`)
          console.log(`   tournament: ${tournamentMatch.tournament}`)
          console.log(`   homeTeam: ${tournamentMatch.homeTeam}`)
          console.log(`   awayTeam: ${tournamentMatch.awayTeam}`)
          console.log(`   status: ${tournamentMatch.status}`)
          console.log(`   homeScore: ${tournamentMatch.homeScore}`)
          console.log(`   awayScore: ${tournamentMatch.awayScore}`)
        }
      }
    } catch (error) {
      console.log(`❌ Tournament match query failed: ${error.message}`)
    }

    // Final summary
    console.log('\n' + '='.repeat(50))
    console.log('🎯 SUMMARY')
    console.log('='.repeat(50))
    console.log(`Target match ID: ${MATCH_ID}`)
    console.log(`Tournament match exists: ${tournamentMatch ? '✅ YES' : '❌ NO'}`)
    console.log(`MatchDetail string query: ${stringResult ? '✅ FOUND' : '❌ NOT FOUND'}`)
    console.log(`MatchDetail ObjectId query: ${objectIdResult ? '✅ FOUND' : '❌ NOT FOUND'}`)
    console.log(`Total MatchDetail records: ${allMatches.length}`)
    console.log(`String type matches in DB: ${stringMatches.length}`)
    console.log(`ObjectId type matches in DB: ${objectIdMatches.length}`)
    
    if (tournamentMatch && !stringResult && !objectIdResult) {
      console.log('\n🎯 DIAGNOSIS: Tournament match exists but NO MatchDetail record!')
      console.log('💡 This explains the 404 error. The match exists but detailed match data hasn\'t been created.')
      console.log('🔧 SOLUTION: Create a MatchDetail record for this match or modify the API to handle this case.')
    } else if (!tournamentMatch) {
      console.log('\n🚨 ISSUE: The match ID was not found in either collection!')
      console.log('💡 Possible reasons:')
      console.log('   1. The match record doesn\'t exist in the database')
      console.log('   2. There\'s a typo in the match ID')
      console.log('   3. The match is in a different collection or database')
    }
    
  } catch (error) {
    console.error('❌ Error during testing:', error)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 Disconnected from MongoDB')
  }
}

// Run the test
console.log('🧪 Starting MatchDetail Database Query Test')
console.log('=' .repeat(50))

testMatchDetailQueries().catch(console.error)