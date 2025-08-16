import KnockoutMatch from '../models/KnockoutMatch.js'
import KnockoutRound from '../models/KnockoutRound.js'
import Standing from '../models/Standing.js'
import Tournament from '../models/Tournament.js'
import PlayerStatsUpdateService from './PlayerStatsUpdateService.js'
import PlayerGenerationService from './PlayerGenerationService.js'

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
      
      // Update player statistics for international caps and goals
      await this.updatePlayerStatsForMatch(match, result)
      
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

  // Convert world ranking to power (1-20 scale)
  calculateTeamPower(worldRanking) {
    if (worldRanking <= 5) return 20      // Top 5 teams
    if (worldRanking <= 10) return 19     // Top 10 teams  
    if (worldRanking <= 15) return 18     // Top 15 teams
    if (worldRanking <= 20) return 17     // Top 20 teams
    if (worldRanking <= 30) return 16     // Top 30 teams
    if (worldRanking <= 40) return 15     // Top 40 teams
    if (worldRanking <= 50) return 14     // Top 50 teams
    if (worldRanking <= 60) return 13     // Top 60 teams
    if (worldRanking <= 70) return 12     // Top 70 teams
    if (worldRanking <= 80) return 11     // Top 80 teams
    if (worldRanking <= 90) return 10     // Top 90 teams
    if (worldRanking <= 100) return 9     // Top 100 teams
    if (worldRanking <= 110) return 8     // Top 110 teams
    if (worldRanking <= 120) return 7     // Top 120 teams
    if (worldRanking <= 130) return 6     // Top 130 teams
    if (worldRanking <= 140) return 5     // Top 140 teams
    if (worldRanking <= 150) return 4     // Top 150 teams
    if (worldRanking <= 170) return 3     // Top 170 teams
    if (worldRanking <= 190) return 2     // Top 190 teams
    return 1                             // Bottom teams
  }

  simulateRegularTime(homeTeam, awayTeam) {
    const homePower = this.calculateTeamPower(homeTeam.worldRanking)
    const awayPower = this.calculateTeamPower(awayTeam.worldRanking)
    
    // Calculate power difference (-19 to +19)
    const powerDiff = homePower - awayPower
    
    // Home advantage (+1.5 power boost - reduced from 2)
    const adjustedPowerDiff = powerDiff + 1.5
    
    // Reduced surprise factor (0.2% chance in knockouts, very limited)
    let surpriseFactor = 0
    if (Math.random() < 0.002) {
      const maxSurprise = Math.max(1, 4 - Math.abs(powerDiff) / 3)
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
    const homePower = this.calculateTeamPower(homeTeam.worldRanking)
    const awayPower = this.calculateTeamPower(awayTeam.worldRanking)
    
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
        
        // If home team is stronger, favor home wins more strongly
        if (powerDiff > 0) {
          if (goalDiff > 0) {
            weight *= Math.pow(1.25, Math.min(powerDiff, 15)) // Stronger boost for home wins
          } else if (goalDiff < 0) {
            weight *= Math.pow(0.75, Math.min(powerDiff, 15)) // Stronger reduction for away wins
          } else {
            // Draws less likely when there's a clear stronger team
            weight *= Math.pow(0.85, Math.min(powerDiff / 1.2, 10))
          }
        }
        // If away team is stronger, favor away wins more strongly
        else if (powerDiff < 0) {
          if (goalDiff < 0) {
            weight *= Math.pow(1.25, Math.min(Math.abs(powerDiff), 15)) // Stronger boost for away wins
          } else if (goalDiff > 0) {
            weight *= Math.pow(0.75, Math.min(Math.abs(powerDiff), 15)) // Stronger reduction for home wins
          } else {
            // Draws less likely when there's a clear stronger team
            weight *= Math.pow(0.85, Math.min(Math.abs(powerDiff) / 1.2, 10))
          }
        }
        
        // For large power differences (>6), strongly favor the stronger team
        if (Math.abs(powerDiff) > 6) {
          const favoredGoalDiff = powerDiff > 0 ? goalDiff : -goalDiff
          if (favoredGoalDiff < 0) {
            weight *= 0.08 // 92% reduction - upsets very rare
          } else if (favoredGoalDiff === 0 && goalDiff === 0) {
            weight *= 0.2 // 80% reduction for draws
          } else if (favoredGoalDiff > 0 && favoredGoalDiff < 2) {
            weight *= 0.8 // Expect wins with reasonable margins
          }
        }
        
        // For extreme power differences (>10), heavily favor the stronger team
        if (Math.abs(powerDiff) > 10) {
          const favoredGoalDiff = powerDiff > 0 ? goalDiff : -goalDiff
          if (favoredGoalDiff < 0) {
            weight *= 0.02 // 98% reduction - upsets extremely rare
          } else if (favoredGoalDiff === 0) {
            weight *= 0.04 // 96% reduction for draws
          } else if (favoredGoalDiff < 2) {
            weight *= 0.6 // Expect convincing wins
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
    
    // Get final match results to set winner and runner-up
    const finalMatch = await KnockoutMatch.findOne({
      tournament: tournamentId,
      round: 'final',
      status: 'completed'
    }).populate('winner loser homeTeam awayTeam')
    
    console.log('🔍 Final match data:', {
      exists: !!finalMatch,
      winner: finalMatch?.winner,
      loser: finalMatch?.loser,
      homeTeam: finalMatch?.homeTeam,
      awayTeam: finalMatch?.awayTeam,
      score: finalMatch ? `${finalMatch.homeScore}-${finalMatch.awayScore}` : 'N/A'
    })
    
    if (finalMatch && finalMatch.winner && finalMatch.loser) {
      // Set winner and runner-up matching the Tournament schema
      tournament.winner = {
        name: finalMatch.winner.countryName || finalMatch.winner.name || finalMatch.winner.country,
        code: finalMatch.winner.countryCode || finalMatch.winner.code,
        flag: finalMatch.winner.countryFlag || finalMatch.winner.flag || '🏆'
      }
      
      tournament.runnerUp = {
        name: finalMatch.loser.countryName || finalMatch.loser.name || finalMatch.loser.country,
        code: finalMatch.loser.countryCode || finalMatch.loser.code,
        flag: finalMatch.loser.countryFlag || finalMatch.loser.flag || '🥈'
      }
      
      // Set final score
      tournament.finalScore = `${finalMatch.homeScore}-${finalMatch.awayScore}`
      
      console.log('🏆 Tournament completion data set:', {
        winner: tournament.winner,
        runnerUp: tournament.runnerUp,
        finalScore: tournament.finalScore,
        finalMatchData: {
          winnerId: finalMatch.winner._id,
          loserId: finalMatch.loser._id,
          homeScore: finalMatch.homeScore,
          awayScore: finalMatch.awayScore
        }
      })
    } else {
      console.error('❌ Final match or winner/loser data missing:', {
        finalMatchExists: !!finalMatch,
        winnerExists: finalMatch?.winner ? true : false,
        loserExists: finalMatch?.loser ? true : false
      })
    }
    
    tournament.status = 'completed'
    tournament.completedAt = new Date()
    
    // Calculate and set MVP before saving
    const mvpPlayer = await this.calculateMVP(tournamentId)
    if (mvpPlayer) {
      // Safety check for player data
      if (!mvpPlayer.player) {
        console.error('🏆 MVP player data is missing! Attempting to fetch player directly...')
        
        // Try to fetch player data directly
        const Player = (await import('../models/Player.js')).default
        const playerId = mvpPlayer.player || (mvpPlayer._id ? mvpPlayer.player : null)
        
        if (playerId) {
          const playerData = await Player.findById(playerId)
          if (playerData) {
            console.log('🏆 Successfully fetched player data:', playerData.displayName)
            mvpPlayer.player = playerData
          }
        }
      }
      
      if (mvpPlayer.player && mvpPlayer.player.displayName) {
      
      tournament.mvp = {
        playerId: mvpPlayer.player._id || mvpPlayer.player,
        playerName: mvpPlayer.player.displayName || 'Unknown Player',
        teamId: mvpPlayer.player.teamId || 'Unknown Team',
        nationality: mvpPlayer.player.nationality || 'Unknown',
        position: mvpPlayer.player.position || mvpPlayer.player.detailedPosition || 'Unknown',
        goals: mvpPlayer.goals || 0,
        assists: mvpPlayer.assists || 0,
        averageRating: mvpPlayer.averageRating || 0,
        matchesPlayed: mvpPlayer.matchesPlayed || 0
      }
      console.log('🏆 MVP calculated:', tournament.mvp)
      console.log('🏆 Raw MVP player data:', {
        mvpPlayer: mvpPlayer,
        playerExists: !!mvpPlayer.player,
        playerDetails: mvpPlayer.player
      })
      }
    }
    
    const savedTournament = await tournament.save()
    
    console.log('✅ Tournament completed and saved with results:', {
      id: savedTournament._id,
      winner: savedTournament.winner,
      runnerUp: savedTournament.runnerUp,
      finalScore: savedTournament.finalScore,
      status: savedTournament.status
    })
    
    // Trigger rankings update if this is a world tournament
    if (tournament.worldId && tournament.winner && tournament.runnerUp) {
      console.log('🌍 Tournament linked to world, updating rankings...')
      const WorldRankingService = await import('./WorldRankingService.js')
      
      try {
        // Generate tournament results
        const tournamentResults = WorldRankingService.default.generateMockTournamentResults(
          tournament.year || new Date().getFullYear(),
          tournament.winner,
          tournament.runnerUp,
          tournament.hostCountry
        )
        
        // Extract qualification results if tournament had qualification
        let qualificationResults = []
        if (tournament.type === 'qualification') {
          console.log('📊 Extracting qualification results for ranking update...')
          // Find qualification by tournamentId
          const Qualification = await import('../models/Qualification.js')
          const qualification = await Qualification.default.findOne({ tournament: tournamentId })
          if (qualification) {
            qualificationResults = await WorldRankingService.default.extractQualificationResults(qualification._id)
          }
        }
        
        // Update rankings with both tournament and qualification results
        await WorldRankingService.default.updateRankingsAfterTournament(
          tournament.worldId, 
          tournamentResults,
          qualificationResults
        )
        console.log('✅ Rankings updated successfully after tournament completion')
      } catch (rankingError) {
        console.error('❌ Error updating rankings:', rankingError)
      }
    }
  }

  async simulateRound(tournamentId, round) {
    const matches = await KnockoutMatch.find({
      tournament: tournamentId,
      round,
      status: 'ready'
    })

    const simulatedMatches = []
    for (const match of matches) {
      console.log(`🏆 ROUND SIM: Simulating match ${match._id} with enhanced details`)
      
      // First simulate the basic knockout match 
      const simulatedMatch = await this.simulateKnockoutMatch(match._id)
      
      // Now run enhanced simulation to create detailed match data (same as individual match route)
      try {
        console.log('🏆 ROUND SIM: Starting enhanced simulation')
        
        // Import BasicEnhancedMatchService
        const BasicEnhancedMatchService = (await import('./BasicEnhancedMatchService.js')).default
        const Tournament = (await import('../models/Tournament.js')).default
        
        // Get tournament and world info
        const tournament = await Tournament.findById(tournamentId)
        const world = tournament?.worldId ? { _id: tournament.worldId } : null
        
        // Create a properly structured match object for enhanced simulation
        const enhancedMatch = {
          _id: simulatedMatch._id,
          tournament: tournamentId,
          homeTeam: {
            countryCode: simulatedMatch.homeTeam.countryCode,
            name: simulatedMatch.homeTeam.countryName || simulatedMatch.homeTeam.name,
            code: simulatedMatch.homeTeam.countryCode
          },
          awayTeam: {
            countryCode: simulatedMatch.awayTeam.countryCode,
            name: simulatedMatch.awayTeam.countryName || simulatedMatch.awayTeam.name,
            code: simulatedMatch.awayTeam.countryCode
          },
          homeScore: simulatedMatch.homeScore,
          awayScore: simulatedMatch.awayScore,
          status: 'completed',
          city: simulatedMatch.city
        }
        
        await BasicEnhancedMatchService.simulateBasicMatchDetails(enhancedMatch, 'tournament', world)
        console.log(`🏆 ROUND SIM: Enhanced simulation completed for match ${match._id}`)
      } catch (enhancedError) {
        console.error('🏆 ROUND SIM: Enhanced simulation failed:', enhancedError.message)
        // Continue even if enhanced simulation fails
      }
      
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

  async calculateMVP(tournamentId) {
    try {
      const PlayerStats = (await import('../models/PlayerStats.js')).default
      
      console.log('🏆 Calculating MVP for tournament:', tournamentId)
      
      // Get all player stats for this tournament
      const allPlayerStats = await PlayerStats.find({
        tournamentId: tournamentId,
        competitionType: 'tournament',
        matchesPlayed: { $gte: 1 } // Must have played at least one match
      }).populate('player', 'displayName teamId nationality position detailedPosition')
      
      if (!allPlayerStats || allPlayerStats.length === 0) {
        console.log('🏆 No player stats found for MVP calculation')
        return null
      }
      
      console.log(`🏆 Found ${allPlayerStats.length} players for MVP consideration`)
      
      // Enhanced MVP calculation formula considering:
      // 1. Individual performance (rating, goals, assists)
      // 2. Team progression (how far their team went)
      // 3. Position-specific contributions
      
      // First, calculate team achievements for each team
      const teamAchievements = await this.calculateTeamAchievements(tournamentId)
      
      let topMVPCandidate = null
      let highestScore = 0
      
      for (const playerStat of allPlayerStats) {
        if (!playerStat.player) continue
        
        const goals = playerStat.goals || 0
        const assists = playerStat.assists || 0
        const rating = playerStat.averageRating || 0
        const matches = playerStat.matchesPlayed || 0
        const teamId = playerStat.player.teamId
        
        // Base performance score (rating is now primary factor)
        let performanceScore = (rating * 15) + (goals * 8) + (assists * 5) + (matches * 1)
        
        // Team progression multiplier based on how far the team went
        const teamAchievement = teamAchievements[teamId] || { stage: 'Group stage', multiplier: 1.0 }
        let progressionMultiplier = teamAchievement.multiplier
        
        // Position-specific bonuses
        let positionBonus = 0
        if (playerStat.player.position === 'Goalkeeper' && playerStat.cleanSheets) {
          positionBonus = playerStat.cleanSheets * 12 // Goalkeeper clean sheets very valuable
        } else if (playerStat.tacklesWon || playerStat.interceptions) {
          positionBonus = ((playerStat.tacklesWon || 0) + (playerStat.interceptions || 0)) * 2 // Defensive contributions
        }
        
        // Final MVP score: Performance × Team Success + Position Bonus
        let mvpScore = (performanceScore * progressionMultiplier) + positionBonus
        
        // Normalize score based on matches played to avoid penalizing players from teams eliminated early
        if (matches > 0) {
          mvpScore = mvpScore * Math.min(1.2, matches / 7) // Cap bonus, normalize for tournament length
        }
        
        console.log(`🏆 MVP candidate: ${playerStat.player.displayName} - Score: ${mvpScore.toFixed(2)} (Performance: ${performanceScore.toFixed(1)}, Team: ${teamAchievement.stage}, Multiplier: ${progressionMultiplier}x, Goals: ${goals}, Rating: ${rating.toFixed(2)})`)
        console.log(`🏆 MVP candidate details:`, {
          playerId: playerStat.player._id,
          playerName: playerStat.player.displayName,
          teamId: playerStat.player.teamId,
          nationality: playerStat.player.nationality,
          position: playerStat.player.position
        })
        
        if (mvpScore > highestScore) {
          highestScore = mvpScore
          topMVPCandidate = {
            ...playerStat.toObject(),
            mvpScore: mvpScore
          }
        }
      }
      
      if (topMVPCandidate) {
        console.log(`🏆 MVP Winner: ${topMVPCandidate.player?.displayName || 'Unknown'} with score ${highestScore.toFixed(2)}`)
        
        // If player data is missing, try to fetch it directly
        if (!topMVPCandidate.player || !topMVPCandidate.player.displayName) {
          console.log('🏆 Player data missing, attempting to fetch directly...')
          const Player = (await import('../models/Player.js')).default
          const playerData = await Player.findById(topMVPCandidate.player?._id || topMVPCandidate.player)
          
          if (playerData) {
            console.log('🏆 Found player data directly:', playerData.displayName)
            topMVPCandidate.player = playerData
          } else {
            console.log('🏆 Could not find player data at all')
          }
        }
        
        return topMVPCandidate
      }
      
      return null
    } catch (error) {
      console.error('Error calculating MVP:', error)
      return null
    }
  }

  async calculateTeamAchievements(tournamentId) {
    try {
      console.log('🏆 Calculating team achievements for tournament:', tournamentId)
      
      // Get tournament final results
      const Tournament = (await import('../models/Tournament.js')).default
      const KnockoutMatch = (await import('../models/KnockoutMatch.js')).default
      const Standing = (await import('../models/Standing.js')).default
      
      const tournament = await Tournament.findById(tournamentId)
      if (!tournament) return {}
      
      const teamAchievements = {}
      
      // Initialize all teams with group stage achievement
      const standings = await Standing.find({ tournament: tournamentId }).populate('team')
      for (const standing of standings) {
        if (standing.team && standing.team.teamId) {
          teamAchievements[standing.team.teamId] = { stage: 'Group stage', multiplier: 1.0 }
        }
      }
      
      // Get knockout matches to determine progression
      const knockoutMatches = await KnockoutMatch.find({ 
        tournament: tournamentId, 
        status: 'completed' 
      }).populate('homeTeam awayTeam winner loser')
      
      // Analyze knockout progression
      const rounds = ['round16', 'quarterfinal', 'semifinal', 'third_place', 'final']
      const roundMultipliers = {
        'round16': 1.2,        // Made it to Round of 16
        'quarterfinal': 1.4,   // Made it to Quarter-finals
        'semifinal': 1.7,      // Made it to Semi-finals
        'third_place': 1.9,    // Played in 3rd place playoff
        'final': 2.2           // Made it to Final
      }
      
      const roundNames = {
        'round16': 'Round of 16',
        'quarterfinal': 'Quarter-finals',
        'semifinal': 'Semi-finals',
        'third_place': 'Third place playoff',
        'final': 'Final'
      }
      
      for (const round of rounds) {
        const roundMatches = knockoutMatches.filter(m => m.round === round)
        
        for (const match of roundMatches) {
          // Both teams that played in this round reached this stage
          const homeTeamId = this.extractTeamId(match.homeTeam)
          const awayTeamId = this.extractTeamId(match.awayTeam)
          
          if (homeTeamId && roundMultipliers[round] > (teamAchievements[homeTeamId]?.multiplier || 0)) {
            teamAchievements[homeTeamId] = { 
              stage: roundNames[round], 
              multiplier: roundMultipliers[round] 
            }
          }
          
          if (awayTeamId && roundMultipliers[round] > (teamAchievements[awayTeamId]?.multiplier || 0)) {
            teamAchievements[awayTeamId] = { 
              stage: roundNames[round], 
              multiplier: roundMultipliers[round] 
            }
          }
        }
      }
      
      // Special bonuses for tournament winner and runner-up
      if (tournament.winner && tournament.winner.code) {
        const winnerTeamId = tournament.winner.code
        teamAchievements[winnerTeamId] = { stage: 'Winner', multiplier: 2.5 }
      }
      
      if (tournament.runnerUp && tournament.runnerUp.code) {
        const runnerUpTeamId = tournament.runnerUp.code
        if (!teamAchievements[runnerUpTeamId] || teamAchievements[runnerUpTeamId].multiplier < 2.3) {
          teamAchievements[runnerUpTeamId] = { stage: 'Runner-up', multiplier: 2.3 }
        }
      }
      
      console.log('🏆 Team achievements calculated:', teamAchievements)
      return teamAchievements
      
    } catch (error) {
      console.error('Error calculating team achievements:', error)
      return {}
    }
  }

  extractTeamId(team) {
    if (!team) return null
    
    // Handle different team ID formats
    if (team.teamId && team.teamId.includes('_')) {
      return team.teamId.split('_')[1] // Extract from "CONF_COUNTRY" format
    }
    
    return team.code || team.countryCode || team.teamId || team.country || team.name
  }

  /**
   * Update player statistics after a knockout match
   */
  async updatePlayerStatsForMatch(match, result) {
    try {
      // Get tournament info
      const tournament = await Tournament.findById(match.tournament)
      if (!tournament || !tournament.worldId) {
        console.log('Skipping player stats update - not a world tournament')
        return
      }

      // Get all players from both teams (basic implementation - all starting players get +1 cap)
      const homeTeamPlayers = await PlayerGenerationService.getTeamPlayers(
        match.homeTeam.code || match.homeTeam.countryCode,
        null, // Get world-level players
        tournament.worldId.toString()
      )

      const awayTeamPlayers = await PlayerGenerationService.getTeamPlayers(
        match.awayTeam.code || match.awayTeam.countryCode,
        null, // Get world-level players
        tournament.worldId.toString()
      )

      // Simulate basic goal distribution (this is a simplified approach)
      const homeGoals = (result.homeScore || 0) + (result.homeExtraTimeScore || 0)
      const awayGoals = (result.awayScore || 0) + (result.awayExtraTimeScore || 0)
      
      const goalScorers = {}
      const assistProviders = {}
      
      // Randomly distribute goals to forwards and midfielders (simple simulation)
      if (homeGoals > 0) {
        const homeScorers = homeTeamPlayers.filter(p => ['Forward', 'Midfielder'].includes(p.position))
        for (let i = 0; i < homeGoals; i++) {
          const scorer = homeScorers[Math.floor(Math.random() * homeScorers.length)]
          goalScorers[scorer._id] = (goalScorers[scorer._id] || 0) + 1
        }
      }

      if (awayGoals > 0) {
        const awayScorers = awayTeamPlayers.filter(p => ['Forward', 'Midfielder'].includes(p.position))
        for (let i = 0; i < awayGoals; i++) {
          const scorer = awayScorers[Math.floor(Math.random() * awayScorers.length)]
          goalScorers[scorer._id] = (goalScorers[scorer._id] || 0) + 1
        }
      }

      // Determine clean sheet keeper
      let cleanSheetKeeper = null
      if (awayGoals === 0) {
        const homeKeeper = homeTeamPlayers.find(p => p.position === 'Goalkeeper')
        cleanSheetKeeper = homeKeeper?._id
      } else if (homeGoals === 0) {
        const awayKeeper = awayTeamPlayers.find(p => p.position === 'Goalkeeper')
        cleanSheetKeeper = awayKeeper?._id
      }

      // Update stats for all players (assume starting XI for each team)
      const homePlayerIds = homeTeamPlayers.slice(0, 11).map(p => p._id)
      const awayPlayerIds = awayTeamPlayers.slice(0, 11).map(p => p._id)

      await PlayerStatsUpdateService.updateTeamMatchStats(
        homePlayerIds,
        awayPlayerIds,
        goalScorers,
        assistProviders,
        cleanSheetKeeper,
        tournament.worldId.toString(),
        tournament._id.toString()
      )

      console.log(`✅ Updated player stats for knockout match: ${match.homeTeam.name} vs ${match.awayTeam.name}`)

    } catch (error) {
      console.error('Error updating player stats for knockout match:', error)
    }
  }
}

export default new KnockoutService()