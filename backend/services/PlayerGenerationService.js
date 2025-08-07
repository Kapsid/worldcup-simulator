import Player from '../models/Player.js'
import { generatePlayerName } from '../data/playerNames.js'
import crypto from 'crypto'

class PlayerGenerationService {
  
  // Position templates for squad generation
  static POSITION_TEMPLATES = {
    // Goalkeepers (3 players)
    goalkeepers: [
      { position: 'Goalkeeper', detailedPosition: 'GK', priority: 1 },
      { position: 'Goalkeeper', detailedPosition: 'GK', priority: 2 },
      { position: 'Goalkeeper', detailedPosition: 'GK', priority: 3 }
    ],
    
    // Defenders (8-10 players)
    defenders: [
      { position: 'Defender', detailedPosition: 'CB', priority: 1 },
      { position: 'Defender', detailedPosition: 'CB', priority: 2 },
      { position: 'Defender', detailedPosition: 'CB', priority: 3 },
      { position: 'Defender', detailedPosition: 'LB', priority: 1 },
      { position: 'Defender', detailedPosition: 'RB', priority: 1 },
      { position: 'Defender', detailedPosition: 'LB', priority: 2 },
      { position: 'Defender', detailedPosition: 'RB', priority: 2 },
      { position: 'Defender', detailedPosition: 'CB', priority: 4 }, // Optional 4th CB
      { position: 'Defender', detailedPosition: 'LWB', priority: 1 }, // Wing-backs
      { position: 'Defender', detailedPosition: 'RWB', priority: 1 }
    ],
    
    // Midfielders (8-10 players)
    midfielders: [
      { position: 'Midfielder', detailedPosition: 'CDM', priority: 1 },
      { position: 'Midfielder', detailedPosition: 'CM', priority: 1 },
      { position: 'Midfielder', detailedPosition: 'CM', priority: 2 },
      { position: 'Midfielder', detailedPosition: 'CAM', priority: 1 },
      { position: 'Midfielder', detailedPosition: 'LM', priority: 1 },
      { position: 'Midfielder', detailedPosition: 'RM', priority: 1 },
      { position: 'Midfielder', detailedPosition: 'CDM', priority: 2 }, // Additional CDM
      { position: 'Midfielder', detailedPosition: 'CM', priority: 3 }, // Additional CM
      { position: 'Midfielder', detailedPosition: 'CAM', priority: 2 }, // Additional CAM
      { position: 'Midfielder', detailedPosition: 'LM', priority: 2 } // Additional LM/RM
    ],
    
    // Forwards (4-6 players)
    forwards: [
      { position: 'Forward', detailedPosition: 'ST', priority: 1 },
      { position: 'Forward', detailedPosition: 'ST', priority: 2 },
      { position: 'Forward', detailedPosition: 'LW', priority: 1 },
      { position: 'Forward', detailedPosition: 'RW', priority: 1 },
      { position: 'Forward', detailedPosition: 'CF', priority: 1 },
      { position: 'Forward', detailedPosition: 'ST', priority: 3 } // Additional striker
    ]
  }

