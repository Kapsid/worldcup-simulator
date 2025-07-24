import Match from '../models/Match.js'
import Standing from '../models/Standing.js'
import Tournament from '../models/Tournament.js'
import TournamentGroup from '../models/TournamentGroup.js'
import TournamentTeam from '../models/TournamentTeam.js'
import TournamentNewsService from './TournamentNewsService.js'
import BasicEnhancedMatchService from './BasicEnhancedMatchService.js'

class MatchService {
  async generateGroupMatches(tournamentId) {
    try {
      const groups = await TournamentGroup.find({ tournament: tournamentId })
        .populate('teams')
      
      // Get tournament cities for city assignment
      const tournament = await Tournament.findById(tournamentId).select('hostCities')
      if (!tournament || !tournament.hostCities || tournament.hostCities.length === 0) {
        throw new Error('Tournament cities not found')
      }
      
      const matches = []
      
      for (const group of groups) {
        if (group.teams.length !== 4) {
          throw new Error(`Group ${group.groupLetter} does not have 4 teams`)
        }
        
        const teams = group.teams
        const groupMatches = this.generateMatchesForGroup(group, teams, tournament.hostCities)
        matches.push(...groupMatches)
      }
      
      await Match.insertMany(matches)
      await this.initializeStandings(tournamentId)
      
      return matches
    } catch (error) {
      throw new Error(`Failed to generate matches: ${error.message}`)
    }
  }

  generateMatchesForGroup(group, teams, hostCities) {
    const matches = []
    
    // Create realistic city assignment system
    const assignCitiesForGroup = (groupLetter, hostCities) => {
      // Ensure we have enough cities
      if (hostCities.length < 3) {
        // If less than 3 cities, repeat cities but ensure different cities per matchday
        const cityNames = hostCities.map(city => city.name)
        while (cityNames.length < 6) {
          cityNames.push(...hostCities.map(city => city.name))
        }
        
        return {
          matchday1: [cityNames[0], cityNames[1]],
          matchday2: [cityNames[2], cityNames[3]],
          matchday3: [cityNames[4], cityNames[5]]
        }
      }
      
      // For tournaments with many cities, distribute them properly
      const cityCount = hostCities.length
      const groupIndex = groupLetter.charCodeAt(0) - 65 // A=0, B=1, etc.
      
      // Create rotation pattern so each group gets different cities
      const startOffset = (groupIndex * 2) % cityCount
      const cities = hostCities.map(city => city.name)
      
      // Get 6 different cities for this group, rotating the array
      const rotatedCities = [
        ...cities.slice(startOffset),
        ...cities.slice(0, startOffset)
      ]
      
      // Ensure we have at least 6 cities (repeat if necessary)
      while (rotatedCities.length < 6) {
        rotatedCities.push(...cities)
      }
      
      return {
        matchday1: [rotatedCities[0], rotatedCities[1]],
        matchday2: [rotatedCities[2], rotatedCities[3]],
        matchday3: [rotatedCities[4], rotatedCities[5]]
      }
    }
    
    const cityAssignment = assignCitiesForGroup(group.groupLetter, hostCities)
    
    const matchPairs = [
      [0, 1], [2, 3],  // Matchday 1
      [0, 2], [1, 3],  // Matchday 2
      [0, 3], [1, 2]   // Matchday 3
    ]
    
    matchPairs.forEach((pair, index) => {
      const matchday = Math.floor(index / 2) + 1
      const matchInDay = index % 2
      const homeTeam = teams[pair[0]]
      const awayTeam = teams[pair[1]]
      
      // Get city for this matchday and match position
      let city
      if (matchday === 1) {
        city = cityAssignment.matchday1[matchInDay]
      } else if (matchday === 2) {
        city = cityAssignment.matchday2[matchInDay]
      } else {
        city = cityAssignment.matchday3[matchInDay]
      }
      
      matches.push({
        tournament: group.tournament,
        group: group._id,
        matchday,
        homeTeam: homeTeam._id,
        awayTeam: awayTeam._id,
        status: 'scheduled',
        city: city
      })
    })
    
    return matches
  }

