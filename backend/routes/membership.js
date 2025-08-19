import express from 'express'
import MembershipService from '../services/MembershipService.js'
import { authenticateToken } from '../middleware/auth.js'
import { checkAdminAccess } from '../middleware/membershipMiddleware.js'

const router = express.Router()

// Get current user's membership status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id
    const membershipStatus = await MembershipService.getMembershipStatus(userId)
    
    res.json({
      success: true,
      data: membershipStatus
    })
  } catch (error) {
    console.error('Error getting membership status:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get membership status'
    })
  }
})

// Get available membership plans
router.get('/plans', async (req, res) => {
  try {
    const plans = MembershipService.getAvailablePlans()
    
    res.json({
      success: true,
      data: plans
    })
  } catch (error) {
    console.error('Error getting membership plans:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get membership plans'
    })
  }
})

// Update user's membership plan (admin only for now, later integrate with payment)
router.post('/upgrade', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id
    const { plan } = req.body
    
    if (!plan) {
      return res.status(400).json({
        success: false,
        message: 'Plan is required'
      })
    }
    
    const validPlans = ['free', 'pro', 'football_maniac']
    if (!validPlans.includes(plan)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan'
      })
    }
    
    const updatedMembership = await MembershipService.updateMembershipPlan(userId, plan)
    
    res.json({
      success: true,
      message: `Successfully upgraded to ${plan} plan`,
      data: updatedMembership
    })
  } catch (error) {
    console.error('Error upgrading membership:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to upgrade membership'
    })
  }
})

// Cancel membership (downgrade to free)
router.post('/cancel', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id
    
    const membership = await MembershipService.updateMembershipPlan(userId, 'free')
    
    res.json({
      success: true,
      message: 'Membership cancelled successfully',
      data: membership
    })
  } catch (error) {
    console.error('Error cancelling membership:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to cancel membership'
    })
  }
})

// Check if user can create tournament
router.get('/check/tournament', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id
    const canCreate = await MembershipService.canCreateTournament(userId)
    const membershipStatus = await MembershipService.getMembershipStatus(userId)
    
    res.json({
      success: true,
      data: {
        canCreate,
        currentUsage: membershipStatus.usage.tournaments,
        limit: membershipStatus.limits.tournaments,
        plan: membershipStatus.plan
      }
    })
  } catch (error) {
    console.error('Error checking tournament permission:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to check tournament permission'
    })
  }
})

// Check if user can create world
router.get('/check/world', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id
    const canCreate = await MembershipService.canCreateWorld(userId)
    const membershipStatus = await MembershipService.getMembershipStatus(userId)
    
    res.json({
      success: true,
      data: {
        canCreate,
        currentUsage: membershipStatus.usage.worlds,
        limit: membershipStatus.limits.worlds,
        plan: membershipStatus.plan
      }
    })
  } catch (error) {
    console.error('Error checking world permission:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to check world permission'
    })
  }
})

// Check if user can modify stats
router.get('/check/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id
    const canModify = await MembershipService.canModifyStats(userId)
    const membershipStatus = await MembershipService.getMembershipStatus(userId)
    
    res.json({
      success: true,
      data: {
        canModify,
        plan: membershipStatus.plan,
        requiredPlan: 'football_maniac'
      }
    })
  } catch (error) {
    console.error('Error checking stats permission:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to check stats permission'
    })
  }
})

// Debug endpoint to set membership (admin only)
router.post('/debug/set-plan', authenticateToken, checkAdminAccess, async (req, res) => {
  try {
    const { userId, plan } = req.body
    
    if (!userId || !plan) {
      return res.status(400).json({
        success: false,
        message: 'userId and plan are required'
      })
    }
    
    const validPlans = ['free', 'pro', 'football_maniac']
    if (!validPlans.includes(plan)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan'
      })
    }
    
    const updatedMembership = await MembershipService.updateMembershipPlan(userId, plan)
    
    res.json({
      success: true,
      message: `Debug: Set user ${userId} to ${plan} plan`,
      data: updatedMembership
    })
  } catch (error) {
    console.error('Error setting debug membership:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to set debug membership'
    })
  }
})

// Debug endpoint to reset usage counters (admin only)
router.post('/debug/reset-usage', authenticateToken, checkAdminAccess, async (req, res) => {
  try {
    const { userId } = req.body
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required'
      })
    }
    
    const membership = await MembershipService.resetUsageCounters(userId)
    
    res.json({
      success: true,
      message: `Debug: Reset usage counters for user ${userId}`,
      data: membership
    })
  } catch (error) {
    console.error('Error resetting usage counters:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to reset usage counters'
    })
  }
})

// Admin endpoint to get membership analytics
router.get('/admin/analytics', authenticateToken, checkAdminAccess, async (req, res) => {
  try {
    const analytics = await MembershipService.getMembershipAnalytics()
    
    res.json({
      success: true,
      data: analytics
    })
  } catch (error) {
    console.error('Error getting membership analytics:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get membership analytics'
    })
  }
})

// Admin endpoint to check and process expired memberships
router.post('/admin/check-expired', authenticateToken, checkAdminAccess, async (req, res) => {
  try {
    const expiredCount = await MembershipService.checkExpiredMemberships()
    
    res.json({
      success: true,
      message: `Processed ${expiredCount} expired memberships`,
      data: { expiredCount }
    })
  } catch (error) {
    console.error('Error checking expired memberships:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to check expired memberships'
    })
  }
})

export default router