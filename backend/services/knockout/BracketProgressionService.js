import KnockoutMatch from '../../models/KnockoutMatch.js'
import KnockoutRound from '../../models/KnockoutRound.js'
import Tournament from '../../models/Tournament.js'

class BracketProgressionService {
  // Update next match after a match is completed
  async updateNextMatch(completedMatch) {
    try {
      if (completedMatch.round === 'final') {
        // Tournament is complete
        return await this.completeTournament(completedMatch.tournament)
      }
      
      if (completedMatch.round === 'semifinal') {
        // Update both final and third place match
        await this.updateFinalMatch(completedMatch)
        await this.updateThirdPlaceMatch(completedMatch)
      } else {
        // Update next round match
        await this.updateSubsequentRoundMatch(completedMatch)
      }
      
      // Update round status
      await this.updateRoundStatus(completedMatch.tournament, completedMatch.round)
      
      return true
    } catch (error) {
      throw new Error(`Failed to update next match: ${error.message}`)
    }
  }

  // Update final match with semifinal winners
  async updateFinalMatch(semiMatch) {
    // Get both semifinal matches
    const allSemiMatches = await KnockoutMatch.find({
      tournament: semiMatch.tournament,
      round: 'semifinal',
      played: true
    }).populate('team1 team2 winner')
    
    if (allSemiMatches.length === 2) {
      // Both semifinals complete, set up final
      const finalMatch = await KnockoutMatch.findOne({
        tournament: semiMatch.tournament,
        round: 'final',
        matchNumber: 1
      })
      
      if (finalMatch) {
        const winner1 = allSemiMatches[0].winner
        const winner2 = allSemiMatches[1].winner
        
        finalMatch.team1 = winner1._id
        finalMatch.team2 = winner2._id
        finalMatch.team1Name = winner1.name
        finalMatch.team2Name = winner2.name
        finalMatch.team1Flag = winner1.flag
        finalMatch.team2Flag = winner2.flag
        
        await finalMatch.save()
      }
    }
  }

  // Update third place match with semifinal losers
  async updateThirdPlaceMatch(semiMatch) {
    // Get both semifinal matches
    const allSemiMatches = await KnockoutMatch.find({
      tournament: semiMatch.tournament,
      round: 'semifinal',
      played: true
    }).populate('team1 team2 winner')
    
    if (allSemiMatches.length === 2) {
      // Both semifinals complete, set up third place match
      const thirdPlaceMatch = await KnockoutMatch.findOne({
        tournament: semiMatch.tournament,
        round: 'third_place',
        matchNumber: 1
      })
      
      if (thirdPlaceMatch) {
        // Get the losers from each semifinal
        const loser1 = this.getMatchLoser(allSemiMatches[0])
        const loser2 = this.getMatchLoser(allSemiMatches[1])
        
        thirdPlaceMatch.team1 = loser1._id
        thirdPlaceMatch.team2 = loser2._id
        thirdPlaceMatch.team1Name = loser1.name
        thirdPlaceMatch.team2Name = loser2.name
        thirdPlaceMatch.team1Flag = loser1.flag
        thirdPlaceMatch.team2Flag = loser2.flag
        
        await thirdPlaceMatch.save()
      }
    }
  }

  // Update subsequent round match (quarterfinals, semifinals)
  async updateSubsequentRoundMatch(completedMatch) {
    const nextRoundConfig = this.getNextRoundConfig(completedMatch.round)
    if (!nextRoundConfig) return
    
    // Calculate which match in the next round this winner goes to
    const nextMatchNumber = this.calculateNextMatchNumber(
      completedMatch.round, 
      completedMatch.matchNumber
    )
    
    const nextMatch = await KnockoutMatch.findOne({
      tournament: completedMatch.tournament,
      round: nextRoundConfig.round,
      matchNumber: nextMatchNumber
    })
    
    if (!nextMatch) return
    
    const winner = await this.getMatchWinner(completedMatch)
    if (!winner) return
    
    // Determine if winner goes to team1 or team2 position
    const isFirstTeam = this.shouldBeFirstTeam(completedMatch.round, completedMatch.matchNumber)
    
    if (isFirstTeam) {
      nextMatch.team1 = winner._id
      nextMatch.team1Name = winner.name
      nextMatch.team1Flag = winner.flag
    } else {
      nextMatch.team2 = winner._id
      nextMatch.team2Name = winner.name
      nextMatch.team2Flag = winner.flag
    }
    
    await nextMatch.save()
  }

  // Get match winner
  async getMatchWinner(match) {
    const populatedMatch = await KnockoutMatch.findById(match._id)
      .populate('team1 team2 winner')
    
    return populatedMatch.winner
  }

  // Get match loser
  getMatchLoser(match) {
    if (!match.winner) return null
    
    const winnerId = match.winner._id.toString()
    const team1Id = match.team1._id.toString()
    
    return winnerId === team1Id ? match.team2 : match.team1
  }

  // Get next round configuration
  getNextRoundConfig(currentRound) {
    const roundMapping = {
      'round16': { round: 'quarterfinal', matchCount: 4 },
      'quarterfinal': { round: 'semifinal', matchCount: 2 },
      'semifinal': { round: 'final', matchCount: 1 }
    }
    
    return roundMapping[currentRound]
  }

