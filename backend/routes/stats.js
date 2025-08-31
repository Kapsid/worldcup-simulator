import express from 'express'
import UserStatsService from '../services/UserStatsService.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Get current user's statistics
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id
    console.log(`📊 Getting user stats for user ${userId}`)
    
    const stats = await UserStatsService.getUserStats(userId)
    
    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Error getting user stats:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get user statistics'
    })
  }
})

// Get specific user's statistics (by user ID - admin or public)
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params
    const requestingUserId = req.user.userId || req.user.id
    
    // For now, only allow users to see their own stats
    // In the future, you might want to add public profile viewing
    if (userId !== requestingUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }
    
    const stats = await UserStatsService.getUserStats(userId)
    
    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Error getting user stats:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get user statistics'
    })
  }
})

// Get leaderboard (top users by various metrics)
router.get('/leaderboard', authenticateToken, async (req, res) => {
  try {
    const leaderboard = await UserStatsService.getLeaderboardStats()
    
    res.json({
      success: true,
      data: leaderboard
    })
  } catch (error) {
    console.error('Error getting leaderboard:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get leaderboard'
    })
  }
})

// Get user's achievements only
router.get('/achievements', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id
    const stats = await UserStatsService.getUserStats(userId)
    
    res.json({
      success: true,
      data: {
        achievements: stats.achievements,
        totalAchievements: stats.achievements.length,
        unlockedAchievements: stats.achievements.filter(a => a.unlocked).length
      }
    })
  } catch (error) {
    console.error('Error getting user achievements:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get user achievements'
    })
  }
})

export default router