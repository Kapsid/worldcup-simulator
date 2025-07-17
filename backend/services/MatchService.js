import Match from '../models/Match.js'
import Standing from '../models/Standing.js'
import TournamentGroup from '../models/TournamentGroup.js'
import TournamentTeam from '../models/TournamentTeam.js'

class MatchService {
  async generateGroupMatches(tournamentId) {
    try {
      const groups = await TournamentGroup.find({ tournament: tournamentId })
        .populate('teams')
      
      const matches = []
      
      for (const group of groups) {
        if (group.teams.length !== 4) {
          throw new Error(`Group ${group.groupLetter} does not have 4 teams`)
        }
        
        const teams = group.teams
        const groupMatches = this.generateMatchesForGroup(group, teams)
        matches.push(...groupMatches)
      }
      
      await Match.insertMany(matches)
      await this.initializeStandings(tournamentId)
      
      return matches
    } catch (error) {
      throw new Error(`Failed to generate matches: ${error.message}`)
    }
  }

  generateMatchesForGroup(group, teams) {
    const matches = []
    
    const matchPairs = [
      [0, 1], [2, 3],
      [0, 2], [1, 3], 
      [0, 3], [1, 2]
    ]
    
    matchPairs.forEach((pair, index) => {
      const matchday = Math.floor(index / 2) + 1
      const homeTeam = teams[pair[0]]
      const awayTeam = teams[pair[1]]
      
      matches.push({
        tournament: group.tournament,
        group: group._id,
        matchday,
        homeTeam: homeTeam._id,
        awayTeam: awayTeam._id,
        status: 'scheduled'
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

  simulateRealisticScore() {
    const outcomes = [
      { home: 0, away: 0, weight: 8 },
      { home: 1, away: 0, weight: 15 },
      { home: 0, away: 1, weight: 15 },
      { home: 1, away: 1, weight: 12 },
      { home: 2, away: 0, weight: 12 },
      { home: 0, away: 2, weight: 12 },
      { home: 2, away: 1, weight: 10 },
      { home: 1, away: 2, weight: 10 },
      { home: 3, away: 0, weight: 6 },
      { home: 0, away: 3, weight: 6 },
      { home: 2, away: 2, weight: 4 },
      { home: 3, away: 1, weight: 4 },
      { home: 1, away: 3, weight: 4 },
      { home: 4, away: 0, weight: 2 },
      { home: 0, away: 4, weight: 2 },
      { home: 3, away: 2, weight: 2 },
      { home: 2, away: 3, weight: 2 },
      { home: 4, away: 1, weight: 1 },
      { home: 1, away: 4, weight: 1 },
      { home: 5, away: 0, weight: 0.5 },
      { home: 0, away: 5, weight: 0.5 },
      { home: 3, away: 3, weight: 0.5 },
      { home: 4, away: 2, weight: 0.5 },
      { home: 2, away: 4, weight: 0.5 }
    ]
    
    const totalWeight = outcomes.reduce((sum, outcome) => sum + outcome.weight, 0)
    const random = Math.random() * totalWeight
    
    let currentWeight = 0
    for (const outcome of outcomes) {
      currentWeight += outcome.weight
      if (random <= currentWeight) {
        return { homeScore: outcome.home, awayScore: outcome.away }
      }
    }
    
    return { homeScore: 1, awayScore: 1 }
  }

  async simulateMatch(matchId) {
    try {
      const match = await Match.findById(matchId)
        .populate('homeTeam awayTeam')
      
      if (!match) {
        throw new Error('Match not found')
      }
      
      if (match.status === 'completed') {
        throw new Error('Match already completed')
      }
      
      const { homeScore, awayScore } = this.simulateRealisticScore()
      
      match.homeScore = homeScore
      match.awayScore = awayScore
      match.status = 'completed'
      match.simulatedAt = new Date()
      
      await match.save()
      await this.updateStandings(match)
      await this.checkGroupStageCompletion(match.tournament)
      
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