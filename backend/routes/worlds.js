import express from 'express'
import World from '../models/World.js'
import WorldRankingService from '../services/WorldRankingService.js'
import { authenticateToken } from '../middleware/auth.js'
import { worldCupHistory } from '../data/worldCupHistory.js'
import { getCountryByCode, countries } from '../data/countries.js'
import PlayerGenerationService from '../services/PlayerGenerationService.js'

const router = express.Router()

// Get all worlds for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const worlds = await World.find({ 
      createdBy: req.user.userId,
      isActive: true 
    })
    .populate('tournaments', 'name status createdAt')
    .sort({ createdAt: -1 })

    res.json({
      success: true,
      data: worlds
    })
  } catch (error) {
    console.error('Error fetching worlds:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch worlds'
    })
  }
})

// Get a specific world by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const world = await World.findOne({
      _id: req.params.id,
      createdBy: req.user.userId,
      isActive: true
    }).populate('tournaments')

    if (!world) {
      return res.status(404).json({
        success: false,
        message: 'World not found'
      })
    }

    console.log('World simulatedHistory:', world.simulatedHistory?.length || 0, 'entries')

    res.json({
      success: true,
      data: world
    })
  } catch (error) {
    console.error('Error fetching world:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch world'
    })
  }
})

// Create a new world
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('Creating world with data:', req.body)
    console.log('User:', req.user)
    
    const { name, labels, beginningYear, useRealHistoricData, description } = req.body

    // Validation
    if (!name || !beginningYear) {
      return res.status(400).json({
        success: false,
        message: 'Name and beginning year are required'
      })
    }

    if (beginningYear < 1900 || beginningYear > 2100) {
      return res.status(400).json({
        success: false,
        message: 'Beginning year must be between 1900 and 2100'
      })
    }

    // Check for duplicate world names for this user
    const existingWorld = await World.findOne({
      name: name.trim(),
      createdBy: req.user.userId,
      isActive: true
    })

    if (existingWorld) {
      return res.status(400).json({
        success: false,
        message: 'A world with this name already exists'
      })
    }

    // Create new world
    const world = new World({
      name: name.trim(),
      labels: labels ? labels.filter(label => label.trim().length > 0) : [],
      beginningYear,
      useRealHistoricData: useRealHistoricData || false,
      description: description ? description.trim() : '',
      createdBy: req.user.userId
    })

    await world.save()

    // Generate players for ALL countries in this world
    console.log('🌍 WORLD CREATION: Starting player generation checks...')
    console.log('🌍 WORLD CREATION: Countries available?', Array.isArray(countries))
    console.log('🌍 WORLD CREATION: Total countries:', countries?.length || 0)
    console.log('🌍 WORLD CREATION: First few countries:', countries?.slice(0, 3)?.map(c => ({ name: c.name, code: c.code })) || [])
    console.log('🌍 WORLD CREATION: World ID:', world._id.toString())
    console.log('🌍 WORLD CREATION: Beginning year:', beginningYear)
    console.log('🌍 WORLD CREATION: PlayerGenerationService available?', !!PlayerGenerationService)
    
    if (!countries || countries.length === 0) {
      console.error('💥 WORLD CREATION: No countries available! Skipping player generation.')
      return res.status(201).json({
        success: true,
        message: 'World created but no players generated (no countries available)',
        data: world
      })
    }
    
    let totalPlayersGenerated = 0
    let totalCountriesProcessed = 0
    let errors = []
    
    console.log('🌍 WORLD CREATION: Starting actual player generation...')
    
    try {
      for (let i = 0; i < countries.length; i++) {
        const country = countries[i]
        console.log(`🏴 [${i+1}/${countries.length}] Processing: ${country.name} (${country.code})`)
        
        try {
          const startTime = Date.now()
          
          const players = await PlayerGenerationService.generateSquad(
            country.code,
            null, // No tournament ID for world-level players
            world._id.toString(), // World ID
            beginningYear
          )
          
          const duration = Date.now() - startTime
          totalPlayersGenerated += players.length
          totalCountriesProcessed++
          
          console.log(`✅ Generated ${players.length} players for ${country.name} in ${duration}ms`)
          
          if (totalCountriesProcessed % 10 === 0) {
            console.log(`📊 Progress: ${totalCountriesProcessed}/${countries.length} countries, ${totalPlayersGenerated} total players`)
          }
          
          // Add small delay to prevent overwhelming the database
          if (i % 50 === 0 && i > 0) {
            console.log('⏳ Taking a short break to prevent database overload...')
            await new Promise(resolve => setTimeout(resolve, 100))
          }
          
        } catch (squadError) {
          const errorMsg = `Error generating squad for ${country.name} (${country.code}): ${squadError.message}`
          console.error(`❌ ${errorMsg}`)
          errors.push(errorMsg)
        }
      }
      
      console.log(`🎉 WORLD PLAYER GENERATION COMPLETED!`)
      console.log(`📊 Final stats: ${totalPlayersGenerated} players for ${totalCountriesProcessed}/${countries.length} countries`)
      if (errors.length > 0) {
        console.log(`⚠️ Errors encountered: ${errors.length}`)
        errors.forEach((err, i) => console.log(`  ${i+1}. ${err}`))
      }
      
    } catch (error) {
      console.error('💥 Critical error during world player generation:', error)
      console.error('💥 Error stack:', error.stack)
    }

    res.status(201).json({
      success: true,
      message: `World created successfully with ${totalPlayersGenerated} players generated`,
      data: world
    })
  } catch (error) {
    console.error('Error creating world:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create world'
    })
  }
})

