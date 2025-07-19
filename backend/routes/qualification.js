import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { confederations } from '../data/confederations.js'
import QualificationService from '../services/QualificationService.js'

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

// Simulate individual match
router.post('/:tournamentId/simulate-match', authenticateToken, async (req, res) => {
  try {
    const { tournamentId } = req.params
    const { matchId } = req.body
    
    if (!matchId) {
      return res.status(400).json({ error: 'Match ID is required' })
    }
    
    console.log(`Simulating individual match ${matchId} for tournament ${tournamentId}`)
    
    const result = await QualificationService.simulateIndividualMatch(tournamentId, matchId)
    
    res.json({
      success: true,
      message: 'Match simulated successfully',
      match: result.match
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

// Simulate OFC playoff match
router.post('/:tournamentId/simulate-ofc-playoff', authenticateToken, async (req, res) => {
  try {
    const { tournamentId } = req.params
    const { matchId } = req.body
    
    if (!matchId) {
      return res.status(400).json({ error: 'Match ID is required' })
    }
    
    console.log(`Simulating OFC playoff match ${matchId} for tournament ${tournamentId}`)
    
    const result = await QualificationService.simulateOFCPlayoffMatch(tournamentId, matchId)
    
    res.json({
      success: true,
      message: 'OFC playoff match simulated successfully',
      match: result.match,
      updated: result.updated
    })
  } catch (error) {
    console.error('Error simulating OFC playoff match:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

export default router