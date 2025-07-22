import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import PlayerGenerationService from '../services/PlayerGenerationService.js'
import { generateTeamTactics } from '../data/tactics.js'

const router = express.Router()

// Get team players with tactics
router.get('/team', authenticateToken, async (req, res) => {
  try {
    console.log('🏆 BACKEND: Team roster request received')
    console.log('🏆 BACKEND: Query params:', req.query)
    console.log('🏆 BACKEND: User ID:', req.user.userId)
    
    const { teamCode, tournamentId, worldId } = req.query

    if (!teamCode) {
      console.log('🏆 BACKEND: Error - no team code provided')
      return res.status(400).json({ error: 'Team code is required' })
    }

    console.log(`🏆 BACKEND: Getting players for team: ${teamCode}`)
    console.log(`🏆 BACKEND: Tournament ID: ${tournamentId || 'null'}`)
    console.log(`🏆 BACKEND: World ID: ${worldId || 'null'}`)

    // Get players for the team
    const players = await PlayerGenerationService.getTeamPlayers(
      teamCode, 
      tournamentId || null, 
      worldId || null
    )

    console.log(`🏆 BACKEND: Found ${players.length} players for ${teamCode}`)

    // Generate or get tactics for the team
    const tactics = generateTeamTactics()

    res.json({
      players,
      tactics,
      teamCode
    })
  } catch (error) {
    console.error('🏆 BACKEND: Error fetching team players:', error)
    res.status(500).json({ error: 'Failed to fetch team players' })
  }
})

// Get individual player details
router.get('/:playerId', authenticateToken, async (req, res) => {
  try {
    const { playerId } = req.params
    const player = await PlayerGenerationService.getPlayerById(playerId)

    if (!player) {
      return res.status(404).json({ error: 'Player not found' })
    }

    res.json(player)
  } catch (error) {
    console.error('Error fetching player:', error)
    res.status(500).json({ error: 'Failed to fetch player' })
  }
})

// Get tournament history for a player
router.get('/:playerId/tournament-history', authenticateToken, async (req, res) => {
  try {
    const { playerId } = req.params
    
    // Import PlayerStats model
    const PlayerStats = await import('../models/PlayerStats.js').then(m => m.default)
    
    // Get all tournament stats for this player
    const playerStats = await PlayerStats.find({ 
      player: playerId 
    })
    .populate('tournamentId', 'name')
    .populate('worldId', 'name')
    .sort({ createdAt: -1 })
    
    // Group stats by tournament
    const tournamentHistory = {}
    
    for (const stats of playerStats) {
      // Create tournament key using tournamentId or worldId
      const tournamentKey = stats.tournamentId?._id?.toString() || stats.worldId?._id?.toString()
      const tournamentName = stats.tournamentId?.name || stats.worldId?.name || 'Unknown Tournament'
      
      if (!tournamentKey) continue
      
      if (!tournamentHistory[tournamentKey]) {
        tournamentHistory[tournamentKey] = {
          tournamentId: tournamentKey,
          tournamentName: tournamentName,
          year: new Date().getFullYear(), // TODO: Get actual year
          qualification: null,
          tournament: null
        }
      }
      
      const historyEntry = tournamentHistory[tournamentKey]
      
      // Add stats based on competition type
      if (stats.competitionType === 'qualification') {
        historyEntry.qualification = {
          starts: stats.matchesStarted,
          goals: stats.goals,
          cleanSheets: stats.cleanSheets
        }
      } else if (stats.competitionType === 'tournament') {
        historyEntry.tournament = {
          starts: stats.matchesStarted,
          goals: stats.goals,
          cleanSheets: stats.cleanSheets
        }
      }
    }
    
    // Convert to array
    const historyArray = Object.values(tournamentHistory)
    
    res.json(historyArray)
  } catch (error) {
    console.error('Error fetching player tournament history:', error)
    res.status(500).json({ error: 'Failed to fetch tournament history' })
  }
})

// Generate squad for a team (admin/development endpoint)
router.post('/generate-squad', authenticateToken, async (req, res) => {
  try {
    const { teamCode, tournamentId, worldId, currentYear } = req.body

    if (!teamCode) {
      return res.status(400).json({ error: 'Team code is required' })
    }

    const players = await PlayerGenerationService.generateSquad(
      teamCode,
      tournamentId || null,
      worldId || null,
      currentYear || 2024
    )

    res.json({
      message: `Generated ${players.length} players for ${teamCode}`,
      players
    })
  } catch (error) {
    console.error('Error generating squad:', error)
    res.status(500).json({ error: 'Failed to generate squad' })
  }
})

// Update player stats (for match simulation)
router.patch('/:playerId/stats', authenticateToken, async (req, res) => {
  try {
    const { playerId } = req.params
    const updates = req.body

    const updatedPlayer = await PlayerGenerationService.updatePlayerStats(playerId, updates)

    if (!updatedPlayer) {
      return res.status(404).json({ error: 'Player not found' })
    }

    res.json(updatedPlayer)
  } catch (error) {
    console.error('Error updating player stats:', error)
    res.status(500).json({ error: 'Failed to update player stats' })
  }
})

