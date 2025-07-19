import TeamGenerationService from './TeamGenerationService.js'

class MatchSimulationService {
  /**
   * Get team ranking from world rankings if available, otherwise use FIFA ranking
   */
  getTeamRanking(team, world) {
    if (world && world.countryRankings) {
      const worldRanking = world.countryRankings.find(
        ranking => ranking.code === team.countryCode || ranking.code === team.code
      )
      if (worldRanking) {
        return worldRanking.rank || 999
      }
    }
    
    // Fallback to existing ranking system
    return team.ranking || TeamGenerationService.getTeamRanking(team.name) || 999
  }

  // Calculate match outcome based on team rankings with adjusted weights for qualifying
  calculateMatchOutcome(homeTeam, awayTeam, isQualifying = true, world = null) {
    const homeRanking = this.getTeamRanking(homeTeam, world)
    const awayRanking = this.getTeamRanking(awayTeam, world)
    
    // Calculate power based on ranking (lower ranking = higher power)
    const homePower = this.calculateTeamPower(homeRanking)
    const awayPower = this.calculateTeamPower(awayRanking)
    
    // Use different weights for qualifying vs tournament matches
    const homeWeight = isQualifying ? 1.08 : 1.12  // Slightly less dramatic for qualifying
    const awayWeight = isQualifying ? 0.92 : 0.88
    
    // Calculate win probabilities
    const totalPower = (homePower * homeWeight) + (awayPower * awayWeight)
    const homeWinProb = (homePower * homeWeight) / totalPower
    const awayWinProb = (awayPower * awayWeight) / totalPower
    
    // Draw probability (higher for more evenly matched teams)
    const powerDifference = Math.abs(homePower - awayPower)
    const drawProb = Math.max(0.15, 0.35 - (powerDifference * 0.02))
    
    // Adjust win probabilities to account for draws
    const adjustedHomeWinProb = homeWinProb * (1 - drawProb)
    const adjustedAwayWinProb = awayWinProb * (1 - drawProb)
    
    const random = Math.random()
    
    if (random < adjustedHomeWinProb) {
      return this.simulateRealisticScore(homePower, awayPower, 'home')
    } else if (random < adjustedHomeWinProb + adjustedAwayWinProb) {
      return this.simulateRealisticScore(homePower, awayPower, 'away')
    } else {
      return this.simulateRealisticScore(homePower, awayPower, 'draw')
    }
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

  // Simulate realistic score based on team powers
  simulateRealisticScore(homePower, awayPower, result) {
    let homeScore = 0
    let awayScore = 0
    
    // Base scoring probability (higher power = more likely to score)
    const homeScoreProb = 0.1 + (homePower / 100)
    const awayScoreProb = 0.1 + (awayPower / 100)
    
    if (result === 'home') {
      // Home team wins
      homeScore = 1 + Math.floor(Math.random() * 3) // 1-3 goals
      awayScore = Math.random() < 0.4 ? Math.floor(Math.random() * 2) : 0 // 0-1 goals usually
      
      // Ensure home team actually wins
      if (homeScore <= awayScore) {
        homeScore = awayScore + 1
      }
    } else if (result === 'away') {
      // Away team wins
      awayScore = 1 + Math.floor(Math.random() * 3) // 1-3 goals
      homeScore = Math.random() < 0.4 ? Math.floor(Math.random() * 2) : 0 // 0-1 goals usually
      
      // Ensure away team actually wins
      if (awayScore <= homeScore) {
        awayScore = homeScore + 1
      }
    } else {
      // Draw
      const baseScore = Math.random() < 0.5 ? 0 : 1
      homeScore = baseScore + Math.floor(Math.random() * 2) // 0-2 goals
      awayScore = homeScore // Same score for draw
    }
    
    // Ensure realistic score ranges (0-5 goals per team max)
    homeScore = Math.min(homeScore, 5)
    awayScore = Math.min(awayScore, 5)
    
    return { homeScore, awayScore }
  }

  // Update team standings after a match
  updateTeamStandings(team, homeScore, awayScore, isHome) {
    const goalDifference = isHome ? (homeScore - awayScore) : (awayScore - homeScore)
    const goalsFor = isHome ? homeScore : awayScore
    const goalsAgainst = isHome ? awayScore : homeScore
    
    team.played++
    team.goalsFor += goalsFor
    team.goalsAgainst += goalsAgainst
    team.goalDifference += goalDifference
    
    if (goalDifference > 0) {
      team.won++
      team.points += 3
    } else if (goalDifference === 0) {
      team.drawn++
      team.points += 1
    } else {
      team.lost++
    }
  }

  // Simulate a single match
  simulateMatch(match, isQualifying = true, world = null) {
    if (match.played) return match

    // Ensure teams have rankings - use world rankings if available
    if (!match.homeTeam.ranking) {
      match.homeTeam.ranking = this.getTeamRanking(match.homeTeam, world)
    }
    if (!match.awayTeam.ranking) {
      match.awayTeam.ranking = this.getTeamRanking(match.awayTeam, world)
    }

    const { homeScore, awayScore } = this.calculateMatchOutcome(
      match.homeTeam, 
      match.awayTeam, 
      isQualifying,
      world
    )
    
    match.homeScore = homeScore
    match.awayScore = awayScore
    match.played = true
    
    return match
  }

  // Generate playoff matches for OFC
  generateOFCPlayoffMatches(groupWinners) {
    if (groupWinners.length !== 2) return []
    
    const playoffMatches = []
    
    // Home leg
    playoffMatches.push({
      matchId: 'ofc_playoff_home',
      name: 'OFC Playoff - Home Leg',
      type: 'playoff_home',
      homeTeam: groupWinners[0],
      awayTeam: groupWinners[1],
      homeScore: 0,
      awayScore: 0,
      played: false,
      confederationId: 'ofc'
    })
    
    // Away leg
    playoffMatches.push({
      matchId: 'ofc_playoff_away',
      name: 'OFC Playoff - Away Leg', 
      type: 'playoff_away',
      homeTeam: groupWinners[1],
      awayTeam: groupWinners[0],
      homeScore: 0,
      awayScore: 0,
      played: false,
      confederationId: 'ofc'
    })
    
    return playoffMatches
  }

  // Determine OFC playoff winner
  determineOFCPlayoffWinner(playoffMatches) {
    if (playoffMatches.length !== 2 || !playoffMatches.every(m => m.played)) {
      return null
    }
    
    const homeMatch = playoffMatches.find(m => m.type === 'playoff_home')
    const awayMatch = playoffMatches.find(m => m.type === 'playoff_away')
    
    if (!homeMatch || !awayMatch) return null
    
    // Calculate aggregate score
    const team1Goals = homeMatch.homeScore + awayMatch.awayScore
    const team2Goals = homeMatch.awayScore + awayMatch.homeScore
    
    let winner = null
    
    if (team1Goals > team2Goals) {
      winner = homeMatch.homeTeam
    } else if (team2Goals > team1Goals) {
      winner = homeMatch.awayTeam
    } else {
      // If aggregate is tied, away goals rule or random winner
      const team1AwayGoals = awayMatch.awayScore
      const team2AwayGoals = homeMatch.awayScore
      
      if (team1AwayGoals > team2AwayGoals) {
        winner = homeMatch.homeTeam
      } else if (team2AwayGoals > team1AwayGoals) {
        winner = homeMatch.awayTeam
      } else {
        // Random winner if still tied
        winner = Math.random() < 0.5 ? homeMatch.homeTeam : homeMatch.awayTeam
      }
    }
    
    return winner
  }
}

export default new MatchSimulationService()