  // Generate a complete squad for a team
  async generateSquad(teamCode, tournamentId = null, worldId = null, currentYear = 2024, preserveExisting = false) {
    try {
      console.log(`⚽ SQUAD GENERATION: Starting for ${teamCode}`)
      console.log(`⚽ SQUAD GENERATION: Tournament ID: ${tournamentId}`)
      console.log(`⚽ SQUAD GENERATION: World ID: ${worldId}`)
      console.log(`⚽ SQUAD GENERATION: Current year: ${currentYear}`)
      console.log(`⚽ SQUAD GENERATION: Preserve existing: ${preserveExisting}`)
      
      // Check for existing players first
      const existingQuery = { teamId: teamCode }
      if (tournamentId) existingQuery.tournamentId = tournamentId
      if (worldId) existingQuery.worldId = worldId
      
      const existingPlayers = await Player.find(existingQuery)
      console.log(`⚽ SQUAD GENERATION: Found ${existingPlayers.length} existing players`)
      
      // If preserving existing players and they exist, return them
      if (preserveExisting && existingPlayers.length > 0) {
        console.log(`⚽ SQUAD GENERATION: Preserving ${existingPlayers.length} existing players for ${teamCode}`)
        return existingPlayers
      }
      
      // Delete existing players for this team/tournament/world (only if not preserving)
      if (!preserveExisting) {
        const deleteQuery = { teamId: teamCode }
        if (tournamentId) deleteQuery.tournamentId = tournamentId
        if (worldId) deleteQuery.worldId = worldId
        
        console.log(`⚽ SQUAD GENERATION: Delete query:`, deleteQuery)
        const deleteResult = await Player.deleteMany(deleteQuery)
        console.log(`⚽ SQUAD GENERATION: Cleared ${deleteResult.deletedCount} existing players for ${teamCode}`)
      }

      const players = []
      const usedJerseyNumbers = new Set()
      const usedNames = new Set()

      // Generate squad composition
      const squadSize = Math.floor(Math.random() * 5) + 23 // 23-27 players
      console.log(`Generating ${squadSize} players for ${teamCode}`)

      // Determine how many players per position
      const composition = PlayerGenerationService.determineSquadComposition(squadSize)
      console.log(`Squad composition:`, composition)

      let playerCount = 0

      // Generate goalkeepers
      for (let i = 0; i < composition.goalkeepers; i++) {
        const template = PlayerGenerationService.POSITION_TEMPLATES.goalkeepers[i] || PlayerGenerationService.POSITION_TEMPLATES.goalkeepers[0]
        const player = await PlayerGenerationService.generatePlayer(teamCode, template, usedJerseyNumbers, usedNames, 
          tournamentId, worldId, currentYear, playerCount === 0) // First player might be captain
        players.push(player)
        playerCount++
      }

      // Generate defenders
      for (let i = 0; i < composition.defenders; i++) {
        const template = PlayerGenerationService.POSITION_TEMPLATES.defenders[i] || 
          PlayerGenerationService.POSITION_TEMPLATES.defenders[Math.floor(Math.random() * PlayerGenerationService.POSITION_TEMPLATES.defenders.length)]
        const player = await PlayerGenerationService.generatePlayer(teamCode, template, usedJerseyNumbers, usedNames,
          tournamentId, worldId, currentYear, playerCount < 3 && players.filter(p => p.isCaptain).length === 0)
        players.push(player)
        playerCount++
      }

      // Generate midfielders
      for (let i = 0; i < composition.midfielders; i++) {
        const template = PlayerGenerationService.POSITION_TEMPLATES.midfielders[i] || 
          PlayerGenerationService.POSITION_TEMPLATES.midfielders[Math.floor(Math.random() * PlayerGenerationService.POSITION_TEMPLATES.midfielders.length)]
        const player = await PlayerGenerationService.generatePlayer(teamCode, template, usedJerseyNumbers, usedNames,
          tournamentId, worldId, currentYear, playerCount < 5 && players.filter(p => p.isCaptain).length === 0)
        players.push(player)
        playerCount++
      }

      // Generate forwards
      for (let i = 0; i < composition.forwards; i++) {
        const template = PlayerGenerationService.POSITION_TEMPLATES.forwards[i] || 
          PlayerGenerationService.POSITION_TEMPLATES.forwards[Math.floor(Math.random() * PlayerGenerationService.POSITION_TEMPLATES.forwards.length)]
        const player = await PlayerGenerationService.generatePlayer(teamCode, template, usedJerseyNumbers, usedNames,
          tournamentId, worldId, currentYear, playerCount < 7 && players.filter(p => p.isCaptain).length === 0)
        players.push(player)
        playerCount++
      }

      // Ensure we have exactly one captain
      if (players.filter(p => p.isCaptain).length === 0) {
        // Make the oldest outfield player captain
        const outfieldPlayers = players.filter(p => p.position !== 'Goalkeeper')
        const captain = outfieldPlayers.sort((a, b) => b.age - a.age)[0]
        if (captain) {
          captain.isCaptain = true
        }
      }

      // Choose vice-captain
      const nonCaptains = players.filter(p => !p.isCaptain && p.position !== 'Goalkeeper')
      if (nonCaptains.length > 0) {
        const viceCaptain = nonCaptains.sort((a, b) => b.age - a.age)[0]
        viceCaptain.isViceCaptain = true
      }

      // Save all players to database
      const savedPlayers = []
      for (const playerData of players) {
        const player = new Player(playerData)
        await player.save()
        savedPlayers.push(player)
      }

      console.log(`⚽ SQUAD GENERATION: Successfully saved ${savedPlayers.length} players to database`)
      console.log(`⚽ SQUAD GENERATION: Sample players:`, savedPlayers.slice(0, 3).map(p => ({
        name: p.displayName,
        position: p.position,
        teamId: p.teamId,
        worldId: p.worldId,
        tournamentId: p.tournamentId
      })))
      console.log(`⚽ SQUAD GENERATION: COMPLETED for ${teamCode} - returning ${savedPlayers.length} players`)
      return savedPlayers

    } catch (error) {
      console.error(`⚽ SQUAD GENERATION: ERROR for ${teamCode}:`, error)
      console.error(`⚽ SQUAD GENERATION: Error stack:`, error.stack)
      throw error
    }
  }

