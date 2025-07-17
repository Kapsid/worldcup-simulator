import KnockoutMatch from '../models/KnockoutMatch.js'
import KnockoutRound from '../models/KnockoutRound.js'
import Standing from '../models/Standing.js'
import Tournament from '../models/Tournament.js'

class KnockoutService {
  constructor() {
    this.rounds = [
      { round: 'round16', roundNumber: 1, name: 'Round of 16', matchCount: 8 },
      { round: 'quarterfinal', roundNumber: 2, name: 'Quarter-finals', matchCount: 4 },
      { round: 'semifinal', roundNumber: 3, name: 'Semi-finals', matchCount: 2 },
      { round: 'final', roundNumber: 4, name: 'Final', matchCount: 1 },
      { round: 'third_place', roundNumber: 5, name: 'Third Place Play-off', matchCount: 1 }
    ]
  }

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

  async getQualifiedTeams(tournamentId) {
    const standings = await Standing.find({ 
      tournament: tournamentId,
      qualifiedFor: 'round16'
    })
    .populate('team group')
    .sort({ 'group.groupLetter': 1, position: 1 })

    const qualifiedTeams = []
    const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    
    for (const groupLetter of groups) {
      const groupStandings = standings.filter(s => s.group.groupLetter === groupLetter)
      if (groupStandings.length >= 2) {
        qualifiedTeams.push({
          team: groupStandings[0].team,
          group: groupLetter,
          position: 1
        })
        qualifiedTeams.push({
          team: groupStandings[1].team,
          group: groupLetter,
          position: 2
        })
      }
    }

    return qualifiedTeams
  }

  async createRounds(tournamentId) {
    const existingRounds = await KnockoutRound.find({ tournament: tournamentId })
    if (existingRounds.length > 0) {
      await KnockoutRound.deleteMany({ tournament: tournamentId })
    }

    const rounds = this.rounds.map(round => ({
      ...round,
      tournament: tournamentId,
      status: round.roundNumber === 1 ? 'ready' : 'pending'
    }))

    await KnockoutRound.insertMany(rounds)
  }

  async createRound16Matches(tournamentId, qualifiedTeams) {
    const round16Pairings = [
      { home: { group: 'A', pos: 1 }, away: { group: 'B', pos: 2 }, position: 1 },
      { home: { group: 'C', pos: 1 }, away: { group: 'D', pos: 2 }, position: 2 },
      { home: { group: 'E', pos: 1 }, away: { group: 'F', pos: 2 }, position: 3 },
      { home: { group: 'G', pos: 1 }, away: { group: 'H', pos: 2 }, position: 4 },
      { home: { group: 'B', pos: 1 }, away: { group: 'A', pos: 2 }, position: 5 },
      { home: { group: 'D', pos: 1 }, away: { group: 'C', pos: 2 }, position: 6 },
      { home: { group: 'F', pos: 1 }, away: { group: 'E', pos: 2 }, position: 7 },
      { home: { group: 'H', pos: 1 }, away: { group: 'G', pos: 2 }, position: 8 }
    ]

    const matches = []
    
    for (const pairing of round16Pairings) {
      const homeTeam = qualifiedTeams.find(t => 
        t.group === pairing.home.group && t.position === pairing.home.pos
      )
      const awayTeam = qualifiedTeams.find(t => 
        t.group === pairing.away.group && t.position === pairing.away.pos
      )

      if (homeTeam && awayTeam) {
        matches.push({
          tournament: tournamentId,
          round: 'round16',
          matchPosition: pairing.position,
          homeTeam: homeTeam.team._id,
          awayTeam: awayTeam.team._id,
          status: 'ready',
          nextMatchPosition: Math.ceil(pairing.position / 2)
        })
      }
    }

    await KnockoutMatch.insertMany(matches)
  }

