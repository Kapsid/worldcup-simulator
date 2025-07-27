import User from '../models/User.js'

class UserService {
  constructor() {
    this.initializeUsers()
  }

  async initializeUsers() {
    try {
      // Check if admin user already exists
      const adminExists = await User.findOne({ username: 'admin' })
      if (!adminExists) {
        // Create admin user
        const adminUser = new User({
          username: 'admin',
          name: 'Administrator',
          password: 'admin123'
        })
        await adminUser.save()
      }
    } catch (error) {
      console.error('Error initializing users:', error)
    }
  }

  async findByUsername(username) {
    try {
      return await User.findOne({ username })
    } catch (error) {
      console.error('Error finding user by username:', error)
      return null
    }
  }

  async findById(id) {
    try {
      return await User.findById(id)
    } catch (error) {
      console.error('Error finding user by id:', error)
      return null
    }
  }

  async createUser(username, name, password) {
    try {
      // Check if username already exists
      const existingUser = await User.findOne({ username })
      if (existingUser) {
        throw new Error('Username already exists')
      }

      const newUser = new User({
        username,
        name,
        password
      })

      await newUser.save()
      return newUser
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Username already exists')
      }
      throw error
    }
  }

  async isUsernameAvailable(username) {
    try {
      const user = await User.findOne({ username })
      return !user
    } catch (error) {
      console.error('Error checking username availability:', error)
      return false
    }
  }

  async getAllUsers() {
    try {
      const users = await User.find({}, '-password')
      return users
    } catch (error) {
      console.error('Error getting all users:', error)
      return []
    }
  }

  async updateProfile(userId, updateData) {
    try {
      const allowedFields = ['name', 'email', 'username']
      const filteredData = {}
      
      // Only allow specific fields to be updated
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field]
        }
      }

      // Check if username is being changed and is available
      if (filteredData.username) {
        const existingUser = await User.findOne({ 
          username: filteredData.username, 
          _id: { $ne: userId } 
        })
        if (existingUser) {
          throw new Error('Username already exists')
        }
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        filteredData,
        { new: true, runValidators: true }
      ).select('-password')

      return updatedUser
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  async updatePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findById(userId)
      if (!user) {
        throw new Error('User not found')
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword)
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect')
      }

      // Update password
      user.password = newPassword
      await user.save()

      return { message: 'Password updated successfully' }
    } catch (error) {
      console.error('Error updating password:', error)
      throw error
    }
  }

  async updateSubscription(userId, subscriptionTier) {
    try {
      const allowedTiers = ['basic', 'pro', 'football_maniac']
      if (!allowedTiers.includes(subscriptionTier)) {
        throw new Error('Invalid subscription tier')
      }

      const updateData = {
        subscriptionTier,
        subscriptionStatus: 'active'
      }

      // Set expiration date for paid tiers
      if (subscriptionTier !== 'basic') {
        const expirationDate = new Date()
        expirationDate.setMonth(expirationDate.getMonth() + 1) // 1 month from now
        updateData.subscriptionExpiresAt = expirationDate
      } else {
        updateData.subscriptionExpiresAt = null
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      ).select('-password')

      return updatedUser
    } catch (error) {
      console.error('Error updating subscription:', error)
      throw error
    }
  }

  async getUserProfile(userId) {
    try {
      const user = await User.findById(userId).select('-password')
      return user
    } catch (error) {
      console.error('Error getting user profile:', error)
      throw error
    }
  }
}

export default new UserService()