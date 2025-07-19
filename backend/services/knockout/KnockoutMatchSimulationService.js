import KnockoutMatch from '../../models/KnockoutMatch.js'

class KnockoutMatchSimulationService {
  // Simulate a knockout match
  async simulateKnockoutMatch(matchId) {
    try {
      const match = await KnockoutMatch.findById(matchId).populate('team1 team2')
      
      if (!match) {
        throw new Error('Match not found')
      }
      
      if (match.played) {
        throw new Error('Match already played')
      }
      
      if (!match.team1 || !match.team2) {
        throw new Error('Both teams must be determined before simulation')
      }

      // Simulate the match result
      const result = this.calculateKnockoutMatchResult(match.team1, match.team2)
      
      // Update match with result
      match.team1Goals = result.team1Goals
      match.team2Goals = result.team2Goals
      match.team1PenaltyGoals = result.team1PenaltyGoals || 0
      match.team2PenaltyGoals = result.team2PenaltyGoals || 0
      match.wentToPenalties = result.wentToPenalties || false
      match.needsPenalties = false
      match.played = true
      
      // Determine winner
      if (result.wentToPenalties) {
        match.winner = result.team1PenaltyGoals > result.team2PenaltyGoals ? match.team1._id : match.team2._id
      } else {
        match.winner = result.team1Goals > result.team2Goals ? match.team1._id : match.team2._id
      }
      
      await match.save()
      
      return match
    } catch (error) {
      throw new Error(`Failed to simulate knockout match: ${error.message}`)
    }
  }

  // Calculate knockout match result
  calculateKnockoutMatchResult(team1, team2) {
    // Get team powers based on rankings
    const team1Power = this.calculateTeamPower(team1.ranking || 999)
    const team2Power = this.calculateTeamPower(team2.ranking || 999)
    
    // Determine which team is stronger and apply stronger weights
    const strongerTeam = team1Power > team2Power ? 'team1' : 'team2'
    const powerDifference = Math.abs(team1Power - team2Power)
    
    // Increase advantage for stronger teams (reduce surprises)
    const baseWeight = 1.0
    const advantageMultiplier = Math.min(0.4, powerDifference * 0.03) // Max 40% advantage
    
    let team1Weight, team2Weight
    if (strongerTeam === 'team1') {
      team1Weight = baseWeight + advantageMultiplier
      team2Weight = baseWeight - (advantageMultiplier * 0.6)
    } else {
      team1Weight = baseWeight - (advantageMultiplier * 0.6)
      team2Weight = baseWeight + advantageMultiplier
    }
    
    // Calculate win probabilities
    const totalPower = (team1Power * team1Weight) + (team2Power * team2Weight)
    const team1WinProb = (team1Power * team1Weight) / totalPower
    
    // Reduce draw probability and make it dependent on power difference
    const drawProb = Math.max(0.15, 0.25 - (powerDifference * 0.015))
    
    // Adjust win probabilities to account for draws
    const adjustedTeam1WinProb = team1WinProb * (1 - drawProb)
    const adjustedTeam2WinProb = (1 - team1WinProb) * (1 - drawProb)
    
    const random = Math.random()
    
    let result = {}
    
    if (random < adjustedTeam1WinProb) {
      // Team 1 wins in regular time
      result = this.simulateKnockoutScore(team1Power, team2Power, 'team1')
    } else if (random < adjustedTeam1WinProb + adjustedTeam2WinProb) {
      // Team 2 wins in regular time
      result = this.simulateKnockoutScore(team1Power, team2Power, 'team2')
    } else {
      // Draw - goes to penalties
      result = this.simulateKnockoutScore(team1Power, team2Power, 'draw')
      
      // Simulate penalty shootout
      const penaltyResult = this.simulatePenaltyShootout(team1Power, team2Power)
      result.team1PenaltyGoals = penaltyResult.team1PenaltyGoals
      result.team2PenaltyGoals = penaltyResult.team2PenaltyGoals
      result.wentToPenalties = true
    }
    
    return result
  }

  // Calculate team power based on FIFA ranking
  calculateTeamPower(ranking) {
    // Convert ranking to power (1-20 scale, higher is better)
    if (ranking <= 5) return 20
    if (ranking <= 10) return 19
    if (ranking <= 15) return 18
    if (ranking <= 20) return 17
    if (ranking <= 30) return 16
    if (ranking <= 40) return 15
    if (ranking <= 50) return 14
    if (ranking <= 60) return 13
    if (ranking <= 70) return 12
    if (ranking <= 80) return 11
    if (ranking <= 90) return 10
    if (ranking <= 100) return 9
    if (ranking <= 120) return 8
    if (ranking <= 140) return 7
    if (ranking <= 160) return 6
    if (ranking <= 180) return 5
    if (ranking <= 190) return 4
    if (ranking <= 200) return 3
    if (ranking <= 210) return 2
    return 1
  }

