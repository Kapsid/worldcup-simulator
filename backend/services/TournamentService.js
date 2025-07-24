import Tournament from '../models/Tournament.js'
import World from '../models/World.js'
import WorldRankingService from './WorldRankingService.js'
import MascotService from './MascotService.js'
import BrandingService from './BrandingService.js'
import PlayerGenerationService from './PlayerGenerationService.js'
import { getCountryByCode } from '../data/countries.js'
import { getCountryCities } from '../data/cities.js'

class TournamentService {
  async createTournament(userId, tournamentData) {
    try {
      const { name, hostCountry, hostCountryCode, type, worldId, year } = tournamentData

      // Validate host country
      const country = getCountryByCode(hostCountryCode)
      if (!country) {
        throw new Error('Invalid host country')
      }

      // If worldId is provided, validate that the world exists and belongs to the user
      if (worldId) {
        const world = await World.findOne({ _id: worldId, createdBy: userId, isActive: true })
        if (!world) {
          throw new Error('Invalid world or world not found')
        }
      }

      // Generate mascot for the tournament
      const mascot = MascotService.generateMascot(hostCountryCode, year || new Date().getFullYear())
      
      // Generate logo for the tournament
      const logo = BrandingService.generateLogo(hostCountryCode, year || new Date().getFullYear(), name)
      
      // Generate anthem for the tournament
      const anthem = BrandingService.generateAnthem(hostCountryCode, year || new Date().getFullYear(), name)
      
      // Generate official ball design for the tournament
      const ballDesign = BrandingService.generateBallDesign(hostCountryCode, year || new Date().getFullYear(), name)
      
      // Generate host cities (randomly select 6-8 cities)
      const numCities = Math.floor(Math.random() * 3) + 6; // 6-8 cities
      const cityData = getCountryCities(hostCountryCode, numCities)

      const tournament = new Tournament({
        name,
        hostCountry,
        hostCountryCode,
        type,
        createdBy: userId,
        worldId: worldId || undefined,
        year: year || undefined,
        mascot,
        logo,
        anthem,
        ballDesign,
        hostCities: cityData.cities,
        lastOpenedAt: new Date()
      })

      await tournament.save()

      // If tournament is linked to a world, add it to the world's tournaments array
      if (worldId) {
        await World.findByIdAndUpdate(
          worldId,
          { $push: { tournaments: tournament._id } },
          { new: true }
        )
      }

      return tournament
    } catch (error) {
      console.error('Error creating tournament:', error)
      throw error
    }
  }

  async getTournamentsByUser(userId) {
    try {
      // Only return tournaments that are NOT linked to a world
      const tournaments = await Tournament
        .find({ 
          createdBy: userId,
          worldId: { $exists: false }
        })
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

      const tournament = await Tournament.findOneAndUpdate(
        { _id: tournamentId, createdBy: userId },
        { 
          ...updateData,
          lastOpenedAt: new Date()
        },
        { new: true, runValidators: true }
      ).populate('createdBy', 'username name')

      console.log('Tournament update complete - checking conditions:', {
        status: updateData.status,
        worldId: tournament.worldId,
        winner: tournament.winner,
        tournamentId: tournament._id
      })

      // If tournament is completed and linked to a world, update rankings
      if (updateData.status === 'completed' && tournament.worldId && tournament.winner && tournament.runnerUp) {
        console.log('✓ Tournament completed and linked to world, updating rankings...')
        try {
          const tournamentResults = WorldRankingService.generateMockTournamentResults(
            tournament.year || new Date().getFullYear(),
            tournament.winner,
            tournament.runnerUp,
            tournament.hostCountry
          )
          
          // Extract qualification results if tournament had qualification
          let qualificationResults = []
          if (tournament.type === 'qualification') {
            console.log('📊 Extracting qualification results for ranking update...')
            const Qualification = await import('../models/Qualification.js')
            const qualification = await Qualification.default.findOne({ tournament: tournamentId })
            if (qualification) {
              qualificationResults = await WorldRankingService.extractQualificationResults(qualification._id)
            }
          }
          
          await WorldRankingService.updateRankingsAfterTournament(
            tournament.worldId, 
            tournamentResults,
            qualificationResults
          )
          console.log('✅ Rankings updated successfully')
        } catch (rankingError) {
          console.error('❌ Error updating rankings:', rankingError)
        }
      } else {
        console.log('✗ Conditions not met for ranking update - status:', updateData.status, 'worldId:', tournament.worldId, 'winner:', !!tournament.winner)
      }

      return tournament
    } catch (error) {
      console.error('Error updating tournament:', error)
      throw error
    }
  }


  async getLastOpenedTournament(userId) {
    try {
      // Only return last opened tournament that is NOT linked to a world
      const tournament = await Tournament
        .findOne({ 
          createdBy: userId,
          worldId: { $exists: false }
        })
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

      // Generate squads for all qualified teams
      if (tournament && qualifiedTeams && qualifiedTeams.length > 0) {
        console.log(`Generating squads for ${qualifiedTeams.length} qualified teams...`)
        
        for (const team of qualifiedTeams) {
          try {
            await PlayerGenerationService.generateSquad(
              team.code,
              tournament._id.toString(),
              tournament.worldId ? tournament.worldId.toString() : null,
              tournament.year || new Date().getFullYear()
            )
            console.log(`✓ Generated squad for ${team.name}`)
          } catch (squadError) {
            console.error(`Error generating squad for ${team.name}:`, squadError)
            // Continue with other teams even if one fails
          }
        }
        
        console.log('Squad generation completed for all qualified teams')
      }

      return tournament
    } catch (error) {
      console.error('Error preparing tournament for draw:', error)
      throw error
    }
  }
}

export default new TournamentService()