  async createEmptyMatches(tournamentId) {
    const emptyMatches = [
      // Quarter-finals
      { round: 'quarterfinal', positions: [1, 2, 3, 4], nextRound: 'semifinal' },
      // Semi-finals
      { round: 'semifinal', positions: [1, 2], nextRound: 'final' },
      // Final and Third Place
      { round: 'final', positions: [1], nextRound: null },
      { round: 'third_place', positions: [1], nextRound: null }
    ]

    const matches = []
    
    for (const matchGroup of emptyMatches) {
      for (const position of matchGroup.positions) {
        let nextMatchPosition = null
        
        if (matchGroup.nextRound) {
          // Quarter-finals (1,2 -> 1), (3,4 -> 2) | Semi-finals (1,2 -> 1)
          nextMatchPosition = Math.ceil(position / 2)
        }
        
        matches.push({
          tournament: tournamentId,
          round: matchGroup.round,
          matchPosition: position,
          status: 'pending',
          nextMatchPosition: nextMatchPosition
        })
      }
    }

    await KnockoutMatch.insertMany(matches)
  }

  async simulateKnockoutMatch(matchId) {
    try {
      const match = await KnockoutMatch.findById(matchId)
        .populate('homeTeam awayTeam')
      
      if (!match) {
        throw new Error('Match not found')
      }
      
      if (match.status !== 'ready') {
        throw new Error('Match is not ready for simulation')
      }

      const result = this.simulateKnockoutResult()
      
      match.homeScore = result.homeScore
      match.awayScore = result.awayScore
      match.homeExtraTimeScore = result.homeExtraTimeScore
      match.awayExtraTimeScore = result.awayExtraTimeScore
      match.homePenaltyScore = result.homePenaltyScore
      match.awayPenaltyScore = result.awayPenaltyScore
      match.decidedBy = result.decidedBy
      match.winner = result.winner === 'home' ? match.homeTeam._id : match.awayTeam._id
      match.loser = result.winner === 'home' ? match.awayTeam._id : match.homeTeam._id
      match.status = 'completed'
      match.simulatedAt = new Date()
      
      await match.save()
      await this.updateNextMatch(match)
      await this.updateRoundStatus(match.tournament, match.round)
      
      return match
    } catch (error) {
      throw new Error(`Failed to simulate knockout match: ${error.message}`)
    }
  }

  simulateKnockoutResult() {
    const regularTime = this.simulateRegularTime()
    
    if (regularTime.homeScore !== regularTime.awayScore) {
      return {
        homeScore: regularTime.homeScore,
        awayScore: regularTime.awayScore,
        homeExtraTimeScore: null,
        awayExtraTimeScore: null,
        homePenaltyScore: null,
        awayPenaltyScore: null,
        decidedBy: 'regular',
        winner: regularTime.homeScore > regularTime.awayScore ? 'home' : 'away'
      }
    }

    const extraTime = this.simulateExtraTime()
    const totalHome = regularTime.homeScore + extraTime.homeScore
    const totalAway = regularTime.awayScore + extraTime.awayScore
    
    if (totalHome !== totalAway) {
      return {
        homeScore: regularTime.homeScore,
        awayScore: regularTime.awayScore,
        homeExtraTimeScore: extraTime.homeScore,
        awayExtraTimeScore: extraTime.awayScore,
        homePenaltyScore: null,
        awayPenaltyScore: null,
        decidedBy: 'extra_time',
        winner: totalHome > totalAway ? 'home' : 'away'
      }
    }

    const penalties = this.simulatePenalties()
    
    return {
      homeScore: regularTime.homeScore,
      awayScore: regularTime.awayScore,
      homeExtraTimeScore: extraTime.homeScore,
      awayExtraTimeScore: extraTime.awayScore,
      homePenaltyScore: penalties.homeScore,
      awayPenaltyScore: penalties.awayScore,
      decidedBy: 'penalties',
      winner: penalties.homeScore > penalties.awayScore ? 'home' : 'away'
    }
  }

  simulateRegularTime() {
    const outcomes = [
      { home: 0, away: 0, weight: 12 },
      { home: 1, away: 0, weight: 15 },
      { home: 0, away: 1, weight: 15 },
      { home: 1, away: 1, weight: 18 },
      { home: 2, away: 0, weight: 12 },
      { home: 0, away: 2, weight: 12 },
      { home: 2, away: 1, weight: 8 },
      { home: 1, away: 2, weight: 8 },
      { home: 3, away: 0, weight: 4 },
      { home: 0, away: 3, weight: 4 },
      { home: 2, away: 2, weight: 6 },
      { home: 3, away: 1, weight: 3 },
      { home: 1, away: 3, weight: 3 }
    ]
    
    return this.selectWeightedOutcome(outcomes)
  }

