import Player from '../models/Player.js'
import MatchDetail from '../models/MatchDetail.js'
import PlayerStats from '../models/PlayerStats.js'

class BasicEnhancedMatchService {
  
  // Card probability by position (higher = more likely to get cards)
  static CARD_PROBABILITIES = {
    'GK': 0.02,
    'CB': 0.25, 'LB': 0.18, 'RB': 0.18, 'LWB': 0.15, 'RWB': 0.15,
    'CDM': 0.30, 'CM': 0.20, 'CAM': 0.12, 'LM': 0.15, 'RM': 0.15,
    'LW': 0.18, 'RW': 0.18, 'CF': 0.22, 'ST': 0.25
  }
  
  /**
   * Get players for a team
   */
  static async getTeamPlayers(teamCode, tournamentId = null, worldId = null) {
    // Use PlayerGenerationService which has better fallback logic
    const PlayerGenerationService = await import('./PlayerGenerationService.js').then(m => m.default)
    const players = await PlayerGenerationService.getTeamPlayers(teamCode, tournamentId, worldId)
    
    // Sort by overall rating for match selection
    players.sort((a, b) => b.overallRating - a.overallRating)
    
    console.log(`🔍 PLAYER LOOKUP: Found ${players.length} players for team ${teamCode}`)
    
    return players
  }

  /**
   * Get similar positions for a given position (for fallback selection)
   */
  static getSimilarPositions(position) {
    const similarPositions = {
      'GK': [],
      'CB': ['LB', 'RB', 'CDM'],
      'LB': ['CB', 'RB', 'LWB', 'LM'],
      'RB': ['CB', 'LB', 'RWB', 'RM'],
      'LWB': ['LB', 'LM', 'RWB'],
      'RWB': ['RB', 'RM', 'LWB'],
      'CDM': ['CM', 'CB', 'CAM'],
      'CM': ['CDM', 'CAM', 'LM', 'RM'],
      'CAM': ['CM', 'CDM', 'ST', 'CF'],
      'LM': ['LB', 'LWB', 'CM', 'LW'],
      'RM': ['RB', 'RWB', 'CM', 'RW'],
      'LW': ['LM', 'ST', 'CF', 'RW'],
      'RW': ['RM', 'ST', 'CF', 'LW'],
      'CF': ['ST', 'CAM', 'LW', 'RW'],
      'ST': ['CF', 'CAM', 'LW', 'RW']
    }
    return similarPositions[position] || []
  }

  /**
   * Select proper starting XI with varied formations
   */
  static async selectStartingXI(teamCode, tournamentId = null, worldId = null) {
    const players = await BasicEnhancedMatchService.getTeamPlayers(teamCode, tournamentId, worldId)
    
    if (players.length < 11) {
      throw new Error(`Not enough players for team ${teamCode}`)
    }

    // Import formations from tactics
    const { formations } = await import('../data/tactics.js')
    
    // Select random formation
    const selectedFormation = formations[Math.floor(Math.random() * formations.length)]
    const formationPositions = selectedFormation.positions
    
    console.log(`🎯 FORMATION: Team ${teamCode} using formation ${selectedFormation.name}:`, formationPositions)
    
    // Sort players by overall rating descending
    players.sort((a, b) => (b.overallRating || 0) - (a.overallRating || 0))

    // Group players by position
    const playersByPosition = {}
    players.forEach(player => {
      const pos = player.detailedPosition
      if (!playersByPosition[pos]) {
        playersByPosition[pos] = []
      }
      playersByPosition[pos].push(player)
    })

    const startingXI = []
    let jerseyNumber = 1
    const usedPlayers = new Set()

    // Helper function to get best available player for position
    const getBestPlayerForPosition = (position) => {
      if (playersByPosition[position]) {
        const available = playersByPosition[position].filter(p => !usedPlayers.has(p._id.toString()))
        if (available.length > 0) {
          return available[0] // Already sorted by rating
        }
      }
      return null
    }

    // Helper function to get any available player as fallback
    const getAnyAvailablePlayer = () => {
      const available = players.filter(p => !usedPlayers.has(p._id.toString()))
      return available.length > 0 ? available[0] : null
    }

    // Build lineup based on formation requirements
    Object.entries(formationPositions).forEach(([position, count]) => {
      for (let i = 0; i < count; i++) {
        let selectedPlayer = getBestPlayerForPosition(position)
        
        // If no exact match, try similar positions
        if (!selectedPlayer) {
          const similarPositions = BasicEnhancedMatchService.getSimilarPositions(position)
          for (const similarPos of similarPositions) {
            selectedPlayer = getBestPlayerForPosition(similarPos)
            if (selectedPlayer) break
          }
        }
        
        // If still no match, get any available player
        if (!selectedPlayer) {
          selectedPlayer = getAnyAvailablePlayer()
        }
        
        if (selectedPlayer) {
          startingXI.push({
            player: selectedPlayer._id,
            position: position,
            jerseyNumber: position === 'GK' ? 1 : jerseyNumber++,
            isStarter: true,
            isCaptain: selectedPlayer.isCaptain || false
          })
          usedPlayers.add(selectedPlayer._id.toString())
          if (position === 'GK') jerseyNumber = 2
        }
      }
    })

    // If we don't have enough players in specific positions, fill with remaining players
    if (startingXI.length < 11) {
      const usedPlayerIds = new Set(startingXI.map(p => p.player.toString()))
      const remainingPlayers = players.filter(p => !usedPlayerIds.has(p._id.toString()))
      
      for (let i = 0; i < remainingPlayers.length && startingXI.length < 11; i++) {
        startingXI.push({
          player: remainingPlayers[i]._id,
          position: remainingPlayers[i].detailedPosition,
          jerseyNumber: jerseyNumber++,
          isStarter: true,
          isCaptain: remainingPlayers[i].isCaptain || false
        })
      }
    }

    return {
      lineup: startingXI.slice(0, 11),
      formation: selectedFormation.name
    }
  }

