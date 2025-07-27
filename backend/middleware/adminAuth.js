import User from '../models/User.js'
import jwt from 'jsonwebtoken'

// Admin authentication middleware
export const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ 
        success: false,
        message: 'Access token required' 
      })
    }

    const token = authHeader.split(' ')[1]
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token format' 
      })
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
    
    // Get user from database
    const user = await User.findById(decoded.userId)
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found' 
      })
    }

    // Check if user is admin
    if (user.username !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Admin access required' 
      })
    }

    req.user = user
    next()
  } catch (error) {
    console.error('Admin auth error:', error)
    return res.status(401).json({ 
      success: false,
      message: 'Invalid or expired token' 
    })
  }
}

// Admin route protection wrapper
export const requireAdmin = (handler) => {
  return async (req, res, next) => {
    try {
      await authenticateAdmin(req, res, async () => {
        await handler(req, res, next)
      })
    } catch (error) {
      console.error('Admin route error:', error)
      res.status(500).json({ 
        success: false,
        message: 'Internal server error' 
      })
    }
  }
}