  simulateExtraTime() {
    const outcomes = [
      { home: 0, away: 0, weight: 40 },
      { home: 1, away: 0, weight: 20 },
      { home: 0, away: 1, weight: 20 },
      { home: 1, away: 1, weight: 15 },
      { home: 2, away: 0, weight: 2 },
      { home: 0, away: 2, weight: 2 },
      { home: 2, away: 1, weight: 0.5 },
      { home: 1, away: 2, weight: 0.5 }
    ]
    
    return this.selectWeightedOutcome(outcomes)
  }

  simulatePenalties() {
    const homeScore = Math.floor(Math.random() * 3) + 3
    const awayScore = Math.floor(Math.random() * 3) + 3
    
    if (homeScore === awayScore) {
      return Math.random() < 0.5 
        ? { homeScore: homeScore + 1, awayScore }
        : { homeScore, awayScore: awayScore + 1 }
    }
    
    return { homeScore, awayScore }
  }

  selectWeightedOutcome(outcomes) {
    const totalWeight = outcomes.reduce((sum, outcome) => sum + outcome.weight, 0)
    const random = Math.random() * totalWeight
    
    let currentWeight = 0
    for (const outcome of outcomes) {
      currentWeight += outcome.weight
      if (random <= currentWeight) {
        return { homeScore: outcome.home, awayScore: outcome.away }
      }
    }
    
    return { homeScore: 1, awayScore: 1 }
  }

  async updateNextMatch(completedMatch) {
    if (!completedMatch.nextMatchPosition) return

    const nextRound = this.getNextRound(completedMatch.round)
    if (!nextRound) return

    const nextMatch = await KnockoutMatch.findOne({
      tournament: completedMatch.tournament,
      round: nextRound,
      matchPosition: completedMatch.nextMatchPosition
    })

    if (!nextMatch) return

    // Determine which position in the next match this team should go to
    // For knockout brackets: matches 1,2 -> QF1, matches 3,4 -> QF2, etc.
    // Winner of match 1 goes to home team of next match, winner of match 2 goes to away team
    const isOddMatch = completedMatch.matchPosition % 2 === 1
    
    if (isOddMatch) {
      // Winner of odd-numbered match (1, 3, 5, 7) goes to home team
      nextMatch.homeTeam = completedMatch.winner
    } else {
      // Winner of even-numbered match (2, 4, 6, 8) goes to away team
      nextMatch.awayTeam = completedMatch.winner
    }

    if (nextMatch.homeTeam && nextMatch.awayTeam) {
      nextMatch.status = 'ready'
    }

    await nextMatch.save()

    if (completedMatch.round === 'semifinal' && nextRound === 'final') {
      await this.updateThirdPlaceMatch(completedMatch)
    }
  }

  async updateThirdPlaceMatch(semiMatch) {
    const thirdPlaceMatch = await KnockoutMatch.findOne({
      tournament: semiMatch.tournament,
      round: 'third_place',
      matchPosition: 1
    })

    if (!thirdPlaceMatch) return

    const isFirstSemi = semiMatch.matchPosition === 1
    
    if (isFirstSemi) {
      thirdPlaceMatch.homeTeam = semiMatch.loser
    } else {
      thirdPlaceMatch.awayTeam = semiMatch.loser
    }

    if (thirdPlaceMatch.homeTeam && thirdPlaceMatch.awayTeam) {
      thirdPlaceMatch.status = 'ready'
    }

    await thirdPlaceMatch.save()
  }

  getNextRound(currentRound) {
    const roundMap = {
      'round16': 'quarterfinal',
      'quarterfinal': 'semifinal',
      'semifinal': 'final'
    }
    return roundMap[currentRound]
  }

