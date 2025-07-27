import Tournament from '../models/Tournament.js'
import World from '../models/World.js'
import WorldRankingService from './WorldRankingService.js'
import MascotService from './MascotService.js'
import BrandingService from './BrandingService.js'
import PlayerGenerationService from './PlayerGenerationService.js'
import MembershipService from './MembershipService.js'
import { getCountryByCode } from '../data/countries.js'
import { getCountryCities } from '../data/cities.js'

class TournamentService {
  
  /**
   * Determines the current phase of a tournament based on match data and tournament status
   * @param {String} tournamentId - The tournament ID
   * @returns {Promise<String>} - The current tournament phase
   */
  async getCurrentTournamentPhase(tournamentId) {
    try {
      // Get tournament data
      const tournament = await Tournament.findById(tournamentId)
      if (!tournament) {
        throw new Error('Tournament not found')
      }

      // If tournament is not active, return draft phase
      if (tournament.status !== 'active') {
        return 'draft'
      }

      // If tournament is completed, return completed phase
      if (tournament.status === 'completed') {
        return 'completed'
      }

      // Check for knockout matches
      const KnockoutMatch = await import('../models/KnockoutMatch.js')
      const knockoutMatches = await KnockoutMatch.default.find({ 
        tournament: tournamentId 
      }).sort({ round: 1, matchPosition: 1 })

      // If there are knockout matches, determine which knockout phase we're in
      if (knockoutMatches.length > 0) {
        // Check for matches that are ready or completed to determine current round
        const completedMatches = knockoutMatches.filter(match => match.status === 'completed')
        const readyMatches = knockoutMatches.filter(match => match.status === 'ready')
        
        // If we have ready matches, we're in that round
        if (readyMatches.length > 0) {
          const currentRound = readyMatches[0].round
          return this.mapRoundToPhase(currentRound)
        }
        
        // If all matches in a round are completed, check next round
        const roundsWithMatches = [...new Set(knockoutMatches.map(match => match.round))]
        const sortedRounds = this.sortKnockoutRounds(roundsWithMatches)
        
        for (const round of sortedRounds) {
          const roundMatches = knockoutMatches.filter(match => match.round === round)
          const completedRoundMatches = roundMatches.filter(match => match.status === 'completed')
          
          // If not all matches in this round are completed, we're in this round
          if (completedRoundMatches.length < roundMatches.length) {
            return this.mapRoundToPhase(round)
          }
        }
        
        // If all knockout matches are completed, tournament should be completed
        if (completedMatches.length === knockoutMatches.length) {
          return 'completed'
        }
        
        // Default to first knockout round if we have knockout matches
        return 'round16'
      }

      // Check for group stage matches
      const Match = await import('../models/Match.js')
      const groupMatches = await Match.default.find({ 
        tournament: tournamentId 
      })

      // If there are group matches, we're in group stage
      if (groupMatches.length > 0) {
        const completedGroupMatches = groupMatches.filter(match => match.status === 'completed')
        
        // If all group matches are completed, we should be transitioning to knockout
        if (completedGroupMatches.length === groupMatches.length && groupMatches.length > 0) {
          // Check if knockout bracket has been generated
          if (knockoutMatches.length > 0) {
            return 'round16' // First knockout round
          }
          return 'group_completed' // Group stage completed, waiting for knockout generation
        }
        
        return 'group_stage'
      }

      // If no matches exist but tournament is active, we're in preparation phase
      return 'preparation'
      
    } catch (error) {
      console.error('Error determining tournament phase:', error)
      throw error
    }
  }

  /**
   * Maps knockout round names to phase names
   * @param {String} round - The knockout round name
   * @returns {String} - The phase name
   */
  mapRoundToPhase(round) {
    const roundMap = {
      'round16': 'round16',
      'quarterfinal': 'quarterfinal', 
      'semifinal': 'semifinal',
      'final': 'final',
      'third_place': 'third_place'
    }
    return roundMap[round] || 'knockout'
  }

  /**
   * Sorts knockout rounds in chronological order
   * @param {Array} rounds - Array of round names
   * @returns {Array} - Sorted rounds
   */
  sortKnockoutRounds(rounds) {
    const roundOrder = ['round16', 'quarterfinal', 'semifinal', 'third_place', 'final']
    return rounds.sort((a, b) => roundOrder.indexOf(a) - roundOrder.indexOf(b))
  }

  async createTournament(userId, tournamentData) {
    try {
      const { name, hostCountry, hostCountryCode, type, worldId, year } = tournamentData

      // Check membership permissions
      const canCreate = await MembershipService.canCreateTournament(userId)
      if (!canCreate) {
        const membershipStatus = await MembershipService.getMembershipStatus(userId)
        throw new Error(`Tournament creation limit reached. Your ${membershipStatus.limits.name} plan allows ${membershipStatus.limits.tournaments === -1 ? 'unlimited' : membershipStatus.limits.tournaments} tournament(s). You have created ${membershipStatus.usage.tournaments}. Please upgrade your plan.`)
      }

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

      // Increment tournament usage counter
      await MembershipService.incrementTournamentUsage(userId)

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