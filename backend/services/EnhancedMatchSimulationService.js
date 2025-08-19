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

  // Card probability by position (higher = more likely to get cards)
  static CARD_PROBABILITIES = {
    'GK': 0.02,
    'CB': 0.25, 'LB': 0.18, 'RB': 0.18, 'LWB': 0.15, 'RWB': 0.15,
    'CDM': 0.30, 'CM': 0.20, 'CAM': 0.12, 'LM': 0.15, 'RM': 0.15,
    'LW': 0.18, 'RW': 0.18, 'CF': 0.22, 'ST': 0.25
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
    const cards = []
    const totalGoals = homeScore + awayScore
    
    if (totalGoals === 0) return goals

    // Generate cards first to know which players are sent off
    const tempMatchStats = {
      fouls: { home: 12, away: 14 } // Temporary stats for card generation
    }
    const generatedCards = await this.generateCards(homeLineup, awayLineup, tempMatchStats)
    
    // Assign goals to teams
    const homeGoals = homeScore
    const awayGoals = awayScore

    // Generate home team goals
    for (let i = 0; i < homeGoals; i++) {
      const goal = await this.generateSingleGoal('home', homeLineup, generatedCards)
      goals.push(goal)
    }

    // Generate away team goals
    for (let i = 0; i < awayGoals; i++) {
      const goal = await this.generateSingleGoal('away', awayLineup, generatedCards)
      goals.push(goal)
    }

    // Sort goals by minute
    goals.sort((a, b) => a.minute - b.minute)

    return goals
  }

  /**
   * Generate goals considering substitutions
   */
  async generateGoalsWithSubstitutions(homeScore, awayScore, homeLineup, awayLineup, substitutions) {
    const goals = []
    const totalGoals = homeScore + awayScore
    
    if (totalGoals === 0) return goals

    // Generate temporary cards for red card filtering
    const tempMatchStats = {
      fouls: { home: 12, away: 14 }
    }
    const tempCards = await this.generateCards(homeLineup, awayLineup, tempMatchStats)
    
    // Assign goals to teams
    const homeGoals = homeScore
    const awayGoals = awayScore

    // Generate home team goals
    for (let i = 0; i < homeGoals; i++) {
      const goal = await this.generateSingleGoal('home', homeLineup, tempCards, substitutions)
      goals.push(goal)
    }

    // Generate away team goals
    for (let i = 0; i < awayGoals; i++) {
      const goal = await this.generateSingleGoal('away', awayLineup, tempCards, substitutions)
      goals.push(goal)
    }

    // Sort goals by minute
    goals.sort((a, b) => a.minute - b.minute)

    return goals
  }

  /**
   * Generate cards considering substitutions
   */
  async generateCardsWithSubstitutions(homeLineup, awayLineup, matchStats, substitutions) {
    const cards = []
    const playerCards = new Map()
    
    // Calculate total card count based on fouls
    const totalFouls = matchStats.fouls.home + matchStats.fouls.away
    const baseCardCount = Math.floor(totalFouls / 4)
    const cardVariation = Math.floor(Math.random() * 3) - 1
    const totalCards = Math.max(0, Math.min(8, baseCardCount + cardVariation))
    
    if (totalCards === 0) return cards
    
    // Distribute cards between teams
    const homeCardRatio = (matchStats.fouls.home / totalFouls) * 0.9
    const homeCards = Math.round(totalCards * homeCardRatio)
    const awayCards = totalCards - homeCards
    
    // Generate home team cards
    for (let i = 0; i < homeCards; i++) {
      const card = this.generateSingleCardWithSubstitutions('home', homeLineup, playerCards, substitutions)
      if (card) {
        cards.push(card)
        this.trackPlayerCard(playerCards, card.player, card.cardType)
      }
    }
    
    // Generate away team cards
    for (let i = 0; i < awayCards; i++) {
      const card = this.generateSingleCardWithSubstitutions('away', awayLineup, playerCards, substitutions)
      if (card) {
        cards.push(card)
        this.trackPlayerCard(playerCards, card.player, card.cardType)
      }
    }
    
    // Sort cards by minute
    cards.sort((a, b) => a.minute - b.minute)
    
    return cards
  }

  /**
   * Generate a single card considering substitutions
   */
  generateSingleCardWithSubstitutions(team, lineup, playerCards, substitutions) {
    // Select a random minute
    const minute = this.generateCardMinute()
    
    // Get active players at this minute (considering substitutions)
    const activePlayers = this.getActivePlayersAtMinute(lineup, substitutions, [], team, minute)
    
    // Select player based on position probabilities and existing cards
    const cardReceiver = this.selectCardReceiverFromActivePlayers(activePlayers, playerCards)
    if (!cardReceiver) return null
    
    // Determine card type (same logic as original)
    const existingYellows = playerCards.get(cardReceiver.player.toString()) || { yellows: 0, reds: 0 }
    let cardType = 'yellow'
    let reason = 'foul'
    
    if (existingYellows.yellows > 0) {
      if (Math.random() < 0.25) {
        cardType = 'second_yellow'
        reason = 'second_yellow'
      }
    } else {
      if (Math.random() < 0.05) {
        cardType = 'red'
        reason = Math.random() < 0.5 ? 'violent_conduct' : 'serious_foul_play'
      }
    }
    
    if (cardType === 'yellow') {
      const yellowReasons = ['foul', 'unsporting_behavior', 'dissent']
      reason = yellowReasons[Math.floor(Math.random() * yellowReasons.length)]
    }
    
    return {
      player: cardReceiver.player,
      team: team,
      minute: minute,
      cardType: cardType,
      reason: reason
    }
  }

  /**
   * Select card receiver from active players
   */
  selectCardReceiverFromActivePlayers(activePlayers, playerCards) {
    // Filter out players who already have red cards
    const eligiblePlayers = activePlayers.filter(player => {
      const playerCardHistory = playerCards.get(player.player.toString()) || { yellows: 0, reds: 0 }
      return playerCardHistory.reds === 0
    })
    
    if (eligiblePlayers.length === 0) return null
    
    const weights = eligiblePlayers.map(player => 
      EnhancedMatchSimulationService.CARD_PROBABILITIES[player.position] || 0.1
    )
    
    const totalWeight = weights.reduce((sum, w) => sum + w, 0)
    let random = Math.random() * totalWeight
    
    for (let i = 0; i < eligiblePlayers.length; i++) {
      random -= weights[i]
      if (random <= 0) {
        return eligiblePlayers[i]
      }
    }
    
    return eligiblePlayers[Math.floor(Math.random() * eligiblePlayers.length)]
  }

  /**
   * Generate a single goal
   */
  async generateSingleGoal(team, lineup, cards = [], substitutions = []) {
    // Select a random minute (weighted towards certain periods)
    const minute = this.generateGoalMinute()
    
    // Select scorer based on position probabilities, excluding red-carded and substituted players
    const scorer = this.selectGoalScorer(lineup, cards, minute, substitutions, team)
    
    // Determine goal type with realistic weightings
    const goalTypeWeights = [
      { type: 'open_play', weight: 0.55 },    // 55% - Most common
      { type: 'penalty', weight: 0.12 },      // 12% - Realistic penalty frequency
      { type: 'free_kick', weight: 0.08 },    // 8% - Direct free kicks
      { type: 'corner', weight: 0.15 },       // 15% - Headers from corners
      { type: 'header', weight: 0.10 }        // 10% - Headers from other situations
    ]
    
    const totalWeight = goalTypeWeights.reduce((sum, gt) => sum + gt.weight, 0)
    let random = Math.random() * totalWeight
    let goalType = 'open_play'
    
    for (const gt of goalTypeWeights) {
      random -= gt.weight
      if (random <= 0) {
        goalType = gt.type
        break
      }
    }
    
    // For penalties, prefer players who are good penalty takers (usually forwards/mids)
    if (goalType === 'penalty') {
      const penaltyTakers = lineup.filter(p => 
        p.isStarter && ['ST', 'CF', 'CAM', 'CM'].includes(p.position)
      )
      // Filter out red-carded penalty takers
      const availablePenaltyTakers = this.filterRedCardedPlayers(penaltyTakers, cards, minute)
      if (availablePenaltyTakers.length > 0) {
        const penaltyScorer = availablePenaltyTakers[Math.floor(Math.random() * availablePenaltyTakers.length)]
        scorer.player = penaltyScorer.player
        scorer.position = penaltyScorer.position
      }
    }
    
    // Possibly add assist (70% chance, but not for penalties)
    let assist = null
    if (Math.random() < 0.7 && goalType !== 'penalty') {
      assist = this.selectAssistProvider(lineup, scorer, cards, minute)
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
   * Filter out players who have been sent off before the given minute
   */
  filterRedCardedPlayers(players, cards, minute) {
    return players.filter(player => {
      // Check if this player has a red card before this minute
      const playerRedCard = cards.find(card => 
        card.player.toString() === player.player.toString() &&
        (card.cardType === 'red' || card.cardType === 'second_yellow') &&
        card.minute < minute
      )
      return !playerRedCard // Include player only if they don't have a red card before this minute
    })
  }

  /**
   * Filter out players who have been substituted off before the given minute
   */
  filterSubstitutedPlayers(players, substitutions, team, minute) {
    return players.filter(player => {
      // Check if this player was substituted out before this minute
      const substitutedOut = substitutions.find(sub => 
        sub.team === team &&
        sub.playerOut.toString() === player.player.toString() &&
        sub.minute < minute
      )
      return !substitutedOut // Include player only if they weren't substituted out before this minute
    })
  }

  /**
   * Get active players at a given minute (including substitutes who came on)
   */
  getActivePlayersAtMinute(lineup, substitutions, cards, team, minute) {
    // Start with all players who were originally on the field
    let activePlayers = lineup.filter(p => p.isStarter)
    
    // Remove players who were substituted out before this minute
    activePlayers = this.filterSubstitutedPlayers(activePlayers, substitutions, team, minute)
    
    // Remove players who were red-carded before this minute
    activePlayers = this.filterRedCardedPlayers(activePlayers, cards, minute)
    
    // Add players who were substituted in before this minute (but not red-carded)
    const substitutedIn = substitutions.filter(sub => 
      sub.team === team && sub.minute < minute
    )
    
    for (const sub of substitutedIn) {
      // Find the substitute player in the lineup
      const subPlayer = lineup.find(p => p.player.toString() === sub.playerIn.toString())
      if (subPlayer) {
        // Check if the substitute was red-carded after coming on
        const subPlayerCards = cards.filter(card => 
          card.player.toString() === subPlayer.player.toString() &&
          (card.cardType === 'red' || card.cardType === 'second_yellow') &&
          card.minute > sub.minute && card.minute < minute
        )
        if (subPlayerCards.length === 0) {
          activePlayers.push(subPlayer)
        }
      }
    }
    
    return activePlayers
  }

  /**
   * Select goal scorer based on position probabilities
   */
  selectGoalScorer(lineup, cards = [], minute = 90, substitutions = [], team = 'home') {
    // Get all active players at this minute (considering substitutions and red cards)
    const availablePlayers = this.getActivePlayersAtMinute(lineup, substitutions, cards, team, minute)
    
    if (availablePlayers.length === 0) {
      // Fallback: if no players are available (very rare), return any starting player
      const startingPlayers = lineup.filter(p => p.isStarter)
      return startingPlayers[Math.floor(Math.random() * startingPlayers.length)]
    }
    
    const weights = availablePlayers.map(player => 
      EnhancedMatchSimulationService.GOAL_PROBABILITIES[player.position] || 0.1
    )
    
    const totalWeight = weights.reduce((sum, w) => sum + w, 0)
    let random = Math.random() * totalWeight
    
    for (let i = 0; i < availablePlayers.length; i++) {
      random -= weights[i]
      if (random <= 0) {
        return availablePlayers[i]
      }
    }
    
    // Fallback
    return availablePlayers[Math.floor(Math.random() * availablePlayers.length)]
  }

  /**
   * Select assist provider
   */
  selectAssistProvider(lineup, scorer, cards = [], minute = 90) {
    const startingPlayers = lineup.filter(p => 
      p.isStarter && !p.player.equals(scorer.player)
    )
    
    // Filter out red-carded players
    const availablePlayers = this.filterRedCardedPlayers(startingPlayers, cards, minute)
    
    if (availablePlayers.length === 0) return null
    
    const weights = availablePlayers.map(player => 
      EnhancedMatchSimulationService.ASSIST_PROBABILITIES[player.position] || 0.1
    )
    
    const totalWeight = weights.reduce((sum, w) => sum + w, 0)
    let random = Math.random() * totalWeight
    
    for (let i = 0; i < availablePlayers.length; i++) {
      random -= weights[i]
      if (random <= 0) {
        return availablePlayers[i].player
      }
    }
    
    return null
  }

  /**
   * Generate cards for the match
   */
  async generateCards(homeLineup, awayLineup, matchStats) {
    const cards = []
    const playerCards = new Map() // Track cards per player
    
    // Calculate total card count based on fouls (realistic range: 1-6 cards per match)
    const totalFouls = matchStats.fouls.home + matchStats.fouls.away
    const baseCardCount = Math.floor(totalFouls / 4) // Roughly 1 card per 4 fouls
    const cardVariation = Math.floor(Math.random() * 3) - 1 // -1, 0, or +1
    const totalCards = Math.max(0, Math.min(8, baseCardCount + cardVariation))
    
    if (totalCards === 0) return cards
    
    // Distribute cards between teams (with slight home advantage in avoiding cards)
    const homeCardRatio = (matchStats.fouls.home / totalFouls) * 0.9 // 10% home advantage
    const homeCards = Math.round(totalCards * homeCardRatio)
    const awayCards = totalCards - homeCards
    
    // Generate home team cards
    for (let i = 0; i < homeCards; i++) {
      const card = this.generateSingleCard('home', homeLineup, playerCards)
      if (card) {
        cards.push(card)
        this.trackPlayerCard(playerCards, card.player, card.cardType)
      }
    }
    
    // Generate away team cards
    for (let i = 0; i < awayCards; i++) {
      const card = this.generateSingleCard('away', awayLineup, playerCards)
      if (card) {
        cards.push(card)
        this.trackPlayerCard(playerCards, card.player, card.cardType)
      }
    }
    
    // Sort cards by minute
    cards.sort((a, b) => a.minute - b.minute)
    
    return cards
  }

  /**
   * Generate a single card
   */
  generateSingleCard(team, lineup, playerCards) {
    // Select a random minute (weighted towards certain periods)
    const minute = this.generateCardMinute()
    
    // Select player based on position probabilities and existing cards
    const cardReceiver = this.selectCardReceiver(lineup, playerCards)
    if (!cardReceiver) return null
    
    // Determine card type (check if player already has yellow)
    const existingYellows = playerCards.get(cardReceiver.player.toString()) || { yellows: 0, reds: 0 }
    let cardType = 'yellow'
    let reason = 'foul'
    
    if (existingYellows.yellows > 0) {
      // Player already has yellow, 25% chance of second yellow = red
      if (Math.random() < 0.25) {
        cardType = 'second_yellow'
        reason = 'second_yellow'
      }
    } else {
      // 5% chance of straight red card
      if (Math.random() < 0.05) {
        cardType = 'red'
        reason = Math.random() < 0.5 ? 'violent_conduct' : 'serious_foul_play'
      }
    }
    
    // Select reason for yellow cards
    if (cardType === 'yellow') {
      const yellowReasons = ['foul', 'unsporting_behavior', 'dissent']
      reason = yellowReasons[Math.floor(Math.random() * yellowReasons.length)]
    }
    
    return {
      player: cardReceiver.player,
      team: team,
      minute: minute,
      cardType: cardType,
      reason: reason
    }
  }

  /**
   * Generate realistic card minutes (more likely in certain periods)
   */
  generateCardMinute() {
    // Cards more likely in intense periods
    const periods = [
      { min: 1, max: 15, weight: 0.10 },   // Early - fewer cards
      { min: 16, max: 30, weight: 0.15 },  // First half middle
      { min: 31, max: 45, weight: 0.20 },  // End of first half - more tension
      { min: 46, max: 60, weight: 0.15 },  // Start of second half
      { min: 61, max: 75, weight: 0.20 },  // Second half middle - intensity builds
      { min: 76, max: 90, weight: 0.20 }   // End of second half - desperation
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
   * Select card receiver based on position probabilities
   */
  selectCardReceiver(lineup, playerCards) {
    const startingPlayers = lineup.filter(p => p.isStarter)
    
    // Filter out players who already have red cards
    const eligiblePlayers = startingPlayers.filter(player => {
      const playerCardHistory = playerCards.get(player.player.toString()) || { yellows: 0, reds: 0 }
      return playerCardHistory.reds === 0 // Can't get card if already sent off
    })
    
    if (eligiblePlayers.length === 0) return null
    
    const weights = eligiblePlayers.map(player => 
      EnhancedMatchSimulationService.CARD_PROBABILITIES[player.position] || 0.1
    )
    
    const totalWeight = weights.reduce((sum, w) => sum + w, 0)
    let random = Math.random() * totalWeight
    
    for (let i = 0; i < eligiblePlayers.length; i++) {
      random -= weights[i]
      if (random <= 0) {
        return eligiblePlayers[i]
      }
    }
    
    // Fallback
    return eligiblePlayers[Math.floor(Math.random() * eligiblePlayers.length)]
  }

  /**
   * Track cards for each player
   */
  trackPlayerCard(playerCards, playerId, cardType) {
    const playerIdStr = playerId.toString()
    const current = playerCards.get(playerIdStr) || { yellows: 0, reds: 0 }
    
    if (cardType === 'yellow') {
      current.yellows += 1
    } else if (cardType === 'red' || cardType === 'second_yellow') {
      current.reds += 1
    }
    
    playerCards.set(playerIdStr, current)
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
      
      // Create full lineup (starters + subs) for substitution generation
      const fullHomeLineup = [...homeStartingXI, ...homeSubstitutes]
      const fullAwayLineup = [...awayStartingXI, ...awaySubstitutes]
      
      // Generate substitutions
      const substitutions = this.generateSubstitutions(homeStartingXI, awayStartingXI, homeSubstitutes, awaySubstitutes)
      
      // Generate goals with actual players
      const goals = await this.generateGoals(homeScore, awayScore, homeStartingXI, awayStartingXI)
      
      // Generate cards
      const cards = await this.generateCards(homeStartingXI, awayStartingXI, matchStats)
      
      // Update match stats with actual card counts
      matchStats.yellowCards.home = cards.filter(c => c.team === 'home' && c.cardType === 'yellow').length
      matchStats.yellowCards.away = cards.filter(c => c.team === 'away' && c.cardType === 'yellow').length
      matchStats.redCards.home = cards.filter(c => c.team === 'home' && (c.cardType === 'red' || c.cardType === 'second_yellow')).length
      matchStats.redCards.away = cards.filter(c => c.team === 'away' && (c.cardType === 'red' || c.cardType === 'second_yellow')).length
      
      // Generate match report
      const matchReport = await this.generateMatchReport(match.homeTeam, match.awayTeam, homeScore, awayScore, goals, matchStats)
      
      // Create or update match details
      const matchDetail = await MatchDetail.findOneAndUpdate(
        { match: match._id },
        {
          match: match._id,
          homeLineup: fullHomeLineup,
          awayLineup: fullAwayLineup,
          goals: goals,
          substitutions: substitutions,
          cards: cards,
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