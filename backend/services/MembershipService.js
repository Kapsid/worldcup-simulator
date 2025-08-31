import Membership from '../models/Membership.js'
import User from '../models/User.js'

class MembershipService {
  constructor() {
    this.initializeDefaultMemberships()
  }

  async initializeDefaultMemberships() {
    try {
      // Create default membership for any existing users that don't have one
      const usersWithoutMembership = await User.find({}).lean()
      
      for (const user of usersWithoutMembership) {
        const existingMembership = await Membership.findOne({ user: user._id })
        if (!existingMembership) {
          await this.createMembership(user._id, 'basic')
        }
      }
    } catch (error) {
      console.error('Error initializing default memberships:', error)
    }
  }

  // Create a new membership for a user
  async createMembership(userId, plan = 'basic') {
    try {
      // Check if membership already exists
      const existingMembership = await Membership.findOne({ user: userId })
      if (existingMembership) {
        throw new Error('User already has a membership')
      }

      const membership = new Membership({
        user: userId,
        plan,
        status: 'active'
      })

      await membership.save()

      // Sync the User model's subscriptionTier
      try {
        const User = (await import('../models/User.js')).default
        await User.findByIdAndUpdate(userId, { subscriptionTier: plan })
      } catch (userError) {
        console.error('Error syncing user subscription tier on creation:', userError)
      }

      return membership
    } catch (error) {
      console.error('Error creating membership:', error)
      throw error
    }
  }

  // Get membership for a user
  async getMembership(userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required')
      }
      
      let membership = await Membership.findOne({ user: userId }).populate('user', 'username name')
      
      // If no membership exists, create one
      if (!membership) {
        // Check if user is admin to create admin membership
        const User = (await import('../models/User.js')).default
        const user = await User.findById(userId)
        const plan = user && user.username === 'admin' ? 'admin' : 'basic'
        membership = await this.createMembership(userId, plan)
        membership = await Membership.findById(membership._id).populate('user', 'username name')
      }
      
      // Upgrade admin users to admin plan if they have a different plan
      if (membership.user && membership.user.username === 'admin' && membership.plan !== 'admin') {
        membership.plan = 'admin'
        await membership.save()
      }