  async initializeStandings(tournamentId) {
    try {
      const groups = await TournamentGroup.find({ tournament: tournamentId })
        .populate('teams')
      
      const standings = []
      
      for (const group of groups) {
        group.teams.forEach((team, index) => {
          standings.push({
            tournament: tournamentId,
            group: group._id,
            team: team._id,
            position: index + 1,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0,
            qualifiedFor: 'none'
          })
        })
      }
      
      await Standing.deleteMany({ tournament: tournamentId })
      await Standing.insertMany(standings)
      
      return standings
    } catch (error) {
      throw new Error(`Failed to initialize standings: ${error.message}`)
    }
  }

  // Convert world ranking to power (1-20 scale)
  calculateTeamPower(worldRanking) {
    // World rankings: 1 = best, 211 = worst
    // Convert to power: 20 = best, 1 = worst
    if (worldRanking <= 5) return 20      // Top 5 teams
    if (worldRanking <= 10) return 19     // Top 10 teams  
    if (worldRanking <= 15) return 18     // Top 15 teams
    if (worldRanking <= 20) return 17     // Top 20 teams
    if (worldRanking <= 30) return 16     // Top 30 teams
    if (worldRanking <= 40) return 15     // Top 40 teams
    if (worldRanking <= 50) return 14     // Top 50 teams
    if (worldRanking <= 60) return 13     // Top 60 teams
    if (worldRanking <= 70) return 12     // Top 70 teams
    if (worldRanking <= 80) return 11     // Top 80 teams
    if (worldRanking <= 90) return 10     // Top 90 teams
    if (worldRanking <= 100) return 9     // Top 100 teams
    if (worldRanking <= 110) return 8     // Top 110 teams
    if (worldRanking <= 120) return 7     // Top 120 teams
    if (worldRanking <= 130) return 6     // Top 130 teams
    if (worldRanking <= 140) return 5     // Top 140 teams
    if (worldRanking <= 150) return 4     // Top 150 teams
    if (worldRanking <= 170) return 3     // Top 170 teams
    if (worldRanking <= 190) return 2     // Top 190 teams
    return 1                             // Bottom teams
  }

