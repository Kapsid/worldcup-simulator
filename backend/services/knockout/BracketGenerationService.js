import KnockoutMatch from '../../models/KnockoutMatch.js'
import KnockoutRound from '../../models/KnockoutRound.js'
import Standing from '../../models/Standing.js'
import Tournament from '../../models/Tournament.js'

class BracketGenerationService {
  constructor() {
    this.rounds = [
      { round: 'round16', roundNumber: 1, name: 'Round of 16', matchCount: 8 },
      { round: 'quarterfinal', roundNumber: 2, name: 'Quarter-finals', matchCount: 4 },
      { round: 'semifinal', roundNumber: 3, name: 'Semi-finals', matchCount: 2 },
      { round: 'final', roundNumber: 4, name: 'Final', matchCount: 1 },
      { round: 'third_place', roundNumber: 5, name: 'Third Place Play-off', matchCount: 1 }
    ]
  }

  // Generate complete knockout bracket
  async generateKnockoutBracket(tournamentId) {
    try {
      // Check if bracket already exists
      const existingMatches = await KnockoutMatch.find({ tournament: tournamentId })
      if (existingMatches.length > 0) {
        console.log('Knockout bracket already exists, returning existing bracket')
        return await this.getKnockoutBracket(tournamentId)
      }

      const qualifiedTeams = await this.getQualifiedTeams(tournamentId)
      
      if (qualifiedTeams.length !== 16) {
        throw new Error(`Expected 16 qualified teams, got ${qualifiedTeams.length}`)
      }

      // Get tournament cities for venue assignment
      const tournament = await Tournament.findById(tournamentId).select('hostCities')
      if (!tournament || !tournament.hostCities || tournament.hostCities.length === 0) {
        throw new Error('Tournament cities not found')
      }

      await this.createRounds(tournamentId)
      await this.createRound16Matches(tournamentId, qualifiedTeams, tournament.hostCities)
      await this.createEmptyMatches(tournamentId, tournament.hostCities)
      
      return await this.getKnockoutBracket(tournamentId)
    } catch (error) {
      throw new Error(`Failed to generate knockout bracket: ${error.message}`)
    }
  }

  // Get qualified teams from group stage
  async getQualifiedTeams(tournamentId) {
    const standings = await Standing.find({ 
      tournament: tournamentId,
      qualifiedFor: 'round16'
    })
    .populate('team group')
    .sort({ 'group.groupLetter': 1, position: 1 })

    const qualifiedTeams = []
    const groupWinners = []
    const runnersUp = []

    // Separate winners and runners-up
    for (const standing of standings) {
      const teamData = {
        _id: standing.team._id,
        name: standing.team.name,
        flag: standing.team.flag,
        group: standing.group.groupLetter,
        position: standing.position,
        points: standing.points,
        goalDifference: standing.goalDifference,
        goalsFor: standing.goalsFor,
        ranking: standing.team.ranking
      }

      if (standing.position === 1) {
        groupWinners.push(teamData)
      } else if (standing.position === 2) {
        runnersUp.push(teamData)
      }
    }

    // Sort groups alphabetically and interleave winners and runners-up
    const sortedGroups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    
    for (const group of sortedGroups) {
      const winner = groupWinners.find(t => t.group === group)
      const runnerUp = runnersUp.find(t => t.group === group)
      
      if (winner) qualifiedTeams.push(winner)
      if (runnerUp) qualifiedTeams.push(runnerUp)
    }

    return qualifiedTeams
  }

  // Create round documents
  async createRounds(tournamentId) {
    const rounds = []
    for (const roundInfo of this.rounds) {
      const round = new KnockoutRound({
        tournament: tournamentId,
        round: roundInfo.round,
        roundNumber: roundInfo.roundNumber,
        name: roundInfo.name,
        matchCount: roundInfo.matchCount,
        completed: false
      })
      rounds.push(round)
    }
    
    await KnockoutRound.insertMany(rounds)
    return rounds
  }

