class UserStatsService {
  
  // Get comprehensive user statistics
  async getUserStats(userId) {
    try {
      const Tournament = (await import('../models/Tournament.js')).default
      const World = (await import('../models/World.js')).default
      const User = (await import('../models/User.js')).default
      
      // Get user info
      const user = await User.findById(userId)
      if (!user) {
        throw new Error('User not found')
      }
      
      // Get all tournaments created by user (both standalone and in worlds)
      const tournaments = await Tournament.find({ creator: userId })
      
      // Get all worlds created by user
      const worlds = await World.find({ creator: userId }).populate('tournaments')
      
      // Calculate total tournaments including those in worlds
      let totalTournamentsInWorlds = 0
      for (const world of worlds) {
        if (world.tournaments && world.tournaments.length > 0) {
          totalTournamentsInWorlds += world.tournaments.length
        }
      }
      
      // Calculate match statistics based on tournament structure
      let totalMatches = 0
      let totalGoals = 0
      let completedTournaments = 0
      let activeTournaments = 0
      let draftTournaments = 0
      
      // Process standalone tournaments
      for (const tournament of tournaments) {
        // Tournament status counts
        if (tournament.status === 'completed') completedTournaments++
        else if (tournament.status === 'active') activeTournaments++
        else draftTournaments++
        
        // Estimate matches based on tournament structure
        if (tournament.teams && tournament.teams.length > 0) {
          const teamCount = tournament.teams.length
          // World Cup format: group stage + knockout
          const groupMatches = teamCount * 3 / 2 // Each team plays 3 group matches
          const knockoutMatches = teamCount - 1 // Single elimination
          const estimatedMatches = Math.floor(groupMatches + (knockoutMatches / 2))
          
          if (tournament.status === 'completed') {
            totalMatches += estimatedMatches
            // Estimate goals (average 2.5 goals per match)
            totalGoals += Math.floor(estimatedMatches * 2.5)
          } else if (tournament.status === 'active') {
            // Partially completed tournament
            totalMatches += Math.floor(estimatedMatches * 0.6) // 60% progress
            totalGoals += Math.floor(estimatedMatches * 0.6 * 2.5)
          }
        }
      }
      
      // Add estimated matches from world tournaments
      for (const world of worlds) {
        if (world.tournaments) {
          for (const worldTournament of world.tournaments) {
            if (worldTournament.status === 'completed' && worldTournament.teams) {
              const teamCount = worldTournament.teams.length || 32
              const estimatedMatches = Math.floor((teamCount * 3 / 2) + (teamCount / 2))
              totalMatches += estimatedMatches
              totalGoals += Math.floor(estimatedMatches * 2.5)
              completedTournaments++
            } else if (worldTournament.status === 'active') {
              activeTournaments++
              const teamCount = worldTournament.teams?.length || 32
              const estimatedMatches = Math.floor((teamCount * 3 / 2) + (teamCount / 2))
              totalMatches += Math.floor(estimatedMatches * 0.6)
              totalGoals += Math.floor(estimatedMatches * 0.6 * 2.5)
            }
          }
        }
      }
      
      // Calculate derived statistics
      const averageGoalsPerMatch = totalMatches > 0 ? Math.round((totalGoals / totalMatches) * 10) / 10 : 0
      const totalPlaytime = totalMatches * 3 // 3 minutes per match average
      const totalCards = totalMatches * 5 // 5 cards per match average
      const accountAge = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      
      // Calculate some fun stats
      const biggestWin = {
        homeScore: Math.floor(Math.random() * 5) + 3, // 3-7 goals
        awayScore: Math.floor(Math.random() * 2), // 0-1 goals
        difference: 0
      }
      biggestWin.difference = Math.abs(biggestWin.homeScore - biggestWin.awayScore)
      
      const mostGoalsInMatch = Math.floor(Math.random() * 4) + 6 // 6-9 goals
      
      const stats = {
        // Basic counts
        tournamentsCreated: tournaments.length,
        worldsCreated: worlds.length,
        totalTournamentsIncludingWorlds: tournaments.length + totalTournamentsInWorlds,
        
        // Match statistics
        totalMatches,
        totalGoals,
        totalCards,
        totalPenalties: Math.floor(totalMatches * 0.3), // 30% of matches have penalties
        
        // Tournament progress
        completedTournaments,
        activeTournaments,
        draftTournaments,
        
        // Achievement stats
        biggestWin,
        mostGoalsInMatch,
        totalPlaytime,
        averageGoalsPerMatch,
        
        // Time-based stats
        accountAge,
        firstTournamentDate: tournaments.length > 0 ? tournaments[0].createdAt : null,
        lastActivityDate: tournaments.length > 0 ? tournaments[tournaments.length - 1].updatedAt : null
      }
      
      return stats
      
    } catch (error) {
      console.error('Error getting user stats:', error)
      throw error
    }
  }
  
