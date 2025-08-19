import TournamentNews from '../models/TournamentNews.js'
import Tournament from '../models/Tournament.js'

class TournamentNewsService {
  
  // Create a news item
  async createNews(tournamentId, type, category, title, message, data = {}, priority = 'medium') {
    try {
      const news = new TournamentNews({
        tournament: tournamentId,
        type,
        category,
        title,
        message,
        data,
        priority
      })
      
      return await news.save()
    } catch (error) {
      console.error('Error creating tournament news:', error)
      throw error
    }
  }

  // Get news for a tournament
  async getNews(tournamentId, options = {}) {
    try {
      const {
        category = null,
        type = null,
        isRead = null,
        limit = 50,
        offset = 0
      } = options

      const query = { tournament: tournamentId }
      
      if (category) query.category = category
      if (type) query.type = type
      if (isRead !== null) query.isRead = isRead

      const news = await TournamentNews.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset)
        .lean()

      return news
    } catch (error) {
      console.error('Error getting tournament news:', error)
      throw error
    }
  }

  // Get unread count
  async getUnreadCount(tournamentId) {
    try {
      return await TournamentNews.countDocuments({
        tournament: tournamentId,
        isRead: false
      })
    } catch (error) {
      console.error('Error getting unread count:', error)
      throw error
    }
  }

  // Mark news as read
  async markAsRead(newsId) {
    try {
      return await TournamentNews.findByIdAndUpdate(
        newsId,
        { isRead: true },
        { new: true }
      )
    } catch (error) {
      console.error('Error marking news as read:', error)
      throw error
    }
  }

  // Mark all news as read for a tournament
  async markAllAsRead(tournamentId) {
    try {
      return await TournamentNews.updateMany(
        { tournament: tournamentId, isRead: false },
        { isRead: true }
      )
    } catch (error) {
      console.error('Error marking all news as read:', error)
      throw error
    }
  }

  // Delete old news (keep only last 100 per tournament)
  async cleanupOldNews(tournamentId) {
    try {
      const news = await TournamentNews.find({ tournament: tournamentId })
        .sort({ createdAt: -1 })
        .skip(100)
        .select('_id')

      if (news.length > 0) {
        const idsToDelete = news.map(n => n._id)
        await TournamentNews.deleteMany({ _id: { $in: idsToDelete } })
      }
    } catch (error) {
      console.error('Error cleaning up old news:', error)
    }
  }

  // Stage change notifications
  async notifyStageChange(tournamentId, fromStage, toStage) {
    const stageNames = {
      'draft': 'Draft',
      'team_selection': 'Team Selection',
      'qualification': 'Qualification',
      'qualification_complete': 'Qualification Complete',
      'draw': 'Draw Phase',
      'group_stage': 'Group Stage',
      'knockout': 'Knockout Stage',
      'completed': 'Tournament Complete'
    }

    const title = `Tournament Stage Updated`
    const message = `Tournament has progressed from ${stageNames[fromStage] || fromStage} to ${stageNames[toStage] || toStage}`

    return await this.createNews(
      tournamentId,
      'stage_change',
      'important',
      title,
      message,
      { fromStage, toStage },
      'high'
    )
  }

  // Round completion notifications
  async notifyRoundCompleted(tournamentId, roundType, roundNumber, matchesPlayed) {
    let title, message

    if (roundType === 'qualification') {
      title = `Qualification Completed`
      message = `All qualification matches have been completed. Teams are ready for the main tournament.`
    } else if (roundType === 'group') {
      title = `Matchday ${roundNumber} Completed`
      message = `Matchday ${roundNumber} has been completed with ${matchesPlayed} matches played.`
    } else if (roundType === 'knockout') {
      const roundNames = {
        'round16': 'Round of 16',
        'quarterfinal': 'Quarter-finals',
        'semifinal': 'Semi-finals',
        'final': 'Final'
      }
      title = `${roundNames[roundNumber] || roundNumber} Completed`
      message = `The ${roundNames[roundNumber] || roundNumber} has been completed.`
    }

    return await this.createNews(
      tournamentId,
      'round_completed',
      'important',
      title,
      message,
      { roundType, roundNumber, matchesPlayed },
      'medium'
    )
  }

  // Surprise result notifications
  async notifySurpriseResult(tournamentId, match, homeTeam, awayTeam) {
    const homeRanking = homeTeam.worldRanking || 999
    const awayRanking = awayTeam.worldRanking || 999
    const rankingDiff = Math.abs(homeRanking - awayRanking)

    const higherRankedTeam = homeRanking < awayRanking ? homeTeam : awayTeam
    const lowerRankedTeam = homeRanking < awayRanking ? awayTeam : homeTeam
    const higherRankedScore = homeRanking < awayRanking ? match.homeScore : match.awayScore
    const lowerRankedScore = homeRanking < awayRanking ? match.awayScore : match.homeScore

    // Case 1: Lower ranked team wins (50+ positions difference)
    if (rankingDiff >= 50 && lowerRankedScore > higherRankedScore) {
      const title = `Major Upset!`
      const message = `${lowerRankedTeam.countryName} (World Rank #${lowerRankedTeam.worldRanking}) defeated ${higherRankedTeam.countryName} (World Rank #${higherRankedTeam.worldRanking}) ${lowerRankedScore}-${higherRankedScore}!`

      return await this.createNews(
        tournamentId,
        'surprise_result',
        'results',
        title,
        message,
        { 
          matchId: match._id,
          winner: lowerRankedTeam.countryName,
          loser: higherRankedTeam.countryName,
          score: `${lowerRankedScore}-${higherRankedScore}`,
          rankingDiff,
          type: 'upset_win'
        },
        'high'
      )
    }

    // Case 2: Draw between teams with 80+ positions difference
    if (rankingDiff >= 80 && higherRankedScore === lowerRankedScore) {
      const title = `Surprising Draw!`
      const message = `${lowerRankedTeam.countryName} (World Rank #${lowerRankedTeam.worldRanking}) held ${higherRankedTeam.countryName} (World Rank #${higherRankedTeam.worldRanking}) to a ${higherRankedScore}-${lowerRankedScore} draw!`

      return await this.createNews(
        tournamentId,
        'surprise_result',
        'results',
        title,
        message,
        { 
          matchId: match._id,
          higherRanked: higherRankedTeam.countryName,
          lowerRanked: lowerRankedTeam.countryName,
          score: `${higherRankedScore}-${lowerRankedScore}`,
          rankingDiff,
          type: 'surprising_draw'
        },
        'high'
      )
    }
  }

  // High scoring match notifications
  async notifyHighScoringMatch(tournamentId, match, homeTeam, awayTeam) {
    const totalGoals = (match.homeScore || 0) + (match.awayScore || 0)

    if (totalGoals >= 6) { // 6+ goals is considered high scoring
      const title = `Goal Fest!`
      const message = `${homeTeam.countryName} vs ${awayTeam.countryName} ended ${match.homeScore}-${match.awayScore} with ${totalGoals} goals!`

      return await this.createNews(
        tournamentId,
        'high_scoring',
        'results',
        title,
        message,
        { 
          matchId: match._id,
          homeTeam: homeTeam.countryName,
          awayTeam: awayTeam.countryName,
          score: `${match.homeScore}-${match.awayScore}`,
          totalGoals
        },
        'medium'
      )
    }
  }

  // Milestone notifications
  async notifyMilestone(tournamentId, milestoneType, data) {
    let title, message, category = 'milestones'

    switch (milestoneType) {
      case 'tournament_started':
        title = 'Tournament Started!'
        message = 'The World Cup tournament has officially begun!'
        category = 'important'
        break
      case 'group_stage_complete':
        title = 'Group Stage Complete'
        message = 'The group stage has concluded. Knockout phase is ready to begin!'
        category = 'important'
        break
      case 'semifinals_reached':
        title = 'Semi-finals Reached'
        message = 'The final four teams have been determined!'
        category = 'important'
        break
      case 'final_reached':
        title = 'Final Set'
        message = 'The two finalists have been determined!'
        category = 'important'
        break
      case 'tournament_complete':
        title = 'Tournament Complete!'
        message = `Congratulations to ${data.winner}! The World Cup has concluded.`
        category = 'important'
        break
      case 'qualification_complete':
        title = `${data.confederation} Qualification Complete!`
        message = `${data.confederation} has completed all qualification matches. ${data.qualifiedTeams} teams have qualified for the World Cup.`
        category = 'important'
        break
      default:
        title = 'Tournament Milestone'
        message = 'A tournament milestone has been reached.'
    }

    return await this.createNews(
      tournamentId,
      'milestone',
      category,
      title,
      message,
      data,
      'high'
    )
  }

  // Process match for automatic news generation
  async processMatchResult(tournamentId, match, homeTeam, awayTeam) {
    try {
      // Normalize match data for both group stage and knockout matches
      const normalizedMatch = this.normalizeMatchData(match, homeTeam, awayTeam)
      
      // Check for surprise results
      await this.notifySurpriseResult(tournamentId, normalizedMatch, normalizedMatch.homeTeam, normalizedMatch.awayTeam)
      
      // Check for high scoring matches
      await this.notifyHighScoringMatch(tournamentId, normalizedMatch, normalizedMatch.homeTeam, normalizedMatch.awayTeam)
      
    } catch (error) {
      console.error('Error processing match result for news:', error)
    }
  }

  // Normalize match data to handle both group stage and knockout matches
  normalizeMatchData(match, team1, team2) {
    // Check if this is a knockout match (has team1Goals) or group stage match (has homeScore)
    const isKnockoutMatch = match.team1Goals !== undefined
    
    if (isKnockoutMatch) {
      return {
        _id: match._id,
        homeScore: match.team1Goals,
        awayScore: match.team2Goals,
        homeTeam: team1,
        awayTeam: team2,
        tournament: match.tournament
      }
    } else {
      return {
        _id: match._id,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        homeTeam: team1,
        awayTeam: team2,
        tournament: match.tournament
      }
    }
  }
}

export default new TournamentNewsService()