import express from 'express'
import { authenticateAdmin } from '../middleware/adminAuth.js'
import User from '../models/User.js'
import Tournament from '../models/Tournament.js'
import World from '../models/World.js'
import Membership from '../models/Membership.js'
import MembershipService from '../services/MembershipService.js'
import DataManagementService from '../services/DataManagementService.js'

const router = express.Router()

// Dashboard overview
router.get('/dashboard', authenticateAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      totalTournaments,
      totalWorlds,
      activeMemberships,
      recentUsers,
      membershipStats
    ] = await Promise.all([
      User.countDocuments(),
      Tournament.countDocuments(),
      World.countDocuments({ isActive: true }),
      Membership.countDocuments({ status: 'active' }),
      User.find().sort({ createdAt: -1 }).limit(5).lean(),
      Membership.aggregate([
        { $group: { _id: '$plan', count: { $sum: 1 } } }
      ])
    ])

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalTournaments,
          totalWorlds,
          activeMemberships
        },
        recentUsers,
        membershipDistribution: membershipStats
      }
    })
  } catch (error) {
    console.error('Admin dashboard error:', error)
    res.status(500).json({ success: false, message: 'Failed to load dashboard' })
  }
})

// User management
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '', sortBy = 'createdAt', sortOrder = 'desc' } = req.query
    
    const query = search ? {
      $or: [
        { username: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ]
    } : {}

    const users = await User.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean()

    const totalUsers = await User.countDocuments(query)

    // Get membership info for each user
    const usersWithMembership = await Promise.all(
      users.map(async (user) => {
        const membership = await Membership.findOne({ user: user._id }).lean()
        return {
          ...user,
          membership: membership || { plan: 'free', status: 'active' }
        }
      })
    )

    res.json({
      success: true,
      data: {
        users: usersWithMembership,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(totalUsers / limit),
          limit: parseInt(limit),
          totalUsers
        }
      }
    })
  } catch (error) {
    console.error('Admin users error:', error)
    res.status(500).json({ success: false, message: 'Failed to load users' })
  }
})

// Get specific user details
router.get('/users/:id', authenticateAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean()
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const [membership, tournaments, worlds] = await Promise.all([
      Membership.findOne({ user: req.params.id }).lean(),
      Tournament.find({ createdBy: req.params.id }).lean(),
      World.find({ createdBy: req.params.id, isActive: true }).lean()
    ])

    res.json({
      success: true,
      data: {
        user,
        membership: membership || { plan: 'free', status: 'active' },
        statistics: {
          tournaments: tournaments.length,
          worlds: worlds.length,
          joinDate: user.createdAt
        },
        content: {
          tournaments: tournaments.slice(0, 10), // Latest 10
          worlds: worlds.slice(0, 10) // Latest 10
        }
      }
    })
  } catch (error) {
    console.error('Admin user detail error:', error)
    res.status(500).json({ success: false, message: 'Failed to load user details' })
  }
})

// Update user membership
router.put('/users/:id/membership', authenticateAdmin, async (req, res) => {
  try {
    const { plan, status } = req.body
    
    const validPlans = ['free', 'pro', 'football_maniac']
    const validStatuses = ['active', 'cancelled', 'expired']
    
    if (plan && !validPlans.includes(plan)) {
      return res.status(400).json({ success: false, message: 'Invalid plan' })
    }
    
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' })
    }

    let membership = await Membership.findOne({ user: req.params.id })
    
    if (!membership) {
      membership = new Membership({ user: req.params.id })
    }
    
    if (plan) membership.plan = plan
    if (status) membership.status = status
    
    // Set expiration for paid plans
    if (plan && plan !== 'free') {
      membership.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    } else if (plan === 'free') {
      membership.endDate = null
    }
    
    await membership.save()

    res.json({
      success: true,
      message: 'Membership updated successfully',
      data: membership
    })
  } catch (error) {
    console.error('Admin membership update error:', error)
    res.status(500).json({ success: false, message: 'Failed to update membership' })
  }
})

// Reset user usage counters
router.post('/users/:id/reset-usage', authenticateAdmin, async (req, res) => {
  try {
    const membership = await Membership.findOne({ user: req.params.id })
    
    if (!membership) {
      return res.status(404).json({ success: false, message: 'Membership not found' })
    }
    
    membership.tournamentsCreated = 0
    membership.worldsCreated = 0
    await membership.save()

    res.json({
      success: true,
      message: 'Usage counters reset successfully',
      data: membership
    })
  } catch (error) {
    console.error('Admin reset usage error:', error)
    res.status(500).json({ success: false, message: 'Failed to reset usage' })
  }
})

