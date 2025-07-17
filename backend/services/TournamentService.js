import Tournament from '../models/Tournament.js'
import { getCountryByCode } from '../data/countries.js'

class TournamentService {
  async createTournament(userId, tournamentData) {
    try {
      const { name, hostCountry, hostCountryCode } = tournamentData

      // Validate host country
      const country = getCountryByCode(hostCountryCode)
      if (!country) {
        throw new Error('Invalid host country')
      }

      const tournament = new Tournament({
        name,
        hostCountry,
        hostCountryCode,
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

      return tournament
    } catch (error) {
      console.error('Error getting tournament by id:', error)
      throw error
    }
  }

  async updateTournament(tournamentId, userId, updateData) {
    try {
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
}

export default new TournamentService()