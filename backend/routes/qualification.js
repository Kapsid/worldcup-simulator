import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { confederations } from '../data/confederations.js'
import QualificationService from '../services/QualificationService.js'
import Qualification from '../models/Qualification.js'

const router = express.Router()

// Get all confederations data
router.get('/confederations', (req, res) => {
  try {
    res.json(confederations)
  } catch (error) {
    console.error('Error getting confederations:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get qualification status for a tournament
router.get('/:tournamentId', authenticateToken, async (req, res) => {
  try {
    const { tournamentId } = req.params
    
    // Get actual qualification data from database
    const qualificationData = await QualificationService.getQualificationData(tournamentId)
    
    if (!qualificationData) {
      // Return basic structure if no qualification started yet
      const qualificationStatus = {
        tournamentId,
        started: false,
        completed: false,
        qualifiedTeams: [],
        completedMatchdays: 0,
        confederationStatus: confederations.map(conf => ({
          confederationId: conf.id,
          name: conf.name,
          started: false,
          completed: false,
          qualifiedTeams: [],
          currentRound: 1,
          totalRounds: getConfederationTotalRounds(conf.id)
        }))
      }
      return res.json(qualificationStatus)
    }
    
    res.json(qualificationData)
  } catch (error) {
    console.error('Error getting qualification status:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Start qualification for a tournament
router.post('/:tournamentId/start', authenticateToken, async (req, res) => {
  try {
    const { tournamentId } = req.params
    
    console.log(`Starting qualification for tournament ${tournamentId}`)
    
    // Use QualificationService to actually start qualification
    const qualificationData = await QualificationService.startQualification(tournamentId)
    
    res.json({
      success: true,
      message: 'Qualification started successfully',
      qualification: qualificationData
    })
  } catch (error) {
    console.error('Error starting qualification:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

// Simulate next matchday for all confederations
router.post('/:tournamentId/simulate-matchday', authenticateToken, async (req, res) => {
  try {
    const { tournamentId } = req.params
    
    console.log(`Simulating matchday for tournament ${tournamentId}`)
    
    // Use QualificationService to simulate matchday
    const result = await QualificationService.simulateNextMatchday(tournamentId)
    
    res.json({
      success: true,
      message: 'Matchday simulated successfully',
      matchesPlayed: result.matchesPlayed,
      currentMatchday: result.currentMatchday
    })
  } catch (error) {
    console.error('Error simulating matchday:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

// Simulate next matchday for a specific confederation
router.post('/:tournamentId/simulate-confederation-matchday/:confederationId', authenticateToken, async (req, res) => {
  try {
    const { tournamentId, confederationId } = req.params
    
    console.log(`Simulating next matchday for confederation ${confederationId} in tournament ${tournamentId}`)
    
    const result = await QualificationService.simulateNextMatchdayForConfederation(tournamentId, confederationId)
    
    res.json({
      success: true,
      message: `Next matchday simulated successfully for ${result.confederationName}`,
      matchesPlayed: result.matchesPlayed,
      confederationId: result.confederationId,
      confederationName: result.confederationName,
      matchday: result.matchday
    })
  } catch (error) {
    console.error('Error simulating confederation matchday:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

// Simulate specific matchday for a specific confederation
router.post('/:tournamentId/simulate-matchday/:confederationId/:matchday', authenticateToken, async (req, res) => {
  try {
    const { tournamentId, confederationId, matchday } = req.params
    
    console.log(`Simulating matchday ${matchday} for confederation ${confederationId} in tournament ${tournamentId}`)
    
    const result = await QualificationService.simulateSpecificMatchday(tournamentId, confederationId, parseInt(matchday))
    
    res.json({
      success: true,
      message: `Matchday ${matchday} simulated successfully for ${result.confederationName}`,
      matchesPlayed: result.matchesPlayed,
      confederationId: result.confederationId,
      confederationName: result.confederationName,
      matchday: result.matchday
    })
  } catch (error) {
    console.error('Error simulating specific matchday:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

// Simulate individual match
router.post('/:tournamentId/simulate-match', authenticateToken, async (req, res) => {
  console.error(`🔥 ROUTE HIT: /api/qualification/${req.params.tournamentId}/simulate-match`)
  console.error(`🔥 ROUTE BODY:`, req.body)
  console.error(`🔥 ROUTE PARAMS:`, req.params)
  
  // Write to file to confirm route is hit
  const fs = await import('fs')
  let logMessage = `${new Date().toISOString()} - Route hit: ${req.params.tournamentId}/simulate-match - Body: ${JSON.stringify(req.body)}\n`
  fs.appendFileSync('/tmp/backend-debug.log', logMessage)
  try {
    const { tournamentId } = req.params
    const { matchId } = req.body
    
    // Check player stats count BEFORE simulation
    const PlayerStats = await import('../models/PlayerStats.js').then(m => m.default)
    const statsCountBefore = await PlayerStats.countDocuments({})
    console.error(`🔢 ROUTE: PlayerStats BEFORE simulation: ${statsCountBefore}`)
    
    if (!matchId) {
      return res.status(400).json({ error: 'Match ID is required' })
    }
    
    console.error(`QUALIFICATION ROUTE: Simulating individual match ${matchId} for tournament ${tournamentId}`)
    
    logMessage = `  -> About to call QualificationService.simulateIndividualMatch\n`
    fs.appendFileSync('/tmp/backend-debug.log', logMessage)
    
    const result = await QualificationService.simulateIndividualMatch(tournamentId, matchId)
    
    logMessage = `  -> QualificationService.simulateIndividualMatch completed\n`
    fs.appendFileSync('/tmp/backend-debug.log', logMessage)
    console.error(`QUALIFICATION ROUTE: Individual match simulation completed for ${matchId}`)
    
    // Check if player stats were created AFTER simulation
    const statsCountAfter = await PlayerStats.countDocuments({})
    console.error(`🔢 ROUTE: PlayerStats AFTER simulation: ${statsCountAfter}`)
    const newStatsCreated = statsCountAfter - statsCountBefore
    console.error(`🔢 ROUTE: New PlayerStats created: ${newStatsCreated}`)
    
    // Write stats info to file
    logMessage = `  -> PlayerStats BEFORE: ${statsCountBefore}, AFTER: ${statsCountAfter}, NEW: ${newStatsCreated}\n`
    fs.appendFileSync('/tmp/backend-debug.log', logMessage)
    
    res.json({
      success: true,
      message: `Match simulated successfully - ROUTE WAS HIT AT ${Date.now()}`,
      match: result.match,
      debug: {
        routeHit: true,
        timestamp: new Date().toISOString(),
        matchId: matchId,
        tournamentId: tournamentId,
        playerStatsBefore: statsCountBefore,
        playerStatsAfter: statsCountAfter,
        newStatsCreated: newStatsCreated
      }
    })
  } catch (error) {
    console.error('Error simulating individual match:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

// Simulate all matches for a confederation
router.post('/:tournamentId/simulate-confederation/:confederationId', authenticateToken, async (req, res) => {
  try {
    const { tournamentId, confederationId } = req.params
    
    console.log(`Simulating all matches for confederation ${confederationId} in tournament ${tournamentId}`)
    
    const result = await QualificationService.simulateAllConfederationMatches(tournamentId, confederationId)
    
    res.json({
      success: true,
      message: `All matches simulated successfully for ${result.confederationName}`,
      matchesPlayed: result.matchesPlayed,
      confederationId: result.confederationId,
      confederationName: result.confederationName,
      completed: result.completed
    })
  } catch (error) {
    console.error('Error simulating all confederation matches:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

// Regenerate qualification
router.post('/:tournamentId/regenerate', authenticateToken, async (req, res) => {
  try {
    const { tournamentId } = req.params
    
    console.log(`Regenerating qualification for tournament ${tournamentId}`)
    
    const qualificationData = await QualificationService.regenerateQualification(tournamentId)
    
    res.json({
      success: true,
      message: 'Qualification regenerated successfully',
      qualification: qualificationData
    })
  } catch (error) {
    console.error('Error regenerating qualification:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

// Finalize qualification and determine final qualified teams
router.post('/:tournamentId/finalize', authenticateToken, async (req, res) => {
  try {
    const { tournamentId } = req.params
    
    console.log(`🎯 FINALIZE REQUEST RECEIVED for tournament ${tournamentId}`)
    
    // First, let's update the qualification status to ensure it's current
    const qualification = await QualificationService.getQualificationData(tournamentId)
    if (!qualification) {
      console.log('❌ No qualification found')
      return res.status(404).json({ error: 'Qualification not found' })
    }
    
    console.log('📊 Qualification status before finalization:', {
      started: qualification.started,
      completed: qualification.completed,
      confederationCount: qualification.confederations.length,
      confederationStatus: qualification.confederations.map(c => ({
        id: c.confederationId,
        completed: c.completed,
        matches: `${c.matches?.filter(m => m.played).length || 0}/${c.matches?.length || 0}`,
        qualified: c.qualifiedTeams?.length || 0
      }))
    })
    
    const result = await QualificationService.finalizeQualification(tournamentId)
    
    res.json({
      success: true,
      message: 'Qualification finalized successfully',
      qualifiedTeams: result.qualifiedTeams,
      totalQualified: result.totalQualified,
      readyForTournament: result.readyForTournament
    })
  } catch (error) {
    console.error('❌ ERROR finalizing qualification:', error.message)
    console.error('Full error:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

// Debug route to check qualification status
router.get('/:tournamentId/debug-status', authenticateToken, async (req, res) => {
  try {
    const { tournamentId } = req.params
    const qualification = await Qualification.findOne({ tournament: tournamentId })
    
    if (!qualification) {
      return res.json({ error: 'No qualification found' })
    }

    const status = {
      tournament: tournamentId,
      started: qualification.started,
      completed: qualification.completed,
      confederations: qualification.confederations.map(conf => ({
        id: conf.confederationId,
        completed: conf.completed,
        totalMatches: conf.matches?.length || 0,
        playedMatches: conf.matches?.filter(m => m.played).length || 0,
        qualifiedTeams: conf.qualifiedTeams?.length || 0,
        qualifiedTeamNames: conf.qualifiedTeams?.map(t => t.name || t.country) || [],
        groups: conf.groups?.length || 0
      })),
      allComplete: qualification.confederations.every(conf => conf.completed)
    }

    res.json(status)
  } catch (error) {
    console.error('Error getting debug status:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get confederation-specific qualification data
router.get('/:tournamentId/confederation/:confederationId', authenticateToken, async (req, res) => {
  try {
    const { tournamentId, confederationId } = req.params
    
    const confederation = confederations.find(conf => conf.id === confederationId)
    if (!confederation) {
      return res.status(404).json({ error: 'Confederation not found' })
    }
    
    // TODO: Return actual confederation qualification data
    const confederationData = {
      confederation,
      groups: [],
      matches: [],
      standings: [],
      qualifiedTeams: [],
      currentRound: 1,
      totalRounds: getConfederationTotalRounds(confederationId)
    }
    
    res.json(confederationData)
  } catch (error) {
    console.error('Error getting confederation qualification data:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Helper function to determine total rounds for a confederation
function getConfederationTotalRounds(confederationId) {
  const confederation = confederations.find(conf => conf.id === confederationId)
  if (!confederation) return 1
  
  switch (confederation.format) {
    case 'groups_and_playoffs':
      return 2 // Group stage + playoffs
    case 'round_robin':
      return 1 // Single league
    case 'multiple_rounds':
      return Object.keys(confederation.structure).length
    default:
      return 1
  }
}

// Simulate playoff match (OFC, CAF, AFC)
router.post('/:tournamentId/simulate-playoff', authenticateToken, async (req, res) => {
  try {
    const { tournamentId } = req.params
    const { matchId } = req.body
    
    if (!matchId) {
      return res.status(400).json({ error: 'Match ID is required' })
    }
    
    console.log(`Simulating playoff match ${matchId} for tournament ${tournamentId}`)
    
    const result = await QualificationService.simulatePlayoffMatch(tournamentId, matchId)
    
    res.json({
      success: true,
      message: 'Playoff match simulated successfully',
      match: result.match,
      updated: result.updated
    })
  } catch (error) {
    console.error('Error simulating playoff match:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

// Legacy OFC playoff route for backward compatibility
router.post('/:tournamentId/simulate-ofc-playoff', authenticateToken, async (req, res) => {
  // Redirect to generic playoff endpoint
  return res.redirect(307, `/${req.params.tournamentId}/simulate-playoff`)
})

// Get top scorers by confederation in qualification
router.get('/:tournamentId/top-scorers/:confederationId', authenticateToken, async (req, res) => {
  try {
    const { tournamentId, confederationId } = req.params
    const { limit = 20 } = req.query
    
    // Import PlayerStats model
    const PlayerStats = await import('../models/PlayerStats.js').then(m => m.default)
    const Player = await import('../models/Player.js').then(m => m.default)
    
    // Get all qualification stats for this tournament
    const playerStats = await PlayerStats.find({
      $or: [
        { tournamentId: tournamentId },
        { worldId: { $exists: true } } // Include worldId queries for broader coverage
      ],
      competitionType: 'qualification',
      goals: { $gt: 0 } // Only players who scored
    })
    .populate('player')
    .sort({ goals: -1, matchesStarted: -1 })
    .limit(parseInt(limit) * 6) // Get more to filter by confederation
    
    // Filter by confederation and get player details
    const confederationTopScorers = []
    
    for (const stats of playerStats) {
      if (!stats.player) continue
      
      // Get full player details to check nationality/confederation
      const fullPlayer = await Player.findById(stats.player._id)
      if (!fullPlayer) continue
      
      // Determine confederation from player nationality or teamId
      const playerConfederation = getPlayerConfederation(fullPlayer)
      
      if (playerConfederation === confederationId.toUpperCase()) {
        confederationTopScorers.push({
          player: {
            _id: fullPlayer._id,
            displayName: fullPlayer.displayName,
            nationality: fullPlayer.nationality,
            position: fullPlayer.position,
            teamId: fullPlayer.teamId
          },
          goals: stats.goals,
          matchesStarted: stats.matchesStarted,
          matchesPlayed: stats.matchesPlayed,
          goalsPerGame: stats.matchesPlayed > 0 ? (stats.goals / stats.matchesPlayed).toFixed(2) : 0
        })
        
        if (confederationTopScorers.length >= parseInt(limit)) break
      }
    }
    
    res.json(confederationTopScorers)
  } catch (error) {
    console.error('Error fetching confederation top scorers:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get all confederation top scorers for tournament
router.get('/:tournamentId/all-confederation-top-scorers', authenticateToken, async (req, res) => {
  try {
    const { tournamentId } = req.params
    const { limit = 20 } = req.query
    
    const confederations = ['UEFA', 'CONMEBOL', 'CONCACAF', 'AFC', 'CAF', 'OFC']
    const allConfederationStats = {}
    
    // Get top scorers for each confederation
    for (const confederation of confederations) {
      const response = await fetch(`http://localhost:3001/api/qualification/${tournamentId}/top-scorers/${confederation.toLowerCase()}?limit=${limit}`, {
        headers: { 'Authorization': req.headers.authorization }
      })
      
      if (response.ok) {
        allConfederationStats[confederation] = await response.json()
      } else {
        allConfederationStats[confederation] = []
      }
    }
    
    res.json(allConfederationStats)
  } catch (error) {
    console.error('Error fetching all confederation top scorers:', error)
    res.status(500).json({ error: error.message })
  }
})

// Helper function to determine confederation from player
function getPlayerConfederation(player) {
  // Map common country codes to confederations
  const confederationMap = {
    // UEFA - Europe
    'GER': 'UEFA', 'FRA': 'UEFA', 'ESP': 'UEFA', 'ITA': 'UEFA', 'ENG': 'UEFA', 
    'NED': 'UEFA', 'POR': 'UEFA', 'BEL': 'UEFA', 'POL': 'UEFA', 'CRO': 'UEFA',
    'UKR': 'UEFA', 'AUT': 'UEFA', 'CZE': 'UEFA', 'DEN': 'UEFA', 'SWE': 'UEFA',
    'NOR': 'UEFA', 'FIN': 'UEFA', 'SUI': 'UEFA', 'SCO': 'UEFA', 'IRL': 'UEFA',
    'WAL': 'UEFA', 'HUN': 'UEFA', 'SVK': 'UEFA', 'SVN': 'UEFA', 'SRB': 'UEFA',
    'BIH': 'UEFA', 'MNE': 'UEFA', 'MKD': 'UEFA', 'ALB': 'UEFA', 'KOS': 'UEFA',
    'BUL': 'UEFA', 'ROU': 'UEFA', 'GRE': 'UEFA', 'TUR': 'UEFA', 'CYP': 'UEFA',
    'MLT': 'UEFA', 'ISL': 'UEFA', 'EST': 'UEFA', 'LVA': 'UEFA', 'LTU': 'UEFA',
    'BLR': 'UEFA', 'MDA': 'UEFA', 'GEO': 'UEFA', 'ARM': 'UEFA', 'AZE': 'UEFA',
    'RUS': 'UEFA',
    
    // CONMEBOL - South America  
    'BRA': 'CONMEBOL', 'ARG': 'CONMEBOL', 'URU': 'CONMEBOL', 'COL': 'CONMEBOL',
    'CHI': 'CONMEBOL', 'PER': 'CONMEBOL', 'ECU': 'CONMEBOL', 'PAR': 'CONMEBOL',
    'BOL': 'CONMEBOL', 'VEN': 'CONMEBOL',
    
    // CONCACAF - North/Central America & Caribbean
    'USA': 'CONCACAF', 'MEX': 'CONCACAF', 'CAN': 'CONCACAF', 'CRC': 'CONCACAF',
    'PAN': 'CONCACAF', 'HON': 'CONCACAF', 'SLV': 'CONCACAF', 'GTM': 'CONCACAF',
    'NIC': 'CONCACAF', 'BLZ': 'CONCACAF', 'JAM': 'CONCACAF', 'CUB': 'CONCACAF',
    'HAI': 'CONCACAF', 'DOM': 'CONCACAF', 'TRI': 'CONCACAF', 'SKN': 'CONCACAF',
    'LCA': 'CONCACAF', 'VIN': 'CONCACAF', 'GRN': 'CONCACAF', 'BRB': 'CONCACAF',
    'ATG': 'CONCACAF', 'DMA': 'CONCACAF', 'TCA': 'CONCACAF', 'MSR': 'CONCACAF',
    
    // AFC - Asia
    'JPN': 'AFC', 'KOR': 'AFC', 'IRN': 'AFC', 'AUS': 'AFC', 'SAU': 'AFC',
    'QAT': 'AFC', 'UAE': 'AFC', 'IRQ': 'AFC', 'UZB': 'AFC', 'KGZ': 'AFC',
    'TJK': 'AFC', 'JOR': 'AFC', 'LBN': 'AFC', 'SYR': 'AFC', 'PAL': 'AFC',
    'OMN': 'AFC', 'BHR': 'AFC', 'KWT': 'AFC', 'YEM': 'AFC', 'IDN': 'AFC',
    'THA': 'AFC', 'VIE': 'AFC', 'MAS': 'AFC', 'SIN': 'AFC', 'PHI': 'AFC',
    'MYA': 'AFC', 'CAM': 'AFC', 'LAO': 'AFC', 'BRU': 'AFC', 'TLS': 'AFC',
    'IND': 'AFC', 'AFG': 'AFC', 'BAN': 'AFC', 'BHU': 'AFC', 'MDV': 'AFC',
    'NEP': 'AFC', 'SRI': 'AFC', 'PAK': 'AFC', 'HKG': 'AFC', 'MAC': 'AFC',
    'TPE': 'AFC', 'CHN': 'AFC', 'PRK': 'AFC', 'MNG': 'AFC', 'GUM': 'AFC',
    
    // CAF - Africa
    'NGA': 'CAF', 'SEN': 'CAF', 'MAR': 'CAF', 'TUN': 'CAF', 'ALG': 'CAF',
    'EGY': 'CAF', 'CMR': 'CAF', 'GHA': 'CAF', 'CIV': 'CAF', 'MLI': 'CAF',
    'BFA': 'CAF', 'GAB': 'CAF', 'CGO': 'CAF', 'ZAM': 'CAF', 'ZIM': 'CAF',
    'RSA': 'CAF', 'KEN': 'CAF', 'UGA': 'CAF', 'TAN': 'CAF', 'ETH': 'CAF',
    'ANG': 'CAF', 'MOZ': 'CAF', 'MAD': 'CAF', 'COM': 'CAF', 'MRI': 'CAF',
    'SEY': 'CAF', 'LBR': 'CAF', 'SLE': 'CAF', 'GUI': 'CAF', 'CPV': 'CAF',
    'GAM': 'CAF', 'GNB': 'CAF', 'EQG': 'CAF', 'CHA': 'CAF', 'CTA': 'CAF',
    'SUD': 'CAF', 'SSD': 'CAF', 'ERI': 'CAF', 'DJI': 'CAF', 'SOM': 'CAF',
    'RWA': 'CAF', 'BDI': 'CAF', 'COD': 'CAF', 'TOG': 'CAF', 'BEN': 'CAF',
    'NIG': 'CAF', 'MWI': 'CAF', 'SWZ': 'CAF', 'LES': 'CAF', 'BOT': 'CAF',
    'NAM': 'CAF', 'LBY': 'CAF',
    
    // OFC - Oceania
    'NZL': 'OFC', 'NCL': 'OFC', 'TAH': 'OFC', 'FIJ': 'OFC', 'PNG': 'OFC',
    'SOL': 'OFC', 'VAN': 'OFC', 'SAM': 'OFC', 'COK': 'OFC', 'TGA': 'OFC',
    'ASA': 'OFC'
  }
  
  const nationality = player.nationality || player.teamId
  return confederationMap[nationality] || 'UNKNOWN'
}

export default router