  simulateRealisticScore(homeTeam, awayTeam) {
    const homePower = this.calculateTeamPower(homeTeam.worldRanking)
    const awayPower = this.calculateTeamPower(awayTeam.worldRanking)
    
    // Calculate power difference (-19 to +19)
    const powerDiff = homePower - awayPower
    
    // Home advantage (+2 power boost)
    const adjustedPowerDiff = powerDiff + 2
    
    // Surprise factor (1% chance, very limited based on power gap)
    let surpriseFactor = 0
    if (Math.random() < 0.01) {
      // Maximum surprise severely limited by power difference
      const maxSurprise = Math.max(2, 8 - Math.abs(powerDiff) / 2)
      surpriseFactor = Math.random() < 0.5 ? -maxSurprise : maxSurprise
    }
    const finalPowerDiff = adjustedPowerDiff + surpriseFactor
    
    // Base outcomes with realistic football scores (slightly increased goal probability)
    const outcomes = [
      { home: 0, away: 0, weight: 7 },   // Boring draw (slightly reduced)
      { home: 1, away: 0, weight: 14 },  // Classic 1-0
      { home: 0, away: 1, weight: 14 },  // Away win
      { home: 1, away: 1, weight: 11 },  // Standard draw
      { home: 2, away: 0, weight: 13 },  // Comfortable win (slightly increased)
      { home: 0, away: 2, weight: 13 },  // Away dominance (slightly increased)
      { home: 2, away: 1, weight: 11 },  // Exciting match (slightly increased)
      { home: 1, away: 2, weight: 11 },  // Comeback win (slightly increased)
      { home: 3, away: 0, weight: 7 },   // Crushing victory (slightly increased)
      { home: 0, away: 3, weight: 7 },   // Away thrashing (slightly increased)
      { home: 2, away: 2, weight: 5 },   // High-scoring draw (slightly increased)
      { home: 3, away: 1, weight: 5 },   // Dominant display (slightly increased)
      { home: 1, away: 3, weight: 5 },   // Away masterclass (slightly increased)
      { home: 4, away: 0, weight: 2.5 }, // Demolition (slightly increased)
      { home: 0, away: 4, weight: 2.5 }, // Away destruction (slightly increased)
      { home: 3, away: 2, weight: 2.5 }, // Thriller (slightly increased)
      { home: 2, away: 3, weight: 2.5 }, // Away thriller (slightly increased)
      { home: 4, away: 1, weight: 1.2 }, // Statement win (slightly increased)
      { home: 1, away: 4, weight: 1.2 }, // Away statement (slightly increased)
      { home: 5, away: 0, weight: 0.6 }, // Humiliation (slightly increased)
      { home: 0, away: 5, weight: 0.6 }, // Away humiliation (slightly increased)
      { home: 3, away: 3, weight: 0.6 }, // Goal fest (slightly increased)
      { home: 4, away: 2, weight: 0.6 }, // High-scoring (slightly increased)
      { home: 2, away: 4, weight: 0.6 }, // Away goal fest (slightly increased)
      // Crazy results (very rare)
      { home: 6, away: 0, weight: 0.1 }, // Historic thrashing
      { home: 0, away: 6, weight: 0.1 }, // Historic away win
      { home: 5, away: 1, weight: 0.1 }, // Demolition job
      { home: 1, away: 5, weight: 0.1 }, // Away demolition
      { home: 4, away: 3, weight: 0.1 }, // Epic encounter
      { home: 3, away: 4, weight: 0.1 }, // Epic away win
      { home: 7, away: 0, weight: 0.05 }, // Legendary result
      { home: 0, away: 7, weight: 0.05 }, // Legendary away win
      { home: 5, away: 2, weight: 0.05 }, // Crazy scoreline
      { home: 2, away: 5, weight: 0.05 }, // Crazy away win
      { home: 4, away: 4, weight: 0.05 }, // Insane draw
      { home: 6, away: 1, weight: 0.02 }, // Unbelievable
      { home: 1, away: 6, weight: 0.02 }, // Unbelievable away
      { home: 8, away: 0, weight: 0.01 }, // Once in a lifetime
      { home: 0, away: 8, weight: 0.01 }  // Historic upset
    ]
    
    // Adjust weights based on power difference
    const adjustedOutcomes = outcomes.map(outcome => {
      let weight = outcome.weight
      const goalDiff = outcome.home - outcome.away
      
      // If home team is stronger, favor home wins - REDUCED for more randomness
      if (finalPowerDiff > 0) {
        if (goalDiff > 0) {
          weight *= Math.pow(1.12, Math.min(finalPowerDiff, 18)) // Mild boost for home wins
        } else if (goalDiff < 0) {
          weight *= Math.pow(0.88, Math.min(finalPowerDiff, 18)) // Mild reduction for away wins
        } else {
          // Draws become less likely with bigger power differences
          weight *= Math.pow(0.94, Math.min(finalPowerDiff / 1.5, 12))
        }
      }
      // If away team is stronger, favor away wins - REDUCED for more randomness
      else if (finalPowerDiff < 0) {
        if (goalDiff < 0) {
          weight *= Math.pow(1.12, Math.min(Math.abs(finalPowerDiff), 18)) // Mild boost for away wins
        } else if (goalDiff > 0) {
          weight *= Math.pow(0.88, Math.min(Math.abs(finalPowerDiff), 18)) // Mild reduction for home wins
        } else {
          // Draws become less likely with bigger power differences
          weight *= Math.pow(0.94, Math.min(Math.abs(finalPowerDiff) / 1.5, 12))
        }
      }
      
      // For large power differences (>8), favor the stronger team - REDUCED for more upsets
      if (Math.abs(finalPowerDiff) > 8) {
        const favoredGoalDiff = finalPowerDiff > 0 ? goalDiff : -goalDiff
        if (favoredGoalDiff < 0) {
          // Upset result - make it less likely but still possible
          weight *= 0.25 // 75% reduction (was 95%)
        } else if (favoredGoalDiff === 0 && Math.abs(goalDiff) === 0) {
          // 0-0 draw with huge power gap - still possible
          weight *= 0.35 // 65% reduction (was 90%)
        } else if (favoredGoalDiff > 0 && favoredGoalDiff < 2) {
          // Small wins when big difference expected - reduce slightly
          weight *= 0.8 // Was 0.7
        }
      }
      
      // For extreme power differences (>12), make upsets rare but not impossible
      if (Math.abs(finalPowerDiff) > 12) {
        const favoredGoalDiff = finalPowerDiff > 0 ? goalDiff : -goalDiff
        if (favoredGoalDiff < 0) {
          weight *= 0.1 // 90% reduction - rare but possible (was 99%)
        } else if (favoredGoalDiff === 0) {
          weight *= 0.15 // 85% reduction for any draw (was 98%)
        } else if (favoredGoalDiff < 3) {
          // Expect big wins with huge power gaps
          weight *= 0.65 // Was 0.5
        }
      }
      
      // Big power differences increase chances of big scorelines
      if (Math.abs(finalPowerDiff) > 8) {
        const totalGoals = outcome.home + outcome.away
        if (totalGoals >= 4) {
          weight *= 1.5 // Increase high-scoring games
        }
      }
      
      return { ...outcome, weight }
    })
    
    const totalWeight = adjustedOutcomes.reduce((sum, outcome) => sum + outcome.weight, 0)
    const random = Math.random() * totalWeight
    
    let currentWeight = 0
    for (const outcome of adjustedOutcomes) {
      currentWeight += outcome.weight
      if (random <= currentWeight) {
        return { homeScore: outcome.home, awayScore: outcome.away }
      }
    }
    
    return { homeScore: 1, awayScore: 1 }
  }

