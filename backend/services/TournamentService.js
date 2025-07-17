import Tournament from '../models/Tournament.js'
import { getCountryByCode } from '../data/countries.js'

class TournamentService {
  async createTournament(userId, tournamentData) {
    try {
      const { name, hostCountry, hostCountryCode, type } = tournamentData

      // Validate host country
      const country = getCountryByCode(hostCountryCode)
      if (!country) {
        throw new Error('Invalid host country')
      }

      const tournament = new Tournament({
        name,
        hostCountry,
        hostCountryCode,
        type,
        createdBy: userId,
        lastOpenedAt: new Date()
      })

      await tournament.save()
      return tournament
    } catch (error) {
      console.error('Error creating tournament:', error)
      throw error
    }
  }

  async getTournamentsByUser(userId) {
    try {
      const tournaments = await Tournament
        .find({ createdBy: userId })
        .sort({ lastOpenedAt: -1 })
        .populate('createdBy', 'username name')

      return tournaments
    } catch (error) {
      console.error('Error getting tournaments by user:', error)
      throw error
    }
  }

  async getTournamentById(tournamentId, userId) {
    try {
      const tournament = await Tournament
        .findOne({ _id: tournamentId, createdBy: userId })
        .populate('createdBy', 'username name')

      if (tournament) {
        // Add default type if missing (for backward compatibility)
        if (!tournament.type) {
          tournament.type = 'manual'
          await tournament.save()
        }
      }

      return tournament
    } catch (error) {
      console.error('Error getting tournament by id:', error)
      throw error
    }
  }

  async updateTournament(tournamentId, userId, updateData) {
    try {
      // If setting status to qualification_complete, also get qualified teams
      if (updateData.status === 'qualification_complete') {
        const QualificationService = await import('./QualificationService.js')
        const qualificationData = await QualificationService.default.getQualificationData(tournamentId)
        
        if (qualificationData && qualificationData.qualifiedTeams) {
          updateData.qualifiedTeams = qualificationData.qualifiedTeams
          updateData.teamCount = qualificationData.qualifiedTeams.length
        }
      }

      const tournament = await Tournament.findOneAndUpdate(
        { _id: tournamentId, createdBy: userId },
        { 
          ...updateData,
          lastOpenedAt: new Date()
        },
        { new: true, runValidators: true }
      ).populate('createdBy', 'username name')

      return tournament
    } catch (error) {
      console.error('Error updating tournament:', error)
      throw error
    }
  }

  async getLastOpenedTournament(userId) {
    try {
      const tournament = await Tournament
        .findOne({ createdBy: userId })
        .sort({ lastOpenedAt: -1 })
        .populate('createdBy', 'username name')

      return tournament
    } catch (error) {
      console.error('Error getting last opened tournament:', error)
      throw error
    }
  }

  async updateLastOpened(tournamentId, userId) {
    try {
      const tournament = await Tournament.findOneAndUpdate(
        { _id: tournamentId, createdBy: userId },
        { lastOpenedAt: new Date() },
        { new: true }
      )

      return tournament
    } catch (error) {
      console.error('Error updating last opened:', error)
      throw error
    }
  }

  async deleteTournament(tournamentId, userId) {
    try {
      const tournament = await Tournament.findOneAndDelete({
        _id: tournamentId,
        createdBy: userId
      })

      return tournament
    } catch (error) {
      console.error('Error deleting tournament:', error)
      throw error
    }
  }

  async prepareTournamentForDraw(tournamentId, userId, qualifiedTeams, totalQualified) {
    try {
      const tournament = await Tournament.findOneAndUpdate(
        { _id: tournamentId, createdBy: userId },
        { 
          status: 'qualification_complete',
          qualifiedTeams: qualifiedTeams,
          teamCount: totalQualified,
          lastOpenedAt: new Date()
        },
        { new: true }
      )

      return tournament
    } catch (error) {
      console.error('Error preparing tournament for draw:', error)
      throw error
    }
  }
}

export default new TournamentService()