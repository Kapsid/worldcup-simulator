import TournamentTeam from '../models/TournamentTeam.js'
import Tournament from '../models/Tournament.js'
import World from '../models/World.js'
import PlayerGenerationService from './PlayerGenerationService.js'
import { getCountryByCode, getCountryByName, getBest31PlusHost } from '../data/countries.js'

class TeamManagementService {
  /**
   * Get team ranking from world rankings if available, otherwise use world ranking
   */
  getTeamRanking(country, world) {
    if (world && world.countryRankings) {
      const worldRanking = world.countryRankings.find(
        ranking => ranking.code === country.code
      )
      if (worldRanking) {
        return worldRanking.rank || 999
      }
    }
    
    // Fallback to world ranking
    return country.worldRanking || 999
  }

  async addTeamToTournament(tournamentId, userId, countryCode) {
    try {
      // Verify tournament belongs to user
      const tournament = await Tournament.findOne({ _id: tournamentId, createdBy: userId })
      if (!tournament) {
        throw new Error('Tournament not found')
      }

      // Check if tournament is already active
      if (tournament.status !== 'draft') {
        throw new Error('Cannot modify teams in an active tournament')
      }

      // Get country data
      const country = getCountryByCode(countryCode)
      if (!country) {
        throw new Error('Invalid country code')
      }

      // Check if team already exists in tournament
      const existingTeam = await TournamentTeam.findOne({ 
        tournament: tournamentId, 
        countryCode 
      })
      if (existingTeam) {
        throw new Error('Team already added to tournament')
      }

      // Check team limit
      const currentTeamCount = await TournamentTeam.countDocuments({ tournament: tournamentId })
      if (currentTeamCount >= tournament.settings.maxTeams) {
        throw new Error('Maximum number of teams reached')
      }

      // Check if this is the host country
      const isHost = tournament.hostCountryCode === countryCode

      // Load world data if tournament belongs to a world
      let world = null
      if (tournament.worldId) {
        world = await World.findById(tournament.worldId)
      }

      // Use world ranking if available, otherwise world ranking
      const teamRanking = this.getTeamRanking(country, world)

      // Create new team
      const tournamentTeam = new TournamentTeam({
        tournament: tournamentId,
        countryCode: country.code,
        countryName: country.name,
        countryFlag: country.flag,
        worldRanking: teamRanking, // Store effective ranking (world or world)
        isHost
      })

      await tournamentTeam.save()

      // Generate squad for the newly added team
      try {
        await PlayerGenerationService.generateSquad(
          country.code,
          tournamentId,
          tournament.worldId ? tournament.worldId.toString() : null,
          tournament.year || new Date().getFullYear()
        )
        console.log(`✓ Generated squad for ${country.name}`)
      } catch (squadError) {
        console.error(`Error generating squad for ${country.name}:`, squadError)
        // Don't throw error - team addition should still succeed
      }

      // Update tournament team count and activation status
      await this.updateTournamentStatus(tournamentId)

      return tournamentTeam
    } catch (error) {
      console.error('Error adding team to tournament:', error)
      throw error
    }
  }

  async removeTeamFromTournament(tournamentId, userId, countryCode) {
    try {
      // Verify tournament belongs to user
      const tournament = await Tournament.findOne({ _id: tournamentId, createdBy: userId })
      if (!tournament) {
        throw new Error('Tournament not found')
      }

      // Check if tournament is already active
      if (tournament.status !== 'draft') {
        throw new Error('Cannot modify teams in an active tournament')
      }

      // Remove team
      const result = await TournamentTeam.findOneAndDelete({
        tournament: tournamentId,
        countryCode
      })

      if (!result) {
        throw new Error('Team not found in tournament')
      }

      // Remove players for this team
      try {
        const { default: Player } = await import('../models/Player.js')
        const deleteQuery = { 
          teamId: countryCode,
          tournamentId: tournamentId
        }
        if (tournament.worldId) {
          deleteQuery.worldId = tournament.worldId.toString()
        }
        
        await Player.deleteMany(deleteQuery)
        console.log(`✓ Removed players for ${countryCode}`)
      } catch (playerError) {
        console.error(`Error removing players for ${countryCode}:`, playerError)
        // Don't throw error - team removal should still succeed
      }

      // Update tournament team count and activation status
      await this.updateTournamentStatus(tournamentId)

      return result
    } catch (error) {
      console.error('Error removing team from tournament:', error)
      throw error
    }
  }

