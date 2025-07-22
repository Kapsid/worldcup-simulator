import Player from '../models/Player.js'
import MatchDetail from '../models/MatchDetail.js'
import PlayerStats from '../models/PlayerStats.js'

class BasicEnhancedMatchService {
  
  /**
   * Get players for a team
   */
  static async getTeamPlayers(teamCode, tournamentId = null, worldId = null) {
    const query = { teamId: teamCode }
    
    if (tournamentId) {
      query.tournamentId = tournamentId
    } else if (worldId) {
      query.worldId = worldId
    }

    const players = await Player.find(query).sort({ overallRating: -1 })
    console.log(`🔍 PLAYER LOOKUP: Found ${players.length} players for team ${teamCode}`)
    
    if (players.length === 0) {
      // Try alternate search without tournament/world restrictions
      const alternateQuery = { teamId: teamCode }
      const alternatePlayers = await Player.find(alternateQuery).sort({ overallRating: -1 })
      console.log(`🔍 PLAYER LOOKUP: Alternate search found ${alternatePlayers.length} players for team ${teamCode}`)
    }
    
    return players
  }

  /**
   * Select proper starting XI with correct positions
   */
  static async selectStartingXI(teamCode, tournamentId = null, worldId = null) {
    const players = await BasicEnhancedMatchService.getTeamPlayers(teamCode, tournamentId, worldId)
    
    if (players.length < 11) {
      throw new Error(`Not enough players for team ${teamCode}`)
    }

    // Sort players by overall rating descending
    players.sort((a, b) => (b.overallRating || 0) - (a.overallRating || 0))

    // Group players by position
    const goalkeepers = players.filter(p => p.detailedPosition === 'GK')
    const defenders = players.filter(p => ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p.detailedPosition))
    const midfielders = players.filter(p => ['CM', 'CAM', 'CDM', 'LM', 'RM'].includes(p.detailedPosition))
    const forwards = players.filter(p => ['ST', 'CF', 'LW', 'RW'].includes(p.detailedPosition))

    const startingXI = []
    let jerseyNumber = 1

    // 1 Goalkeeper
    if (goalkeepers.length > 0) {
      startingXI.push({
        player: goalkeepers[0]._id,
        position: 'GK',
        jerseyNumber: 1,
        isStarter: true,
        isCaptain: goalkeepers[0].isCaptain || false
      })
      jerseyNumber = 2
    } else {
      throw new Error(`No goalkeeper available for team ${teamCode}`)
    }

    // 4 Defenders
    for (let i = 0; i < Math.min(4, defenders.length); i++) {
      startingXI.push({
        player: defenders[i]._id,
        position: defenders[i].detailedPosition,
        jerseyNumber: jerseyNumber++,
        isStarter: true,
        isCaptain: defenders[i].isCaptain || false
      })
    }

    // 4 Midfielders
    for (let i = 0; i < Math.min(4, midfielders.length); i++) {
      startingXI.push({
        player: midfielders[i]._id,
        position: midfielders[i].detailedPosition,
        jerseyNumber: jerseyNumber++,
        isStarter: true,
        isCaptain: midfielders[i].isCaptain || false
      })
    }

    // 2 Forwards
    for (let i = 0; i < Math.min(2, forwards.length); i++) {
      startingXI.push({
        player: forwards[i]._id,
        position: forwards[i].detailedPosition,
        jerseyNumber: jerseyNumber++,
        isStarter: true,
        isCaptain: forwards[i].isCaptain || false
      })
    }

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