  // Determine squad composition based on total squad size
  static determineSquadComposition(squadSize) {
    const base = {
      goalkeepers: 3,
      defenders: 8,
      midfielders: 8,
      forwards: 4
    }

    const remaining = squadSize - 23
    
    // Distribute remaining players
    for (let i = 0; i < remaining; i++) {
      const rand = Math.random()
      if (rand < 0.4) {
        base.midfielders++
      } else if (rand < 0.7) {
        base.defenders++
      } else {
        base.forwards++
      }
    }

    return base
  }

  // Generate a single player
  static async generatePlayer(teamCode, template, usedJerseyNumbers, usedNames, 
    tournamentId, worldId, currentYear, candidateForCaptain = false) {
    
    // Generate unique name
    let nameData
    let attempts = 0
    do {
      nameData = generatePlayerName(teamCode)
      attempts++
    } while (usedNames.has(nameData.displayName) && attempts < 50)
    
    usedNames.add(nameData.displayName)

    // Generate jersey number
    let jerseyNumber
    if (template.position === 'Goalkeeper') {
      // Goalkeepers usually wear 1, 12, 23
      const preferredNumbers = [1, 12, 23].filter(n => !usedJerseyNumbers.has(n))
      jerseyNumber = preferredNumbers.length > 0 ? 
        preferredNumbers[Math.floor(Math.random() * preferredNumbers.length)] :
        PlayerGenerationService.getRandomJerseyNumber(usedJerseyNumbers)
    } else {
      jerseyNumber = PlayerGenerationService.getRandomJerseyNumber(usedJerseyNumbers)
    }
    usedJerseyNumbers.add(jerseyNumber)

    // Generate age (realistic football ages)
    const age = PlayerGenerationService.generateRealisticAge(template.position)
    const dateOfBirth = new Date(currentYear - age, 
      Math.floor(Math.random() * 12), 
      Math.floor(Math.random() * 28) + 1)

    // Generate career stats based on age and position
    const careerStats = PlayerGenerationService.generateCareerStats(age, template.position)

    // Generate physical attributes
    const height = PlayerGenerationService.generateHeight(template.position)

    // Generate avatar seed
    const avatarSeed = crypto.randomBytes(8).toString('hex')

    // Generate ratings
    const overallRating = PlayerGenerationService.generateOverallRating(age, template.priority)
    const potential = PlayerGenerationService.generatePotential(age, overallRating)

    // Captain candidacy
    const isCaptain = candidateForCaptain && Math.random() < 0.3 && age >= 25

    return {
      firstName: nameData.firstName,
      lastName: nameData.lastName,
      displayName: nameData.displayName,
      dateOfBirth,
      age,
      nationality: teamCode,
      position: template.position,
      detailedPosition: template.detailedPosition,
      jerseyNumber,
      internationalCaps: careerStats.caps,
      internationalGoals: careerStats.goals,
      internationalAssists: careerStats.assists,
      internationalCleanSheets: careerStats.cleanSheets,
      debutYear: careerStats.debutYear,
      teamId: teamCode,
      tournamentId,
      worldId,
      height,
      preferredFoot: Math.random() < 0.15 ? 'Left' : (Math.random() < 0.05 ? 'Both' : 'Right'),
      avatarSeed,
      overallRating,
      potential,
      isCaptain,
      currentForm: PlayerGenerationService.getRandomForm(),
      fitness: Math.floor(Math.random() * 21) + 80, // 80-100
      morale: Math.floor(Math.random() * 31) + 70   // 70-100
    }
  }