  async getTeamsForTournament(tournamentId, userId) {
    try {
      // Verify tournament belongs to user
      const tournament = await Tournament.findOne({ _id: tournamentId, createdBy: userId })
      if (!tournament) {
        throw new Error('Tournament not found')
      }

      const teams = await TournamentTeam
        .find({ tournament: tournamentId })
        .sort({ worldRanking: 1 }) // Sort by effective ranking (which is world ranking when available)

      return teams
    } catch (error) {
      console.error('Error getting teams for tournament:', error)
      throw error
    }
  }

  async autoFillBest31PlusHost(tournamentId, userId) {
    try {
      // Verify tournament belongs to user
      const tournament = await Tournament.findOne({ _id: tournamentId, createdBy: userId })
      if (!tournament) {
        throw new Error('Tournament not found')
      }

      // Check if tournament is already active
      if (tournament.status !== 'draft') {
        throw new Error('Cannot modify teams in an active tournament')
      }

      // Clear existing teams and their players
      await TournamentTeam.deleteMany({ tournament: tournamentId })
      
      // Clear existing players for this tournament
      try {
        const { default: Player } = await import('../models/Player.js')
        const deleteQuery = { tournamentId: tournamentId }
        if (tournament.worldId) {
          deleteQuery.worldId = tournament.worldId.toString()
        }
        
        await Player.deleteMany(deleteQuery)
        console.log(`✓ Cleared all players for tournament`)
      } catch (playerError) {
        console.error(`Error clearing players for tournament:`, playerError)
        // Don't throw error - team clearing should still succeed
      }

      // Load world data if tournament belongs to a world
      let world = null
      if (tournament.worldId) {
        world = await World.findById(tournament.worldId)
      }

      // Get best 31 teams plus host - if using world rankings, we need to sort differently
      let bestTeams
      if (world && world.countryRankings) {
        // Use world rankings to select best teams
        const { countries } = await import('../data/countries.js')
        const allCountries = [...countries]
        
        // Sort by world ranking and take top 31 plus host
        allCountries.forEach(country => {
          country._effectiveRanking = this.getTeamRanking(country, world)
        })
        allCountries.sort((a, b) => a._effectiveRanking - b._effectiveRanking)
        
        // Ensure host is included
        const hostIndex = allCountries.findIndex(c => c.code === tournament.hostCountryCode)
        if (hostIndex > 31) {
          // Move host to top 32 if not already there
          const hostCountry = allCountries.splice(hostIndex, 1)[0]
          allCountries.splice(31, 0, hostCountry)
        }
        
        bestTeams = allCountries.slice(0, 32)
      } else {
        // Use existing world ranking-based selection
        bestTeams = getBest31PlusHost(tournament.hostCountryCode)
      }

      // Create tournament teams
      const tournamentTeams = bestTeams.map(country => ({
        tournament: tournamentId,
        countryCode: country.code,
        countryName: country.name,
        countryFlag: country.flag,
        worldRanking: this.getTeamRanking(country, world), // Use effective ranking
        isHost: country.code === tournament.hostCountryCode
      }))

      await TournamentTeam.insertMany(tournamentTeams)

      // Generate squads for all teams
      console.log(`Generating squads for ${bestTeams.length} teams...`)
      for (const country of bestTeams) {
        try {
          await PlayerGenerationService.generateSquad(
            country.code,
            tournamentId,
            tournament.worldId ? tournament.worldId.toString() : null,
            tournament.year || new Date().getFullYear()
          )
          console.log(`✓ Generated squad for ${country.name}`)
        } catch (squadError) {
          console.error(`Error generating squad for ${country.name}:`, squadError)
          // Continue with other teams even if one fails
        }
      }
      console.log('Squad generation completed for all teams')

      // Update tournament status
      await this.updateTournamentStatus(tournamentId)

      return await this.getTeamsForTournament(tournamentId, userId)
    } catch (error) {
      console.error('Error auto-filling teams:', error)
      throw error
    }
  }

  async clearAllTeams(tournamentId, userId) {
    try {
      // Verify tournament belongs to user
      const tournament = await Tournament.findOne({ _id: tournamentId, createdBy: userId })
      if (!tournament) {
        throw new Error('Tournament not found')
      }

      // Check if tournament is already active
      if (tournament.status !== 'draft') {
        throw new Error('Cannot modify teams in an active tournament')
      }

      // Remove all teams
      await TournamentTeam.deleteMany({ tournament: tournamentId })
      
      // Remove all players for this tournament
      try {
        const { default: Player } = await import('../models/Player.js')
        const deleteQuery = { tournamentId: tournamentId }
        if (tournament.worldId) {
          deleteQuery.worldId = tournament.worldId.toString()
        }
        
        await Player.deleteMany(deleteQuery)
        console.log(`✓ Cleared all players for tournament`)
      } catch (playerError) {
        console.error(`Error clearing players for tournament:`, playerError)
        // Don't throw error - clearing should still succeed
      }

      // Update tournament status
      await this.updateTournamentStatus(tournamentId)

      return { message: 'All teams removed successfully' }
    } catch (error) {
      console.error('Error clearing teams:', error)
      throw error
    }
  }

