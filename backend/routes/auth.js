import express from 'express'
import UserService from '../services/UserService.js'
import CaptchaService from '../services/CaptchaService.js'
import { generateToken, authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' })
    }

    const user = await UserService.findByUsername(username)
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = generateToken(user)
    res.json({ 
      token, 
      username: user.username,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        createdAt: user.createdAt
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await UserService.findById(req.user.userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({
      id: user._id,
      username: user.username,
      name: user.name,
      createdAt: user.createdAt
    })
  } catch (error) {
    console.error('Profile error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logged out successfully' })
})

router.get('/captcha', async (req, res) => {
  try {
    const captcha = await CaptchaService.generateCaptcha()
    res.json(captcha)
  } catch (error) {
    console.error('Captcha generation error:', error)
    res.status(500).json({ error: 'Failed to generate captcha' })
  }
})

router.post('/register', async (req, res) => {
  try {
    const { username, name, password, confirmPassword, captchaId, captchaAnswer } = req.body

    // Validation
    if (!username || !name || !password || !confirmPassword || !captchaId || !captchaAnswer) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long' })
    }

    if (name.length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters long' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' })
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' })
    }

    // Verify captcha
    if (!(await CaptchaService.verifyCaptcha(captchaId, captchaAnswer))) {
      return res.status(400).json({ error: 'Invalid captcha answer' })
    }

    // Check if username is available
    if (!(await UserService.isUsernameAvailable(username))) {
      return res.status(400).json({ error: 'Username already exists' })
    }

    // Create user
    const user = await UserService.createUser(username, name, password)
    const token = generateToken(user)

    res.status(201).json({
      token,
      username: user.username,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        createdAt: user.createdAt
      },
      message: 'User registered successfully'
    })
  } catch (error) {
    console.error('Registration error:', error)
    if (error.message === 'Username already exists') {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router