// Tournaments management
router.get('/tournaments', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '', status = '' } = req.query
    
    const query = {}
    if (search) {
      query.name = { $regex: search, $options: 'i' }
    }
    if (status) {
      query.status = status
    }

    const tournaments = await Tournament.find(query)
      .populate('createdBy', 'username name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean()

    const totalTournaments = await Tournament.countDocuments(query)

    res.json({
      success: true,
      data: {
        tournaments,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(totalTournaments / limit),
          limit: parseInt(limit),
          totalTournaments
        }
      }
    })
  } catch (error) {
    console.error('Admin tournaments error:', error)
    res.status(500).json({ success: false, message: 'Failed to load tournaments' })
  }
})

// Worlds management
router.get('/worlds', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query
    
    const query = { isActive: true }
    if (search) {
      query.name = { $regex: search, $options: 'i' }
    }

    const worlds = await World.find(query)
      .populate('createdBy', 'username name')
      .populate('tournaments', 'name status')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean()

    const totalWorlds = await World.countDocuments(query)

    res.json({
      success: true,
      data: {
        worlds,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(totalWorlds / limit),
          limit: parseInt(limit),
          totalWorlds
        }
      }
    })
  } catch (error) {
    console.error('Admin worlds error:', error)
    res.status(500).json({ success: false, message: 'Failed to load worlds' })
  }
})

// Membership analytics
router.get('/membership/analytics', authenticateAdmin, async (req, res) => {
  try {
    const analytics = await MembershipService.getMembershipAnalytics()
    
    // Additional analytics
    const [
      recentUpgrades,
      expiringMemberships,
      usageStats
    ] = await Promise.all([
      Membership.find({ plan: { $ne: 'free' } })
        .sort({ updatedAt: -1 })
        .limit(10)
        .populate('user', 'username name')
        .lean(),
      Membership.find({ 
        endDate: { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
        status: 'active',
        plan: { $ne: 'free' }
      })
        .populate('user', 'username name')
        .lean(),
      Membership.aggregate([
        {
          $group: {
            _id: null,
            totalTournaments: { $sum: '$tournamentsCreated' },
            totalWorlds: { $sum: '$worldsCreated' },
            avgTournaments: { $avg: '$tournamentsCreated' },
            avgWorlds: { $avg: '$worldsCreated' }
          }
        }
      ])
    ])

    res.json({
      success: true,
      data: {
        ...analytics,
        recentUpgrades,
        expiringMemberships,
        usageStats: usageStats[0] || {}
      }
    })
  } catch (error) {
    console.error('Admin membership analytics error:', error)
    res.status(500).json({ success: false, message: 'Failed to load analytics' })
  }
})

// System operations
router.post('/system/cleanup-expired', authenticateAdmin, async (req, res) => {
  try {
    const expiredCount = await MembershipService.checkExpiredMemberships()
    
    res.json({
      success: true,
      message: `Processed ${expiredCount} expired memberships`,
      data: { expiredCount }
    })
  } catch (error) {
    console.error('Admin cleanup error:', error)
    res.status(500).json({ success: false, message: 'Failed to cleanup expired memberships' })
  }
})

// Delete tournament (admin only)
router.delete('/tournaments/:id', authenticateAdmin, async (req, res) => {
  try {
    const tournament = await Tournament.findByIdAndDelete(req.params.id)
    
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' })
    }

    res.json({
      success: true,
      message: 'Tournament deleted successfully'
    })
  } catch (error) {
    console.error('Admin delete tournament error:', error)
    res.status(500).json({ success: false, message: 'Failed to delete tournament' })
  }
})

// Delete world (admin only)
router.delete('/worlds/:id', authenticateAdmin, async (req, res) => {
  try {
    const world = await World.findById(req.params.id)
    
    if (!world) {
      return res.status(404).json({ success: false, message: 'World not found' })
    }

    world.isActive = false
    await world.save()

    res.json({
      success: true,
      message: 'World deleted successfully'
    })
  } catch (error) {
    console.error('Admin delete world error:', error)
    res.status(500).json({ success: false, message: 'Failed to delete world' })
  }
})

// ===============================
// DATA MANAGEMENT ROUTES
// ===============================