  async simulateMatch(matchId) {
    console.error(`🎯 MATCH SERVICE: simulateMatch called with ID: ${matchId}`)
    try {
      const match = await Match.findById(matchId)
        .populate('homeTeam awayTeam tournament')
      
      console.error(`🎯 MATCH SERVICE: Match found:`, {
        id: match?._id,
        homeTeam: match?.homeTeam?.countryName,
        awayTeam: match?.awayTeam?.countryName,
        status: match?.status
      })
      
      if (!match) {
        throw new Error('Match not found')
      }
      
      if (match.status === 'completed') {
        throw new Error('Match already completed')
      }
      
      // First simulate basic score using existing logic
      const { homeScore, awayScore } = this.simulateRealisticScore(match.homeTeam, match.awayTeam)
      
      match.homeScore = homeScore
      match.awayScore = awayScore
      match.status = 'completed'
      match.simulatedAt = new Date()
      
      await match.save()
      
      // Now run enhanced simulation with detailed match data
      try {
        console.error('🎯 GROUP MATCH SIM: Starting enhanced simulation')
        console.error(`🎯 GROUP MATCH SIM: About to call BasicEnhancedMatchService.simulateBasicMatchDetails`)
        console.error('🎯 GROUP MATCH SIM: Match data:', {
          matchId: match._id,
          tournamentId: match.tournament._id,
          worldId: match.tournament.world,
          homeTeam: {
            countryCode: match.homeTeam.countryCode,
            countryName: match.homeTeam.countryName,
            teamId: match.homeTeam._id
          },
          awayTeam: {
            countryCode: match.awayTeam.countryCode,
            countryName: match.awayTeam.countryName,
            teamId: match.awayTeam._id
          }
        })
        
        // Create a properly structured match object for enhanced simulation
        const enhancedMatch = {
          _id: match._id,
          tournament: match.tournament._id,
          homeTeam: {
            countryCode: match.homeTeam.countryCode,
            name: match.homeTeam.countryName,
            code: match.homeTeam.countryCode
          },
          awayTeam: {
            countryCode: match.awayTeam.countryCode,
            name: match.awayTeam.countryName,
            code: match.awayTeam.countryCode
          },
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          status: 'completed'
        }
        
        // Get world context from tournament
        const world = match.tournament.world ? { _id: match.tournament.world } : null
        console.error('🎯 GROUP MATCH SIM: World context:', world)
        
        await BasicEnhancedMatchService.simulateBasicMatchDetails(enhancedMatch, 'tournament', world)
        console.error(`🎯 GROUP MATCH SIM: Enhanced simulation completed for match ${matchId}`)
      } catch (enhancedError) {
        console.error('🎯 GROUP MATCH SIM: Enhanced simulation failed:', enhancedError)
        console.error('🎯 GROUP MATCH SIM: Error stack:', enhancedError.stack)
        // Don't fail the entire match - basic result is still valid
      }
      
      await this.updateStandings(match)
      await this.checkGroupStageCompletion(match.tournament)
      
      // Generate news for this match
      await TournamentNewsService.processMatchResult(
        match.tournament,
        match,
        match.homeTeam,
        match.awayTeam
      )
      
      return match
    } catch (error) {
      throw new Error(`Failed to simulate match: ${error.message}`)
    }
  }

