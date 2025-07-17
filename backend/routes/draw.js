import express from 'express'
import DrawService from '../services/DrawService.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Generate pots for tournament
router.post('/:tournamentId/pots/generate', authenticateToken, async (req, res) => {
  try {
    const pots = await DrawService.generatePots(req.params.tournamentId, req.user.userId)
    res.json({
      pots,
      message: 'Pots generated successfully'
    })
  } catch (error) {
    console.error('Error generating pots:', error)
    if (error.message === 'Tournament not found') {
      return res.status(404).json({ error: error.message })
    }
    if (error.message === 'Tournament must have exactly 32 teams to generate pots' ||
        error.message === 'Tournament must be active to generate pots') {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get pots for tournament
router.get('/:tournamentId/pots', authenticateToken, async (req, res) => {
  try {
    const pots = await DrawService.getPots(req.params.tournamentId, req.user.userId)
    res.json(pots)
  } catch (error) {
    console.error('Error getting pots:', error)
    if (error.message === 'Tournament not found') {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Initialize groups for tournament
router.post('/:tournamentId/groups/initialize', authenticateToken, async (req, res) => {
  try {
    const groups = await DrawService.initializeGroups(req.params.tournamentId, req.user.userId)
    res.json({
      groups,
      message: 'Groups initialized successfully'
    })
  } catch (error) {
    console.error('Error initializing groups:', error)
    if (error.message === 'Tournament not found') {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get groups for tournament
router.get('/:tournamentId/groups', authenticateToken, async (req, res) => {
  try {
    const groups = await DrawService.getGroups(req.params.tournamentId, req.user.userId)
    res.json(groups)
  } catch (error) {
    console.error('Error getting groups:', error)
    if (error.message === 'Tournament not found') {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Draw all teams at once
router.post('/:tournamentId/draw/all', authenticateToken, async (req, res) => {
  try {
    const groups = await DrawService.drawAllTeams(req.params.tournamentId, req.user.userId)
    res.json({
      groups,
      message: 'All teams drawn successfully'
    })
  } catch (error) {
    console.error('Error drawing all teams:', error)
    if (error.message === 'Tournament not found') {
      return res.status(404).json({ error: error.message })
    }
    if (error.message === 'No pots found. Generate pots first.') {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Draw teams from specific pot
router.post('/:tournamentId/draw/pot/:potNumber', authenticateToken, async (req, res) => {
  try {
    const potNumber = parseInt(req.params.potNumber)
    if (isNaN(potNumber) || potNumber < 1 || potNumber > 4) {
      return res.status(400).json({ error: 'Invalid pot number. Must be between 1 and 4.' })
    }

    const groups = await DrawService.drawPot(req.params.tournamentId, req.user.userId, potNumber)
    res.json({
      groups,
      message: `Pot ${potNumber} drawn successfully`
    })
  } catch (error) {
    console.error('Error drawing pot:', error)
    if (error.message === 'Tournament not found') {
      return res.status(404).json({ error: error.message })
    }
    if (error.message === 'Pot not found' ||
        error.message === 'All teams from this pot have already been drawn') {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})


// Draw single team to specific group
router.post('/:tournamentId/draw/team', authenticateToken, async (req, res) => {
  try {
    const { teamId, groupLetter } = req.body

    if (!teamId || !groupLetter) {
      return res.status(400).json({ error: 'Team ID and group letter are required' })
    }

    const groups = await DrawService.drawSingleTeam(
      req.params.tournamentId,
      req.user.userId,
      teamId,
      groupLetter
    )
    res.json({
      groups,
      message: `Team drawn to Group ${groupLetter.toUpperCase()} successfully`
    })
  } catch (error) {
    console.error('Error drawing single team:', error)
    if (error.message === 'Tournament not found') {
      return res.status(404).json({ error: error.message })
    }
    if (error.message === 'Team not found in tournament' ||
        error.message === 'Group not found' ||
        error.message === 'Team is already assigned to a group' ||
        error.message === 'Group is already full') {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Clear draw (remove all team assignments from groups)
router.delete('/:tournamentId/draw/clear', authenticateToken, async (req, res) => {
  try {
    const groups = await DrawService.clearDraw(req.params.tournamentId, req.user.userId)
    res.json({
      groups,
      message: 'Draw cleared successfully'
    })
  } catch (error) {
    console.error('Error clearing draw:', error)
    if (error.message === 'Tournament not found') {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router