  // Create Round of 16 matches with proper bracket structure
  async createRound16Matches(tournamentId, qualifiedTeams, hostCities) {
    // World Cup bracket structure (winners vs runners-up from different groups)
    const matchPairings = [
      { match: 1, team1Index: 0, team2Index: 3 },   // A1 vs B2
      { match: 2, team1Index: 2, team2Index: 1 },   // B1 vs A2  
      { match: 3, team1Index: 4, team2Index: 7 },   // C1 vs D2
      { match: 4, team1Index: 6, team2Index: 5 },   // D1 vs C2
      { match: 5, team1Index: 8, team2Index: 11 },  // E1 vs F2
      { match: 6, team1Index: 10, team2Index: 9 },  // F1 vs E2
      { match: 7, team1Index: 12, team2Index: 15 }, // G1 vs H2
      { match: 8, team1Index: 14, team2Index: 13 }  // H1 vs G2
    ]

    // Create city assignment for Round of 16
    const cityAssignment = this.assignKnockoutCities(hostCities, 'round16', 8)
    
    const matches = []
    for (const pairing of matchPairings) {
      const team1 = qualifiedTeams[pairing.team1Index]
      const team2 = qualifiedTeams[pairing.team2Index]
      
      if (!team1 || !team2) {
        throw new Error(`Missing teams for Round of 16 match ${pairing.match}`)
      }

      const match = new KnockoutMatch({
        tournament: tournamentId,
        round: 'round16',
        matchNumber: pairing.match,
        team1: team1._id,
        team2: team2._id,
        team1Name: team1.name,
        team2Name: team2.name,
        team1Flag: team1.flag,
        team2Flag: team2.flag,
        team1Goals: 0,
        team2Goals: 0,
        team1PenaltyGoals: 0,
        team2PenaltyGoals: 0,
        winner: null,
        played: false,
        needsPenalties: false,
        wentToPenalties: false,
        city: cityAssignment[pairing.match - 1] // Array is 0-indexed, match numbers are 1-indexed
      })
      
      matches.push(match)
    }

    await KnockoutMatch.insertMany(matches)
    return matches
  }

  // Create empty matches for subsequent rounds
  async createEmptyMatches(tournamentId, hostCities) {
    const matchesToCreate = []

    // Get city assignments for each round
    const quarterFinalCities = this.assignKnockoutCities(hostCities, 'quarterfinal', 4)
    const semiFinalCities = this.assignKnockoutCities(hostCities, 'semifinal', 2)
    const finalCities = this.assignKnockoutCities(hostCities, 'final', 1)
    const thirdPlaceCities = this.assignKnockoutCities(hostCities, 'third_place', 1)

    // Quarter-finals (4 matches)
    for (let i = 1; i <= 4; i++) {
      matchesToCreate.push({
        tournament: tournamentId,
        round: 'quarterfinal',
        matchNumber: i,
        team1: null,
        team2: null,
        team1Name: 'TBD',
        team2Name: 'TBD',
        team1Flag: '',
        team2Flag: '',
        team1Goals: 0,
        team2Goals: 0,
        team1PenaltyGoals: 0,
        team2PenaltyGoals: 0,
        winner: null,
        played: false,
        needsPenalties: false,
        wentToPenalties: false,
        city: quarterFinalCities[i - 1]
      })
    }

    // Semi-finals (2 matches)
    for (let i = 1; i <= 2; i++) {
      matchesToCreate.push({
        tournament: tournamentId,
        round: 'semifinal',
        matchNumber: i,
        team1: null,
        team2: null,
        team1Name: 'TBD',
        team2Name: 'TBD',
        team1Flag: '',
        team2Flag: '',
        team1Goals: 0,
        team2Goals: 0,
        team1PenaltyGoals: 0,
        team2PenaltyGoals: 0,
        winner: null,
        played: false,
        needsPenalties: false,
        wentToPenalties: false,
        city: semiFinalCities[i - 1]
      })
    }

    // Final
    matchesToCreate.push({
      tournament: tournamentId,
      round: 'final',
      matchNumber: 1,
      team1: null,
      team2: null,
      team1Name: 'TBD',
      team2Name: 'TBD',
      team1Flag: '',
      team2Flag: '',
      team1Goals: 0,
      team2Goals: 0,
      team1PenaltyGoals: 0,
      team2PenaltyGoals: 0,
      winner: null,
      played: false,
      needsPenalties: false,
      wentToPenalties: false,
      city: finalCities[0]
    })

    // Third Place Play-off
    matchesToCreate.push({
      tournament: tournamentId,
      round: 'third_place',
      matchNumber: 1,
      team1: null,
      team2: null,
      team1Name: 'TBD',
      team2Name: 'TBD',
      team1Flag: '',
      team2Flag: '',
      team1Goals: 0,
      team2Goals: 0,
      team1PenaltyGoals: 0,
      team2PenaltyGoals: 0,
      winner: null,
      played: false,
      needsPenalties: false,
      wentToPenalties: false,
      city: thirdPlaceCities[0]
    })

    await KnockoutMatch.insertMany(matchesToCreate)
  }

