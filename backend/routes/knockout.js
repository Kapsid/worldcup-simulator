import express from 'express'
import KnockoutService from '../services/KnockoutService.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.post('/:tournamentId/generate', authenticateToken, async (req, res) => {
  try {
    const { tournamentId } = req.params
    const bracket = await KnockoutService.generateKnockoutBracket(tournamentId)
    res.json({ bracket })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.get('/:tournamentId/bracket', authenticateToken, async (req, res) => {
  try {
    const { tournamentId } = req.params
    const bracket = await KnockoutService.getKnockoutBracket(tournamentId)
    res.json(bracket)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.post('/:tournamentId/simulate/match/:matchId', async (req, res) => {
  try {
    console.error(`🚨 KNOCKOUT ROUTE HIT: ${req.params.tournamentId}/simulate/match/${req.params.matchId}`)
    const { matchId, tournamentId } = req.params
    
    // First simulate the basic knockout match 
    const match = await KnockoutService.simulateKnockoutMatch(matchId)
    
    // Now run enhanced simulation to create detailed match data
    try {
      console.error('🚨 KNOCKOUT SIM: Starting enhanced simulation')
      console.error('🚨 KNOCKOUT SIM: Match data before enhancement:', {
        matchId: match._id,
        homeTeam: {
          countryCode: match.homeTeam.countryCode,
          countryName: match.homeTeam.countryName,
          name: match.homeTeam.name,
          teamId: match.homeTeam._id
        },
        awayTeam: {
          countryCode: match.awayTeam.countryCode,
          countryName: match.awayTeam.countryName,
          name: match.awayTeam.name,
          teamId: match.awayTeam._id
        }
      })
      
      // Import BasicEnhancedMatchService
      const BasicEnhancedMatchService = (await import('../services/BasicEnhancedMatchService.js')).default
      const Tournament = (await import('../models/Tournament.js')).default
      
      // Get tournament and world info
      const tournament = await Tournament.findById(tournamentId)
      const world = tournament?.world ? { _id: tournament.world } : null
      console.error('🚨 KNOCKOUT SIM: World context:', world)
      
      // Create a properly structured match object for enhanced simulation
      const enhancedMatch = {
        _id: match._id,
        tournament: tournamentId,
        homeTeam: {
          countryCode: match.homeTeam.countryCode,
          name: match.homeTeam.countryName || match.homeTeam.name,
          code: match.homeTeam.countryCode
        },
        awayTeam: {
          countryCode: match.awayTeam.countryCode,
          name: match.awayTeam.countryName || match.awayTeam.name,
          code: match.awayTeam.countryCode
        },
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        status: 'completed',
        city: match.city
      }
      
      await BasicEnhancedMatchService.simulateBasicMatchDetails(enhancedMatch, 'tournament', world)
      console.error(`🚨 KNOCKOUT SIM: Enhanced simulation completed for match ${matchId}`)
    } catch (enhancedError) {
      console.error('🚨 KNOCKOUT SIM: Enhanced simulation failed:', enhancedError.message)
      console.error('🚨 KNOCKOUT SIM: Full error stack:', enhancedError.stack)
      console.error('🚨 KNOCKOUT SIM: Enhanced match object:', JSON.stringify(enhancedMatch, null, 2))
      // Continue even if enhanced simulation fails
    }
    
    res.json({ match })
  } catch (error) {
    console.error(`🚨 KNOCKOUT ROUTE ERROR:`, error)
    res.status(400).json({ error: error.message })
  }
})

router.post('/:tournamentId/simulate/round/:round', authenticateToken, async (req, res) => {
  try {
    const { tournamentId, round } = req.params
    const matches = await KnockoutService.simulateRound(tournamentId, round)
    res.json({ matches })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.get('/:tournamentId/results', authenticateToken, async (req, res) => {
  try {
    const { tournamentId } = req.params
    const results = await KnockoutService.getFinalResults(tournamentId)
    res.json(results)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.post('/:tournamentId/fix', authenticateToken, async (req, res) => {
  try {
    const { tournamentId } = req.params
    await KnockoutService.fixExistingBracket(tournamentId)
    const bracket = await KnockoutService.getKnockoutBracket(tournamentId)
    res.json({ message: 'Bracket fixed successfully', bracket })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

export default router