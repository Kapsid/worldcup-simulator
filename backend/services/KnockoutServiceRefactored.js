import BracketGenerationService from './knockout/BracketGenerationService.js'
import KnockoutMatchSimulationService from './knockout/KnockoutMatchSimulationService.js'
import BracketProgressionService from './knockout/BracketProgressionService.js'

class KnockoutService {
  // Generate knockout bracket
  async generateKnockoutBracket(tournamentId) {
    try {
      return await BracketGenerationService.generateKnockoutBracket(tournamentId)
    } catch (error) {
      throw new Error(`Failed to generate knockout bracket: ${error.message}`)
    }
  }

  // Get knockout bracket
  async getKnockoutBracket(tournamentId) {
    try {
      return await BracketGenerationService.getKnockoutBracket(tournamentId)
    } catch (error) {
      throw new Error(`Failed to get knockout bracket: ${error.message}`)
    }
  }

  // Simulate knockout match
  async simulateKnockoutMatch(matchId) {
    try {
      const match = await KnockoutMatchSimulationService.simulateKnockoutMatch(matchId)
      
      // Update bracket progression
      await BracketProgressionService.updateNextMatch(match)
      
      return match
    } catch (error) {
      throw new Error(`Failed to simulate knockout match: ${error.message}`)
    }
  }

  // Simulate entire round
  async simulateRound(tournamentId, round) {
    try {
      const results = await KnockoutMatchSimulationService.simulateRound(tournamentId, round)
      
      // Update bracket progression for all completed matches
      for (const match of results) {
        await BracketProgressionService.updateNextMatch(match)
      }
      
      return results
    } catch (error) {
      throw new Error(`Failed to simulate round: ${error.message}`)
    }
  }

  // Get final results
  async getFinalResults(tournamentId) {
    try {
      return await BracketProgressionService.getFinalResults(tournamentId)
    } catch (error) {
      throw new Error(`Failed to get final results: ${error.message}`)
    }
  }

  // Fix existing bracket
  async fixExistingBracket(tournamentId) {
    try {
      return await BracketGenerationService.fixExistingBracket(tournamentId)
    } catch (error) {
      throw new Error(`Failed to fix bracket: ${error.message}`)
    }
  }

  // Check if round is ready
  async isRoundReady(tournamentId, round) {
    try {
      return await BracketProgressionService.isRoundReady(tournamentId, round)
    } catch (error) {
      throw new Error(`Failed to check round readiness: ${error.message}`)
    }
  }

  // Get round progress
  async getRoundProgress(tournamentId, round) {
    try {
      return await BracketProgressionService.getRoundProgress(tournamentId, round)
    } catch (error) {
      throw new Error(`Failed to get round progress: ${error.message}`)
    }
  }

  // Get qualified teams
  async getQualifiedTeams(tournamentId) {
    try {
      return await BracketGenerationService.getQualifiedTeams(tournamentId)
    } catch (error) {
      throw new Error(`Failed to get qualified teams: ${error.message}`)
    }
  }

  // Get match result summary
  getMatchResultSummary(match) {
    return KnockoutMatchSimulationService.getMatchResultSummary(match)
  }

  // Check if penalties are needed
  async checkPenaltiesNeeded(matchId) {
    try {
      return await KnockoutMatchSimulationService.checkPenaltiesNeeded(matchId)
    } catch (error) {
      throw new Error(`Failed to check penalties: ${error.message}`)
    }
  }

  // Get round configuration
  getRoundConfig() {
    return BracketGenerationService.getRoundConfig()
  }

  // Get specific round info
  getRoundInfo(roundName) {
    return BracketGenerationService.getRoundInfo(roundName)
  }

  // Complete tournament
  async completeTournament(tournamentId) {
    try {
      return await BracketProgressionService.completeTournament(tournamentId)
    } catch (error) {
      throw new Error(`Failed to complete tournament: ${error.message}`)
    }
  }

  // Utility method to get all knockout rounds
  getKnockoutRounds() {
    return [
      { round: 'round16', roundNumber: 1, name: 'Round of 16', matchCount: 8 },
      { round: 'quarterfinal', roundNumber: 2, name: 'Quarter-finals', matchCount: 4 },
      { round: 'semifinal', roundNumber: 3, name: 'Semi-finals', matchCount: 2 },
      { round: 'final', roundNumber: 4, name: 'Final', matchCount: 1 },
      { round: 'third_place', roundNumber: 5, name: 'Third Place Play-off', matchCount: 1 }
    ]
  }

  // Get bracket statistics
  async getBracketStatistics(tournamentId) {
    try {
      const bracket = await this.getKnockoutBracket(tournamentId)
      const rounds = this.getKnockoutRounds()
      
      const statistics = {
        totalMatches: 0,
        playedMatches: 0,
        remainingMatches: 0,
        roundProgress: {}
      }
      
      for (const roundInfo of rounds) {
        const roundMatches = bracket.allMatches.filter(m => m.round === roundInfo.round)
        const playedCount = roundMatches.filter(m => m.played).length
        const totalCount = roundMatches.length
        
        statistics.totalMatches += totalCount
        statistics.playedMatches += playedCount
        
        statistics.roundProgress[roundInfo.round] = {
          name: roundInfo.name,
          played: playedCount,
          total: totalCount,
          percentage: totalCount > 0 ? (playedCount / totalCount) * 100 : 0,
          completed: playedCount === totalCount && totalCount > 0
        }
      }
      
      statistics.remainingMatches = statistics.totalMatches - statistics.playedMatches
      statistics.overallProgress = statistics.totalMatches > 0 ? 
        (statistics.playedMatches / statistics.totalMatches) * 100 : 0
      
      return statistics
    } catch (error) {
      throw new Error(`Failed to get bracket statistics: ${error.message}`)
    }
  }
}

export default new KnockoutService()