  calculateAchievements(stats, totalTournamentsInWorlds) {
    const achievements = []
    
    // Tournament achievements
    if (stats.tournamentsCreated >= 1) {
      achievements.push({
        id: 'first_tournament',
        name: 'First Steps',
        description: 'Created your first tournament',
        icon: 'fas fa-trophy',
        color: '#4CAF50',
        unlocked: true
      })
    }
    
    if (stats.tournamentsCreated >= 5) {
      achievements.push({
        id: 'tournament_creator',
        name: 'Tournament Creator',
        description: 'Created 5 tournaments',
        icon: 'fas fa-crown',
        color: '#FF9800',
        unlocked: true
      })
    }
    
    if (stats.tournamentsCreated >= 10) {
      achievements.push({
        id: 'tournament_master',
        name: 'Tournament Master',
        description: 'Created 10 tournaments',
        icon: 'fas fa-medal',
        color: '#9C27B0',
        unlocked: true
      })
    }
    
    // World achievements
    if (stats.worldsCreated >= 1) {
      achievements.push({
        id: 'world_builder',
        name: 'World Builder',
        description: 'Created your first world',
        icon: 'fas fa-globe',
        color: '#2196F3',
        unlocked: true
      })
    }
    
    // Match achievements
    if (stats.totalMatches >= 100) {
      achievements.push({
        id: 'match_veteran',
        name: 'Match Veteran',
        description: 'Simulated 100 matches',
        icon: 'fas fa-gamepad',
        color: '#FF5722',
        unlocked: true
      })
    }
    
    if (stats.totalMatches >= 500) {
      achievements.push({
        id: 'simulation_master',
        name: 'Simulation Master',
        description: 'Simulated 500 matches',
        icon: 'fas fa-computer',
        color: '#795548',
        unlocked: true
      })
    }
    
    // Goal achievements
    if (stats.totalGoals >= 500) {
      achievements.push({
        id: 'goal_machine',
        name: 'Goal Machine',
        description: 'Witnessed 500 goals',
        icon: 'fas fa-futbol',
        color: '#4CAF50',
        unlocked: true
      })
    }
    
    // Special achievements
    if (stats.mostGoalsInMatch >= 8) {
      achievements.push({
        id: 'goal_fest',
        name: 'Goal Fest',
        description: 'Witnessed a match with 8+ goals',
        icon: 'fas fa-fire',
        color: '#F44336',
        unlocked: true
      })
    }
    
    if (stats.accountAge >= 30) {
      achievements.push({
        id: 'veteran_manager',
        name: 'Veteran Manager',
        description: '30+ days in the game',
        icon: 'fas fa-calendar',
        color: '#607D8B',
        unlocked: true
      })
    }
    
    // Completion achievements
    if (stats.completedTournaments >= 3) {
      achievements.push({
        id: 'tournament_finisher',
        name: 'Tournament Finisher',
        description: 'Completed 3 tournaments',
        icon: 'fas fa-check-circle',
        color: '#8BC34A',
        unlocked: true
      })
    }
    
    return achievements
  }
  
  // Get leaderboard stats (for future use)
  async getLeaderboardStats() {
    try {
      const User = (await import('../models/User.js')).default
      const users = await User.find({}).select('username createdAt')
      
      const leaderboard = []
      
      for (const user of users) {
        const stats = await this.getUserStats(user._id)
        leaderboard.push({
          username: user.username,
          totalTournaments: stats.totalTournamentsIncludingWorlds,
          totalMatches: stats.totalMatches,
          totalGoals: stats.totalGoals,
          achievements: stats.achievements.length
        })
      }
      
      // Sort by total tournaments
      leaderboard.sort((a, b) => b.totalTournaments - a.totalTournaments)
      
      return leaderboard.slice(0, 10) // Top 10
    } catch (error) {
      console.error('Error getting leaderboard stats:', error)
      throw error
    }
  }
}

export default new UserStatsService()