    return startingXI.slice(0, 11)
  }

  /**
   * Generate basic match details
   */
  static async simulateBasicMatchDetails(match, competitionType = 'tournament', world = null) {
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
      const homeStartingXI = await BasicEnhancedMatchService.selectStartingXI(homeTeamCode, match.tournament, world?._id)
      const awayStartingXI = await BasicEnhancedMatchService.selectStartingXI(awayTeamCode, match.tournament, world?._id)
      
      // Simple goals generation
      const goals = []
      const homeScore = match.homeScore || 0
      const awayScore = match.awayScore || 0
      
      // Helper function to select scorer based on position probabilities
      const selectScorer = (startingXI) => {
        // Group players by position type
        const forwards = startingXI.filter(p => ['ST', 'CF', 'LW', 'RW'].includes(p.position))
        const midfielders = startingXI.filter(p => ['CM', 'CAM', 'CDM', 'LM', 'RM'].includes(p.position))
        const defenders = startingXI.filter(p => ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p.position))
        
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
          const fieldPlayers = startingXI.filter(p => p.position !== 'GK')
          selectedPlayer = fieldPlayers[Math.floor(Math.random() * fieldPlayers.length)]
        }
        
        return selectedPlayer
      }
      
      // Assign goals with position-based probabilities
      for (let i = 0; i < homeScore; i++) {
        const scorer = selectScorer(homeStartingXI)
        goals.push({
          player: scorer.player,
          team: 'home',
          minute: Math.floor(Math.random() * 90) + 1,
          goalType: 'open_play',
          isOwnGoal: false
        })
      }
      
      for (let i = 0; i < awayScore; i++) {
        const scorer = selectScorer(awayStartingXI)
        goals.push({
          player: scorer.player,
          team: 'away',
          minute: Math.floor(Math.random() * 90) + 1,
          goalType: 'open_play',
          isOwnGoal: false
        })
      }
      
      // Sort goals by minute
      goals.sort((a, b) => a.minute - b.minute)
      
      // Basic match report
      const homeTeamName = match.homeTeam.name || homeTeamCode
      const awayTeamName = match.awayTeam.name || awayTeamCode
      const matchReport = {
        summary: `${homeTeamName} ${homeScore}-${awayScore} ${awayTeamName}`,
        keyMoments: goals.map(goal => `${goal.minute}' - Goal scored`),
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
      
      const matchDetail = await MatchDetail.findOneAndUpdate(
        { match: match._id },
        {
          match: match._id,
          matchType: competitionType || 'tournament',
          homeLineup: homeStartingXI,
          awayLineup: awayStartingXI,
          goals: goals,
          substitutions: [],
          possession: { home: 50, away: 50 },
          shots: { home: 10, away: 8 },
          shotsOnTarget: { home: 4, away: 3 },
          corners: { home: 5, away: 3 },
          fouls: { home: 12, away: 14 },
          yellowCards: { home: 2, away: 1 },
          redCards: { home: 0, away: 0 },
          matchReport: matchReport,
          homeFormation: '4-4-2',
          awayFormation: '4-4-2',
          weather: 'sunny',
          temperature: 20,
          attendance: 45000
        },
        { upsert: true, new: true }
      )
      
      // Log after MatchDetail creation
      logMessage = `  -> MatchDetail created/updated successfully\n`
      fs.appendFileSync('/tmp/backend-debug.log', logMessage)
      
      // Update player stats
      console.log(`📊 STATS UPDATE: Processing ${goals.length} goals and ${homeStartingXI.length + awayStartingXI.length} players`)
      
      // Log to file
      logMessage = `  -> About to call updatePlayerStats with ${goals.length} goals and ${homeStartingXI.length + awayStartingXI.length} players\n`
      fs.appendFileSync('/tmp/backend-debug.log', logMessage)
      
      await BasicEnhancedMatchService.updatePlayerStats(match, homeStartingXI, awayStartingXI, goals, competitionType, world)
      
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
        const playerId = playerData.player
        const playerTeam = homeStartingXI.includes(playerData) ? 'home' : 'away'
        
        // Count goals scored by this player
        const playerGoals = goals.filter(goal => 
          goal.player.toString() === playerId.toString() && goal.team === playerTeam
        ).length
        
        // Find or create player stats
        const statsQuery = {
          player: playerId,
          competitionType: competitionType
        }
        
        // Add both worldId and tournamentId when available for better querying
        if (world && world._id) {
          statsQuery.worldId = world._id
        }
        if (match.tournament) {
          statsQuery.tournamentId = match.tournament
        } else if (match.tournamentId) {
          statsQuery.tournamentId = match.tournamentId
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
          date: new Date()
        })
        
        try {
          // Log to file before save
          const fs = await import('fs')
          let logMessage = `    -> About to save PlayerStats for player ${playerId} - Goals: ${playerGoals}, Matches: ${playerStats.matchesStarted}\n`
          logMessage += `       Query: tournamentId=${statsQuery.tournamentId}, worldId=${statsQuery.worldId}, competitionType=${statsQuery.competitionType}\n`
          fs.appendFileSync('/tmp/backend-debug.log', logMessage)
          
          console.log(`PLAYER STATS: 💾 About to save stats for player ${playerId}`, {
            tournamentId: statsQuery.tournamentId,
            worldId: statsQuery.worldId,
            competitionType: statsQuery.competitionType,
            goals: playerStats.goals,
            matchesStarted: playerStats.matchesStarted
          })
          const savedStats = await playerStats.save()
          
          // Log successful save to file
          logMessage = `    -> ✅ Successfully saved PlayerStats for player ${playerId} - Total Goals: ${savedStats.goals}\n`
          fs.appendFileSync('/tmp/backend-debug.log', logMessage)
          console.log(`PLAYER STATS: ✅ Successfully saved stats for player ${playerId} - Goals: ${playerGoals}, Total Goals: ${savedStats.goals}, Matches Started: ${savedStats.matchesStarted}`)
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
}

export default BasicEnhancedMatchService