// Update a world
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, labels, beginningYear, useRealHistoricData, description } = req.body

    const world = await World.findOne({
      _id: req.params.id,
      createdBy: req.user.userId,
      isActive: true
    })

    if (!world) {
      return res.status(404).json({
        success: false,
        message: 'World not found'
      })
    }

    // Validation
    if (name && (name.length < 3 || name.length > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Name must be between 3 and 100 characters'
      })
    }

    if (beginningYear && (beginningYear < 1900 || beginningYear > 2100)) {
      return res.status(400).json({
        success: false,
        message: 'Beginning year must be between 1900 and 2100'
      })
    }

    // Check for duplicate names if name is being changed
    if (name && name.trim() !== world.name) {
      const existingWorld = await World.findOne({
        name: name.trim(),
        createdBy: req.user.userId,
        isActive: true,
        _id: { $ne: world._id }
      })

      if (existingWorld) {
        return res.status(400).json({
          success: false,
          message: 'A world with this name already exists'
        })
      }
    }

    // Update fields
    if (name) world.name = name.trim()
    if (labels !== undefined) world.labels = labels.filter(label => label.trim().length > 0)
    if (beginningYear) world.beginningYear = beginningYear
    if (useRealHistoricData !== undefined) world.useRealHistoricData = useRealHistoricData
    if (description !== undefined) world.description = description.trim()

    await world.save()

    res.json({
      success: true,
      message: 'World updated successfully',
      data: world
    })
  } catch (error) {
    console.error('Error updating world:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update world'
    })
  }
})

// Delete a world (soft delete)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const world = await World.findOne({
      _id: req.params.id,
      createdBy: req.user.userId,
      isActive: true
    })

    if (!world) {
      return res.status(404).json({
        success: false,
        message: 'World not found'
      })
    }

    // Soft delete
    world.isActive = false
    await world.save()

    res.json({
      success: true,
      message: 'World deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting world:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete world'
    })
  }
})

// Get world statistics
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const world = await World.findOne({
      _id: req.params.id,
      createdBy: req.user.userId,
      isActive: true
    }).populate('tournaments')

    if (!world) {
      return res.status(404).json({
        success: false,
        message: 'World not found'
      })
    }

    const stats = {
      totalTournaments: world.tournaments.length,
      activeTournaments: world.tournaments.filter(t => t.status === 'active').length,
      completedTournaments: world.tournaments.filter(t => t.status === 'completed').length,
      draftTournaments: world.tournaments.filter(t => t.status === 'draft').length,
      createdAt: world.createdAt,
      lastUpdated: world.updatedAt
    }

    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Error fetching world stats:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch world statistics'
    })
  }
})

