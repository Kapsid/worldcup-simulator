import TournamentTeam from '../models/TournamentTeam.js'
import Tournament from '../models/Tournament.js'
import { getCountryByCode, getCountryByName, getBest31PlusHost } from '../data/countries.js'

class TeamManagementService {
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

      // Create new team
      const tournamentTeam = new TournamentTeam({
        tournament: tournamentId,
        countryCode: country.code,
        countryName: country.name,
        countryFlag: country.flag,
        fifaRanking: country.fifaRanking,
        isHost
      })

      await tournamentTeam.save()

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
        .sort({ fifaRanking: 1 })

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

      // Clear existing teams
      await TournamentTeam.deleteMany({ tournament: tournamentId })

      // Get best 31 teams plus host
      const bestTeams = getBest31PlusHost(tournament.hostCountryCode)

      // Create tournament teams
      const tournamentTeams = bestTeams.map(country => ({
        tournament: tournamentId,
        countryCode: country.code,
        countryName: country.name,
        countryFlag: country.flag,
        fifaRanking: country.fifaRanking,
        isHost: country.code === tournament.hostCountryCode
      }))

      await TournamentTeam.insertMany(tournamentTeams)

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

      // Check if tournament is already active
      if (tournament.status !== 'draft') {
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
          fifaRanking: hostCountry.fifaRanking || 999,
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
          let fifaRanking = 999
          
          // Extract country code from teamId (e.g., "uefa_GER" -> "GER")
          if (qualifiedTeam.teamId) {
            countryCode = qualifiedTeam.teamId.split('_')[1]
            const country = getCountryByCode(countryCode)
            if (country) {
              countryName = country.name
              countryFlag = country.flag
              fifaRanking = country.fifaRanking || 999
            }
          }
          
          // Fallback to team data
          if (!countryName) {
            countryName = qualifiedTeam.name || qualifiedTeam.country
            countryFlag = qualifiedTeam.flag || '🏆'
            fifaRanking = qualifiedTeam.ranking || 999
            
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
            fifaRanking: fifaRanking,
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
}

export default new TeamManagementService()