// Get data overview
router.get('/data/overview', authenticateAdmin, async (req, res) => {
  try {
    const overview = await DataManagementService.getDataOverview()
    
    res.json({
      success: true,
      data: overview
    })
  } catch (error) {
    console.error('Admin data overview error:', error)
    res.status(500).json({ success: false, message: 'Failed to load data overview' })
  }
})

// Countries management
router.get('/data/countries', authenticateAdmin, async (req, res) => {
  try {
    const countries = await DataManagementService.getCountries()
    
    res.json({
      success: true,
      data: countries
    })
  } catch (error) {
    console.error('Admin countries error:', error)
    res.status(500).json({ success: false, message: 'Failed to load countries' })
  }
})

router.post('/data/countries', authenticateAdmin, async (req, res) => {
  try {
    await DataManagementService.addCountry(req.body)
    
    res.json({
      success: true,
      message: 'Country added successfully'
    })
  } catch (error) {
    console.error('Admin add country error:', error)
    res.status(400).json({ success: false, message: error.message })
  }
})

router.put('/data/countries/:code', authenticateAdmin, async (req, res) => {
  try {
    await DataManagementService.updateCountry(req.params.code, req.body)
    
    res.json({
      success: true,
      message: 'Country updated successfully'
    })
  } catch (error) {
    console.error('Admin update country error:', error)
    res.status(400).json({ success: false, message: error.message })
  }
})

router.delete('/data/countries/:code', authenticateAdmin, async (req, res) => {
  try {
    await DataManagementService.deleteCountry(req.params.code)
    
    res.json({
      success: true,
      message: 'Country deleted successfully'
    })
  } catch (error) {
    console.error('Admin delete country error:', error)
    res.status(400).json({ success: false, message: error.message })
  }
})

// Confederations management
router.get('/data/confederations', authenticateAdmin, async (req, res) => {
  try {
    const confederations = await DataManagementService.getConfederations()
    
    res.json({
      success: true,
      data: confederations
    })
  } catch (error) {
    console.error('Admin confederations error:', error)
    res.status(500).json({ success: false, message: 'Failed to load confederations' })
  }
})

router.put('/data/confederations/:id', authenticateAdmin, async (req, res) => {
  try {
    await DataManagementService.updateConfederation(req.params.id, req.body)
    
    res.json({
      success: true,
      message: 'Confederation updated successfully'
    })
  } catch (error) {
    console.error('Admin update confederation error:', error)
    res.status(400).json({ success: false, message: error.message })
  }
})

// Cities management
router.get('/data/cities', authenticateAdmin, async (req, res) => {
  try {
    const cities = await DataManagementService.getCities()
    
    res.json({
      success: true,
      data: cities
    })
  } catch (error) {
    console.error('Admin cities error:', error)
    res.status(500).json({ success: false, message: 'Failed to load cities' })
  }
})

router.post('/data/cities', authenticateAdmin, async (req, res) => {
  try {
    await DataManagementService.addCity(req.body)
    
    res.json({
      success: true,
      message: 'City added successfully'
    })
  } catch (error) {
    console.error('Admin add city error:', error)
    res.status(400).json({ success: false, message: error.message })
  }
})

router.put('/data/cities/:id', authenticateAdmin, async (req, res) => {
  try {
    await DataManagementService.updateCity(req.params.id, req.body)
    
    res.json({
      success: true,
      message: 'City updated successfully'
    })
  } catch (error) {
    console.error('Admin update city error:', error)
    res.status(400).json({ success: false, message: error.message })
  }
})

router.delete('/data/cities/:id', authenticateAdmin, async (req, res) => {
  try {
    await DataManagementService.deleteCity(req.params.id)
    
    res.json({
      success: true,
      message: 'City deleted successfully'
    })
  } catch (error) {
    console.error('Admin delete city error:', error)
    res.status(400).json({ success: false, message: error.message })
  }
})

// Tactics management
router.get('/data/tactics', authenticateAdmin, async (req, res) => {
  try {
    const tactics = await DataManagementService.getTactics()
    
    res.json({
      success: true,
      data: tactics
    })
  } catch (error) {
    console.error('Admin tactics error:', error)
    res.status(500).json({ success: false, message: 'Failed to load tactics' })
  }
})

router.post('/data/tactics', authenticateAdmin, async (req, res) => {
  try {
    await DataManagementService.addTactic(req.body)
    
    res.json({
      success: true,
      message: 'Formation added successfully'
    })
  } catch (error) {
    console.error('Admin add tactic error:', error)
    res.status(400).json({ success: false, message: error.message })
  }
})

