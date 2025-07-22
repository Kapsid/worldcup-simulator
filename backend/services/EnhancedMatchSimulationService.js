import Player from '../models/Player.js'
import MatchDetail from '../models/MatchDetail.js'
import PlayerStats from '../models/PlayerStats.js'
import { generatePlayerName } from '../data/playerNames.js'

class EnhancedMatchSimulationService {
  
  // Formation templates with positions
  static FORMATIONS = {
    '4-4-2': {
      positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'LM', 'CM', 'CM', 'RM', 'ST', 'ST'],
      description: 'Classic 4-4-2 formation'
    },
    '4-3-3': {
      positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'CDM', 'CM', 'CM', 'LW', 'ST', 'RW'],
      description: 'Attacking 4-3-3 formation'
    },
    '4-2-3-1': {
      positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'CDM', 'CDM', 'LM', 'CAM', 'RM', 'ST'],
      description: 'Modern 4-2-3-1 formation'
    },
    '3-5-2': {
      positions: ['GK', 'CB', 'CB', 'CB', 'LWB', 'CM', 'CM', 'CM', 'RWB', 'ST', 'ST'],
      description: 'Wing-back formation'
    },
    '5-3-2': {
      positions: ['GK', 'LB', 'CB', 'CB', 'CB', 'RB', 'CM', 'CM', 'CM', 'ST', 'ST'],
      description: 'Defensive 5-3-2 formation'
    }
  }

  // Goal probability by position
  static GOAL_PROBABILITIES = {
    'GK': 0.01,
    'CB': 0.08, 'LB': 0.05, 'RB': 0.05, 'LWB': 0.08, 'RWB': 0.08,
    'CDM': 0.12, 'CM': 0.18, 'CAM': 0.25, 'LM': 0.15, 'RM': 0.15,
    'LW': 0.22, 'RW': 0.22, 'CF': 0.35, 'ST': 0.40
  }

  // Assist probability by position  
  static ASSIST_PROBABILITIES = {
    'GK': 0.02,
    'CB': 0.08, 'LB': 0.15, 'RB': 0.15, 'LWB': 0.20, 'RWB': 0.20,
    'CDM': 0.18, 'CM': 0.25, 'CAM': 0.35, 'LM': 0.22, 'RM': 0.22,
    'LW': 0.30, 'RW': 0.30, 'CF': 0.20, 'ST': 0.18
  }

  /**
   * Get players for a team from the database
   */
  async getTeamPlayers(teamCode, tournamentId = null, worldId = null) {
    const query = { teamId: teamCode }
    
    if (tournamentId) {
      query.tournamentId = tournamentId
    } else if (worldId) {
      query.worldId = worldId
    }

    const players = await Player.find(query).sort({ overallRating: -1 })
    return players
  }

  /**
   * Select starting XI based on formation and player ratings
   */
  async selectStartingXI(teamCode, formation = '4-4-2', tournamentId = null, worldId = null) {
    const players = await this.getTeamPlayers(teamCode, tournamentId, worldId)
    
    if (players.length < 11) {
      throw new Error(`Not enough players for team ${teamCode}. Found ${players.length}, need at least 11.`)
    }

    const formationData = EnhancedMatchSimulationService.FORMATIONS[formation]
    const requiredPositions = formationData.positions
    const startingXI = []

    // Group players by position
    const playersByPosition = {}
    players.forEach(player => {
      const pos = player.detailedPosition
      if (!playersByPosition[pos]) {
        playersByPosition[pos] = []
      }
      playersByPosition[pos].push(player)
    })

    // Select best player for each required position
    for (const position of requiredPositions) {
      let selectedPlayer = null
      
      // First, try to find exact position match
      if (playersByPosition[position] && playersByPosition[position].length > 0) {
        // Get best available player for this position
        const availablePlayers = playersByPosition[position].filter(p => 
          !startingXI.some(selected => selected._id.equals(p._id))
        )
        if (availablePlayers.length > 0) {
          selectedPlayer = availablePlayers.sort((a, b) => b.overallRating - a.overallRating)[0]
        }
      }

      // If no exact match, find similar position
      if (!selectedPlayer) {
        selectedPlayer = this.findSimilarPositionPlayer(position, playersByPosition, startingXI)
      }

      // If still no match, pick best available player
      if (!selectedPlayer) {
        const availablePlayers = players.filter(p => 
          !startingXI.some(selected => selected._id.equals(p._id))
        )
        if (availablePlayers.length > 0) {
          selectedPlayer = availablePlayers[0]
        }
      }

      if (selectedPlayer) {
        startingXI.push({
          player: selectedPlayer._id,
          position: position,
          jerseyNumber: selectedPlayer.jerseyNumber,
          isStarter: true,
          isCaptain: selectedPlayer.isCaptain
        })
      }
    }

    return startingXI
  }

  /**
   * Find player with similar position when exact match not available
   */
  findSimilarPositionPlayer(requiredPosition, playersByPosition, alreadySelected) {
    const positionGroups = {
      'GK': ['GK'],
      'CB': ['CB', 'LB', 'RB'],
      'LB': ['LB', 'LWB', 'CB'],
      'RB': ['RB', 'RWB', 'CB'],
      'LWB': ['LWB', 'LB', 'LM'],
      'RWB': ['RWB', 'RB', 'RM'],
      'CDM': ['CDM', 'CM', 'CB'],
      'CM': ['CM', 'CDM', 'CAM'],
      'CAM': ['CAM', 'CM', 'LW', 'RW'],
      'LM': ['LM', 'LWB', 'LW'],
      'RM': ['RM', 'RWB', 'RW'],
      'LW': ['LW', 'LM', 'ST'],
      'RW': ['RW', 'RM', 'ST'],
      'CF': ['CF', 'ST', 'CAM'],
      'ST': ['ST', 'CF', 'LW', 'RW']
    }

    const similarPositions = positionGroups[requiredPosition] || [requiredPosition]
    
    for (const pos of similarPositions) {
      if (playersByPosition[pos]) {
        const available = playersByPosition[pos].filter(p => 
          !alreadySelected.some(selected => selected._id?.equals(p._id) || selected.player?.equals(p._id))
        )
        if (available.length > 0) {
          return available.sort((a, b) => b.overallRating - a.overallRating)[0]
        }
      }
    }

    return null
  }

  /**
   * Select substitutes (usually 7-12 players)
   */
  async selectSubstitutes(teamCode, startingXI, tournamentId = null, worldId = null) {
    const allPlayers = await this.getTeamPlayers(teamCode, tournamentId, worldId)
    const startingPlayerIds = startingXI.map(s => s.player.toString())
    
    const substitutes = allPlayers
      .filter(player => !startingPlayerIds.includes(player._id.toString()))
      .sort((a, b) => b.overallRating - a.overallRating)
      .slice(0, 12)  // Take up to 12 substitutes
      .map(player => ({
        player: player._id,
        position: player.detailedPosition,
        jerseyNumber: player.jerseyNumber,
        isStarter: false,
        isCaptain: false
      }))

    return substitutes
  }

  /**
   * Generate match statistics based on team strength
   */
  generateMatchStats(homeTeamStrength, awayTeamStrength) {
    const totalStrength = homeTeamStrength + awayTeamStrength
    const homeAdvantage = 1.1  // 10% home advantage
    
    const homePossession = Math.round(
      ((homeTeamStrength * homeAdvantage) / (totalStrength * homeAdvantage)) * 100
    )
    const awayPossession = 100 - homePossession

    const homeShots = Math.round(8 + Math.random() * 12 + (homeTeamStrength - awayTeamStrength) * 0.3)
    const awayShots = Math.round(8 + Math.random() * 12 + (awayTeamStrength - homeTeamStrength) * 0.3)

    return {
      possession: { home: homePossession, away: awayPossession },
      shots: { home: Math.max(2, homeShots), away: Math.max(2, awayShots) },
      shotsOnTarget: { 
        home: Math.round(homeShots * (0.2 + Math.random() * 0.4)), 
        away: Math.round(awayShots * (0.2 + Math.random() * 0.4))
      },
      corners: { 
        home: Math.round(2 + Math.random() * 8), 
        away: Math.round(2 + Math.random() * 8)
      },
      fouls: { 
        home: Math.round(8 + Math.random() * 10), 
        away: Math.round(8 + Math.random() * 10)
      },
      yellowCards: { home: 0, away: 0 },
      redCards: { home: 0, away: 0 }
    }
  }

  /**
   * Generate goals for the match
   */
  async generateGoals(homeScore, awayScore, homeLineup, awayLineup) {
    const goals = []
    const totalGoals = homeScore + awayScore
    
    if (totalGoals === 0) return goals

    // Assign goals to teams
    const homeGoals = homeScore
    const awayGoals = awayScore

    // Generate home team goals
    for (let i = 0; i < homeGoals; i++) {
      const goal = await this.generateSingleGoal('home', homeLineup)
      goals.push(goal)
    }

    // Generate away team goals
    for (let i = 0; i < awayGoals; i++) {
      const goal = await this.generateSingleGoal('away', awayLineup)
      goals.push(goal)
    }

    // Sort goals by minute
    goals.sort((a, b) => a.minute - b.minute)

    return goals
  }

  /**
   * Generate a single goal
   */
  async generateSingleGoal(team, lineup) {
    // Select a random minute (weighted towards certain periods)
    const minute = this.generateGoalMinute()
    
    // Select scorer based on position probabilities
    const scorer = this.selectGoalScorer(lineup)
    
    // Determine goal type
    const goalTypes = ['open_play', 'penalty', 'free_kick', 'corner', 'header']
    const goalType = goalTypes[Math.floor(Math.random() * goalTypes.length)]
    
    // Possibly add assist (70% chance)
    let assist = null
    if (Math.random() < 0.7 && goalType !== 'penalty') {
      assist = this.selectAssistProvider(lineup, scorer)
    }

    return {
      player: scorer.player,
      team: team,
      minute: minute,
      goalType: goalType,
      isOwnGoal: false,
      assist: assist
    }
  }

  /**
   * Generate realistic goal minutes
   */
  generateGoalMinute() {
    // Weight certain periods more heavily
    const periods = [
      { min: 1, max: 15, weight: 0.15 },   // Early
      { min: 16, max: 30, weight: 0.20 },  // First half middle
      { min: 31, max: 45, weight: 0.25 },  // End of first half
      { min: 46, max: 60, weight: 0.20 },  // Start of second half
      { min: 61, max: 75, weight: 0.15 },  // Second half middle
      { min: 76, max: 90, weight: 0.25 }   // End of second half
    ]
    
    const random = Math.random()
    let cumulative = 0
    
    for (const period of periods) {
      cumulative += period.weight
      if (random <= cumulative) {
        return Math.floor(Math.random() * (period.max - period.min + 1)) + period.min
      }
    }
    
    return 45 + Math.floor(Math.random() * 46) // Fallback
  }

  /**
   * Select goal scorer based on position probabilities
   */
  selectGoalScorer(lineup) {
    const startingPlayers = lineup.filter(p => p.isStarter)
    const weights = startingPlayers.map(player => 
      EnhancedMatchSimulationService.GOAL_PROBABILITIES[player.position] || 0.1
    )
    
    const totalWeight = weights.reduce((sum, w) => sum + w, 0)
    let random = Math.random() * totalWeight
    
    for (let i = 0; i < startingPlayers.length; i++) {
      random -= weights[i]
      if (random <= 0) {
        return startingPlayers[i]
      }
    }
    
    // Fallback
    return startingPlayers[Math.floor(Math.random() * startingPlayers.length)]
  }

  /**
   * Select assist provider
   */
  selectAssistProvider(lineup, scorer) {
    const startingPlayers = lineup.filter(p => 
      p.isStarter && !p.player.equals(scorer.player)
    )
    
    if (startingPlayers.length === 0) return null
    
    const weights = startingPlayers.map(player => 
      EnhancedMatchSimulationService.ASSIST_PROBABILITIES[player.position] || 0.1
    )
    
    const totalWeight = weights.reduce((sum, w) => sum + w, 0)
    let random = Math.random() * totalWeight
    
    for (let i = 0; i < startingPlayers.length; i++) {
      random -= weights[i]
      if (random <= 0) {
        return startingPlayers[i].player
      }
    }
    
    return null
  }

  /**
   * Generate substitutions
   */
  generateSubstitutions(homeLineup, awayLineup, homeSubstitutes, awaySubstitutes) {
    const substitutions = []
    
    // Generate 1-3 substitutions per team
    const homeSubCount = Math.floor(Math.random() * 3) + 1
    const awaySubCount = Math.floor(Math.random() * 3) + 1
    
    // Generate home team substitutions
    for (let i = 0; i < homeSubCount && i < homeSubstitutes.length; i++) {
      if (i < homeLineup.filter(p => p.isStarter).length) {
        const playerOut = homeLineup.filter(p => p.isStarter)[i]
        const playerIn = homeSubstitutes[i]
        const minute = 46 + Math.floor(Math.random() * 35) // Second half subs
        
        substitutions.push({
          playerOut: playerOut.player,
          playerIn: playerIn.player,
          team: 'home',
          minute: minute,
          reason: 'tactical'
        })
      }
    }
    
    // Generate away team substitutions
    for (let i = 0; i < awaySubCount && i < awaySubstitutes.length; i++) {
      if (i < awayLineup.filter(p => p.isStarter).length) {
        const playerOut = awayLineup.filter(p => p.isStarter)[i]
        const playerIn = awaySubstitutes[i]
        const minute = 46 + Math.floor(Math.random() * 35)
        
        substitutions.push({
          playerOut: playerOut.player,
          playerIn: playerIn.player,
          team: 'away',
          minute: minute,
          reason: 'tactical'
        })
      }
    }
    
    return substitutions.sort((a, b) => a.minute - b.minute)
  }

  /**
   * Generate match report
   */
  async generateMatchReport(homeTeam, awayTeam, homeScore, awayScore, goals, matchStats) {
    const homeTeamName = homeTeam.name || homeTeam.countryCode || 'Home Team'
    const awayTeamName = awayTeam.name || awayTeam.countryCode || 'Away Team'
    
    let summary = ""
    let keyMoments = []
    
    if (homeScore > awayScore) {
      summary = `${homeTeamName} secured a ${homeScore}-${awayScore} victory over ${awayTeamName} in an entertaining encounter. The hosts dominated possession (${matchStats.possession.home}%) and created more chances throughout the match.`
    } else if (awayScore > homeScore) {
      summary = `${awayTeamName} claimed a ${awayScore}-${homeScore} away victory against ${homeTeamName}. Despite having less possession (${matchStats.possession.away}%), the visitors were clinical in front of goal.`
    } else {
      summary = `${homeTeamName} and ${awayTeamName} shared the points in a ${homeScore}-${awayScore} draw. Both teams created chances but had to settle for a point each in this competitive encounter.`
    }
    
    // Add goal moments
    for (const goal of goals) {
      try {
        const player = await Player.findById(goal.player)
        if (player) {
          const teamName = goal.team === 'home' ? homeTeamName : awayTeamName
          keyMoments.push(`${goal.minute}' - GOAL! ${player.displayName} scores for ${teamName}`)
        }
      } catch (error) {
        console.error('Error finding player for match report:', error)
      }
    }
    
    // Add stats moments
    if (matchStats.shots.home > matchStats.shots.away + 5) {
      keyMoments.push(`${homeTeamName} dominated with ${matchStats.shots.home} shots to ${matchStats.shots.away}`)
    } else if (matchStats.shots.away > matchStats.shots.home + 5) {
      keyMoments.push(`${awayTeamName} outshot their opponents ${matchStats.shots.away} to ${matchStats.shots.home}`)
    }
    
    return {
      summary,
      keyMoments,
      manOfTheMatch: goals.length > 0 ? goals[0].player : null
    }
  }

  /**
   * Update player statistics
   */
  async updatePlayerStats(playerId, matchId, performance, competitionType, tournamentId = null, worldId = null) {
    let stats = await PlayerStats.findOne({
      player: playerId,
      tournamentId: tournamentId,
      worldId: worldId,
      competitionType: competitionType
    })
    
    if (!stats) {
      stats = new PlayerStats({
        player: playerId,
        tournamentId: tournamentId,
        worldId: worldId,
        competitionType: competitionType
      })
    }
    
    await stats.addMatchPerformance({
      match: matchId,
      isStarter: performance.isStarter || false,
      minutesPlayed: performance.minutesPlayed || 90,
      goals: performance.goals || 0,
      assists: performance.assists || 0,
      yellowCard: performance.yellowCard || false,
      redCard: performance.redCard || false,
      rating: performance.rating || 6.0,
      date: new Date()
    })
    
    return stats
  }

  /**
   * Complete enhanced match simulation
   */
  async simulateEnhancedMatch(match, competitionType = 'tournament', world = null) {
    try {
      console.log(`Starting enhanced simulation for match ${match._id}`)
      
      // Get team codes
      const homeTeamCode = match.homeTeam.countryCode || match.homeTeam.code
      const awayTeamCode = match.awayTeam.countryCode || match.awayTeam.code
      
      // Select formations (could be made more intelligent based on team style)
      const formations = Object.keys(EnhancedMatchSimulationService.FORMATIONS)
      const homeFormation = formations[Math.floor(Math.random() * formations.length)]
      const awayFormation = formations[Math.floor(Math.random() * formations.length)]
      
      // Generate lineups
      const homeStartingXI = await this.selectStartingXI(homeTeamCode, homeFormation, match.tournament, world?._id)
      const awayStartingXI = await this.selectStartingXI(awayTeamCode, awayFormation, match.tournament, world?._id)
      
      const homeSubstitutes = await this.selectSubstitutes(homeTeamCode, homeStartingXI, match.tournament, world?._id)
      const awaySubstitutes = await this.selectSubstitutes(awayTeamCode, awayStartingXI, match.tournament, world?._id)
      
      // Calculate team strength (average rating)
      const homeStrength = await this.calculateTeamStrength(homeTeamCode, match.tournament, world?._id)
      const awayStrength = await this.calculateTeamStrength(awayTeamCode, match.tournament, world?._id)
      
      // Generate match statistics
      const matchStats = this.generateMatchStats(homeStrength, awayStrength)
      
      // Use existing basic score simulation (we keep the same outcome logic)
      const homeScore = match.homeScore
      const awayScore = match.awayScore
      
      // Generate goals with actual players
      const goals = await this.generateGoals(homeScore, awayScore, homeStartingXI, awayStartingXI)
      
      // Generate substitutions
      const substitutions = this.generateSubstitutions(homeStartingXI, awayStartingXI, homeSubstitutes, awaySubstitutes)
      
      // Generate match report
      const matchReport = await this.generateMatchReport(match.homeTeam, match.awayTeam, homeScore, awayScore, goals, matchStats)
      
      // Create full lineup (starters + subs)
      const fullHomeLineup = [...homeStartingXI, ...homeSubstitutes]
      const fullAwayLineup = [...awayStartingXI, ...awaySubstitutes]
      
      // Create or update match details
      const matchDetail = await MatchDetail.findOneAndUpdate(
        { match: match._id },
        {
          match: match._id,
          homeLineup: fullHomeLineup,
          awayLineup: fullAwayLineup,
          goals: goals,
          substitutions: substitutions,
          possession: matchStats.possession,
          shots: matchStats.shots,
          shotsOnTarget: matchStats.shotsOnTarget,
          corners: matchStats.corners,
          fouls: matchStats.fouls,
          yellowCards: matchStats.yellowCards,
          redCards: matchStats.redCards,
          matchReport: matchReport,
          homeFormation: homeFormation,
          awayFormation: awayFormation,
          weather: ['sunny', 'cloudy', 'rainy'][Math.floor(Math.random() * 3)],
          temperature: Math.floor(Math.random() * 30) + 5,
          attendance: Math.floor(Math.random() * 80000) + 20000
        },
        { upsert: true, new: true }
      )
      
      // Update player statistics
      await this.updateAllPlayerStats(fullHomeLineup, fullAwayLineup, goals, substitutions, match._id, competitionType, match.tournament, world?._id)
      
      console.log(`Enhanced match simulation completed for match ${match._id}`)
      return matchDetail
      
    } catch (error) {
      console.error('Error in enhanced match simulation:', error)
      throw error
    }
  }

  /**
   * Calculate team strength based on player ratings
   */
  async calculateTeamStrength(teamCode, tournamentId = null, worldId = null) {
    const players = await this.getTeamPlayers(teamCode, tournamentId, worldId)
    if (players.length === 0) return 50
    
    // Get top 11 players by rating
    const topPlayers = players
      .sort((a, b) => b.overallRating - a.overallRating)
      .slice(0, 11)
    
    const averageRating = topPlayers.reduce((sum, player) => sum + player.overallRating, 0) / topPlayers.length
    return averageRating
  }

  /**
   * Update statistics for all players involved in the match
   */
  async updateAllPlayerStats(homeLineup, awayLineup, goals, substitutions, matchId, competitionType, tournamentId = null, worldId = null) {
    // Count goals and assists for each player
    const playerStats = {}
    
    // Initialize all players
    [...homeLineup, ...awayLineup].forEach(lineupPlayer => {
      const playerId = lineupPlayer.player.toString()
      playerStats[playerId] = {
        isStarter: lineupPlayer.isStarter,
        minutesPlayed: lineupPlayer.isStarter ? 90 : 0,
        goals: 0,
        assists: 0,
        yellowCard: false,
        redCard: false,
        rating: 6.0
      }
    })
    
    // Count goals
    goals.forEach(goal => {
      const scorerId = goal.player.toString()
      if (playerStats[scorerId]) {
        playerStats[scorerId].goals += 1
        playerStats[scorerId].rating += 0.5  // Boost rating for goal
      }
      
      if (goal.assist) {
        const assistId = goal.assist.toString()
        if (playerStats[assistId]) {
          playerStats[assistId].assists += 1
          playerStats[assistId].rating += 0.3  // Boost rating for assist
        }
      }
    })
    
    // Adjust minutes for substitutions
    substitutions.forEach(sub => {
      const playerOutId = sub.playerOut.toString()
      const playerInId = sub.playerIn.toString()
      
      if (playerStats[playerOutId]) {
        playerStats[playerOutId].minutesPlayed = sub.minute
      }
      
      if (playerStats[playerInId]) {
        playerStats[playerInId].minutesPlayed = 90 - sub.minute
        if (playerStats[playerInId].minutesPlayed > 0) {
          playerStats[playerInId].isStarter = false
        }
      }
    })
    
    // Update database records
    const updatePromises = Object.keys(playerStats).map(playerId => {
      return this.updatePlayerStats(playerId, matchId, playerStats[playerId], competitionType, tournamentId, worldId)
    })
    
    await Promise.all(updatePromises)
  }
}

export default new EnhancedMatchSimulationService()