  async updateTournamentStatus(tournamentId) {
    try {
      const teamCount = await TournamentTeam.countDocuments({ tournament: tournamentId })
      const tournament = await Tournament.findById(tournamentId)
      
      if (!tournament) return

      const canActivate = teamCount === tournament.settings.maxTeams

      await Tournament.findByIdAndUpdate(tournamentId, {
        teamCount,
        canActivate
      })

      return { teamCount, canActivate }
    } catch (error) {
      console.error('Error updating tournament status:', error)
      throw error
    }
  }

  async getTournamentTeamStats(tournamentId, userId) {
    try {
      // Verify tournament belongs to user
      const tournament = await Tournament.findOne({ _id: tournamentId, createdBy: userId })
      if (!tournament) {
        throw new Error('Tournament not found')
      }

      const teamCount = await TournamentTeam.countDocuments({ tournament: tournamentId })
      const maxTeams = tournament.settings.maxTeams
      const canActivate = teamCount === maxTeams

      return {
        teamCount,
        maxTeams,
        canActivate,
        spotsRemaining: maxTeams - teamCount
      }
    } catch (error) {
      console.error('Error getting tournament team stats:', error)
      throw error
    }
  }

  async getTeamDetails(tournamentId, teamId, userId) {
    try {
      // Verify tournament belongs to user
      const tournament = await Tournament.findOne({ _id: tournamentId, createdBy: userId })
      if (!tournament) {
        throw new Error('Tournament not found')
      }

      // Get team details
      const team = await TournamentTeam.findOne({ 
        _id: teamId, 
        tournament: tournamentId 
      })
      
      if (!team) {
        throw new Error('Team not found')
      }

      return team
    } catch (error) {
      console.error('Error getting team details:', error)
      throw error
    }
  }

  async addQualifiedTeamsToTournament(tournamentId, userId) {
    try {
      // Verify tournament belongs to user
      const tournament = await Tournament.findOne({ _id: tournamentId, createdBy: userId })
      if (!tournament) {
        throw new Error('Tournament not found')
      }

      // Check if tournament is already active (allow draft and qualification_complete)
      if (tournament.status !== 'draft' && tournament.status !== 'qualification_complete') {
        throw new Error('Cannot modify teams in an active tournament')
      }

      // Get qualification data
      const QualificationService = await import('./QualificationService.js')
      const qualificationData = await QualificationService.default.getQualificationData(tournamentId)
      
      if (!qualificationData) {
        throw new Error('No qualification data found')
      }

      if (!qualificationData.completed) {
        throw new Error('Qualification not completed')
      }

      // Load world data if tournament belongs to a world
      let world = null
      if (tournament.worldId) {
        world = await World.findById(tournament.worldId)
      }

      // Clear existing teams first
      await TournamentTeam.deleteMany({ tournament: tournamentId })

      // Add qualified teams
      const teams = []
      
      // First, add the host country
      const hostCountry = getCountryByCode(tournament.hostCountryCode)
      if (hostCountry) {
        const hostTeam = new TournamentTeam({
          tournament: tournamentId,
          countryCode: hostCountry.code,
          countryName: hostCountry.name,
          countryFlag: hostCountry.flag,
          worldRanking: this.getTeamRanking(hostCountry, world), // Use world ranking if available
          isHost: true
        })
        await hostTeam.save()
        teams.push(hostTeam)
      }
      
      // Get all qualified teams from the qualification groups
      for (const confederation of qualificationData.confederations) {
        const qualifiedFromConfederation = confederation.qualifiedTeams || []
        
        for (const qualifiedTeam of qualifiedFromConfederation) {
          // Skip if it's the host country (already added)
          if (qualifiedTeam.teamId && qualifiedTeam.teamId.includes(tournament.hostCountryCode)) {
            continue
          }
          
          let countryCode = null
          let countryName = null
          let countryFlag = null
          let worldRanking = 999
          
          // Extract country code from teamId (e.g., "uefa_GER" -> "GER")
          if (qualifiedTeam.teamId) {
            countryCode = qualifiedTeam.teamId.split('_')[1]
            const country = getCountryByCode(countryCode)
            if (country) {
              countryName = country.name
              countryFlag = country.flag
              worldRanking = this.getTeamRanking(country, world) // Use world ranking if available
            }
          }
          
          // Fallback to team data
          if (!countryName) {
            countryName = qualifiedTeam.name || qualifiedTeam.country
            countryFlag = qualifiedTeam.flag || '🏆'
            worldRanking = qualifiedTeam.ranking || 999
            
            // Try to extract country code from name if not available
            if (!countryCode && countryName) {
              countryCode = countryName.substring(0, 3).toUpperCase()
            }
          }
          
          // Validate required fields
          if (!countryCode || !countryName) {
            console.error('ERROR: Missing required fields for qualified team:', {
              countryCode,
              countryName,
              qualifiedTeam
            })
            continue // Skip this team instead of throwing error
          }

          const tournamentTeam = new TournamentTeam({
            tournament: tournamentId,
            countryCode: countryCode,
            countryName: countryName,
            countryFlag: countryFlag,
            worldRanking: worldRanking,
            isHost: false
          })

          await tournamentTeam.save()
          teams.push(tournamentTeam)
        }
      }

      // Update tournament team count
      await this.updateTournamentStatus(tournamentId)

      return teams
    } catch (error) {
      console.error('Error adding qualified teams:', error)
      throw error
    }
  }

