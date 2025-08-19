import Player from '../models/Player.js'

class PlayerStatsUpdateService {
  
  /**
   * Update player's international career stats after a match
   * @param {string} playerId - Player ID
   * @param {Object} matchStats - Match statistics for the player
   * @param {string} worldId - World ID (if this is a world tournament)
   * @param {string} tournamentId - Tournament ID
   */
  async updatePlayerInternationalStats(playerId, matchStats, worldId = null, tournamentId = null) {
    try {
      // Only update international stats for world tournaments
      if (!worldId) {
        console.log(`Skipping international stats update for non-world tournament`)
        return
      }

      // Find the player (prioritize world-level player over tournament copy)
      let player = await Player.findOne({ 
        _id: playerId,
        worldId: worldId,
        tournamentId: null // World-level player
      })

      // If not found, try to find tournament-specific player
      if (!player) {
        player = await Player.findOne({ 
          _id: playerId,
          worldId: worldId,
          tournamentId: tournamentId
        })
      }

      if (!player) {
        console.log(`Player ${playerId} not found for stats update`)
        return
      }

      const updates = {}
      let hasUpdates = false

      // Track overall match participation - increment for any involvement
      let overallMatchesIncrement = 0
      
      // Update caps (appearances) - increment by 1 for each match played
      if (matchStats.played) {
        updates.internationalCaps = (player.internationalCaps || 0) + 1
        overallMatchesIncrement = 1
        hasUpdates = true
        
        // Set debut year if this is their first cap
        if (!player.debutYear && player.internationalCaps === 0) {
          updates.debutYear = new Date().getFullYear()
        }
      }

      // Update goals scored - also counts as match participation if not already counted
      if (matchStats.goals && matchStats.goals > 0) {
        updates.internationalGoals = (player.internationalGoals || 0) + matchStats.goals
        // If player scored but didn't start, still increment overall matches
        if (!matchStats.played) {
          overallMatchesIncrement = 1
        }
        hasUpdates = true
      }
      
      // Apply overall matches increment
      if (overallMatchesIncrement > 0) {
        updates.overallMatches = (player.overallMatches || 0) + overallMatchesIncrement
      }

      // Update assists
      if (matchStats.assists && matchStats.assists > 0) {
        updates.internationalAssists = (player.internationalAssists || 0) + matchStats.assists
        hasUpdates = true
      }

      // Update clean sheets for goalkeepers
      if (matchStats.cleanSheet && player.position === 'Goalkeeper') {
        updates.internationalCleanSheets = (player.internationalCleanSheets || 0) + 1
        hasUpdates = true
      }

      // Apply updates if any
      if (hasUpdates) {
        await Player.findByIdAndUpdate(player._id, updates)
        const finalOverallMatchesIncrement = overallMatchesIncrement
        console.log(`✅ Updated international stats for ${player.displayName}: +${matchStats.played ? 1 : 0} caps, +${finalOverallMatchesIncrement} overall matches, +${matchStats.goals || 0} goals, +${matchStats.assists || 0} assists`)
        
        // If this is a tournament-specific copy, also update the world-level player
        if (player.tournamentId) {
          const worldPlayer = await Player.findOne({
            teamId: player.teamId,
            worldId: worldId,
            tournamentId: null
          })
          
          if (worldPlayer) {
            await Player.findByIdAndUpdate(worldPlayer._id, updates)
            console.log(`✅ Also updated world-level player ${worldPlayer.displayName}`)
          }
        }
      }

    } catch (error) {
      console.error(`Error updating player international stats:`, error)
    }
  }

  /**
   * Update stats for multiple players after a match
   * @param {Array} playerStatsList - Array of player stats objects
   * @param {string} worldId - World ID
   * @param {string} tournamentId - Tournament ID
   */
  async updateMultiplePlayersStats(playerStatsList, worldId = null, tournamentId = null) {
    const updatePromises = playerStatsList.map(playerStats => 
      this.updatePlayerInternationalStats(playerStats.playerId, playerStats, worldId, tournamentId)
    )
    
    await Promise.all(updatePromises)
  }

  /**
   * Update team appearance stats after a match (all players who played get +1 cap)
   * @param {Array} homeTeamPlayers - Array of player IDs from home team lineup
   * @param {Array} awayTeamPlayers - Array of player IDs from away team lineup
   * @param {Object} goalScorers - Object with player IDs as keys and goal counts as values
   * @param {Object} assistProviders - Object with player IDs as keys and assist counts as values
   * @param {string} cleanSheetKeeper - Player ID of goalkeeper who kept clean sheet (if any)
   * @param {string} worldId - World ID
   * @param {string} tournamentId - Tournament ID
   */
  async updateTeamMatchStats(homeTeamPlayers, awayTeamPlayers, goalScorers = {}, assistProviders = {}, cleanSheetKeeper = null, worldId = null, tournamentId = null) {
    console.log(`🔥 PLAYER_STATS: updateTeamMatchStats called`)
    console.log(`🔥 PLAYER_STATS: Home team players count:`, homeTeamPlayers.length)
    console.log(`🔥 PLAYER_STATS: Away team players count:`, awayTeamPlayers.length)
    console.log(`🔥 PLAYER_STATS: Goal scorers:`, goalScorers)
    console.log(`🔥 PLAYER_STATS: World ID:`, worldId)
    console.log(`🔥 PLAYER_STATS: Tournament ID:`, tournamentId)
    
    const allPlayerStats = []

    // Process home team players
    homeTeamPlayers.forEach(playerId => {
      allPlayerStats.push({
        playerId: playerId,
        played: true,
        goals: goalScorers[playerId] || 0,
        assists: assistProviders[playerId] || 0,
        cleanSheet: cleanSheetKeeper === playerId
      })
    })

    // Process away team players
    awayTeamPlayers.forEach(playerId => {
      allPlayerStats.push({
        playerId: playerId,
        played: true,
        goals: goalScorers[playerId] || 0,
        assists: assistProviders[playerId] || 0,
        cleanSheet: cleanSheetKeeper === playerId
      })
    })

    console.log(`🔥 PLAYER_STATS: About to update ${allPlayerStats.length} players stats`)
    console.log(`🔥 PLAYER_STATS: Sample player stats:`, allPlayerStats.slice(0, 2))
    
    await this.updateMultiplePlayersStats(allPlayerStats, worldId, tournamentId)
  }
}

export default new PlayerStatsUpdateService()