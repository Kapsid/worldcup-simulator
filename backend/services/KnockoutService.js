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

      const result = this.simulateKnockoutResult(match.homeTeam, match.awayTeam)
      
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

  simulateKnockoutResult(homeTeam, awayTeam) {
    const regularTime = this.simulateRegularTime(homeTeam, awayTeam)
    
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

    const extraTime = this.simulateExtraTime(homeTeam, awayTeam)
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

  // Convert FIFA ranking to power (1-20 scale)
  calculateTeamPower(fifaRanking) {
    if (fifaRanking <= 5) return 20      // Top 5 teams
    if (fifaRanking <= 10) return 19     // Top 10 teams  
    if (fifaRanking <= 15) return 18     // Top 15 teams
    if (fifaRanking <= 20) return 17     // Top 20 teams
    if (fifaRanking <= 30) return 16     // Top 30 teams
    if (fifaRanking <= 40) return 15     // Top 40 teams
    if (fifaRanking <= 50) return 14     // Top 50 teams
    if (fifaRanking <= 60) return 13     // Top 60 teams
    if (fifaRanking <= 70) return 12     // Top 70 teams
    if (fifaRanking <= 80) return 11     // Top 80 teams
    if (fifaRanking <= 90) return 10     // Top 90 teams
    if (fifaRanking <= 100) return 9     // Top 100 teams
    if (fifaRanking <= 110) return 8     // Top 110 teams
    if (fifaRanking <= 120) return 7     // Top 120 teams
    if (fifaRanking <= 130) return 6     // Top 130 teams
    if (fifaRanking <= 140) return 5     // Top 140 teams
    if (fifaRanking <= 150) return 4     // Top 150 teams
    if (fifaRanking <= 170) return 3     // Top 170 teams
    if (fifaRanking <= 190) return 2     // Top 190 teams
    return 1                             // Bottom teams
  }

  simulateRegularTime(homeTeam, awayTeam) {
    const homePower = this.calculateTeamPower(homeTeam.fifaRanking)
    const awayPower = this.calculateTeamPower(awayTeam.fifaRanking)
    
    // Calculate power difference (-19 to +19)
    const powerDiff = homePower - awayPower
    
    // Home advantage (+2 power boost)
    const adjustedPowerDiff = powerDiff + 2
    
    // Surprise factor (0.5% chance in knockouts, very limited)
    let surpriseFactor = 0
    if (Math.random() < 0.005) {
      const maxSurprise = Math.max(2, 6 - Math.abs(powerDiff) / 2)
      surpriseFactor = Math.random() < 0.5 ? -maxSurprise : maxSurprise
    }
    const finalPowerDiff = adjustedPowerDiff + surpriseFactor
    
    // Knockout matches tend to be more cagey but slightly more goals and closer games
    const outcomes = [
      { home: 0, away: 0, weight: 10 },   // Cagey affair (slightly reduced)
      { home: 1, away: 0, weight: 14 },   // Narrow home win (slightly reduced)
      { home: 0, away: 1, weight: 14 },   // Away edge (slightly reduced)
      { home: 1, away: 1, weight: 20 },   // Tight contest (increased for closer games)
      { home: 2, away: 0, weight: 11 },   // Home control (slightly reduced)
      { home: 0, away: 2, weight: 11 },   // Away dominance (slightly reduced)
      { home: 2, away: 1, weight: 10 },   // Close victory (increased for closer games)
      { home: 1, away: 2, weight: 10 },   // Away win (increased for closer games)
      { home: 3, away: 0, weight: 3 },    // Convincing (slightly reduced)
      { home: 0, away: 3, weight: 3 },    // Away statement (slightly reduced)
      { home: 2, away: 2, weight: 8 },    // Entertaining (increased for closer games)
      { home: 3, away: 1, weight: 2.5 },  // Dominant display (slightly reduced)
      { home: 1, away: 3, weight: 2.5 },  // Away masterclass (slightly reduced)
      // Rare knockout scorelines
      { home: 4, away: 0, weight: 0.8 },  // Demolition (slightly reduced)
      { home: 0, away: 4, weight: 0.8 },  // Away thrashing (slightly reduced)
      { home: 3, away: 2, weight: 1.5 },  // Thriller (increased for closer games)
      { home: 2, away: 3, weight: 1.5 },  // Away thriller (increased for closer games)
      { home: 4, away: 1, weight: 0.4 },  // Statement (slightly reduced)
      { home: 1, away: 4, weight: 0.4 },  // Away statement (slightly reduced)
      { home: 5, away: 0, weight: 0.1 },  // Historic
      { home: 0, away: 5, weight: 0.1 }   // Historic away
    ]
    
    return this.selectWeightedOutcome(outcomes, finalPowerDiff)
  }

  simulateExtraTime(homeTeam, awayTeam) {
    const homePower = this.calculateTeamPower(homeTeam.fifaRanking)
    const awayPower = this.calculateTeamPower(awayTeam.fifaRanking)
    
    // Calculate power difference for extra time
    const powerDiff = homePower - awayPower
    const adjustedPowerDiff = powerDiff + 1 // Smaller home advantage in extra time
    
    // Almost no surprise factor in extra time (0.2% chance)
    let surpriseFactor = 0
    if (Math.random() < 0.002) {
      const maxSurprise = Math.max(1, 3 - Math.abs(powerDiff) / 2)
      surpriseFactor = Math.random() < 0.5 ? -maxSurprise : maxSurprise
    }
    const finalPowerDiff = adjustedPowerDiff + surpriseFactor
    
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
    
    return this.selectWeightedOutcome(outcomes, finalPowerDiff)
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

  selectWeightedOutcome(outcomes, powerDiff = 0) {
    // Adjust weights based on power difference if provided
    const adjustedOutcomes = outcomes.map(outcome => {
      let weight = outcome.weight
      
      if (powerDiff !== 0) {
        const goalDiff = outcome.home - outcome.away
        
        // If home team is stronger, favor home wins (but less extreme for closer knockout games)
        if (powerDiff > 0) {
          if (goalDiff > 0) {
            weight *= Math.pow(1.15, Math.min(powerDiff, 15)) // Boost home wins less extreme
          } else if (goalDiff < 0) {
            weight *= Math.pow(0.85, Math.min(powerDiff, 15)) // Reduce away wins less extreme
          } else {
            // Draws slightly more likely in knockout (closer games)
            weight *= Math.pow(0.92, Math.min(powerDiff / 1.5, 10))
          }
        }
        // If away team is stronger, favor away wins (but less extreme for closer knockout games)
        else if (powerDiff < 0) {
          if (goalDiff < 0) {
            weight *= Math.pow(1.15, Math.min(Math.abs(powerDiff), 15)) // Boost away wins less extreme
          } else if (goalDiff > 0) {
            weight *= Math.pow(0.85, Math.min(Math.abs(powerDiff), 15)) // Reduce home wins less extreme
          } else {
            // Draws slightly more likely in knockout (closer games)
            weight *= Math.pow(0.92, Math.min(Math.abs(powerDiff) / 1.5, 10))
          }
        }
        
        // For large power differences (>6), favor the stronger team but allow more upsets in knockout
        if (Math.abs(powerDiff) > 6) {
          const favoredGoalDiff = powerDiff > 0 ? goalDiff : -goalDiff
          if (favoredGoalDiff < 0) {
            weight *= 0.12 // 88% reduction - upsets slightly more possible in knockout
          } else if (favoredGoalDiff === 0 && goalDiff === 0) {
            weight *= 0.3 // 70% reduction for draws - closer games in knockout
          } else if (favoredGoalDiff > 0 && favoredGoalDiff < 2) {
            weight *= 0.7 // Expect wins but closer margins
          }
        }
        
        // For extreme power differences (>10), still allow some upsets in knockout drama
        if (Math.abs(powerDiff) > 10) {
          const favoredGoalDiff = powerDiff > 0 ? goalDiff : -goalDiff
          if (favoredGoalDiff < 0) {
            weight *= 0.05 // 95% reduction - rare but possible upsets
          } else if (favoredGoalDiff === 0) {
            weight *= 0.08 // 92% reduction for draws - closer knockout games
          } else if (favoredGoalDiff < 2) {
            weight *= 0.4 // Expect wins but closer margins in knockout
          }
        }
      }
      
      return { ...outcome, weight }
    })
    
    const totalWeight = adjustedOutcomes.reduce((sum, outcome) => sum + outcome.weight, 0)
    const random = Math.random() * totalWeight
    
    let currentWeight = 0
    for (const outcome of adjustedOutcomes) {
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