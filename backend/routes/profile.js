import express from 'express'
import UserService from '../services/UserService.js'
import { authenticateToken } from '../middleware/auth.js'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/avatars'))
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'avatar-' + req.user.userId + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    
    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  }
})

// Get user profile
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await UserService.getUserProfile(req.user.userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json(user)
  } catch (error) {
    console.error('Error getting user profile:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update user profile
router.put('/', authenticateToken, async (req, res) => {
  try {
    const { name, email, username } = req.body

    // Basic validation
    if (name && name.length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters long' })
    }

    if (username && username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long' })
    }

    if (email && email.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' })
      }
    }

    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (username !== undefined) updateData.username = username

    const updatedUser = await UserService.updateProfile(req.user.userId, updateData)
    
    res.json({
      user: updatedUser,
      message: 'Profile updated successfully'
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    if (error.message === 'Username already exists') {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update password
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' })
    }

    const result = await UserService.updatePassword(req.user.userId, currentPassword, newPassword)
    
    res.json(result)
  } catch (error) {
    console.error('Error updating password:', error)
    if (error.message === 'User not found' || error.message === 'Current password is incorrect') {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update subscription
router.put('/subscription', authenticateToken, async (req, res) => {
  try {
    const { subscriptionTier } = req.body

    if (!subscriptionTier) {
      return res.status(400).json({ error: 'Subscription tier is required' })
    }

    const updatedUser = await UserService.updateSubscription(req.user.userId, subscriptionTier)
    
    res.json({
      user: updatedUser,
      message: 'Subscription updated successfully'
    })
  } catch (error) {
    console.error('Error updating subscription:', error)
    if (error.message === 'Invalid subscription tier') {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get subscription tiers (for pricing display)
router.get('/subscription-tiers', (req, res) => {
  const tiers = [
    {
      id: 'basic',
      name: 'Basic',
      price: 0,
      currency: 'USD',
      interval: 'forever',
      features: []
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 5,
      currency: 'USD',
      interval: 'month',
      features: []
    },
    {
      id: 'football_maniac',
      name: 'Football Maniac',
      price: 10,
      currency: 'USD',
      interval: 'month',
      features: []
    }
  ]

  res.json(tiers)
})

// Update avatar (predefined)
router.put('/avatar', authenticateToken, async (req, res) => {
  try {
    const { type, avatarId, icon, color } = req.body

    if (type !== 'predefined') {
      return res.status(400).json({ error: 'Invalid avatar type' })
    }

    if (!avatarId || !icon) {
      return res.status(400).json({ error: 'Avatar ID and icon are required' })
    }

    const avatar = {
      type: 'predefined',
      avatarId,
      icon,
      color
    }

    const updatedUser = await UserService.updateAvatar(req.user.userId, avatar)
    
    res.json({
      avatar: updatedUser.avatar,
      message: 'Avatar updated successfully'
    })
  } catch (error) {
    console.error('Error updating avatar:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Upload custom avatar
router.post('/avatar/upload', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`
    const avatar = {
      type: 'upload',
      url: avatarUrl,
      filename: req.file.filename
    }

    const updatedUser = await UserService.updateAvatar(req.user.userId, avatar)
    
    res.json({
      avatar: updatedUser.avatar,
      message: 'Avatar uploaded successfully'
    })
  } catch (error) {
    console.error('Error uploading avatar:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router