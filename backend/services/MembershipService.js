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
          await this.createMembership(user._id, 'free')
        }
      }
    } catch (error) {
      console.error('Error initializing default memberships:', error)
    }
  }

  // Create a new membership for a user
  async createMembership(userId, plan = 'free') {
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
      return membership
    } catch (error) {
      console.error('Error creating membership:', error)
      throw error
    }
  }

  // Get membership for a user
  async getMembership(userId) {
    try {
      let membership = await Membership.findOne({ user: userId }).populate('user', 'username name')
      
      // If no membership exists, create a free one
      if (!membership) {
        membership = await this.createMembership(userId)
        membership = await Membership.findById(membership._id).populate('user', 'username name')
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
      const validPlans = ['free', 'pro', 'football_maniac']
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
        if (newPlan !== 'free') {
          membership.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        } else {
          membership.endDate = null
        }
        
        await membership.save()
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
      
      return {
        plan: membership.plan,
        status: membership.status,
        isActive: membership.isActive,
        isExpired: membership.isExpired,
        endDate: membership.endDate,
        limits,
        usage: {
          tournaments: membership.tournamentsCreated,
          worlds: membership.worldsCreated
        },
        permissions: {
          canCreateTournament: membership.canCreateTournament(),
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

      if (membership.plan === 'free') {
        throw new Error('Cannot cancel free membership')
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
      free: {
        name: 'Free',
        tournaments: 1,
        worlds: 1,
        canModifyStats: false,
        price: 0,
        description: 'Perfect for trying out the platform',
        features: [
          'Create 1 tournament',
          'Create 1 world',
          'Basic simulation features',
          'Community support'
        ],
        highlight: 'Get started for free!'
      },
      pro: {
        name: 'Pro',
        tournaments: 5,
        worlds: 3,
        canModifyStats: false,
        price: 9.99,
        description: 'Great for regular users who want more content',
        features: [
          'Create up to 5 tournaments',
          'Create up to 3 worlds',
          'Advanced statistics',
          'Priority support',
          'Historical data access'
        ],
        highlight: 'Most popular choice!'
      },
      football_maniac: {
        name: 'Football Maniac',
        tournaments: -1, // Unlimited
        worlds: -1, // Unlimited
        canModifyStats: true,
        price: 19.99,
        description: 'Ultimate experience with full customization',
        features: [
          'Unlimited tournaments',
          'Unlimited worlds', 
          'Player & stats editing',
          'Custom team management',
          'Export capabilities',
          'Premium support'
        ],
        highlight: 'Full control & customization!'
      }
    }
  }

  // Check and handle expired memberships
  async checkExpiredMemberships() {
    try {
      const expiredMemberships = await Membership.find({
        endDate: { $lt: new Date() },
        status: 'active',
        plan: { $ne: 'free' }
      })

      for (const membership of expiredMemberships) {
        membership.status = 'expired'
        membership.plan = 'free'
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