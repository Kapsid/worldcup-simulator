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
    const { name, hostCountry, hostCountryCode } = req.body

    // Validation
    if (!name || !hostCountry || !hostCountryCode) {
      return res.status(400).json({ error: 'Name, host country, and host country code are required' })
    }

    if (name.length < 3) {
      return res.status(400).json({ error: 'Tournament name must be at least 3 characters long' })
    }

    if (name.length > 100) {
      return res.status(400).json({ error: 'Tournament name must not exceed 100 characters' })
    }

    const tournament = await TournamentService.createTournament(req.user.userId, {
      name,
      hostCountry,
      hostCountryCode
    })

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
    const { name, hostCountry, hostCountryCode, status } = req.body

    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (hostCountry !== undefined) updateData.hostCountry = hostCountry
    if (hostCountryCode !== undefined) updateData.hostCountryCode = hostCountryCode
    
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