// Age players in world (for world progression)
router.post('/age-world-players', authenticateToken, async (req, res) => {
  try {
    const { worldId, newYear } = req.body

    if (!worldId || !newYear) {
      return res.status(400).json({ error: 'World ID and new year are required' })
    }

    const result = await PlayerGenerationService.agePlayersInWorld(worldId, newYear)

    res.json({
      message: `Aged ${result.aged} players, ${result.retired} retired`,
      result
    })
  } catch (error) {
    console.error('Error aging world players:', error)
    res.status(500).json({ error: 'Failed to age world players' })
  }
})

// Regenerate all players for a tournament (debug endpoint)
router.post('/regenerate-tournament', authenticateToken, async (req, res) => {
  try {
    const { tournamentId } = req.body

    if (!tournamentId) {
      return res.status(400).json({ error: 'Tournament ID is required' })
    }

    // Get tournament details
    const Tournament = (await import('../models/Tournament.js')).default
    const tournament = await Tournament.findById(tournamentId)
    
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' })
    }

    // Check if user owns the tournament
    if (tournament.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized: Tournament not owned by user' })
    }

    let totalTeamsRegenerated = 0
    let teamsToRegenerate = []

    // Get teams based on tournament type
    if (tournament.type === 'qualification') {
      // For qualification tournaments, get teams from qualification data
      const Qualification = (await import('../models/Qualification.js')).default
      const qualification = await Qualification.findOne({ tournament: tournamentId })
      
      if (qualification) {
        for (const confederation of qualification.confederations) {
          for (const group of confederation.groups) {
            for (const team of group.teams) {
              const { countries } = await import('../data/countries.js')
              const countryCode = countries.find(c => c.name === team.country)?.code || team.name.substring(0, 3).toUpperCase()
              teamsToRegenerate.push({
                countryCode,
                name: team.country || team.name
              })
            }
          }
        }
      }
    } else {
      // For manual tournaments, get teams from TournamentTeam
      const TournamentTeam = (await import('../models/TournamentTeam.js')).default
      const tournamentTeams = await TournamentTeam.find({ tournament: tournamentId })
      
      teamsToRegenerate = tournamentTeams.map(team => ({
        countryCode: team.countryCode,
        name: team.countryName
      }))
    }

    console.log(`Debug: Regenerating players for ${teamsToRegenerate.length} teams...`)

    // Clear existing players for this tournament
    const Player = (await import('../models/Player.js')).default
    const deleteQuery = { tournamentId }
    if (tournament.worldId) {
      deleteQuery.worldId = tournament.worldId.toString()
    }
    await Player.deleteMany(deleteQuery)
    console.log('✓ Cleared existing players')

    // Regenerate players for all teams
    for (const team of teamsToRegenerate) {
      try {
        await PlayerGenerationService.generateSquad(
          team.countryCode,
          tournamentId,
          tournament.worldId ? tournament.worldId.toString() : null,
          tournament.year || new Date().getFullYear()
        )
        totalTeamsRegenerated++
        
        if (totalTeamsRegenerated % 5 === 0) {
          console.log(`✓ Regenerated squads for ${totalTeamsRegenerated} teams...`)
        }
      } catch (squadError) {
        console.error(`Error regenerating squad for ${team.name}:`, squadError)
        // Continue with other teams even if one fails
      }
    }

    console.log(`✅ Player regeneration completed for ${totalTeamsRegenerated} teams`)

    res.json({
      message: `Successfully regenerated players for ${totalTeamsRegenerated} teams`,
      teamsRegenerated: totalTeamsRegenerated,
      tournamentId
    })
  } catch (error) {
    console.error('Error regenerating tournament players:', error)
    res.status(500).json({ error: 'Failed to regenerate tournament players' })
  }
})

// Debug endpoint to check player count
router.get('/debug/count', authenticateToken, async (req, res) => {
  try {
    const Player = (await import('../models/Player.js')).default
    const { worldId, tournamentId } = req.query
    
    let query = {}
    if (worldId) query.worldId = worldId
    if (tournamentId) query.tournamentId = tournamentId
    
    const totalPlayers = await Player.countDocuments(query)
    const samplePlayers = await Player.find(query).limit(5).select('displayName nationality worldId tournamentId teamId')
    
    res.json({
      totalPlayers,
      query,
      samplePlayers
    })
  } catch (error) {
    console.error('Error counting players:', error)
    res.status(500).json({ error: 'Failed to count players' })
  }
})

// Debug endpoint to manually generate players for one country
router.post('/debug/generate-test', authenticateToken, async (req, res) => {
  try {
    console.log('🧪 TEST GENERATION: Starting manual test')
    const { countryCode, worldId } = req.body
    
    if (!countryCode) {
      return res.status(400).json({ error: 'countryCode required' })
    }
    
    console.log('🧪 TEST GENERATION: Country code:', countryCode)
    console.log('🧪 TEST GENERATION: World ID:', worldId)
    
    const players = await PlayerGenerationService.generateSquad(
      countryCode,
      null, // No tournament
      worldId,
      2024
    )
    
    console.log('🧪 TEST GENERATION: Result:', players.length, 'players')
    
    res.json({
      success: true,
      countryCode,
      playersGenerated: players.length,
      samplePlayers: players.slice(0, 3).map(p => ({
        name: p.displayName,
        position: p.position,
        teamId: p.teamId
      }))
    })
  } catch (error) {
    console.error('🧪 TEST GENERATION: Error:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router