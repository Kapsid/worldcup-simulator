import TournamentTeam from '../models/TournamentTeam.js'
import Tournament from '../models/Tournament.js'
import { getCountryByCode, getBest31PlusHost } from '../data/countries.js'

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
}

export default new TeamManagementService()