  async simulateMatchday(tournamentId, matchday) {
    try {
      const matches = await Match.find({ 
        tournament: tournamentId, 
        matchday,
        status: 'scheduled'
      })
      
      const simulatedMatches = []
      
      for (const match of matches) {
        const simulatedMatch = await this.simulateMatch(match._id)
        simulatedMatches.push(simulatedMatch)
      }
      
      // Generate news for matchday completion
      if (simulatedMatches.length > 0) {
        await TournamentNewsService.notifyRoundCompleted(
          tournamentId,
          'group',
          matchday,
          simulatedMatches.length
        )
      }
      
      await this.checkGroupStageCompletion(tournamentId)
      
      return simulatedMatches
    } catch (error) {
      throw new Error(`Failed to simulate matchday: ${error.message}`)
    }
  }

  async updateStandings(match) {
    try {
      const homeStanding = await Standing.findOne({
        tournament: match.tournament,
        group: match.group,
        team: match.homeTeam
      })
      
      const awayStanding = await Standing.findOne({
        tournament: match.tournament,
        group: match.group,
        team: match.awayTeam
      })
      
      if (!homeStanding || !awayStanding) {
        throw new Error('Standings not found for teams')
      }
      
      homeStanding.played += 1
      homeStanding.goalsFor += match.homeScore
      homeStanding.goalsAgainst += match.awayScore
      homeStanding.goalDifference = homeStanding.goalsFor - homeStanding.goalsAgainst
      
      awayStanding.played += 1
      awayStanding.goalsFor += match.awayScore
      awayStanding.goalsAgainst += match.homeScore
      awayStanding.goalDifference = awayStanding.goalsFor - awayStanding.goalsAgainst
      
      if (match.homeScore > match.awayScore) {
        homeStanding.won += 1
        homeStanding.points += 3
        awayStanding.lost += 1
      } else if (match.homeScore < match.awayScore) {
        awayStanding.won += 1
        awayStanding.points += 3
        homeStanding.lost += 1
      } else {
        homeStanding.drawn += 1
        homeStanding.points += 1
        awayStanding.drawn += 1
        awayStanding.points += 1
      }
      
      await homeStanding.save()
      await awayStanding.save()
      
      await this.updateGroupPositions(match.tournament, match.group)
      
    } catch (error) {
      throw new Error(`Failed to update standings: ${error.message}`)
    }
  }

  async updateGroupPositions(tournamentId, groupId) {
    try {
      const standings = await Standing.find({
        tournament: tournamentId,
        group: groupId
      }).sort({
        points: -1,
        goalDifference: -1,
        goalsFor: -1
      })
      
      for (let i = 0; i < standings.length; i++) {
        standings[i].position = i + 1
        standings[i].qualifiedFor = i < 2 ? 'round16' : 'none'
        await standings[i].save()
      }
      
    } catch (error) {
      throw new Error(`Failed to update group positions: ${error.message}`)
    }
  }

  async getMatches(tournamentId) {
    try {
      const matches = await Match.find({ tournament: tournamentId })
        .populate('homeTeam awayTeam group')
        .sort({ matchday: 1, createdAt: 1 })
      
      return matches
    } catch (error) {
      throw new Error(`Failed to get matches: ${error.message}`)
    }
  }

  async getStandings(tournamentId) {
    try {
      const standings = await Standing.find({ tournament: tournamentId })
        .populate('team group')
        .sort({ 'group.groupLetter': 1, position: 1 })
      
      return standings
    } catch (error) {
      throw new Error(`Failed to get standings: ${error.message}`)
    }
  }

  async checkGroupStageCompletion(tournamentId) {
    try {
      const totalMatches = await Match.countDocuments({ tournament: tournamentId })
      const completedMatches = await Match.countDocuments({ 
        tournament: tournamentId, 
        status: 'completed' 
      })
      
      // Check if all group matches are completed (48 matches total: 8 groups × 6 matches each)
      if (totalMatches === 48 && completedMatches === 48) {
        console.log('All group matches completed, knockout bracket can be generated')
        // The knockout bracket will be auto-generated when the UI loads the bracket
        // This prevents circular dependency issues
      }
    } catch (error) {
      console.error('Error checking group stage completion:', error.message)
    }
  }

  async getTeamMatches(tournamentId, teamId) {
    try {
      const matches = await Match.find({
        tournament: tournamentId,
        $or: [
          { homeTeam: teamId },
          { awayTeam: teamId }
        ]
      })
      .populate('homeTeam', 'name countryCode')
      .populate('awayTeam', 'name countryCode')
      .sort({ matchday: 1, scheduledDate: 1 })

      return matches
    } catch (error) {
      throw new Error(`Failed to get team matches: ${error.message}`)
    }
  }
}

export default new MatchService()