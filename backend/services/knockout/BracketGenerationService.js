import KnockoutMatch from '../../models/KnockoutMatch.js'
import KnockoutRound from '../../models/KnockoutRound.js'
import Standing from '../../models/Standing.js'

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

      await this.createRounds(tournamentId)
      await this.createRound16Matches(tournamentId, qualifiedTeams)
      await this.createEmptyMatches(tournamentId)
      
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
  async createRound16Matches(tournamentId, qualifiedTeams) {
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
        wentToPenalties: false
      })
      
      matches.push(match)
    }

    await KnockoutMatch.insertMany(matches)
    return matches
  }

  // Create empty matches for subsequent rounds
  async createEmptyMatches(tournamentId) {
    const matchesToCreate = []

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
        wentToPenalties: false
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
        wentToPenalties: false
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
      wentToPenalties: false
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
      wentToPenalties: false
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
}

export default new BracketGenerationService()