  async getTeamTournamentHistory(countryCode, userId) {
    try {
      // Get country data to validate country exists
      const country = getCountryByCode(countryCode)
      if (!country) {
        throw new Error('Country not found')
      }

      const history = {
        country: {
          code: countryCode,
          name: country.name,
          flag: country.flag
        },
        tournaments: [],
        statistics: {
          totalTournaments: 0,
          wins: 0,
          runnerUps: 0,
          semifinals: 0,
          quarterfinals: 0,
          round16: 0,
          groupStage: 0,
          qualification: 0,
          bestResult: 'Did not qualify'
        }
      }

      // Find all tournaments where this team participated (both worlds and independent)
      const tournaments = await Tournament.find({ 
        createdBy: userId,
        status: 'completed'
      }).populate('worldId').sort({ completedAt: -1 })

      for (const tournament of tournaments) {
        // Check if team participated in this tournament
        const tournamentTeam = await TournamentTeam.findOne({
          tournament: tournament._id,
          countryCode: countryCode
        })

        if (tournamentTeam) {
          const tournamentResult = {
            tournamentId: tournament._id,
            year: tournament.year || new Date(tournament.completedAt).getFullYear(),
            name: tournament.name,
            hostCountry: tournament.hostCountry,
            hostCountryCode: tournament.hostCountryCode,
            isWorldTournament: !!tournament.worldId,
            worldName: tournament.worldId?.name,
            result: 'Group Stage',
            position: null,
            qualified: true
          }

          // Determine the team's result in this tournament
          if (tournament.winner?.code === countryCode) {
            tournamentResult.result = 'Winner'
            tournamentResult.position = 1
            history.statistics.wins++
          } else if (tournament.runnerUp?.code === countryCode) {
            tournamentResult.result = 'Runner-up'
            tournamentResult.position = 2
            history.statistics.runnerUps++
          } else {
            // Check knockout results for more specific placement
            // This would require looking at knockout matches, but for now we'll keep it simple
            tournamentResult.result = 'Group Stage'
            history.statistics.groupStage++
          }

          history.tournaments.push(tournamentResult)
          history.statistics.totalTournaments++
        } else {
          // Check if team was in qualification but didn't qualify
          try {
            // This would require checking qualification data
            // For now, we'll skip unqualified teams
          } catch (error) {
            // Ignore qualification check errors
          }
        }
      }

      // Determine best result
      if (history.statistics.wins > 0) {
        history.statistics.bestResult = 'World Cup Winner'
      } else if (history.statistics.runnerUps > 0) {
        history.statistics.bestResult = 'World Cup Runner-up'
      } else if (history.statistics.semifinals > 0) {
        history.statistics.bestResult = 'Semi-finals'
      } else if (history.statistics.quarterfinals > 0) {
        history.statistics.bestResult = 'Quarter-finals'
      } else if (history.statistics.round16 > 0) {
        history.statistics.bestResult = 'Round of 16'
      } else if (history.statistics.groupStage > 0) {
        history.statistics.bestResult = 'Group Stage'
      } else if (history.statistics.qualification > 0) {
        history.statistics.bestResult = 'Qualified'
      }

      return history
    } catch (error) {
      console.error('Error getting team tournament history:', error)
      throw error
    }
  }
}

export default new TeamManagementService()