  // Simulate knockout match score
  simulateKnockoutScore(team1Power, team2Power, result) {
    let team1Goals = 0
    let team2Goals = 0
    
    if (result === 'team1') {
      // Team 1 wins
      team1Goals = 1 + Math.floor(Math.random() * 3) // 1-3 goals
      team2Goals = Math.random() < 0.3 ? Math.floor(Math.random() * 2) : 0 // 0-1 goals usually
      
      // Ensure team1 actually wins
      if (team1Goals <= team2Goals) {
        team1Goals = team2Goals + 1
      }
    } else if (result === 'team2') {
      // Team 2 wins
      team2Goals = 1 + Math.floor(Math.random() * 3) // 1-3 goals
      team1Goals = Math.random() < 0.3 ? Math.floor(Math.random() * 2) : 0 // 0-1 goals usually
      
      // Ensure team2 actually wins
      if (team2Goals <= team1Goals) {
        team2Goals = team1Goals + 1
      }
    } else {
      // Draw (going to penalties)
      const baseScore = Math.random() < 0.4 ? 0 : 1
      team1Goals = baseScore + Math.floor(Math.random() * 2) // 0-2 goals
      team2Goals = team1Goals // Same score for draw
    }
    
    // Ensure realistic score ranges (0-4 goals per team max in knockouts)
    team1Goals = Math.min(team1Goals, 4)
    team2Goals = Math.min(team2Goals, 4)
    
    return { team1Goals, team2Goals }
  }

  // Simulate penalty shootout
  simulatePenaltyShootout(team1Power, team2Power) {
    // Improved penalty success rate that better reflects team strength
    const team1SuccessRate = Math.min(0.90, 0.70 + (team1Power / 80))
    const team2SuccessRate = Math.min(0.90, 0.70 + (team2Power / 80))
    
    let team1PenaltyGoals = 0
    let team2PenaltyGoals = 0
    
    // First 5 penalties for each team
    for (let i = 0; i < 5; i++) {
      if (Math.random() < team1SuccessRate) team1PenaltyGoals++
      if (Math.random() < team2SuccessRate) team2PenaltyGoals++
    }
    
    // Sudden death if tied after 5 penalties each
    while (team1PenaltyGoals === team2PenaltyGoals) {
      const team1Scores = Math.random() < team1SuccessRate
      const team2Scores = Math.random() < team2SuccessRate
      
      if (team1Scores) team1PenaltyGoals++
      if (team2Scores) team2PenaltyGoals++
      
      // If one team scores and the other doesn't, winner is determined
      if (team1Scores !== team2Scores) break
    }
    
    return { team1PenaltyGoals, team2PenaltyGoals }
  }

  // Simulate entire round
  async simulateRound(tournamentId, round) {
    try {
      const matches = await KnockoutMatch.find({ 
        tournament: tournamentId, 
        round: round,
        played: false
      }).populate('team1 team2')

      const results = []
      
      for (const match of matches) {
        if (match.team1 && match.team2) {
          const result = await this.simulateKnockoutMatch(match._id)
          results.push(result)
        }
      }
      
      return results
    } catch (error) {
      throw new Error(`Failed to simulate round: ${error.message}`)
    }
  }

  // Check if match needs penalties (used for UI)
  async checkPenaltiesNeeded(matchId) {
    const match = await KnockoutMatch.findById(matchId)
    if (!match) return false
    
    return match.team1Goals === match.team2Goals && !match.played
  }

  // Get match result summary
  getMatchResultSummary(match) {
    if (!match.played) {
      return {
        status: 'not_played',
        winner: null,
        scoreline: `${match.team1Name} vs ${match.team2Name}`,
        result: 'TBD'
      }
    }
    
    const regularTime = `${match.team1Goals}-${match.team2Goals}`
    let result = regularTime
    
    if (match.wentToPenalties) {
      const penalties = `${match.team1PenaltyGoals}-${match.team2PenaltyGoals}`
      result = `${regularTime} (${penalties} pen.)`
    }
    
    const winnerTeam = match.winner?.toString() === match.team1?._id?.toString() ? 
      match.team1Name : match.team2Name
    
    return {
      status: 'played',
      winner: winnerTeam,
      scoreline: `${match.team1Name} ${result} ${match.team2Name}`,
      result: result,
      wentToPenalties: match.wentToPenalties
    }
  }
}

export default new KnockoutMatchSimulationService()