  // Generate realistic football age
  static generateRealisticAge(position) {
    if (position === 'Goalkeeper') {
      // Goalkeepers: 18-40, peak 25-35
      const weights = [1, 2, 3, 4, 5, 6, 6, 6, 6, 5, 4, 3, 3, 3, 3, 3, 2, 2, 1, 1, 1, 1, 1]
      return PlayerGenerationService.weightedRandom(18, weights)
    } else {
      // Outfield players: 17-38, peak 22-30  
      const weights = [1, 2, 3, 4, 5, 6, 6, 6, 6, 5, 4, 3, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1]
      return PlayerGenerationService.weightedRandom(17, weights)
    }
  }

  // Generate career statistics based on age and position
  static generateCareerStats(age, position) {
    const careerLength = Math.max(0, age - 17)
    const debutYear = new Date().getFullYear() - careerLength
    
    if (position === 'Goalkeeper') {
      const caps = PlayerGenerationService.generateCaps(age, careerLength)
      return {
        caps,
        goals: Math.random() < 0.05 ? Math.floor(Math.random() * 3) : 0, // Very rare GK goals
        assists: Math.floor(caps * Math.random() * 0.02), // Rare GK assists
        cleanSheets: Math.floor(caps * (0.3 + Math.random() * 0.4)), // 30-70% clean sheet rate
        debutYear: caps > 0 ? debutYear : null
      }
    } else if (position === 'Forward') {
      const caps = PlayerGenerationService.generateCaps(age, careerLength)
      const goalRate = 0.3 + Math.random() * 0.5 // 0.3-0.8 goals per game for forwards
      return {
        caps,
        goals: Math.floor(caps * goalRate),
        assists: Math.floor(caps * (0.1 + Math.random() * 0.3)),
        cleanSheets: 0,
        debutYear: caps > 0 ? debutYear : null
      }
    } else if (position === 'Midfielder') {
      const caps = PlayerGenerationService.generateCaps(age, careerLength)
      const goalRate = 0.05 + Math.random() * 0.25 // 0.05-0.3 goals per game
      return {
        caps,
        goals: Math.floor(caps * goalRate),
        assists: Math.floor(caps * (0.15 + Math.random() * 0.25)),
        cleanSheets: 0,
        debutYear: caps > 0 ? debutYear : null
      }
    } else { // Defender
      const caps = PlayerGenerationService.generateCaps(age, careerLength)
      const goalRate = 0.02 + Math.random() * 0.08 // 0.02-0.1 goals per game
      return {
        caps,
        goals: Math.floor(caps * goalRate),
        assists: Math.floor(caps * (0.05 + Math.random() * 0.15)),
        cleanSheets: 0,
        debutYear: caps > 0 ? debutYear : null
      }
    }
  }

  // Generate realistic number of international caps
  static generateCaps(age, careerLength) {
    if (age < 18 || careerLength <= 0) return 0
    
    // Young players (18-21): 0-15 caps
    if (age <= 21) {
      return Math.floor(Math.random() * 16)
    }
    
    // Regular players (22-28): 5-60 caps
    if (age <= 28) {
      const base = Math.floor(careerLength * 2)
      return Math.min(base + Math.floor(Math.random() * 20), 80)
    }
    
    // Experienced players (29-35): 20-100+ caps
    if (age <= 35) {
      const base = Math.floor(careerLength * 3)
      return Math.min(base + Math.floor(Math.random() * 30), 120)
    }
    
    // Veterans (36+): 30-150+ caps
    const base = Math.floor(careerLength * 4)
    return Math.min(base + Math.floor(Math.random() * 40), 180)
  }

