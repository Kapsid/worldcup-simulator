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

// Get tournament phase detection (moved to a different route pattern)
router.get('/phase/:id', authenticateToken, async (req, res) => {
  try {
    const phase = await TournamentService.getCurrentTournamentPhase(req.params.id)
    res.json({ 
      tournamentId: req.params.id,
      currentPhase: phase,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error getting tournament phase:', error)
    if (error.message === 'Tournament not found') {
      return res.status(404).json({ error: error.message })
    }
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

    // Convert to plain object for modification
    let tournamentData = tournament.toObject ? tournament.toObject() : tournament

    // If phase query parameter is present, add phase information
    if (req.query.includePhase === 'true') {
      console.log('Phase detection requested for tournament:', req.params.id)
      try {
        const phase = await TournamentService.getCurrentTournamentPhase(req.params.id)
        console.log('Phase detected:', phase)
        tournamentData.currentPhase = phase
      } catch (phaseError) {
        console.error('Error getting tournament phase:', phaseError)
        tournamentData.currentPhase = 'unknown'
      }
    }

    res.json(tournamentData)
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

// Quick test endpoint
router.get('/:tournamentId/test-stats', async (req, res) => {
  try {
    const PlayerStats = (await import('../models/PlayerStats.js')).default
    const count = await PlayerStats.countDocuments({ tournamentId: req.params.tournamentId })
    const sample = await PlayerStats.findOne({ tournamentId: req.params.tournamentId })
      .populate('player', 'displayName position')
    
    res.json({
      count,
      samplePlayer: sample?.player?.displayName || 'NO_PLAYER',
      samplePosition: sample?.player?.position || 'NO_POSITION',
      sampleRating: sample?.averageRating || 0
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Simple debug endpoint to check raw PlayerStats
router.get('/:tournamentId/debug-raw-stats', authenticateToken, async (req, res) => {
  try {
    const { tournamentId } = req.params
    const PlayerStats = (await import('../models/PlayerStats.js')).default
    
    const rawStats = await PlayerStats.find({ tournamentId })
      .populate('player', 'displayName nationality position teamId')
      .limit(10)
      .lean()
    
    res.json({
      count: rawStats.length,
      samples: rawStats.map(stat => ({
        playerName: stat.player?.displayName || 'NO_NAME',
        position: stat.player?.position || 'NO_POSITION', 
        hasPlayer: !!stat.player,
        rating: stat.averageRating,
        goals: stat.goals,
        matches: stat.matchesPlayed
      }))
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Debug endpoint to check PlayerStats in database
router.get('/:tournamentId/debug-stats', authenticateToken, async (req, res) => {
  try {
    const { tournamentId } = req.params
    
    const PlayerStats = (await import('../models/PlayerStats.js')).default
    const Tournament = (await import('../models/Tournament.js')).default
    
    // Get tournament
    const tournament = await Tournament.findById(tournamentId)
    
    // Check all PlayerStats for this tournament/world
    const allStats = await PlayerStats.find({}).limit(50).lean()
    
    const tournamentStats = await PlayerStats.find({
      tournamentId: tournamentId
    }).limit(50).lean()
    
    const worldStats = tournament?.worldId ? await PlayerStats.find({
      worldId: tournament.worldId
    }).limit(50).lean() : []
    
    res.json({
      tournament: {
        id: tournament?._id,
        worldId: tournament?.worldId
      },
      allStatsCount: allStats.length,
      tournamentStatsCount: tournamentStats.length,
      worldStatsCount: worldStats.length,
      sampleAllStats: allStats.slice(0, 5),
      sampleTournamentStats: tournamentStats.slice(0, 5),
      sampleWorldStats: worldStats.slice(0, 5)
    })
  } catch (error) {
    console.error('Debug stats error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get Clean Sheets for tournament
router.get('/:tournamentId/clean-sheets', authenticateToken, async (req, res) => {
  try {
    const { tournamentId } = req.params
    const { limit = 20 } = req.query
    
    console.log(`CLEAN SHEETS API: Getting clean sheets for tournament ${tournamentId}`)
    
    // Import models
    const PlayerStats = (await import('../models/PlayerStats.js')).default
    const Tournament = (await import('../models/Tournament.js')).default
    
    // Get tournament to check if it has a worldId
    const tournament = await Tournament.findById(tournamentId)
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' })
    }
    
    // Build query based on whether tournament has worldId
    const query = {
      competitionType: { $in: ['tournament', 'world_cup'] },
      matchesPlayed: { $gte: 1 }, // At least 1 match
      cleanSheets: { $gt: 0 } // Only players with clean sheets
    }
    
    if (tournament.worldId) {
      query.worldId = tournament.worldId
    } else {
      query.tournamentId = tournamentId
    }
    
    console.log('Clean Sheets Query:', query)
    
    // Get clean sheet leaders - focusing on goalkeepers
    const cleanSheetStats = await PlayerStats.find(query)
      .populate('player', 'displayName nationality position teamId detailedPosition')
      .sort({ cleanSheets: -1, matchesStarted: -1 })
      .limit(parseInt(limit))
    
    console.log(`Found ${cleanSheetStats.length} players with clean sheets`)
    
    // Filter for goalkeepers primarily, but include any player with clean sheets
    const cleanSheetLeaders = cleanSheetStats
      .filter(stat => stat.player && stat.cleanSheets > 0)
      .map((stat, index) => ({
        rank: index + 1,
        player: {
          _id: stat.player._id,
          displayName: stat.player.displayName,
          teamId: stat.player.teamId,
          detailedPosition: stat.player.detailedPosition || stat.player.position
        },
        cleanSheets: stat.cleanSheets,
        matchesStarted: stat.matchesStarted,
        matchesPlayed: stat.matchesPlayed,
        cleanSheetPercentage: stat.matchesStarted > 0 
          ? Math.round((stat.cleanSheets / stat.matchesStarted) * 100) 
          : 0
      }))
    
    res.json({
      tournamentId,
      cleanSheets: cleanSheetLeaders,
      totalKeepers: cleanSheetLeaders.length
    })
  } catch (error) {
    console.error('Error getting clean sheets:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get All Stars XI for tournament
router.get('/:tournamentId/all-stars-xi', authenticateToken, async (req, res) => {
  console.log('All Stars XI endpoint hit for tournament:', req.params.tournamentId)
  try {
    const { tournamentId } = req.params
    
    // Import models
    const PlayerStats = (await import('../models/PlayerStats.js')).default
    const Tournament = (await import('../models/Tournament.js')).default
    
    // Get tournament to check if it has a worldId
    const tournament = await Tournament.findById(tournamentId)
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' })
    }
    
    // Build query based on whether tournament has worldId
    const query = {
      competitionType: { $in: ['tournament', 'world_cup'] },
      matchesPlayed: { $gte: 1 }, // At least 1 match
      averageRating: { $gt: 0 }
    }
    
    if (tournament.worldId) {
      query.worldId = tournament.worldId
    } else {
      query.tournamentId = tournamentId
    }
    
    console.log('All Stars XI Query:', query)
    
    // First, get raw stats without population to see the player IDs
    const rawStats = await PlayerStats.find(query).limit(5).lean()
    console.log('Raw stats sample (before population):', rawStats.map(stat => ({
      _id: stat._id,
      player: stat.player,
      competitionType: stat.competitionType,
      matchesPlayed: stat.matchesPlayed,
      averageRating: stat.averageRating
    })))
    
    // Get all player stats for this tournament with minimum matches played
    const playerStats = await PlayerStats.find(query)
    .populate('player', 'displayName nationality position teamId')
    .sort({ averageRating: -1 })
    
    console.log(`Found ${playerStats.length} players with stats`)
    
    // Debug: Log first few players to see their structure
    console.log('Sample player stats (after population):', JSON.stringify(playerStats.slice(0, 3), null, 2))
    
    // If no players found, return empty response
    if (playerStats.length === 0) {
      return res.json({
        formation: '4-4-2',
        players: {
          GK: null, LB: null, CB1: null, CB2: null, RB: null,
          LM: null, CM1: null, CM2: null, RM: null,
          ST1: null, ST2: null
        },
        bench: [],
        teamAverageRating: 0,
        message: 'No player statistics available yet. Play some matches first!'
      })
    }
    
    // Group players by position
    const playersByPosition = {
      GK: [],
      defenders: [], // CB, LB, RB
      midfielders: [], // CM, CDM, CAM, LM, RM
      forwards: [] // ST, CF, LW, RW
    }
    
    playerStats.forEach((stat, index) => {
      console.log(`Processing player ${index + 1}:`, {
        hasPlayer: !!stat.player,
        playerId: stat.player?._id,
        playerName: stat.player?.displayName,
        position: stat.player?.position,
        rating: stat.averageRating
      })
      
      if (!stat.player) return
      
      const position = stat.player.position
      const playerData = {
        ...stat.player.toObject(),
        stats: {
          matchesPlayed: stat.matchesPlayed,
          matchesStarted: stat.matchesStarted,
          goals: stat.goals,
          cleanSheets: stat.cleanSheets,
          averageRating: stat.averageRating
        }
      }
      
      if (position === 'GK' || position === 'Goalkeeper') {
        playersByPosition.GK.push(playerData)
      } else if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(position) || position === 'Defender') {
        playersByPosition.defenders.push(playerData)
      } else if (['CM', 'CDM', 'CAM', 'LM', 'RM'].includes(position) || position === 'Midfielder') {
        playersByPosition.midfielders.push(playerData)
      } else if (['ST', 'CF', 'LW', 'RW'].includes(position) || position === 'Forward') {
        playersByPosition.forwards.push(playerData)
      }
    })
    
    // Debug: Log how many players in each position group
    console.log('Players by position:', {
      GK: playersByPosition.GK.length,
      defenders: playersByPosition.defenders.length,
      midfielders: playersByPosition.midfielders.length,
      forwards: playersByPosition.forwards.length
    })
    
    // Select best XI in 4-4-2 formation
    const allStarsXI = {
      formation: '4-4-2',
      players: {
        GK: playersByPosition.GK[0] || null,
        LB: playersByPosition.defenders.find(p => p.position === 'LB') || 
            playersByPosition.defenders.find(p => p.position === 'LWB') ||
            playersByPosition.defenders[0] || null,
        CB1: playersByPosition.defenders.find(p => p.position === 'CB') || 
             playersByPosition.defenders[1] || null,
        CB2: playersByPosition.defenders.filter(p => p.position === 'CB')[1] || 
             playersByPosition.defenders[2] || null,
        RB: playersByPosition.defenders.find(p => p.position === 'RB') || 
            playersByPosition.defenders.find(p => p.position === 'RWB') ||
            playersByPosition.defenders[3] || null,
        LM: playersByPosition.midfielders.find(p => ['LM', 'LW'].includes(p.position)) ||
            playersByPosition.midfielders[0] || null,
        CM1: playersByPosition.midfielders.find(p => ['CM', 'CDM'].includes(p.position)) ||
             playersByPosition.midfielders[1] || null,
        CM2: playersByPosition.midfielders.filter(p => ['CM', 'CAM'].includes(p.position))[1] ||
             playersByPosition.midfielders[2] || null,
        RM: playersByPosition.midfielders.find(p => ['RM', 'RW'].includes(p.position)) ||
            playersByPosition.midfielders[3] || null,
        ST1: playersByPosition.forwards.find(p => ['ST', 'CF'].includes(p.position)) ||
             playersByPosition.forwards[0] || null,
        ST2: playersByPosition.forwards.filter(p => ['ST', 'CF', 'LW', 'RW'].includes(p.position))[1] ||
             playersByPosition.forwards[1] || null
      },
      // Also include bench (best players not in starting XI)
      bench: []
    }
    
    // Calculate team average rating
    const xiPlayers = Object.values(allStarsXI.players).filter(p => p !== null)
    const teamAverageRating = xiPlayers.length > 0
      ? Math.round((xiPlayers.reduce((sum, p) => sum + p.stats.averageRating, 0) / xiPlayers.length) * 10) / 10
      : 0
    
    allStarsXI.teamAverageRating = teamAverageRating
    
    res.json(allStarsXI)
  } catch (error) {
    console.error('Error fetching All Stars XI:', error)
    res.status(500).json({ error: 'Failed to fetch All Stars XI' })
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