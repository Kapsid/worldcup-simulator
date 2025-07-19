import express from 'express'
import TournamentService from '../services/TournamentService.js'
import { authenticateToken } from '../middleware/auth.js'
import { countries } from '../data/countries.js'

const router = express.Router()

// Get all countries for host selection
router.get('/countries', (req, res) => {
  try {
    res.json(countries)
  } catch (error) {
    console.error('Error getting countries:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get all tournaments for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const tournaments = await TournamentService.getTournamentsByUser(req.user.userId)
    res.json(tournaments)
  } catch (error) {
    console.error('Error getting tournaments:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get last opened tournament for the authenticated user
router.get('/last-opened', authenticateToken, async (req, res) => {
  try {
    const tournament = await TournamentService.getLastOpenedTournament(req.user.userId)
    res.json(tournament)
  } catch (error) {
    console.error('Error getting last opened tournament:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get specific tournament by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const tournament = await TournamentService.getTournamentById(req.params.id, req.user.userId)
    
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' })
    }

    res.json(tournament)
  } catch (error) {
    console.error('Error getting tournament:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create new tournament
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, hostCountry, hostCountryCode, type, worldId, year } = req.body

    // Validation
    if (!name || !hostCountry || !hostCountryCode || !type) {
      return res.status(400).json({ error: 'Name, host country, host country code, and type are required' })
    }
    
    if (!['manual', 'qualification'].includes(type)) {
      return res.status(400).json({ error: 'Tournament type must be either "manual" or "qualification"' })
    }

    if (name.length < 3) {
      return res.status(400).json({ error: 'Tournament name must be at least 3 characters long' })
    }

    if (name.length > 100) {
      return res.status(400).json({ error: 'Tournament name must not exceed 100 characters' })
    }

    console.log('Creating tournament with type:', type)
    const tournament = await TournamentService.createTournament(req.user.userId, {
      name,
      hostCountry,
      hostCountryCode,
      type,
      worldId,
      year
    })
    console.log('Tournament created:', tournament.type)

    res.status(201).json({
      tournament,
      message: 'Tournament created successfully'
    })
  } catch (error) {
    console.error('Error creating tournament:', error)
    if (error.message === 'Invalid host country') {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update tournament
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, status, winner, runnerUp, finalScore } = req.body

    const updateData = {}
    if (name !== undefined) updateData.name = name
    
    // Check if trying to activate tournament
    if (status !== undefined) {
      if (status === 'active') {
        const tournament = await TournamentService.getTournamentById(req.params.id, req.user.userId)
        if (!tournament) {
          return res.status(404).json({ error: 'Tournament not found' })
        }
        
        if (tournament.teamCount !== tournament.settings.maxTeams) {
          return res.status(400).json({ 
            error: `Cannot activate tournament. Need exactly ${tournament.settings.maxTeams} teams. Currently have ${tournament.teamCount} teams.` 
          })
        }
      }
      updateData.status = status
      
      // If completing tournament, store results
      if (status === 'completed') {
        if (winner) updateData.winner = winner
        if (runnerUp) updateData.runnerUp = runnerUp
        if (finalScore) updateData.finalScore = finalScore
      }
    }

    // Validation
    if (name && name.length < 3) {
      return res.status(400).json({ error: 'Tournament name must be at least 3 characters long' })
    }

    if (name && name.length > 100) {
      return res.status(400).json({ error: 'Tournament name must not exceed 100 characters' })
    }

    const tournament = await TournamentService.updateTournament(req.params.id, req.user.userId, updateData)
    
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' })
    }

    res.json({
      tournament,
      message: 'Tournament updated successfully'
    })
  } catch (error) {
    console.error('Error updating tournament:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update last opened timestamp
router.post('/:id/open', authenticateToken, async (req, res) => {
  try {
    const tournament = await TournamentService.updateLastOpened(req.params.id, req.user.userId)
    
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' })
    }

    res.json({ message: 'Tournament opened successfully' })
  } catch (error) {
    console.error('Error opening tournament:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Prepare tournament for draw after qualification
router.post('/:id/prepare-draw', authenticateToken, async (req, res) => {
  try {
    const { qualifiedTeams, totalQualified } = req.body
    
    if (!qualifiedTeams || !Array.isArray(qualifiedTeams)) {
      return res.status(400).json({ error: 'Qualified teams array is required' })
    }

    const tournament = await TournamentService.prepareTournamentForDraw(
      req.params.id, 
      req.user.userId, 
      qualifiedTeams, 
      totalQualified
    )
    
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' })
    }

    res.json({
      tournament,
      message: 'Tournament prepared for draw successfully'
    })
  } catch (error) {
    console.error('Error preparing tournament for draw:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete tournament
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const tournament = await TournamentService.deleteTournament(req.params.id, req.user.userId)
    
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' })
    }

    res.json({ message: 'Tournament deleted successfully' })
  } catch (error) {
    console.error('Error deleting tournament:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router