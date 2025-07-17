import express from 'express'
import TeamManagementService from '../services/TeamManagementService.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Get teams for a tournament
router.get('/:tournamentId', authenticateToken, async (req, res) => {
  try {
    const teams = await TeamManagementService.getTeamsForTournament(
      req.params.tournamentId, 
      req.user.userId
    )
    res.json(teams)
  } catch (error) {
    console.error('Error getting teams:', error)
    if (error.message === 'Tournament not found') {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get tournament team statistics
router.get('/:tournamentId/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await TeamManagementService.getTournamentTeamStats(
      req.params.tournamentId, 
      req.user.userId
    )
    res.json(stats)
  } catch (error) {
    console.error('Error getting team stats:', error)
    if (error.message === 'Tournament not found') {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Add team to tournament
router.post('/:tournamentId/add', authenticateToken, async (req, res) => {
  try {
    const { countryCode } = req.body

    if (!countryCode) {
      return res.status(400).json({ error: 'Country code is required' })
    }

    const team = await TeamManagementService.addTeamToTournament(
      req.params.tournamentId,
      req.user.userId,
      countryCode
    )

    res.status(201).json({
      team,
      message: 'Team added successfully'
    })
  } catch (error) {
    console.error('Error adding team:', error)
    if (error.message === 'Tournament not found') {
      return res.status(404).json({ error: error.message })
    }
    if (error.message === 'Team already added to tournament' || 
        error.message === 'Maximum number of teams reached' ||
        error.message === 'Cannot modify teams in an active tournament' ||
        error.message === 'Invalid country code') {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Remove team from tournament
router.delete('/:tournamentId/remove/:countryCode', authenticateToken, async (req, res) => {
  try {
    const result = await TeamManagementService.removeTeamFromTournament(
      req.params.tournamentId,
      req.user.userId,
      req.params.countryCode
    )

    res.json({
      message: 'Team removed successfully'
    })
  } catch (error) {
    console.error('Error removing team:', error)
    if (error.message === 'Tournament not found') {
      return res.status(404).json({ error: error.message })
    }
    if (error.message === 'Team not found in tournament' ||
        error.message === 'Cannot modify teams in an active tournament') {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Auto-fill with best 31 teams plus host
router.post('/:tournamentId/auto-fill', authenticateToken, async (req, res) => {
  try {
    const teams = await TeamManagementService.autoFillBest31PlusHost(
      req.params.tournamentId,
      req.user.userId
    )

    res.json({
      teams,
      message: 'Tournament auto-filled with best 31 teams plus host'
    })
  } catch (error) {
    console.error('Error auto-filling teams:', error)
    if (error.message === 'Tournament not found') {
      return res.status(404).json({ error: error.message })
    }
    if (error.message === 'Cannot modify teams in an active tournament') {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Clear all teams
router.delete('/:tournamentId/clear', authenticateToken, async (req, res) => {
  try {
    const result = await TeamManagementService.clearAllTeams(
      req.params.tournamentId,
      req.user.userId
    )

    res.json(result)
  } catch (error) {
    console.error('Error clearing teams:', error)
    if (error.message === 'Tournament not found') {
      return res.status(404).json({ error: error.message })
    }
    if (error.message === 'Cannot modify teams in an active tournament') {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get specific team details
router.get('/:tournamentId/:teamId', authenticateToken, async (req, res) => {
  try {
    const team = await TeamManagementService.getTeamDetails(
      req.params.tournamentId,
      req.params.teamId,
      req.user.userId
    )
    res.json(team)
  } catch (error) {
    console.error('Error getting team details:', error)
    if (error.message === 'Tournament not found' || error.message === 'Team not found') {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router