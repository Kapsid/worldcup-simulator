import express from 'express'
import TournamentNewsService from '../services/TournamentNewsService.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Get tournament news
router.get('/:tournamentId', authenticateToken, async (req, res) => {
  try {
    const { category, type, isRead, limit = 50, offset = 0 } = req.query
    
    const options = {
      category: category || null,
      type: type || null,
      isRead: isRead !== undefined ? isRead === 'true' : null,
      limit: parseInt(limit),
      offset: parseInt(offset)
    }

    const news = await TournamentNewsService.getNews(req.params.tournamentId, options)
    res.json(news)
  } catch (error) {
    console.error('Error getting tournament news:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get unread count
router.get('/:tournamentId/unread-count', authenticateToken, async (req, res) => {
  try {
    const count = await TournamentNewsService.getUnreadCount(req.params.tournamentId)
    res.json({ count })
  } catch (error) {
    console.error('Error getting unread count:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Mark news item as read
router.put('/:newsId/read', authenticateToken, async (req, res) => {
  try {
    const news = await TournamentNewsService.markAsRead(req.params.newsId)
    res.json(news)
  } catch (error) {
    console.error('Error marking news as read:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Mark all news as read for tournament
router.put('/:tournamentId/mark-all-read', authenticateToken, async (req, res) => {
  try {
    const result = await TournamentNewsService.markAllAsRead(req.params.tournamentId)
    res.json({ message: 'All news marked as read', modifiedCount: result.modifiedCount })
  } catch (error) {
    console.error('Error marking all news as read:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create manual news item (for testing or manual announcements)
router.post('/:tournamentId', authenticateToken, async (req, res) => {
  try {
    const { type, category, title, message, data = {}, priority = 'medium' } = req.body

    if (!type || !title || !message) {
      return res.status(400).json({ error: 'Type, title, and message are required' })
    }

    const news = await TournamentNewsService.createNews(
      req.params.tournamentId,
      type,
      category || 'general',
      title,
      message,
      data,
      priority
    )

    res.status(201).json(news)
  } catch (error) {
    console.error('Error creating tournament news:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router