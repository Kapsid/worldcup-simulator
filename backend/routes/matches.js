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

router.post('/:tournamentId/simulate/match/:matchId', authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params
    const match = await MatchService.simulateMatch(matchId)
    res.json({ match })
  } catch (error) {
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
router.get('/detail/:matchId', authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params
    console.log(`MATCH DETAIL API: Looking for match details with ID: ${matchId}`)
    
    const matchDetail = await MatchDetail.findOne({ match: matchId })
      .populate('homeLineup.player awayLineup.player')
      .populate('goals.player goals.assist')
      .populate('substitutions.playerOut substitutions.playerIn')
      .populate('matchReport.manOfTheMatch')
    
    console.log(`MATCH DETAIL API: Query result:`, matchDetail ? `FOUND (${matchDetail._id})` : 'NOT FOUND')
    
    if (!matchDetail) {
      // Let's also try to find any MatchDetail documents to see what exists
      const allMatchDetails = await MatchDetail.find({}).limit(5)
      console.log(`MATCH DETAIL API: Available match details in DB:`, allMatchDetails.map(md => ({ 
        id: md._id, 
        match: md.match, 
        matchType: md.matchType 
      })))
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