  // Generate height based on position
  static generateHeight(position) {
    if (position === 'Goalkeeper') {
      return Math.floor(Math.random() * 20) + 180 // 180-199 cm
    } else if (position === 'Defender') {
      return Math.floor(Math.random() * 25) + 175 // 175-199 cm
    } else if (position === 'Midfielder') {
      return Math.floor(Math.random() * 25) + 165 // 165-189 cm
    } else { // Forward
      return Math.floor(Math.random() * 30) + 165 // 165-194 cm
    }
  }

  // Generate overall rating
  static generateOverallRating(age, priority) {
    let baseRating = 65
    
    // Priority affects base rating
    if (priority === 1) baseRating = 75
    else if (priority === 2) baseRating = 70
    else if (priority === 3) baseRating = 65
    
    // Age affects rating
    if (age >= 28 && age <= 32) baseRating += 5 // Peak years
    else if (age < 20) baseRating -= 5 // Young players
    else if (age > 35) baseRating -= 8 // Declining players
    
    // Add randomness
    const variation = Math.floor(Math.random() * 15) - 7 // -7 to +7
    const rating = Math.max(45, Math.min(95, baseRating + variation))
    
    return rating
  }

  // Generate potential rating
  static generatePotential(age, overallRating) {
    if (age <= 21) {
      // Young players can improve a lot
      return Math.min(95, overallRating + Math.floor(Math.random() * 15) + 5)
    } else if (age <= 25) {
      // Some improvement possible
      return Math.min(95, overallRating + Math.floor(Math.random() * 8))
    } else {
      // Little to no improvement
      return Math.min(95, overallRating + Math.floor(Math.random() * 3))
    }
  }

  // Get random jersey number
  static getRandomJerseyNumber(used) {
    let number
    do {
      number = Math.floor(Math.random() * 99) + 1
    } while (used.has(number))
    return number
  }

  // Get random form
  static getRandomForm() {
    const forms = ['Excellent', 'Good', 'Average', 'Poor']
    const weights = [10, 40, 35, 15] // Good is most common
    return PlayerGenerationService.weightedChoice(forms, weights)
  }

  // Helper: weighted random selection
  static weightedRandom(start, weights) {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
    let random = Math.floor(Math.random() * totalWeight)
    
    for (let i = 0; i < weights.length; i++) {
      random -= weights[i]
      if (random < 0) {
        return start + i
      }
    }
    return start
  }

  // Helper: weighted choice
  static weightedChoice(choices, weights) {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
    let random = Math.floor(Math.random() * totalWeight)
    
    for (let i = 0; i < choices.length; i++) {
      random -= weights[i]
      if (random < 0) {
        return choices[i]
      }
    }
    return choices[0]
  }

