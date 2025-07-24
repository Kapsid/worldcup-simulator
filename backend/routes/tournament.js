import express from 'express'
import TournamentService from '../services/TournamentService.js'
import { authenticateToken } from '../middleware/auth.js'
import { countries } from '../data/countries.js'
import TournamentTeam from '../models/TournamentTeam.js'
import PlayerStats from '../models/PlayerStats.js'

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

// Get top scorers for a tournament (no auth required for public stats)
router.get('/:id/top-scorers', async (req, res) => {
  try {
    const { id: tournamentId } = req.params
    const { limit = 20 } = req.query
    
    console.log(`TOP SCORERS API: Getting top scorers for tournament ${tournamentId}`)
    
    const topScorers = await PlayerStats.find({
      tournamentId: tournamentId,
      competitionType: 'tournament',
      goals: { $gt: 0 }
    })
    .populate('player')
    .sort({ goals: -1, assists: -1, matchesStarted: 1 })
    .limit(parseInt(limit))
    
    console.log(`TOP SCORERS API: Found ${topScorers.length} scorers`)
    
    // Format the response data
    const formattedTopScorers = topScorers.map((stat, index) => ({
      rank: index + 1,
      player: {
        _id: stat.player._id,
        displayName: stat.player.displayName,
        teamId: stat.player.teamId,
        detailedPosition: stat.player.detailedPosition
      },
      goals: stat.goals,
      assists: stat.assists || 0,
      matchesPlayed: stat.matchesPlayed,
      matchesStarted: stat.matchesStarted,
      goalsPerGame: stat.matchesPlayed > 0 ? (stat.goals / stat.matchesPlayed).toFixed(2) : '0.00'
    }))
    
    res.json({
      tournamentId,
      topScorers: formattedTopScorers,
      totalPlayers: topScorers.length
    })
  } catch (error) {
    console.error('Error getting top scorers:', error)
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

// Activate tournament
router.post('/:id/activate', authenticateToken, async (req, res) => {
  try {
    const tournament = await TournamentService.getTournamentById(req.params.id, req.user.userId)
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' })
    }
    
    // Check if tournament can be activated
    if (tournament.status !== 'draft') {
      return res.status(400).json({ 
        error: `Cannot activate tournament. Tournament status must be 'draft', current status is '${tournament.status}'.` 
      })
    }
    
    if (tournament.teamCount !== tournament.settings.maxTeams) {
      return res.status(400).json({ 
        error: `Cannot activate tournament. Need exactly ${tournament.settings.maxTeams} teams. Currently have ${tournament.teamCount} teams.` 
      })
    }
    
    // If tournament has qualified teams from qualification, create TournamentTeam documents
    if (tournament.type === 'qualification' && tournament.qualifiedTeams && tournament.qualifiedTeams.length > 0) {
      console.log('Creating TournamentTeam documents from qualified teams...')
      
      // First, delete any existing TournamentTeam documents for this tournament
      await TournamentTeam.deleteMany({ tournament: tournament._id })
      
      // Create TournamentTeam documents from qualified teams
      const tournamentTeams = tournament.qualifiedTeams.map((team, index) => ({
        tournament: tournament._id,
        countryCode: team.teamId || team.country.substring(0, 3).toUpperCase(),
        countryName: team.country || team.name,
        countryFlag: team.flag,
        worldRanking: team.worldRanking || (index + 1), // Use index as fallback
        isHost: (team.country || team.name) === tournament.hostCountry
      }))
      
      await TournamentTeam.insertMany(tournamentTeams)
      console.log(`Created ${tournamentTeams.length} TournamentTeam documents`)
    }
    
    // Activate the tournament
    const updatedTournament = await TournamentService.updateTournament(req.params.id, req.user.userId, {
      status: 'active'
    })
    
    res.json({
      tournament: updatedTournament,
      message: 'Tournament activated successfully'
    })
  } catch (error) {
    console.error('Error activating tournament:', error)
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

// Get tournament top scorers
router.get('/:id/top-scorers', authenticateToken, async (req, res) => {
  try {
    const tournament = await TournamentService.getTournamentById(req.params.id, req.user.userId)
    
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' })
    }

    // Import PlayerStats model
    const PlayerStats = (await import('../models/PlayerStats.js')).default
    
    // Build query for tournament stats
    const query = { 
      competitionType: 'tournament',
      goals: { $gt: 0 } // Only include players with goals
    }
    
    // Add tournament or world context
    if (tournament.worldId) {
      query.worldId = tournament.worldId
    } else {
      query.tournamentId = tournament._id
    }

    // Get top scorers with player details
    const topScorers = await PlayerStats.find(query)
      .populate('player', 'displayName nationality position')
      .sort({ goals: -1, matchesStarted: -1 }) // Sort by goals (desc), then matches started (desc)
      .limit(20) // Top 20 scorers
      .lean()

    // Format the response
    const formattedScorers = topScorers.map((stats, index) => ({
      rank: index + 1,
      playerId: stats.player._id,
      playerName: stats.player.displayName,
      nationality: stats.player.nationality,
      position: stats.player.position,
      goals: stats.goals,
      matchesStarted: stats.matchesStarted,
      matchesPlayed: stats.matchesPlayed,
      goalsPerGame: stats.matchesPlayed > 0 ? (stats.goals / stats.matchesPlayed).toFixed(2) : '0.00'
    }))

    res.json({
      tournament: {
        id: tournament._id,
        name: tournament.name
      },
      topScorers: formattedScorers,
      totalScorers: formattedScorers.length
    })
  } catch (error) {
    console.error('Error getting tournament top scorers:', error)
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