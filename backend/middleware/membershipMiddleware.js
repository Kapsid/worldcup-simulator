import MembershipService from '../services/MembershipService.js'

// Middleware to check if user can create tournaments
export const checkTournamentCreation = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id
    
    const canCreate = await MembershipService.canCreateTournament(userId)
    
    if (!canCreate) {
      const membership = await MembershipService.getMembershipStatus(userId)
      return res.status(403).json({
        error: 'Tournament creation limit reached',
        message: `Your ${membership.limits.name} plan allows ${membership.limits.tournaments === -1 ? 'unlimited' : membership.limits.tournaments} tournament(s). You have created ${membership.usage.tournaments}.`,
        currentPlan: membership.plan,
        limits: membership.limits,
        usage: membership.usage,
        upgradeRequired: true
      })
    }
    
    next()
  } catch (error) {
    console.error('Error in tournament creation middleware:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Middleware to check if user can create worlds
export const checkWorldCreation = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id
    
    const canCreate = await MembershipService.canCreateWorld(userId)
    
    if (!canCreate) {
      const membership = await MembershipService.getMembershipStatus(userId)
      return res.status(403).json({
        error: 'World creation limit reached',
        message: `Your ${membership.limits.name} plan allows ${membership.limits.worlds === -1 ? 'unlimited' : membership.limits.worlds} world(s). You have created ${membership.usage.worlds}.`,
        currentPlan: membership.plan,
        limits: membership.limits,
        usage: membership.usage,
        upgradeRequired: true
      })
    }
    
    next()
  } catch (error) {
    console.error('Error in world creation middleware:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Middleware to check if user can modify stats/players
export const checkStatsModification = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id
    
    const canModify = await MembershipService.canModifyStats(userId)
    
    if (!canModify) {
      const membership = await MembershipService.getMembershipStatus(userId)
      return res.status(403).json({
        error: 'Stats modification not allowed',
        message: `Player and stats modification is only available for Football Maniac subscribers. Your current plan: ${membership.limits.name}`,
        currentPlan: membership.plan,
        limits: membership.limits,
        upgradeRequired: true,
        requiredPlan: 'football_maniac'
      })
    }
    
    next()
  } catch (error) {
    console.error('Error in stats modification middleware:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Middleware to check if membership is active
export const checkActiveMembership = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id
    
    const membership = await MembershipService.getMembership(userId)
    
    if (!membership.isActive) {
      return res.status(403).json({
        error: 'Inactive membership',
        message: 'Your membership is not active. Please renew your subscription.',
        currentPlan: membership.plan,
        status: membership.status,
        isExpired: membership.isExpired,
        upgradeRequired: true
      })
    }
    
    next()
  } catch (error) {
    console.error('Error in active membership middleware:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Middleware to attach membership info to request
export const attachMembershipInfo = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id
    
    const membershipStatus = await MembershipService.getMembershipStatus(userId)
    req.membership = membershipStatus
    
    next()
  } catch (error) {
    console.error('Error attaching membership info:', error)
    // Don't block the request if we can't get membership info
    req.membership = null
    next()
  }
}

// Middleware to increment tournament usage after successful creation
export const incrementTournamentUsage = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id
    await MembershipService.incrementTournamentUsage(userId)
    next()
  } catch (error) {
    console.error('Error incrementing tournament usage:', error)
    // Don't block the response if usage tracking fails
    next()
  }
}

// Middleware to increment world usage after successful creation
export const incrementWorldUsage = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id
    await MembershipService.incrementWorldUsage(userId)
    next()
  } catch (error) {
    console.error('Error incrementing world usage:', error)
    // Don't block the response if usage tracking fails
    next()
  }
}

// Admin middleware to check if user has admin privileges
export const checkAdminAccess = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id
    
    // Check if user is admin (you might want to add an isAdmin field to User model)
    const User = await import('../models/User.js')
    const user = await User.default.findById(userId)
    
    if (!user || user.username !== 'admin') {
      return res.status(403).json({
        error: 'Admin access required',
        message: 'This endpoint requires administrator privileges'
      })
    }
    
    next()
  } catch (error) {
    console.error('Error in admin access middleware:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export default {
  checkTournamentCreation,
  checkWorldCreation,
  checkStatsModification,
  checkActiveMembership,
  attachMembershipInfo,
  incrementTournamentUsage,
  incrementWorldUsage,
  checkAdminAccess
}