  /**
   * Filter out players who have been substituted off before the given minute
   */
  static filterSubstitutedPlayers(players, substitutions, team, minute) {
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
  static getActivePlayersAtMinute(lineup, substitutions, team, minute) {
    // Start with all players who were originally on the field
    let activePlayers = lineup.filter(p => p.isStarter)
    
    // Remove players who were substituted out before this minute
    activePlayers = BasicEnhancedMatchService.filterSubstitutedPlayers(activePlayers, substitutions, team, minute)
    
    // Add players who were substituted in before this minute
    const substitutedIn = substitutions.filter(sub => 
      sub.team === team && sub.minute < minute
    )
    
    for (const sub of substitutedIn) {
      // Find the substitute player in the lineup
      const subPlayer = lineup.find(p => p.player.toString() === sub.playerIn.toString())
      if (subPlayer) {
        activePlayers.push(subPlayer)
      }
    }
    
    return activePlayers
  }

  /**
   * Generate cards for the match
   */
  static generateCards(homeLineup, awayLineup, foulsHome, foulsAway, substitutions = []) {
    const cards = []
    const playerCards = new Map() // Track cards per player
    
    // Calculate total card count based on fouls (realistic range: 1-6 cards per match)
    const totalFouls = foulsHome + foulsAway
    const baseCardCount = Math.floor(totalFouls / 4) // Roughly 1 card per 4 fouls
    const cardVariation = Math.floor(Math.random() * 3) - 1 // -1, 0, or +1
    const totalCards = Math.max(0, Math.min(8, baseCardCount + cardVariation))
    
    if (totalCards === 0) return cards
    
    // Distribute cards between teams (with slight home advantage in avoiding cards)
    const homeCardRatio = (foulsHome / totalFouls) * 0.9 // 10% home advantage
    const homeCards = Math.round(totalCards * homeCardRatio)
    const awayCards = totalCards - homeCards
    
    // Generate home team cards
    for (let i = 0; i < homeCards; i++) {
      const card = BasicEnhancedMatchService.generateSingleCard('home', homeLineup, playerCards, substitutions)
      if (card) {
        cards.push(card)
        BasicEnhancedMatchService.trackPlayerCard(playerCards, card.player, card.cardType)
      }
    }
    
    // Generate away team cards
    for (let i = 0; i < awayCards; i++) {
      const card = BasicEnhancedMatchService.generateSingleCard('away', awayLineup, playerCards, substitutions)
      if (card) {
        cards.push(card)
        BasicEnhancedMatchService.trackPlayerCard(playerCards, card.player, card.cardType)
      }
    }
    
    // Sort cards by minute
    cards.sort((a, b) => a.minute - b.minute)
    
    return cards
  }

  /**
   * Generate a single card
   */
  static generateSingleCard(team, lineup, playerCards, substitutions = []) {
    // Select a random minute (weighted towards certain periods)
    const minute = BasicEnhancedMatchService.generateCardMinute()
    
    // Get active players at this minute (considering substitutions)
    const activePlayers = BasicEnhancedMatchService.getActivePlayersAtMinute(lineup, substitutions, team, minute)
    
    // Select player based on position probabilities and existing cards
    const cardReceiver = BasicEnhancedMatchService.selectCardReceiver(activePlayers, playerCards)
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
  static generateCardMinute() {
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
  static selectCardReceiver(activePlayers, playerCards) {
    // Filter out players who already have red cards
    const eligiblePlayers = activePlayers.filter(player => {
      const playerCardHistory = playerCards.get(player.player.toString()) || { yellows: 0, reds: 0 }
      return playerCardHistory.reds === 0 // Can't get card if already sent off
    })
    
    if (eligiblePlayers.length === 0) return null
    
    const weights = eligiblePlayers.map(player => 
      BasicEnhancedMatchService.CARD_PROBABILITIES[player.position] || 0.1
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
  static trackPlayerCard(playerCards, playerId, cardType) {
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
   * Generate substitutions for the match
   */
  static generateSubstitutions(homeLineup, awayLineup) {
    const substitutions = []
    
    // Generate 1-3 substitutions per team randomly
    const homeSubCount = Math.floor(Math.random() * 3) + 1
    const awaySubCount = Math.floor(Math.random() * 3) + 1
    
    // Get available players for substitutions (bench players)
    const homeStarters = homeLineup.filter(p => p.isStarter)
    const homeSubstitutes = homeLineup.filter(p => !p.isStarter)
    const awayStarters = awayLineup.filter(p => p.isStarter)
    const awaySubstitutes = awayLineup.filter(p => !p.isStarter)
    
    // Generate home team substitutions
    for (let i = 0; i < homeSubCount && i < Math.min(homeStarters.length, homeSubstitutes.length); i++) {
      // Pick a random starter to substitute
      const playerOutIndex = Math.floor(Math.random() * homeStarters.length)
      const playerOut = homeStarters[playerOutIndex]
      
      // Pick a random substitute
      const playerIn = homeSubstitutes[i % homeSubstitutes.length]
      
      // Generate substitution minute (usually second half, 46-85)
      const minute = 46 + Math.floor(Math.random() * 40)
      
      // Determine substitution reason
      const reasons = ['tactical', 'injury', 'performance']
      const reason = reasons[Math.floor(Math.random() * reasons.length)]
      
      substitutions.push({
        playerOut: playerOut.player,
        playerIn: playerIn.player,
        team: 'home',
        minute: minute,
        reason: reason
      })
      
      // Remove substituted player from available starters
      homeStarters.splice(playerOutIndex, 1)
    }
    
    // Generate away team substitutions
    for (let i = 0; i < awaySubCount && i < Math.min(awayStarters.length, awaySubstitutes.length); i++) {
      // Pick a random starter to substitute
      const playerOutIndex = Math.floor(Math.random() * awayStarters.length)
      const playerOut = awayStarters[playerOutIndex]
      
      // Pick a random substitute
      const playerIn = awaySubstitutes[i % awaySubstitutes.length]
      
      // Generate substitution minute (usually second half, 46-85)
      const minute = 46 + Math.floor(Math.random() * 40)
      
      // Determine substitution reason
      const reasons = ['tactical', 'injury', 'performance']
      const reason = reasons[Math.floor(Math.random() * reasons.length)]
      
      substitutions.push({
        playerOut: playerOut.player,
        playerIn: playerIn.player,
        team: 'away',
        minute: minute,
        reason: reason
      })
      
      // Remove substituted player from available starters
      awayStarters.splice(playerOutIndex, 1)
    }
    
    // Sort substitutions by minute
    return substitutions.sort((a, b) => a.minute - b.minute)
  }

  /**
   * Generate bench players for lineups
   */
  static async generateBenchPlayers(teamCode, startingXI, tournamentId = null, worldId = null) {
    const allPlayers = await BasicEnhancedMatchService.getTeamPlayers(teamCode, tournamentId, worldId)
    const startingPlayerIds = startingXI.map(s => s.player.toString())
    
    // Get remaining players as substitutes (up to 7-12 players)
    const substitutes = allPlayers
      .filter(player => !startingPlayerIds.includes(player._id.toString()))
      .sort((a, b) => (b.overallRating || 0) - (a.overallRating || 0))
      .slice(0, 7)  // Take up to 7 substitutes for qualification matches
      .map((player, index) => ({
        player: player._id,
        position: player.detailedPosition,
        jerseyNumber: startingXI.length + index + 1,
        isStarter: false,
        isCaptain: false
      }))
    
    return substitutes
  }

  /**
   * Generate basic match details
   */
  static async simulateBasicMatchDetails(match, competitionType = 'tournament', world = null) {
    console.log('🔥 BASIC ENHANCED: simulateBasicMatchDetails called!')
    console.log('🔥 BASIC ENHANCED: Match:', match.homeTeam?.name, 'vs', match.awayTeam?.name)
    console.log('🔥 BASIC ENHANCED: Competition type:', competitionType)
    console.log('🔥 BASIC ENHANCED: World:', world)
    
    try {
      // Log to file since console isn't showing
      const fs = await import('fs')
      let logMessage = `  -> BasicEnhancedMatchService called: ${match.homeTeam?.name} vs ${match.awayTeam?.name}\n`
      fs.appendFileSync('/tmp/backend-debug.log', logMessage)
      
      console.log(`🚀 MATCH SIM: ${match.homeTeam?.name} vs ${match.awayTeam?.name}`)
      console.error(`🚀 MATCH SIM: ${match.homeTeam?.name} vs ${match.awayTeam?.name}`) // Force with error
      process.stdout.write(`🚀 MATCH SIM: ${match.homeTeam?.name} vs ${match.awayTeam?.name}\n`) // Force stdout
      
      const homeTeamCode = match.homeTeam.countryCode || match.homeTeam.code
      const awayTeamCode = match.awayTeam.countryCode || match.awayTeam.code
      
      // Generate lineups
      console.log(`🚀 BASIC ENHANCED: Generating lineups for ${homeTeamCode} vs ${awayTeamCode}`)
      const homeResult = await BasicEnhancedMatchService.selectStartingXI(homeTeamCode, match.tournament, world?._id)
      const awayResult = await BasicEnhancedMatchService.selectStartingXI(awayTeamCode, match.tournament, world?._id)
      
      console.log(`🚀 BASIC ENHANCED: Home result:`, homeResult ? 'SUCCESS' : 'FAILED')
      console.log(`🚀 BASIC ENHANCED: Away result:`, awayResult ? 'SUCCESS' : 'FAILED')
      
      const homeStartingXI = homeResult.lineup
      const awayStartingXI = awayResult.lineup
      const homeFormation = homeResult.formation
      const awayFormation = awayResult.formation
      
      console.log(`🚀 BASIC ENHANCED: Lineups - Home: ${homeStartingXI.length}, Away: ${awayStartingXI.length}`)
      console.log(`🚀 BASIC ENHANCED: Formations - Home: ${homeFormation}, Away: ${awayFormation}`)
      
      // Generate bench players
      const homeSubstitutes = await BasicEnhancedMatchService.generateBenchPlayers(homeTeamCode, homeStartingXI, match.tournament, world?._id)
      const awaySubstitutes = await BasicEnhancedMatchService.generateBenchPlayers(awayTeamCode, awayStartingXI, match.tournament, world?._id)
      
      // Combine starters and substitutes for full lineups
      const fullHomeLineup = [...homeStartingXI, ...homeSubstitutes]
      const fullAwayLineup = [...awayStartingXI, ...awaySubstitutes]
      
      console.log(`🚀 BASIC ENHANCED: Full lineups - Home: ${fullHomeLineup.length}, Away: ${fullAwayLineup.length}`)
      
      // Simple goals generation
      const goals = []
      const homeScore = match.homeScore || 0
      const awayScore = match.awayScore || 0
      
      // Helper function to generate a single goal with realistic types
      const generateSingleGoal = (team, lineup, substitutions) => {
        // Select a random minute first
        const minute = Math.floor(Math.random() * 90) + 1
        
        // Get active players at this minute (considering substitutions)
        const activePlayers = BasicEnhancedMatchService.getActivePlayersAtMinute(lineup, substitutions, team, minute)
        
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
        
        // Select scorer based on goal type
        let scorer
        if (goalType === 'penalty') {
          // For penalties, prefer players who are good penalty takers (usually forwards/mids)
          const penaltyTakers = activePlayers.filter(p => 
            ['ST', 'CF', 'CAM', 'CM'].includes(p.position)
          )
          if (penaltyTakers.length > 0) {
            scorer = penaltyTakers[Math.floor(Math.random() * penaltyTakers.length)]
          } else {
            scorer = selectScorer(activePlayers) // Fallback to regular selection
          }
        } else {
          scorer = selectScorer(activePlayers)
        }
        
        return {
          player: scorer.player,
          team: team,
          minute: minute,
          goalType: goalType,
          isOwnGoal: false
        }
      }
      
      // Helper function to select scorer based on position probabilities
      const selectScorer = (activePlayers) => {
        // Group players by position type
        const forwards = activePlayers.filter(p => ['ST', 'CF', 'LW', 'RW'].includes(p.position))
        const midfielders = activePlayers.filter(p => ['CM', 'CAM', 'CDM', 'LM', 'RM'].includes(p.position))
        const defenders = activePlayers.filter(p => ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p.position))
        
        // Generate random number between 0-100
        const rand = Math.random() * 100
        
        let selectedPlayer
        if (rand < 60 && forwards.length > 0) {
          // 60% chance for forwards
          selectedPlayer = forwards[Math.floor(Math.random() * forwards.length)]
        } else if (rand < 90 && midfielders.length > 0) {
          // 30% chance for midfielders (60-90)
          selectedPlayer = midfielders[Math.floor(Math.random() * midfielders.length)]
        } else if (defenders.length > 0) {
          // 10% chance for defenders (90-100)
          selectedPlayer = defenders[Math.floor(Math.random() * defenders.length)]
        } else {
          // Fallback to any field player (exclude goalkeeper)
          const fieldPlayers = activePlayers.filter(p => p.position !== 'GK')
          selectedPlayer = fieldPlayers[Math.floor(Math.random() * fieldPlayers.length)]
        }
        
        return selectedPlayer
      }
      
      // Generate substitutions first (simpler approach)
      const substitutions = BasicEnhancedMatchService.generateSubstitutions(fullHomeLineup, fullAwayLineup)
      
      // Assign goals with position-based probabilities and realistic goal types
      for (let i = 0; i < homeScore; i++) {
        const goalData = generateSingleGoal('home', fullHomeLineup, substitutions)
        goals.push(goalData)
      }
      
      for (let i = 0; i < awayScore; i++) {
        const goalData = generateSingleGoal('away', fullAwayLineup, substitutions)
        goals.push(goalData)
      }
      
      // Sort goals by minute
      goals.sort((a, b) => a.minute - b.minute)
      
      // Generate match statistics
      const foulsHome = Math.round(8 + Math.random() * 10)
      const foulsAway = Math.round(8 + Math.random() * 10)
      
      // Generate cards (use full lineup to account for substitutions)
      const cards = BasicEnhancedMatchService.generateCards(fullHomeLineup, fullAwayLineup, foulsHome, foulsAway, substitutions)
      
      // Calculate card statistics
      const yellowCardsHome = cards.filter(c => c.team === 'home' && c.cardType === 'yellow').length
      const yellowCardsAway = cards.filter(c => c.team === 'away' && c.cardType === 'yellow').length
      const redCardsHome = cards.filter(c => c.team === 'home' && (c.cardType === 'red' || c.cardType === 'second_yellow')).length
      const redCardsAway = cards.filter(c => c.team === 'away' && (c.cardType === 'red' || c.cardType === 'second_yellow')).length
      
      // Basic match report
      const homeTeamName = match.homeTeam.name || homeTeamCode
      const awayTeamName = match.awayTeam.name || awayTeamCode
      const matchReport = {
        summary: `${homeTeamName} ${homeScore}-${awayScore} ${awayTeamName}`,
        keyMoments: [
          ...goals.map(goal => `${goal.minute}' - Goal scored${goal.goalType === 'penalty' ? ' (Penalty)' : ''}`),
          ...cards.map(card => `${card.minute}' - ${card.cardType === 'yellow' ? 'Yellow' : 'Red'} card`),
          ...substitutions.map(sub => `${sub.minute}' - Substitution`)
        ],
        manOfTheMatch: goals.length > 0 ? goals[0].player : null
      }
      
      // Create or update match details
      console.log(`BASIC ENHANCED: About to create/update MatchDetail for ${match._id}`)
      console.log(`BASIC ENHANCED: Match type will be: ${competitionType || 'tournament'}`)
      console.log(`BASIC ENHANCED: Home lineup players: ${homeStartingXI.length}, Away lineup players: ${awayStartingXI.length}`)
      console.log(`BASIC ENHANCED: Goals created: ${goals.length}`)
      
      // Log to file before MatchDetail creation
      logMessage = `  -> About to create/update MatchDetail for match ${match._id}\n`
      fs.appendFileSync('/tmp/backend-debug.log', logMessage)
      
      let matchDetail
      try {
        matchDetail = await MatchDetail.findOneAndUpdate(
          { match: match._id },
          {
            match: match._id,
            matchType: competitionType || 'tournament',
            homeLineup: fullHomeLineup,
            awayLineup: fullAwayLineup,
            goals: goals,
            substitutions: substitutions,
            cards: cards,
            possession: { home: 50, away: 50 },
            shots: { home: 10, away: 8 },
            shotsOnTarget: { home: 4, away: 3 },
            corners: { home: 5, away: 3 },
            fouls: { home: foulsHome, away: foulsAway },
            yellowCards: { home: yellowCardsHome, away: yellowCardsAway },
            redCards: { home: redCardsHome, away: redCardsAway },
            matchReport: matchReport,
            homeFormation: homeFormation,
            awayFormation: awayFormation,
            weather: 'sunny',
            temperature: 20,
            attendance: 45000
          },
          { upsert: true, new: true }
        )
        
        // Log after MatchDetail creation with verification
        if (matchDetail && matchDetail._id) {
          logMessage = `  -> ✅ MatchDetail created successfully with ID: ${matchDetail._id}\n`
        } else {
          logMessage = `  -> ❌ MatchDetail creation returned null/empty result\n`
        }
        fs.appendFileSync('/tmp/backend-debug.log', logMessage)
        
      } catch (matchDetailError) {
        logMessage = `  -> ❌ MatchDetail creation FAILED: ${matchDetailError.message}\n`
        fs.appendFileSync('/tmp/backend-debug.log', logMessage)
        console.error('MATCH DETAIL ERROR:', matchDetailError)
        throw matchDetailError
      }
      
      // Update player stats
      console.log(`📊 STATS UPDATE: Processing ${goals.length} goals and ${fullHomeLineup.length + fullAwayLineup.length} players`)
      
      // Log to file
      logMessage = `  -> About to call updatePlayerStats with ${goals.length} goals and ${fullHomeLineup.length + fullAwayLineup.length} players\n`
      fs.appendFileSync('/tmp/backend-debug.log', logMessage)
      
      await BasicEnhancedMatchService.updatePlayerStats(match, fullHomeLineup, fullAwayLineup, goals, competitionType, world)
      
      logMessage = `  -> updatePlayerStats completed\n`
      fs.appendFileSync('/tmp/backend-debug.log', logMessage)
      return matchDetail
      
    } catch (error) {
      console.error('Error in basic enhanced match simulation:', error)
      throw error
    }
  }

  /**
   * Update player statistics after match simulation
   */
  static async updatePlayerStats(match, homeStartingXI, awayStartingXI, goals, competitionType, world) {
    try {
      
      // Combine both lineups
      const allPlayers = [...homeStartingXI, ...awayStartingXI]
      
      for (const playerData of allPlayers) {
        console.log('🔍 DEBUG: playerData structure:', playerData)
        const playerId = playerData.player || playerData._id || playerData.id
        const playerTeam = homeStartingXI.includes(playerData) ? 'home' : 'away'
        
        console.log('🔍 DEBUG: extracted playerId:', playerId)
        
        // Verify the Player document exists
        const actualPlayer = await Player.findById(playerId)
        console.log('🔍 DEBUG: Player document exists:', !!actualPlayer)
        if (!actualPlayer) {
          console.error('❌ CRITICAL: Player document not found for ID:', playerId)
          continue // Skip this player if document doesn't exist
        }
        
        console.log('🔍 DEBUG: About to save PlayerStats with player ID:', playerId)
        console.log('🔍 DEBUG: Actual player document ID:', actualPlayer._id)
        
        // Use the actual player document's _id to ensure consistency
        const correctPlayerId = actualPlayer._id
        
        // Count goals scored by this player
        const playerGoals = goals.filter(goal => 
          goal.player && goal.player.toString() === correctPlayerId.toString() && goal.team === playerTeam
        ).length
        
        // Find or create player stats
        const statsQuery = {
          player: correctPlayerId,
          competitionType: competitionType
        }
        
        // Add both worldId and tournamentId when available for better querying
        if (world && world._id) {
          statsQuery.worldId = world._id
          console.log(`PLAYER STATS: Using worldId: ${world._id}`)
        }
        if (match.tournament) {
          statsQuery.tournamentId = match.tournament
          console.log(`PLAYER STATS: Using tournamentId from match.tournament: ${match.tournament}`)
        } else if (match.tournamentId) {
          statsQuery.tournamentId = match.tournamentId
          console.log(`PLAYER STATS: Using tournamentId from match.tournamentId: ${match.tournamentId}`)
        }
        
        // Log what we're using for debugging
        const fs = await import('fs')
        let debugMessage = `       DEBUG: match.tournament=${match.tournament}, match.tournamentId=${match.tournamentId}\n`
        fs.appendFileSync('/tmp/backend-debug.log', debugMessage)
        
        if (!statsQuery.worldId && !statsQuery.tournamentId) {
          console.warn('PLAYER STATS: No world or tournament ID found, this might cause issues')
        }
        
        let playerStats = await PlayerStats.findOne(statsQuery)
        
        if (!playerStats) {
          console.log(`🆕 PLAYER STATS: Creating new record for player ${playerId}`)
          playerStats = new PlayerStats({
            ...statsQuery,
            matchesPlayed: 0,
            matchesStarted: 0,
            goals: 0,
            assists: 0,
            cleanSheets: 0
          })
        }
        playerStats.matchesPlayed += 1
        if (playerData.isStarter) {
          playerStats.matchesStarted += 1
        }
        playerStats.goals += playerGoals
        
        // Calculate player rating first (need to create proper player object for rating function)
        const playerForRating = {
          _id: correctPlayerId,
          position: playerData.position
        }
        const playerRating = BasicEnhancedMatchService.calculatePlayerRating(
          playerForRating, 
          { homeScore: match.homeScore, awayScore: match.awayScore },
          playerTeam,
          goals
        )
        
        // Update average rating
        if (playerStats.averageRating === 0) {
          playerStats.averageRating = playerRating
        } else {
          const totalRating = (playerStats.averageRating * (playerStats.matchesPlayed - 1)) + playerRating
          playerStats.averageRating = Math.round((totalRating / playerStats.matchesPlayed) * 10) / 10
        }
        
        // For goalkeepers, track clean sheets
        if (playerData.position === 'GK') {
          const concededGoals = goals.filter(goal => goal.team !== playerTeam).length
          if (concededGoals === 0) {
            playerStats.cleanSheets += 1
          }
        }
        
        // Add match details
        playerStats.matchDetails.push({
          match: match._id,
          isStarter: playerData.isStarter,
          minutesPlayed: 90, // Assume full match for now
          goals: playerGoals,
          assists: 0, // TODO: Track assists
          yellowCard: false,
          redCard: false,
          rating: playerRating,
          date: new Date()
        })
        
        try {
          // Log to file before save
          const fs = await import('fs')
          let logMessage = `    -> About to save PlayerStats for player ${playerId} - Goals: ${playerGoals}, Matches: ${playerStats.matchesStarted}\n`
          logMessage += `       Query: tournamentId=${statsQuery.tournamentId}, worldId=${statsQuery.worldId}, competitionType=${statsQuery.competitionType}\n`
          fs.appendFileSync('/tmp/backend-debug.log', logMessage)
          
          console.log(`PLAYER STATS: 💾 About to save stats for player ${correctPlayerId}`, {
            tournamentId: statsQuery.tournamentId,
            worldId: statsQuery.worldId,
            competitionType: statsQuery.competitionType,
            goals: playerStats.goals,
            matchesStarted: playerStats.matchesStarted,
            averageRating: playerStats.averageRating,
            matchesPlayed: playerStats.matchesPlayed,
            isNewRecord: playerStats.isNew
          })
          
          console.log(`PLAYER STATS: Full PlayerStats object before save:`, JSON.stringify(playerStats, null, 2))
          
          const savedStats = await playerStats.save()
          
          // Log successful save to file
          logMessage = `    -> ✅ Successfully saved PlayerStats for player ${playerId} - Total Goals: ${savedStats.goals}\n`
          fs.appendFileSync('/tmp/backend-debug.log', logMessage)
          console.log(`PLAYER STATS: ✅ Successfully saved stats for player ${playerId}`, {
            _id: savedStats._id,
            player: savedStats.player,
            tournamentId: savedStats.tournamentId,
            worldId: savedStats.worldId,
            competitionType: savedStats.competitionType,
            goals: savedStats.goals,
            matchesStarted: savedStats.matchesStarted,
            matchesPlayed: savedStats.matchesPlayed,
            averageRating: savedStats.averageRating
          })
        } catch (saveError) {
          // Log error to file
          const fs = await import('fs')
          let logMessage = `    -> ❌ Failed to save PlayerStats for player ${playerId}: ${saveError.message}\n`
          fs.appendFileSync('/tmp/backend-debug.log', logMessage)
          
          console.error(`PLAYER STATS: ❌ Failed to save stats for player ${playerId}:`, saveError.message)
          console.error(`PLAYER STATS: ❌ Error details:`, {
            name: saveError.name,
            code: saveError.code,
            keyPattern: saveError.keyPattern,
            keyValue: saveError.keyValue
          })
          throw saveError // Re-throw to see the error
        }
      }
      
    } catch (error) {
      console.error('PLAYER STATS: Error updating player statistics:', error)
      // Don't throw - we don't want to fail the entire match simulation
    }
  }

  /**
   * Calculate player match rating based on performance
   * Rating scale: 1-10 (10 being the best)
   */
  static calculatePlayerRating(playerData, matchResult, playerTeam, goals) {
    let baseRating = 6.5 // Starting base rating
    
    console.log('🔍 RATING: playerData:', playerData)
    console.log('🔍 RATING: playerData._id:', playerData._id)
    console.log('🔍 RATING: playerTeam:', playerTeam)
    console.log('🔍 RATING: goals:', goals)
    
    // Ensure playerData has an _id
    if (!playerData || !playerData._id) {
      console.error('RATING ERROR: playerData or playerData._id is undefined')
      return 6.0 // Return default rating
    }
    
    // Get player's goals in this match
    const playerGoals = goals.filter(goal => 
      goal.player && goal.player.toString() === playerData._id.toString() && goal.team === playerTeam
    ).length
    
    // Position-specific adjustments
    const position = playerData.position
    
    // Goal impact (position weighted)
    if (playerGoals > 0) {
      if (['ST', 'CF', 'LW', 'RW'].includes(position)) {
        baseRating += playerGoals * 1.0 // Forwards get 1.0 per goal
      } else if (['CM', 'CAM', 'CDM', 'LM', 'RM'].includes(position)) {
        baseRating += playerGoals * 1.3 // Midfielders get 1.3 per goal (less expected)
      } else if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(position)) {
        baseRating += playerGoals * 1.5 // Defenders get 1.5 per goal (rare)
      } else if (position === 'GK') {
        baseRating += playerGoals * 2.0 // Goalkeeper goals are extremely rare
      }
    }
    
    // Team result impact
    const teamScore = playerTeam === 'home' ? matchResult.homeScore : matchResult.awayScore
    const opponentScore = playerTeam === 'home' ? matchResult.awayScore : matchResult.homeScore
    
    if (teamScore > opponentScore) {
      // Win bonus
      baseRating += 0.5
    } else if (teamScore === opponentScore) {
      // Draw - neutral
      baseRating += 0.1
    } else {
      // Loss penalty
      baseRating -= 0.3
    }
    
    // Clean sheet bonus for defenders and goalkeeper
    if (opponentScore === 0 && ['GK', 'CB', 'LB', 'RB', 'LWB', 'RWB'].includes(position)) {
      baseRating += 0.8
    }
    
    // Heavy defeat penalty
    if (opponentScore - teamScore >= 3) {
      baseRating -= 0.5
    }
    
    // Big win bonus
    if (teamScore - opponentScore >= 3) {
      baseRating += 0.3
    }
    
    // Starter vs substitute (starters play full match, get slight bonus)
    if (playerData.isStarter) {
      baseRating += 0.2
    }
    
    // Add some randomness for realism (±0.5)
    const randomAdjustment = (Math.random() - 0.5)
    baseRating += randomAdjustment
    
    // Ensure rating stays within 1-10 range
    return Math.max(1, Math.min(10, Math.round(baseRating * 10) / 10))
  }
}

export default BasicEnhancedMatchService