  async updateRoundStatus(tournamentId, round) {
    const roundDoc = await KnockoutRound.findOne({ tournament: tournamentId, round })
    const completedMatches = await KnockoutMatch.countDocuments({ 
      tournament: tournamentId, 
      round, 
      status: 'completed' 
    })

    roundDoc.completedMatches = completedMatches
    
    if (completedMatches === roundDoc.matchCount) {
      roundDoc.status = 'completed'
      roundDoc.completedAt = new Date()
      
      if (round === 'final' && roundDoc.status === 'completed') {
        await this.completeTournament(tournamentId)
      }
    } else if (completedMatches > 0) {
      roundDoc.status = 'in_progress'
    }

    await roundDoc.save()
  }

  async completeTournament(tournamentId) {
    const tournament = await Tournament.findById(tournamentId)
    tournament.status = 'completed'
    await tournament.save()
  }

  async simulateRound(tournamentId, round) {
    const matches = await KnockoutMatch.find({
      tournament: tournamentId,
      round,
      status: 'ready'
    })

    const simulatedMatches = []
    for (const match of matches) {
      const simulatedMatch = await this.simulateKnockoutMatch(match._id)
      simulatedMatches.push(simulatedMatch)
    }

    return simulatedMatches
  }

  async getKnockoutBracket(tournamentId) {
    const rounds = await KnockoutRound.find({ tournament: tournamentId })
      .sort({ roundNumber: 1 })
    
    const matches = await KnockoutMatch.find({ tournament: tournamentId })
      .populate('homeTeam awayTeam winner loser')
      .sort({ round: 1, matchPosition: 1 })

    return {
      rounds,
      matches: this.groupMatchesByRound(matches)
    }
  }

  groupMatchesByRound(matches) {
    const grouped = {}
    for (const match of matches) {
      if (!grouped[match.round]) {
        grouped[match.round] = []
      }
      grouped[match.round].push(match)
    }
    return grouped
  }

  async getFinalResults(tournamentId) {
    const finalMatch = await KnockoutMatch.findOne({
      tournament: tournamentId,
      round: 'final',
      status: 'completed'
    }).populate('winner loser')

    const thirdPlaceMatch = await KnockoutMatch.findOne({
      tournament: tournamentId,
      round: 'third_place',
      status: 'completed'
    }).populate('winner loser')

    return {
      champion: finalMatch?.winner || null,
      runnerUp: finalMatch?.loser || null,
      thirdPlace: thirdPlaceMatch?.winner || null,
      fourthPlace: thirdPlaceMatch?.loser || null
    }
  }

  async fixExistingBracket(tournamentId) {
    try {
      // Fix nextMatchPosition for existing matches
      const round16Matches = await KnockoutMatch.find({ 
        tournament: tournamentId, 
        round: 'round16' 
      }).sort({ matchPosition: 1 })
      
      for (const match of round16Matches) {
        match.nextMatchPosition = Math.ceil(match.matchPosition / 2)
        await match.save()
      }
      
      const quarterMatches = await KnockoutMatch.find({ 
        tournament: tournamentId, 
        round: 'quarterfinal' 
      }).sort({ matchPosition: 1 })
      
      for (const match of quarterMatches) {
        match.nextMatchPosition = Math.ceil(match.matchPosition / 2)
        await match.save()
      }
      
      const semiMatches = await KnockoutMatch.find({ 
        tournament: tournamentId, 
        round: 'semifinal' 
      }).sort({ matchPosition: 1 })
      
      for (const match of semiMatches) {
        match.nextMatchPosition = 1
        await match.save()
      }
      
      // Now re-process all completed matches to fix advancement
      const completedMatches = await KnockoutMatch.find({ 
        tournament: tournamentId, 
        status: 'completed' 
      }).sort({ round: 1, matchPosition: 1 })
      
      // Reset next round matches
      await KnockoutMatch.updateMany(
        { tournament: tournamentId, status: 'pending' },
        { $unset: { homeTeam: 1, awayTeam: 1 } }
      )
      
      // Re-process each completed match
      for (const match of completedMatches) {
        await this.updateNextMatch(match)
      }
      
      console.log('Bracket fixed successfully')
    } catch (error) {
      console.error('Error fixing bracket:', error.message)
      throw new Error(`Failed to fix bracket: ${error.message}`)
    }
  }
}

export default new KnockoutService()