  // Get complete knockout bracket
  async getKnockoutBracket(tournamentId) {
    const matches = await KnockoutMatch.find({ tournament: tournamentId })
      .populate('team1 team2 winner')
      .sort({ round: 1, matchNumber: 1 })

    const rounds = await KnockoutRound.find({ tournament: tournamentId })
      .sort({ roundNumber: 1 })

    // Group matches by round
    const bracketStructure = {}
    for (const roundInfo of this.rounds) {
      bracketStructure[roundInfo.round] = {
        info: rounds.find(r => r.round === roundInfo.round),
        matches: matches.filter(m => m.round === roundInfo.round)
      }
    }

    return {
      tournament: tournamentId,
      structure: bracketStructure,
      allMatches: matches,
      rounds: rounds
    }
  }

  // Fix existing bracket structure (utility method)
  async fixExistingBracket(tournamentId) {
    try {
      // Delete existing bracket
      await KnockoutMatch.deleteMany({ tournament: tournamentId })
      await KnockoutRound.deleteMany({ tournament: tournamentId })
      
      // Regenerate bracket
      return await this.generateKnockoutBracket(tournamentId)
    } catch (error) {
      throw new Error(`Failed to fix bracket: ${error.message}`)
    }
  }

  // Get round configuration
  getRoundConfig() {
    return this.rounds
  }

  // Get specific round info
  getRoundInfo(roundName) {
    return this.rounds.find(r => r.round === roundName)
  }

  // Assign cities to knockout matches based on importance and prestige
  assignKnockoutCities(hostCities, round, matchCount) {
    const cities = hostCities.map(city => city.name)
    
    // Create venue hierarchy based on match importance
    const venueHierarchy = {
      'final': this.getPrestigiousVenues(cities, 1),
      'third_place': this.getPrestigiousVenues(cities, 1, 1), // Different from final
      'semifinal': this.getPrestigiousVenues(cities, 2),
      'quarterfinal': this.getMajorVenues(cities, 4),
      'round16': this.getWellDistributedVenues(cities, 8)
    }
    
    return venueHierarchy[round] || cities.slice(0, matchCount)
  }

  // Get most prestigious venues (capitals, major cities)
  getPrestigiousVenues(cities, count, offset = 0) {
    // Priority order: Capital cities, major metropolitan areas, then others
    const prestigiousOrder = [
      // Common capital/major cities
      'Berlin', 'Munich', 'London', 'Paris', 'Madrid', 'Rome', 'Moscow', 
      'Tokyo', 'Seoul', 'Beijing', 'Buenos Aires', 'Brasília', 'Mexico City',
      'Washington DC', 'New York', 'Los Angeles', 'Sydney', 'Cairo', 'Johannesburg',
      'Doha', 'Istanbul', 'Amsterdam', 'Stockholm', 'Copenhagen'
    ]
    
    const prestigiousCities = []
    
    // First, add cities that match prestigious order
    for (const prestigiousCity of prestigiousOrder) {
      const match = cities.find(city => 
        city.toLowerCase().includes(prestigiousCity.toLowerCase()) ||
        prestigiousCity.toLowerCase().includes(city.toLowerCase())
      )
      if (match && !prestigiousCities.includes(match)) {
        prestigiousCities.push(match)
      }
    }
    
    // Then add remaining cities
    for (const city of cities) {
      if (!prestigiousCities.includes(city)) {
        prestigiousCities.push(city)
      }
    }
    
    // Return requested count with offset
    return prestigiousCities.slice(offset, offset + count)
  }

  // Get major venues for quarter-finals
  getMajorVenues(cities, count) {
    // For quarter-finals, use good mix of major cities
    const majorCities = this.getPrestigiousVenues(cities, Math.min(count, cities.length))
    
    // If we need more cities than available, cycle through
    while (majorCities.length < count) {
      const additionalCities = cities.filter(city => !majorCities.includes(city))
      if (additionalCities.length === 0) break
      majorCities.push(...additionalCities.slice(0, count - majorCities.length))
    }
    
    return majorCities.slice(0, count)
  }

  // Get well-distributed venues for Round of 16
  getWellDistributedVenues(cities, count) {
    // For Round of 16, ensure good geographical distribution
    const distributedCities = []
    
    // If we have enough cities, use different ones
    if (cities.length >= count) {
      return cities.slice(0, count)
    }
    
    // If not enough cities, distribute evenly
    let cityIndex = 0
    for (let i = 0; i < count; i++) {
      distributedCities.push(cities[cityIndex % cities.length])
      cityIndex++
    }
    
    return distributedCities
  }
}

export default new BracketGenerationService()