import Tournament from '../models/Tournament.js'
import World from '../models/World.js'
import Standing from '../models/Standing.js'
import KnockoutMatch from '../models/KnockoutMatch.js'
import Match from '../models/Match.js'
import WorldRankingService from './WorldRankingService.js'
import MascotService from './MascotService.js'
import BrandingService from './BrandingService.js'
import PlayerGenerationService from './PlayerGenerationService.js'
import MembershipService from './MembershipService.js'
import { getCountryByCode } from '../data/countries.js'
import { getCountryCities } from '../data/cities.js'
import CountryTournamentHistory from '../models/CountryTournamentHistory.js'

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

      // Check membership permissions (skip for world tournaments)
      if (!worldId) {
        const canCreate = await MembershipService.canCreateTournament(userId)
        if (!canCreate) {
          const membershipStatus = await MembershipService.getMembershipStatus(userId)
          throw new Error(`Tournament creation limit reached. Your ${membershipStatus.limits.name} plan allows ${membershipStatus.limits.tournaments === -1 ? 'unlimited' : membershipStatus.limits.tournaments} tournament(s). You have created ${membershipStatus.usage.tournaments}. Please upgrade your plan.`)
        }
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

      // Increment tournament usage counter (skip for world tournaments)
      if (!worldId) {
        await MembershipService.incrementTournamentUsage(userId)
      }

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
        
        // Update world's simulated history
        try {
          console.log('📜 Updating world simulated history...')
          const World = await import('../models/World.js')
          const world = await World.default.findById(tournament.worldId)
          
          if (world) {
            // Get country information for winner, runner-up, and host
            const { countries } = await import('../data/countries.js')
            const winnerCountry = countries.find(c => c.code === tournament.winner.code)
            const runnerUpCountry = countries.find(c => c.code === tournament.runnerUp.code)
            const hostCountry = countries.find(c => c.code === tournament.hostCountryCode)
            
            const historyEntry = {
              year: tournament.year || new Date().getFullYear(),
              host: {
                name: tournament.hostCountry,
                code: tournament.hostCountryCode,
                flag: hostCountry?.flag || '🏆'
              },
              winner: {
                name: tournament.winner.name,
                code: tournament.winner.code,
                flag: tournament.winner.flag || winnerCountry?.flag || '🏆'
              },
              runnerUp: {
                name: tournament.runnerUp.name,
                code: tournament.runnerUp.code,
                flag: tournament.runnerUp.flag || runnerUpCountry?.flag || '🥈'
              },
              final: {
                score: tournament.finalScore || 'N/A',
                venue: `${tournament.hostCountry} Stadium`
              },
              teams: 32
            }
            
            // Add to simulated history
            if (!world.simulatedHistory) {
              world.simulatedHistory = []
            }
            world.simulatedHistory.push(historyEntry)
            
            // Sort by year descending
            world.simulatedHistory.sort((a, b) => b.year - a.year)
            
            await world.save()
            console.log('✅ World simulated history updated successfully')
          }
        } catch (historyError) {
          console.error('❌ Error updating world simulated history:', historyError)
        }
        
        // Save country tournament achievements (only for world tournaments)
        if (tournament.worldId) {
          try {
            console.log('🏆 Saving country tournament achievements...')
            await this.saveCountryTournamentAchievements(tournament)
            console.log('✅ Country tournament achievements saved successfully')
          } catch (achievementError) {
            console.error('❌ Error saving country tournament achievements:', achievementError)
          }
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

      // Generate squads for all qualified teams AND the host (only if they don't exist)
      if (tournament && qualifiedTeams && qualifiedTeams.length > 0) {
        console.log(`🔄 ROSTER: Checking squads for ${qualifiedTeams.length} qualified teams plus host...`)
        
        let teamsGenerated = 0
        let teamsSkipped = 0
        
        // First, check/generate squad for the host team
        if (tournament.hostCountryCode) {
          try {
            if (tournament.worldId) {
              // For world tournaments, check if host has world-level players (no tournament-specific copies)
              const existingWorldPlayers = await PlayerGenerationService.getTeamPlayers(
                tournament.hostCountryCode,
                null, // No tournament ID - get world-level players
                tournament.worldId.toString()
              )
              
              if (existingWorldPlayers.length > 0) {
                console.log(`🔄 ROSTER: Host team ${tournament.hostCountry} already has ${existingWorldPlayers.length} world players - preserving roster`)
                teamsSkipped++
              } else {
                console.log(`🔄 ROSTER: Generating initial squad for host team: ${tournament.hostCountry} (${tournament.hostCountryCode}) at world level`)
                await PlayerGenerationService.generateSquad(
                  tournament.hostCountryCode,
                  null, // No tournament ID - generate at world level
                  tournament.worldId.toString(),
                  tournament.year || new Date().getFullYear()
                )
                console.log(`✓ Generated world-level squad for host ${tournament.hostCountry}`)
                teamsGenerated++
              }
            } else {
              // For standalone tournaments, check tournament-specific players
              const existingHostPlayers = await PlayerGenerationService.getTeamPlayers(
                tournament.hostCountryCode,
                tournament._id.toString(),
                null
              )
              
              if (existingHostPlayers.length > 0) {
                console.log(`🔄 ROSTER: Host team ${tournament.hostCountry} already has ${existingHostPlayers.length} players - skipping generation`)
                teamsSkipped++
              } else {
                console.log(`🔄 ROSTER: Generating squad for host team: ${tournament.hostCountry} (${tournament.hostCountryCode})`)
                await PlayerGenerationService.generateSquad(
                  tournament.hostCountryCode,
                  tournament._id.toString(),
                  null,
                  tournament.year || new Date().getFullYear()
                )
                console.log(`✓ Generated squad for host ${tournament.hostCountry}`)
                teamsGenerated++
              }
            }
          } catch (hostSquadError) {
            console.error(`Error checking/generating squad for host ${tournament.hostCountry}:`, hostSquadError)
          }
        }
        
        // Then check/generate squads for all qualified teams
        for (const team of qualifiedTeams) {
          try {
            if (tournament.worldId) {
              // For world tournaments, check if team has world-level players (no tournament-specific copies)
              const existingWorldPlayers = await PlayerGenerationService.getTeamPlayers(
                team.code,
                null, // No tournament ID - get world-level players
                tournament.worldId.toString()
              )
              
              if (existingWorldPlayers.length > 0) {
                console.log(`🔄 ROSTER: Team ${team.name} already has ${existingWorldPlayers.length} world players - preserving roster`)
                teamsSkipped++
              } else {
                console.log(`🔄 ROSTER: Generating initial squad for team: ${team.name} (${team.code}) at world level`)
                await PlayerGenerationService.generateSquad(
                  team.code,
                  null, // No tournament ID - generate at world level
                  tournament.worldId.toString(),
                  tournament.year || new Date().getFullYear()
                )
                console.log(`✓ Generated world-level squad for ${team.name}`)
                teamsGenerated++
              }
            } else {
              // For standalone tournaments, check tournament-specific players
              const existingPlayers = await PlayerGenerationService.getTeamPlayers(
                team.code,
                tournament._id.toString(),
                null
              )
              
              if (existingPlayers.length > 0) {
                console.log(`🔄 ROSTER: Team ${team.name} already has ${existingPlayers.length} players - skipping generation`)
                teamsSkipped++
              } else {
                console.log(`🔄 ROSTER: Generating squad for team: ${team.name} (${team.code})`)
                await PlayerGenerationService.generateSquad(
                  team.code,
                  tournament._id.toString(),
                  null,
                  tournament.year || new Date().getFullYear()
                )
                console.log(`✓ Generated squad for ${team.name}`)
                teamsGenerated++
              }
            }
          } catch (squadError) {
            console.error(`Error checking/generating squad for ${team.name}:`, squadError)
            // Continue with other teams even if one fails
          }
        }
        
        console.log(`🔄 ROSTER: Squad check completed - ${teamsGenerated} new squads generated, ${teamsSkipped} existing squads preserved`)
      }

      return tournament
    } catch (error) {
      console.error('Error preparing tournament for draw:', error)
      throw error
    }
  }

  async saveCountryTournamentAchievements(tournament) {
    try {
      console.log('🏆 ACHIEVEMENTS: Starting to save tournament achievements...')
      
      // Get all countries data for name lookups
      const { countries } = await import('../data/countries.js')
      
      // Get tournament standings to understand final positions
      const standings = await Standing.find({ tournament: tournament._id })
        .sort({ 
          position: 1, 
          points: -1, 
          goalDifference: -1, 
          goalsFor: -1 
        })
      
      // Get knockout matches to understand elimination stages
      const knockoutMatches = await KnockoutMatch.find({ tournament: tournament._id })
        .populate('homeTeam awayTeam')
      
      // Get all teams that participated in the tournament
      const allTeams = tournament.qualifiedTeams || []
      
      // Add host team if not already included
      if (tournament.hostCountryCode && !allTeams.find(t => t.code === tournament.hostCountryCode)) {
        const hostCountry = countries.find(c => c.code === tournament.hostCountryCode)
        if (hostCountry) {
          allTeams.push({
            code: tournament.hostCountryCode,
            name: hostCountry.name,
            flag: hostCountry.flag
          })
        }
      }
      
      console.log(`🏆 ACHIEVEMENTS: Processing ${allTeams.length} teams`)
      
      // Process each team
      for (const team of allTeams) {
        const countryCode = team.code
        const countryData = countries.find(c => c.code === countryCode)
        
        if (!countryData) {
          console.warn(`🏆 ACHIEVEMENTS: Country data not found for ${countryCode}`)
          continue
        }
        
        // Determine achievement level
        const achievement = this.determineAchievement(
          team, 
          tournament, 
          standings, 
          knockoutMatches
        )
        
        // Calculate statistics from matches
        const stats = await this.calculateTeamStats(tournament._id, countryCode)
        
        // Create or update achievement record
        await CountryTournamentHistory.findOneAndUpdate(
          {
            worldId: tournament.worldId,
            tournamentId: tournament._id,
            countryCode: countryCode
          },
          {
            countryName: countryData.name,
            tournamentYear: tournament.year || new Date().getFullYear(),
            hostCountry: tournament.hostCountry,
            hostCountryCode: tournament.hostCountryCode,
            achievement: achievement.achievement,
            participatedInTournament: achievement.participated,
            qualificationResult: achievement.qualificationResult,
            eliminatedInStage: achievement.eliminatedInStage,
            finalPosition: achievement.finalPosition,
            matchesPlayed: stats.matchesPlayed,
            wins: stats.wins,
            draws: stats.draws,
            losses: stats.losses,
            goalsFor: stats.goalsFor,
            goalsAgainst: stats.goalsAgainst
          },
          { 
            upsert: true, 
            new: true 
          }
        )
        
        console.log(`🏆 ACHIEVEMENTS: Saved ${countryData.name} - ${achievement.achievement}`)
      }
      
      console.log('🏆 ACHIEVEMENTS: All country achievements saved successfully')
      
    } catch (error) {
      console.error('🏆 ACHIEVEMENTS: Error saving country tournament achievements:', error)
      throw error
    }
  }

  determineAchievement(team, tournament, standings, knockoutMatches) {
    const countryCode = team.code
    
    // Check if this is the winner
    if (tournament.winner && tournament.winner.code === countryCode) {
      return {
        achievement: '1st place',
        participated: true,
        qualificationResult: 'qualified',
        eliminatedInStage: 'none',
        finalPosition: 1
      }
    }
    
    // Check if this is the runner-up
    if (tournament.runnerUp && tournament.runnerUp.code === countryCode) {
      return {
        achievement: '2nd place',
        participated: true,
        qualificationResult: 'qualified',
        eliminatedInStage: 'final',
        finalPosition: 2
      }
    }
    
    // Check knockout elimination stage
    const eliminationStage = this.findEliminationStage(countryCode, knockoutMatches)
    if (eliminationStage) {
      return {
        achievement: eliminationStage.achievement,
        participated: true,
        qualificationResult: 'qualified',
        eliminatedInStage: eliminationStage.stage,
        finalPosition: eliminationStage.position
      }
    }
    
    // Check if eliminated in group stage
    const teamStanding = standings.find(s => s.teamCode === countryCode)
    if (teamStanding) {
      return {
        achievement: 'Group stage ended',
        participated: true,
        qualificationResult: 'qualified',
        eliminatedInStage: 'group_stage',
        finalPosition: null
      }
    }
    
    // If not found in tournament, assume failed qualification
    return {
      achievement: 'Did not qualify',
      participated: false,
      qualificationResult: 'eliminated',
      eliminatedInStage: 'qualification',
      finalPosition: null
    }
  }

  findEliminationStage(countryCode, knockoutMatches) {
    // Sort matches by round (later rounds first)
    const sortedMatches = knockoutMatches.sort((a, b) => {
      const roundOrder = {
        'Final': 5,
        'Semi-Finals': 4,
        'Quarter-Finals': 3,
        'Round of 16': 2,
        'Play-off': 1
      }
      return (roundOrder[b.round] || 0) - (roundOrder[a.round] || 0)
    })
    
    // Find the latest round this team participated in
    for (const match of sortedMatches) {
      if (match.homeTeam?.code === countryCode || match.awayTeam?.code === countryCode) {
        const isWinner = (match.homeTeam?.code === countryCode && match.homeScore > match.awayScore) ||
                        (match.awayTeam?.code === countryCode && match.awayScore > match.homeScore)
        
        if (!isWinner) {
          // Team was eliminated in this round
          switch (match.round) {
            case 'Final':
              return { achievement: '2nd place', stage: 'final', position: 2 }
            case 'Semi-Finals':
              return { achievement: '4th place', stage: 'semi_final', position: 4 } // Assuming lost 3rd place playoff
            case 'Quarter-Finals':
              return { achievement: '1/4 Final ended', stage: 'quarter_final', position: null }
            case 'Round of 16':
              return { achievement: '1/8 Final ended', stage: 'round_16', position: null }
            default:
              return { achievement: 'Group stage ended', stage: 'group_stage', position: null }
          }
        }
      }
    }
    
    return null
  }

  async calculateTeamStats(tournamentId, countryCode) {
    // Get all matches for this team in this tournament
    const matches = await Match.find({
      tournament: tournamentId,
      $or: [
        { 'homeTeam.code': countryCode },
        { 'awayTeam.code': countryCode }
      ],
      played: true
    })
    
    let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0
    
    for (const match of matches) {
      const isHome = match.homeTeam?.code === countryCode
      const teamScore = isHome ? match.homeScore : match.awayScore
      const opponentScore = isHome ? match.awayScore : match.homeScore
      
      goalsFor += teamScore || 0
      goalsAgainst += opponentScore || 0
      
      if (teamScore > opponentScore) wins++
      else if (teamScore === opponentScore) draws++
      else losses++
    }
    
    return {
      matchesPlayed: matches.length,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst
    }
  }
}

export default new TournamentService()