      return membership
    } catch (error) {
      console.error('Error getting membership:', error)
      throw error
    }
  }

  // Update membership plan
  async updateMembershipPlan(userId, newPlan) {
    try {
      const validPlans = ['basic', 'pro', 'admin']
      if (!validPlans.includes(newPlan)) {
        throw new Error('Invalid membership plan')
      }

      let membership = await Membership.findOne({ user: userId })
      
      if (!membership) {
        membership = await this.createMembership(userId, newPlan)
      } else {
        membership.plan = newPlan
        membership.status = 'active'
        
        // Set expiration for paid plans (30 days from now)
        if (newPlan !== 'basic') {
          membership.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        } else {
          membership.endDate = null
        }
        
        await membership.save()
      }

      // Sync the User model's subscriptionTier
      try {
        const User = (await import('../models/User.js')).default
        await User.findByIdAndUpdate(userId, { subscriptionTier: newPlan })
      } catch (userError) {
        console.error('Error syncing user subscription tier:', userError)
      }

      return membership
    } catch (error) {
      console.error('Error updating membership plan:', error)
      throw error
    }
  }

  // Check if user can create tournament
  async canCreateTournament(userId) {
    try {
      const membership = await this.getMembership(userId)
      return membership.canCreateTournament()
    } catch (error) {
      console.error('Error checking tournament creation permission:', error)
      return false
    }
  }

  // Check if user can create world
  async canCreateWorld(userId) {
    try {
      const membership = await this.getMembership(userId)
      return membership.canCreateWorld()
    } catch (error) {
      console.error('Error checking world creation permission:', error)
      return false
    }
  }

  // Check if user can modify stats/players
  async canModifyStats(userId) {
    try {
      const membership = await this.getMembership(userId)
      return membership.canModifyStats()
    } catch (error) {
      console.error('Error checking stats modification permission:', error)
      return false
    }
  }

  // Increment tournament usage counter
  async incrementTournamentUsage(userId) {
    try {
      const membership = await this.getMembership(userId)
      await membership.incrementTournamentUsage()
      return membership
    } catch (error) {
      console.error('Error incrementing tournament usage:', error)
      throw error
    }
  }

  // Increment world usage counter
  async incrementWorldUsage(userId) {
    try {
      const membership = await this.getMembership(userId)
      await membership.incrementWorldUsage()
      return membership
    } catch (error) {
      console.error('Error incrementing world usage:', error)
      throw error
    }
  }

  // Get membership limits and current usage
  async getMembershipStatus(userId) {
    try {
      const membership = await this.getMembership(userId)
      const limits = membership.getPlanLimits()
      
      // Count only standalone tournaments (not world tournaments)
      const Tournament = (await import('../models/Tournament.js')).default
      const standaloneTournamentCount = await Tournament.countDocuments({
        createdBy: userId,
        worldId: { $exists: false }
      })
      
      return {
        plan: membership.plan,
        status: membership.status,
        isActive: membership.isActive,
        isExpired: membership.isExpired,
        endDate: membership.endDate,
        limits,
        usage: {
          tournaments: standaloneTournamentCount, // Only count standalone tournaments
          worlds: membership.worldsCreated
        },
        permissions: {
          canCreateTournament: await membership.canCreateTournament(), // Now async
          canCreateWorld: membership.canCreateWorld(),
          canModifyStats: membership.canModifyStats()
        }
      }
    } catch (error) {
      console.error('Error getting membership status:', error)
      throw error
    }
  }

  // Cancel membership (for paid plans)
  async cancelMembership(userId) {
    try {
      const membership = await Membership.findOne({ user: userId })
      if (!membership) {
        throw new Error('Membership not found')
      }

      if (membership.plan === 'basic') {
        throw new Error('Cannot cancel basic membership')
      }

      membership.status = 'cancelled'
      await membership.save()

      return membership
    } catch (error) {
      console.error('Error cancelling membership:', error)
      throw error
    }
  }

  // Reactivate cancelled membership
  async reactivateMembership(userId) {
    try {
      const membership = await Membership.findOne({ user: userId })
      if (!membership) {
        throw new Error('Membership not found')
      }

      if (membership.status !== 'cancelled') {
        throw new Error('Membership is not cancelled')
      }

      membership.status = 'active'
      await membership.save()

      return membership
    } catch (error) {
      console.error('Error reactivating membership:', error)
      throw error
    }
  }

  // Get all available plans
  getAvailablePlans() {
    return {
      basic: {
        name: 'Basic',
        tournaments: 1, // 1 standalone tournament
        worlds: 1, // 1 world with unlimited tournaments
        canModifyStats: false,
        price: 0,
        description: 'Perfect for trying out the platform',
        features: [
          '1 tournament separately',
          '1 world (unlimited tournaments inside)',
          'Basic simulation features',
          'Community support'
        ],
        highlight: 'Get started for free!'
      },
      pro: {
        name: 'Pro',
        tournaments: -1, // Unlimited
        worlds: -1, // Unlimited
        canModifyStats: true,
        price: 7.99,
        description: 'Unlimited access to all features',
        features: [
          'Unlimited tournaments',
          'Unlimited worlds',
          'Advanced statistics',
          'Player & stats editing',
          'Priority support'
        ],
        highlight: 'Everything unlimited!'
      }
    }
  }

  // Check and handle expired memberships
  async checkExpiredMemberships() {
    try {
      const expiredMemberships = await Membership.find({
        endDate: { $lt: new Date() },
        status: 'active',
        plan: { $ne: 'basic' }
      })

      for (const membership of expiredMemberships) {
        membership.status = 'expired'
        membership.plan = 'basic'
        membership.endDate = null
        membership.tournamentsCreated = 0
        membership.worldsCreated = 0
        await membership.save()
      }

      return expiredMemberships.length
    } catch (error) {
      console.error('Error checking expired memberships:', error)
      return 0
    }
  }

  // Reset usage counters (admin function)
  async resetUsageCounters(userId) {
    try {
      const membership = await Membership.findOne({ user: userId })
      if (!membership) {
        throw new Error('Membership not found')
      }

      membership.tournamentsCreated = 0
      membership.worldsCreated = 0
      await membership.save()

      return membership
    } catch (error) {
      console.error('Error resetting usage counters:', error)
      throw error
    }
  }

  // Get membership analytics (admin function)
  async getMembershipAnalytics() {
    try {
      const analytics = await Membership.aggregate([
        {
          $group: {
            _id: '$plan',
            count: { $sum: 1 },
            totalTournaments: { $sum: '$tournamentsCreated' },
            totalWorlds: { $sum: '$worldsCreated' }
          }
        }
      ])

      const totalUsers = await Membership.countDocuments()
      const activeUsers = await Membership.countDocuments({ status: 'active' })
      const expiredUsers = await Membership.countDocuments({ status: 'expired' })

      return {
        byPlan: analytics,
        totals: {
          totalUsers,
          activeUsers,
          expiredUsers
        }
      }
    } catch (error) {
      console.error('Error getting membership analytics:', error)
      throw error
    }
  }
}

export default new MembershipService()