// Get World Cup history for a world
router.get('/:id/history', authenticateToken, async (req, res) => {
  try {
    const world = await World.findOne({
      _id: req.params.id,
      createdBy: req.user.userId,
      isActive: true
    }).populate({
      path: 'tournaments',
      match: { status: 'completed' },
      select: 'name year hostCountry hostCountryCode winner runnerUp finalScore completedAt',
      options: { lean: true }
    })

    if (!world) {
      return res.status(404).json({
        success: false,
        message: 'World not found'
      })
    }

    let history = []
    
    // If using real historic data, include real World Cup history
    if (world.useRealHistoricData) {
      // Filter real history to only include tournaments from the beginning year and earlier
      history = worldCupHistory.filter(tournament => tournament.year < world.beginningYear)
      console.log('Real World Cup history entries:', history.length)
    }
    
    // Add completed tournaments from this world
    if (world.tournaments && world.tournaments.length > 0) {
      console.log('Processing tournaments:', world.tournaments.length)
      
      const simulatedHistory = world.tournaments.map(tournament => {
        console.log('Tournament data:', JSON.stringify({
          name: tournament.name,
          year: tournament.year,
          winner: tournament.winner,
          runnerUp: tournament.runnerUp,
          finalScore: tournament.finalScore,
          _id: tournament._id
        }, null, 2))
        
        // Get host country flag
        const hostCountry = getCountryByCode(tournament.hostCountryCode)
        const hostFlag = hostCountry ? hostCountry.flag : '🏆'
        
        return {
          year: tournament.year || new Date(tournament.completedAt).getFullYear(),
          host: {
            name: tournament.hostCountry,
            code: tournament.hostCountryCode,
            flag: hostFlag
          },
          winner: tournament.winner || {
            name: 'Unknown Winner',
            code: 'UNK',
            flag: '🏆'
          },
          runnerUp: tournament.runnerUp || {
            name: 'Unknown Runner-up',
            code: 'UNK', 
            flag: '🥈'
          },
          final: {
            score: tournament.finalScore || 'N/A',
            venue: `${tournament.hostCountry} Stadium`
          },
          teams: 32
        }
      })
      
      console.log('Simulated history entries:', simulatedHistory.length)
      history = history.concat(simulatedHistory)
    } else {
      console.log('No completed tournaments found for world:', world._id)
    }
    
    // Sort by year descending (latest first)
    history.sort((a, b) => b.year - a.year)
    
    console.log('Total history entries returned:', history.length)
    
    res.json({
      success: true,
      data: history
    })
  } catch (error) {
    console.error('Error fetching world history:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch world history'
    })
  }
})

// Get world rankings
router.get('/:id/rankings', authenticateToken, async (req, res) => {
  try {
    const world = await World.findOne({
      _id: req.params.id,
      createdBy: req.user.userId,
      isActive: true
    })

    if (!world) {
      return res.status(404).json({
        success: false,
        message: 'World not found'
      })
    }

    const rankings = await WorldRankingService.getWorldRankings(req.params.id)
    
    res.json({
      success: true,
      data: rankings
    })
  } catch (error) {
    console.error('Error fetching world rankings:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch world rankings'
    })
  }
})

// Get host candidates for next tournament
router.get('/:id/host-candidates', authenticateToken, async (req, res) => {
  try {
    const world = await World.findOne({
      _id: req.params.id,
      createdBy: req.user.userId,
      isActive: true
    })

    if (!world) {
      return res.status(404).json({
        success: false,
        message: 'World not found'
      })
    }

    const candidates = await WorldRankingService.getHostCandidates(req.params.id)
    
    res.json({
      success: true,
      data: candidates
    })
  } catch (error) {
    console.error('Error fetching host candidates:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch host candidates'
    })
  }
})

export default router