router.put('/data/tactics/:name', authenticateAdmin, async (req, res) => {
  try {
    await DataManagementService.updateTactic(req.params.name, req.body)
    
    res.json({
      success: true,
      message: 'Formation updated successfully'
    })
  } catch (error) {
    console.error('Admin update tactic error:', error)
    res.status(400).json({ success: false, message: error.message })
  }
})

router.delete('/data/tactics/:name', authenticateAdmin, async (req, res) => {
  try {
    await DataManagementService.deleteTactic(req.params.name)
    
    res.json({
      success: true,
      message: 'Formation deleted successfully'
    })
  } catch (error) {
    console.error('Admin delete tactic error:', error)
    res.status(400).json({ success: false, message: error.message })
  }
})

// World Cup History management
router.get('/data/history', authenticateAdmin, async (req, res) => {
  try {
    const history = await DataManagementService.getWorldCupHistory()
    
    res.json({
      success: true,
      data: history
    })
  } catch (error) {
    console.error('Admin history error:', error)
    res.status(500).json({ success: false, message: 'Failed to load World Cup history' })
  }
})

router.post('/data/history', authenticateAdmin, async (req, res) => {
  try {
    await DataManagementService.addWorldCupEntry(req.body)
    
    res.json({
      success: true,
      message: 'World Cup entry added successfully'
    })
  } catch (error) {
    console.error('Admin add history error:', error)
    res.status(400).json({ success: false, message: error.message })
  }
})

router.put('/data/history/:year', authenticateAdmin, async (req, res) => {
  try {
    await DataManagementService.updateWorldCupEntry(parseInt(req.params.year), req.body)
    
    res.json({
      success: true,
      message: 'World Cup entry updated successfully'
    })
  } catch (error) {
    console.error('Admin update history error:', error)
    res.status(400).json({ success: false, message: error.message })
  }
})

router.delete('/data/history/:year', authenticateAdmin, async (req, res) => {
  try {
    await DataManagementService.deleteWorldCupEntry(parseInt(req.params.year))
    
    res.json({
      success: true,
      message: 'World Cup entry deleted successfully'
    })
  } catch (error) {
    console.error('Admin delete history error:', error)
    res.status(400).json({ success: false, message: error.message })
  }
})

// Player Names management
router.get('/data/player-names', authenticateAdmin, async (req, res) => {
  try {
    const playerNames = await DataManagementService.getPlayerNames()
    
    res.json({
      success: true,
      data: playerNames
    })
  } catch (error) {
    console.error('Admin player names error:', error)
    res.status(500).json({ success: false, message: 'Failed to load player names' })
  }
})

router.put('/data/player-names/:region', authenticateAdmin, async (req, res) => {
  try {
    await DataManagementService.updatePlayerNamesRegion(req.params.region, req.body)
    
    res.json({
      success: true,
      message: 'Player names updated successfully'
    })
  } catch (error) {
    console.error('Admin update player names error:', error)
    res.status(400).json({ success: false, message: error.message })
  }
})

router.post('/data/player-names/:region', authenticateAdmin, async (req, res) => {
  try {
    await DataManagementService.addPlayerNamesRegion(req.params.region, req.body)
    
    res.json({
      success: true,
      message: 'Player names region added successfully'
    })
  } catch (error) {
    console.error('Admin add player names error:', error)
    res.status(400).json({ success: false, message: error.message })
  }
})

router.delete('/data/player-names/:region', authenticateAdmin, async (req, res) => {
  try {
    await DataManagementService.deletePlayerNamesRegion(req.params.region)
    
    res.json({
      success: true,
      message: 'Player names region deleted successfully'
    })
  } catch (error) {
    console.error('Admin delete player names error:', error)
    res.status(400).json({ success: false, message: error.message })
  }
})

// Backup and restore
router.post('/data/backup', authenticateAdmin, async (req, res) => {
  try {
    const backupPath = await DataManagementService.createBackup()
    
    res.json({
      success: true,
      message: 'Backup created successfully',
      data: { backupPath }
    })
  } catch (error) {
    console.error('Admin backup error:', error)
    res.status(500).json({ success: false, message: 'Failed to create backup' })
  }
})

router.post('/data/restore', authenticateAdmin, async (req, res) => {
  try {
    await DataManagementService.restoreBackup(req.body)
    
    res.json({
      success: true,
      message: 'Data restored successfully'
    })
  } catch (error) {
    console.error('Admin restore error:', error)
    res.status(400).json({ success: false, message: error.message })
  }
})

export default router