  // Get players for a team
  async getTeamPlayers(teamCode, tournamentId = null, worldId = null) {
    console.log(`🏆 SERVICE: Getting players for team: ${teamCode}`)
    console.log(`🏆 SERVICE: Tournament ID: ${tournamentId}`)
    console.log(`🏆 SERVICE: World ID: ${worldId}`)
    
    // Build query with team code
    const query = { teamId: teamCode }
    
    // Try to find players with exact tournament/world match first
    if (tournamentId) query.tournamentId = tournamentId
    if (worldId) query.worldId = worldId
    
    console.log(`🏆 SERVICE: Initial query:`, query)
    
    let players = await Player.find(query).sort({ jerseyNumber: 1 })
    console.log(`🏆 SERVICE: Found ${players.length} players with exact match`)
    
    // If no players found with tournament ID, try with just world ID
    if (players.length === 0 && tournamentId && worldId) {
      console.log(`🏆 SERVICE: No players found with tournament ID, trying with just world ID...`)
      delete query.tournamentId
      players = await Player.find(query).sort({ jerseyNumber: 1 })
      console.log(`🏆 SERVICE: Found ${players.length} players with world ID only`)
    }
    
    // If still no players found, let's debug what's in the database
    if (players.length === 0) {
      console.log(`🏆 SERVICE: Still no players found, checking database...`)
      
      // Check if any players exist for this team (any variant)
      const teamVariants = [teamCode, teamCode.toUpperCase(), teamCode.toLowerCase()]
      const anyTeamPlayers = await Player.find({ 
        teamId: { $in: teamVariants }
      }).limit(5)
      console.log(`🏆 SERVICE: Players with team variants (any world/tournament):`, anyTeamPlayers.map(p => ({
        teamId: p.teamId,
        nationality: p.nationality,
        tournamentId: p.tournamentId,
        worldId: p.worldId,
        name: p.displayName
      })))
      
      // If we found players with team variants but not with our query, use them
      if (anyTeamPlayers.length > 0 && worldId) {
        console.log(`🏆 SERVICE: Found players with team variants, fetching all for this world...`)
        players = await Player.find({
          teamId: { $in: teamVariants },
          worldId: worldId
        }).sort({ jerseyNumber: 1 })
        console.log(`🏆 SERVICE: Found ${players.length} players with team variants and world ID`)
      }
    }
    
    return players
  }

  // Copy existing players from world to tournament (for roster preservation)
  async copyPlayersToTournament(teamCode, tournamentId, worldId) {
    try {
      console.log(`📋 ROSTER COPY: Copying players for ${teamCode} from world ${worldId} to tournament ${tournamentId}`)
      
      // Find existing players in the world for this team
      const worldPlayers = await Player.find({ 
        teamId: teamCode, 
        worldId: worldId, 
        tournamentId: null // Players that belong to the world but not a specific tournament
      })
      
      console.log(`📋 ROSTER COPY: Found ${worldPlayers.length} world players for ${teamCode}`)
      
      if (worldPlayers.length === 0) {
        console.log(`📋 ROSTER COPY: No world players found for ${teamCode} - cannot copy`)
        return []
      }
      
      // Check if tournament players already exist
      const existingTournamentPlayers = await Player.find({
        teamId: teamCode,
        tournamentId: tournamentId,
        worldId: worldId
      })
      
      if (existingTournamentPlayers.length > 0) {
        console.log(`📋 ROSTER COPY: Tournament players already exist (${existingTournamentPlayers.length}) - returning existing`)
        return existingTournamentPlayers
      }
      
      // Create copies of world players for the tournament
      const copiedPlayers = []
      for (const worldPlayer of worldPlayers) {
        const playerCopy = new Player({
          ...worldPlayer.toObject(),
          _id: undefined, // Let MongoDB generate new ID
          tournamentId: tournamentId,
          // Keep the same worldId
          createdAt: undefined,
          updatedAt: undefined
        })
        
        await playerCopy.save()
        copiedPlayers.push(playerCopy)
      }
      
      console.log(`📋 ROSTER COPY: Successfully copied ${copiedPlayers.length} players from world to tournament`)
      return copiedPlayers
      
    } catch (error) {
      console.error(`📋 ROSTER COPY: Error copying players for ${teamCode}:`, error)
      throw error
    }
  }

  // Get player by ID
  async getPlayerById(playerId) {
    return await Player.findById(playerId)
  }

  // Update player stats (for match results)
  async updatePlayerStats(playerId, updates) {
    return await Player.findByIdAndUpdate(playerId, updates, { new: true })
  }

  // Age players for world mode
  async agePlayersInWorld(worldId, newYear) {
    // DISABLED: Player aging and retirement has been disabled
    // All players will maintain their current age and stay active
    console.log(`🚫 AGING DISABLED: Player aging/retirement disabled for world ${worldId} - players will not age or retire`)
    
    const players = await Player.find({ worldId, isRetired: false })
    console.log(`🚫 AGING DISABLED: Found ${players.length} active players, but they will not be aged`)
    
    return { aged: 0, retired: 0, message: 'Player aging and retirement disabled' }
  }
}

export default new PlayerGenerationService()