  // Calculate which match number in next round
  calculateNextMatchNumber(currentRound, currentMatchNumber) {
    if (currentRound === 'round16') {
      // Round of 16 (8 matches) -> Quarterfinals (4 matches)
      return Math.ceil(currentMatchNumber / 2)
    } else if (currentRound === 'quarterfinal') {
      // Quarterfinals (4 matches) -> Semifinals (2 matches)
      return Math.ceil(currentMatchNumber / 2)
    } else if (currentRound === 'semifinal') {
      // Semifinals (2 matches) -> Final (1 match)
      return 1
    }
    
    return 1
  }

  // Determine if winner should be first team in next match
  shouldBeFirstTeam(currentRound, currentMatchNumber) {
    if (currentRound === 'round16') {
      // Odd numbered matches go to team1, even to team2
      return currentMatchNumber % 2 === 1
    } else if (currentRound === 'quarterfinal') {
      // Odd numbered matches go to team1, even to team2
      return currentMatchNumber % 2 === 1
    }
    
    // For semifinals, first semi winner goes to team1, second to team2
    return currentMatchNumber === 1
  }

  // Update round status
  async updateRoundStatus(tournamentId, round) {
    try {
      const roundDoc = await KnockoutRound.findOne({ 
        tournament: tournamentId, 
        round: round 
      })
      
      if (!roundDoc) return
      
      // Check if all matches in this round are complete
      const roundMatches = await KnockoutMatch.find({
        tournament: tournamentId,
        round: round
      })
      
      const allMatchesPlayed = roundMatches.every(match => match.played)
      
      if (allMatchesPlayed && !roundDoc.completed) {
        roundDoc.completed = true
        roundDoc.completedAt = new Date()
        await roundDoc.save()
      }
      
      return roundDoc
    } catch (error) {
      throw new Error(`Failed to update round status: ${error.message}`)
    }
  }

  // Complete tournament
  async completeTournament(tournamentId) {
    try {
      const tournament = await Tournament.findById(tournamentId)
      if (!tournament) {
        throw new Error('Tournament not found')
      }
      
      // Get final match to determine winner
      const finalMatch = await KnockoutMatch.findOne({
        tournament: tournamentId,
        round: 'final',
        played: true
      }).populate('winner')
      
      if (finalMatch && finalMatch.winner) {
        tournament.winner = finalMatch.winner._id
        tournament.status = 'completed'
        tournament.completedAt = new Date()
        await tournament.save()
      }
      
      return tournament
    } catch (error) {
      throw new Error(`Failed to complete tournament: ${error.message}`)
    }
  }

  // Get final results
  async getFinalResults(tournamentId) {
    try {
      const finalMatch = await KnockoutMatch.findOne({
        tournament: tournamentId,
        round: 'final',
        played: true
      }).populate('team1 team2 winner')
      
      const thirdPlaceMatch = await KnockoutMatch.findOne({
        tournament: tournamentId,
        round: 'third_place',
        played: true
      }).populate('team1 team2 winner')
      
      if (!finalMatch) {
        return null
      }
      
      const champion = finalMatch.winner
      const runnerUp = finalMatch.team1._id.toString() === champion._id.toString() ? 
        finalMatch.team2 : finalMatch.team1
      
      let thirdPlace = null
      let fourthPlace = null
      
      if (thirdPlaceMatch) {
        thirdPlace = thirdPlaceMatch.winner
        fourthPlace = thirdPlaceMatch.team1._id.toString() === thirdPlace._id.toString() ? 
          thirdPlaceMatch.team2 : thirdPlaceMatch.team1
      }
      
      return {
        champion,
        runnerUp,
        thirdPlace,
        fourthPlace,
        finalScore: `${finalMatch.team1Goals}-${finalMatch.team2Goals}`,
        finalWentToPenalties: finalMatch.wentToPenalties,
        thirdPlaceScore: thirdPlaceMatch ? `${thirdPlaceMatch.team1Goals}-${thirdPlaceMatch.team2Goals}` : null
      }
    } catch (error) {
      throw new Error(`Failed to get final results: ${error.message}`)
    }
  }

  // Check if round is ready to play
  async isRoundReady(tournamentId, round) {
    const matches = await KnockoutMatch.find({
      tournament: tournamentId,
      round: round
    })
    
    // Check if all matches have both teams assigned
    return matches.every(match => match.team1 && match.team2)
  }

  // Get round progress
  async getRoundProgress(tournamentId, round) {
    const matches = await KnockoutMatch.find({
      tournament: tournamentId,
      round: round
    })
    
    const totalMatches = matches.length
    const playedMatches = matches.filter(m => m.played).length
    const readyMatches = matches.filter(m => m.team1 && m.team2).length
    
    return {
      total: totalMatches,
      played: playedMatches,
      ready: readyMatches,
      percentage: totalMatches > 0 ? (playedMatches / totalMatches) * 100 : 0
    }
  }
}

export default new BracketProgressionService()