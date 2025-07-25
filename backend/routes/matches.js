import express from 'express'
import MatchService from '../services/MatchService.js'
import MatchDetail from '../models/MatchDetail.js'
import PlayerStats from '../models/PlayerStats.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.post('/:tournamentId/generate', authenticateToken, async (req, res) => {
  try {
    const { tournamentId } = req.params
    const matches = await MatchService.generateGroupMatches(tournamentId)
    res.json({ matches })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.get('/:tournamentId/matches', authenticateToken, async (req, res) => {
  try {
    const { tournamentId } = req.params
    const matches = await MatchService.getMatches(tournamentId)
    res.json(matches)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.get('/:tournamentId/standings', authenticateToken, async (req, res) => {
  try {
    const { tournamentId } = req.params
    const standings = await MatchService.getStandings(tournamentId)
    res.json(standings)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Test route to verify our routes are registered
router.get('/:tournamentId/test-route', async (req, res) => {
  console.error('🟢 TEST ROUTE HIT!')
  res.json({ message: 'Test route working', tournamentId: req.params.tournamentId })
})


router.post('/:tournamentId/simulate/match/:matchId', async (req, res) => {
  try {
    console.error(`🎯 ROUTE: Group match simulation requested for match ${req.params.matchId} in tournament ${req.params.tournamentId}`)
    console.log(`🎯 ROUTE: Group match simulation requested for match ${req.params.matchId} in tournament ${req.params.tournamentId}`)
    process.stdout.write(`🎯 ROUTE: Group match simulation requested for match ${req.params.matchId} in tournament ${req.params.tournamentId}\n`)
    
    // Write to a file to be absolutely sure
    const fs = await import('fs')
    fs.appendFileSync('/tmp/group-match-debug.log', `${new Date().toISOString()} - ROUTE HIT: ${req.params.matchId}\n`)
    
    const { matchId } = req.params
    const match = await MatchService.simulateMatch(matchId)
    console.error(`🎯 ROUTE: Match simulation completed, returning result`)
    res.json({ match })
  } catch (error) {
    console.error(`🎯 ROUTE: Match simulation failed:`, error)
    res.status(400).json({ error: error.message })
  }
})

router.post('/:tournamentId/simulate/matchday/:matchday', authenticateToken, async (req, res) => {
  try {
    const { tournamentId, matchday } = req.params
    const matches = await MatchService.simulateMatchday(tournamentId, parseInt(matchday))
    res.json({ matches })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Get matches for a specific team
router.get('/:tournamentId/team/:teamId', authenticateToken, async (req, res) => {
  try {
    const { tournamentId, teamId } = req.params
    const matches = await MatchService.getTeamMatches(tournamentId, teamId)
    res.json(matches)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Get detailed match information (lineups, goals, report)
router.get('/detail/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params
    console.log(`MATCH DETAIL API: Looking for match details with ID: ${matchId}`)
    console.log(`MATCH DETAIL API: Match ID type: ${typeof matchId}, length: ${matchId.length}`)
    
    let matchDetail = null
    let queryUsed = 'string'
    
    // Try string query first (for qualification matches)
    matchDetail = await MatchDetail.findOne({ match: matchId })
    console.log(`MATCH DETAIL API: String query result:`, matchDetail ? 'FOUND' : 'NOT FOUND')
    
    if (!matchDetail) {
      // Try as ObjectId if it's a valid ObjectId string (for tournament matches)
      try {
        const mongoose = await import('mongoose')
        if (mongoose.Types.ObjectId.isValid(matchId)) {
          const objectIdQuery = new mongoose.Types.ObjectId(matchId)
          matchDetail = await MatchDetail.findOne({ match: objectIdQuery })
          queryUsed = 'objectId'
          console.log(`MATCH DETAIL API: ObjectId query result:`, matchDetail ? 'FOUND' : 'NOT FOUND')
        }
      } catch (objectIdError) {
        console.log(`MATCH DETAIL API: ObjectId query failed:`, objectIdError.message)
      }
    }
    
    if (matchDetail) {
      // Use the same query type that found the record for populate operations
      try {
        let populateQuery
        if (queryUsed === 'objectId') {
          const mongoose = await import('mongoose')
          populateQuery = { match: new mongoose.Types.ObjectId(matchId) }
        } else {
          populateQuery = { match: matchId }
        }
        
        matchDetail = await MatchDetail.findOne(populateQuery)
          .populate('homeLineup.player awayLineup.player')
          .populate('goals.player goals.assist')
          .populate('substitutions.playerOut substitutions.playerIn')
          .populate('matchReport.manOfTheMatch')
          
        console.log(`MATCH DETAIL API: Populate with ${queryUsed} query successful`)
      } catch (populateError) {
        console.log(`MATCH DETAIL API: Populate failed, returning basic match detail:`, populateError.message)
        // matchDetail already contains the basic record from previous query
      }
    }
    
    console.log(`MATCH DETAIL API: Final result:`, matchDetail ? `FOUND (${matchDetail._id})` : 'NOT FOUND')
    
    if (!matchDetail) {
      return res.status(404).json({ error: 'Match details not found' })
    }
    
    console.log(`MATCH DETAIL API: Found match detail with type: ${matchDetail.matchType}`)
    
    // Only populate match reference for tournament matches
    if (matchDetail.matchType === 'tournament') {
      await matchDetail.populate({
        path: 'match',
        populate: {
          path: 'homeTeam awayTeam',
          model: 'TournamentTeam'
        }
      })
    }
    
    console.log(`MATCH DETAIL API: Sending response`)
    res.json(matchDetail)
  } catch (error) {
    console.error('Error fetching match detail:', error)
    res.status(400).json({ error: error.message })
  }
})

// Get player statistics for tournament/qualification
router.get('/:tournamentId/player-stats/:playerId', authenticateToken, async (req, res) => {
  try {
    const { tournamentId, playerId } = req.params
    const { competitionType = 'tournament' } = req.query
    
    console.log(`PLAYER STATS API: Looking for stats - Player: ${playerId}, Tournament: ${tournamentId}, Type: ${competitionType}`)
    
    // Try to find by tournamentId first
    let stats = await PlayerStats.findOne({
      player: playerId,
      tournamentId: tournamentId,
      competitionType: competitionType
    }).populate('player')
    
    console.log(`PLAYER STATS API: Found by tournamentId:`, !!stats)
    
    // If not found, try to find by worldId (in case it was saved with world context)
    if (!stats) {
      // Get the world ID from the tournament
      const Tournament = await import('../models/Tournament.js').then(m => m.default)
      const tournament = await Tournament.findById(tournamentId)
      
      if (tournament && tournament.world) {
        stats = await PlayerStats.findOne({
          player: playerId,
          worldId: tournament.world,
          competitionType: competitionType
        }).populate('player')
        
        console.log(`PLAYER STATS API: Found by worldId (${tournament.world}):`, !!stats)
      }
    }
    
    // Also try to find all stats for this player for debugging
    const allStats = await PlayerStats.find({ player: playerId })
    console.log(`PLAYER STATS API: Player ${playerId} has ${allStats.length} total stat records`)
    allStats.forEach(stat => {
      console.log(`  - Tournament: ${stat.tournamentId}, World: ${stat.worldId}, Type: ${stat.competitionType}, Goals: ${stat.goals}, Starts: ${stat.matchesStarted}`)
    })
    
    res.json(stats)
  } catch (error) {
    console.error('PLAYER STATS API ERROR:', error)
    res.status(400).json({ error: error.message })
  }
})

// Get top scorers for tournament/qualification
router.get('/:tournamentId/top-scorers', authenticateToken, async (req, res) => {
  try {
    const { tournamentId } = req.params
    const { competitionType = 'tournament', limit = 10 } = req.query
    
    const topScorers = await PlayerStats.find({
      tournamentId: tournamentId,
      competitionType: competitionType,
      goals: { $gt: 0 }
    })
    .populate('player')
    .sort({ goals: -1, assists: -1 })
    .limit(parseInt(limit))
    
    res.json(topScorers)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Get player match history
router.get('/:tournamentId/player/:playerId/matches', authenticateToken, async (req, res) => {
  try {
    const { tournamentId, playerId } = req.params
    const { competitionType = 'tournament' } = req.query
    
    const stats = await PlayerStats.findOne({
      player: playerId,
      tournamentId: tournamentId,
      competitionType: competitionType
    }).populate('matchDetails.match').populate('player')
    
    res.json(stats?.matchDetails || [])
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Debug endpoint to check all player stats
router.get('/:tournamentId/debug/all-player-stats', authenticateToken, async (req, res) => {
  try {
    const { tournamentId } = req.params
    
    console.log('DEBUG: Fetching all player stats for tournament', tournamentId)
    
    // Get all player stats for this tournament
    const statsByTournament = await PlayerStats.find({ tournamentId }).populate('player')
    const statsByWorld = await PlayerStats.find().populate('player')
    
    // Get tournament info
    const Tournament = await import('../models/Tournament.js').then(m => m.default)
    const tournament = await Tournament.findById(tournamentId)
    
    const response = {
      tournamentId,
      tournament: tournament ? {
        name: tournament.name,
        worldId: tournament.world
      } : null,
      statsByTournamentId: statsByTournament.length,
      statsByWorldId: tournament ? (await PlayerStats.find({ worldId: tournament.world }).populate('player')).length : 0,
      totalPlayerStats: statsByWorld.length,
      sampleStats: statsByTournament.slice(0, 5).map(stat => ({
        player: stat.player?.displayName || 'Unknown',
        playerId: stat.player?._id,
        tournamentId: stat.tournamentId,
        worldId: stat.worldId,
        competitionType: stat.competitionType,
        goals: stat.goals,
        matchesStarted: stat.matchesStarted,
        matchesPlayed: stat.matchesPlayed
      }))
    }
    
    console.log('DEBUG: Player stats summary:', response)
    res.json(response)
  } catch (error) {
    console.error('DEBUG ERROR:', error)
    res.status(400).json({ error: error.message })
  }
})

export default router