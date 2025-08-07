import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import Tournament from '../models/Tournament.js'
import Standing from '../models/Standing.js'
import KnockoutMatch from '../models/KnockoutMatch.js'

const router = express.Router()

// Get tournament history for a country within a world (generated dynamically from existing data)
router.get('/:countryCode/tournament-history', authenticateToken, async (req, res) => {
  try {
    const { countryCode } = req.params
    const { worldId } = req.query

    console.log(`📚 HISTORY: Getting tournament history for ${countryCode}${worldId ? ` in world ${worldId}` : ''}`)

    if (!worldId) {
      return res.status(400).json({ 
        error: 'World ID is required for tournament history' 
      })
    }

    // Get all tournaments in this world first
    const allTournaments = await Tournament.find({
      worldId: worldId
    }).sort({ year: -1 })

    console.log(`📚 HISTORY: Found ${allTournaments.length} tournaments in world`)
    console.log(`📚 HISTORY: Tournament details:`, allTournaments.map(t => ({ 
      name: t.name, 
      year: t.year, 
      status: t.status,
      hostCountryCode: t.hostCountryCode,
      qualifiedTeamsCount: t.qualifiedTeams?.length || 0
    })))

    const tournaments = []

    // Process each tournament to calculate achievements dynamically
    for (const tournament of allTournaments) {
      console.log(`📚 HISTORY: Processing tournament ${tournament.name} (${tournament.year})`)
      console.log(`📚 HISTORY: Status: ${tournament.status}, Qualified teams: ${tournament.qualifiedTeams?.length || 0}`)
      
      // Check if country participated
      const isHost = tournament.hostCountryCode === countryCode.toUpperCase()
      
      // Check if country was in qualified teams - be more flexible with matching
      let isQualified = false
      const upperCountry = countryCode.toUpperCase()
      
      if (tournament.qualifiedTeams && tournament.qualifiedTeams.length > 0) {
        isQualified = tournament.qualifiedTeams.some(team => {
          // Extract country code from various formats
          let teamCountryCode = null
          
          // If teamId has format "CONF_COUNTRY", extract country part
          if (team.teamId && team.teamId.includes('_')) {
            teamCountryCode = team.teamId.split('_')[1]
          } else {
            teamCountryCode = team.code || team.teamId || team.country || team.name
          }
          
          // Normalize and compare
          if (teamCountryCode) {
            teamCountryCode = teamCountryCode.toUpperCase()
            const matches = teamCountryCode === upperCountry
            if (matches) {
              console.log(`📚 HISTORY: Found ${countryCode} in qualified teams:`, team)
            }
            return matches
          }
          return false
        })
      }
      
      console.log(`📚 HISTORY: Country ${countryCode} - isHost: ${isHost}, isQualified: ${isQualified}`)
      
      // Determine achievement
      let achievement = 'Did not qualify'
      let finalPosition = null
      
      if (isHost || isQualified) {
        // Fetch tournament data to determine how far the team went
        const [knockoutMatches, standings] = await Promise.all([
          KnockoutMatch.find({ tournament: tournament._id }).populate('winner loser homeTeam awayTeam'),
          Standing.find({ tournament: tournament._id }).populate('team')
        ])
        
        console.log(`📚 HISTORY: Found ${knockoutMatches.length} knockout matches and ${standings.length} standings`)
        
        // Determine achievement from match data
        achievement = determineCountryAchievement(upperCountry, tournament, knockoutMatches, standings)
        finalPosition = getFinalPosition(achievement)
        
        console.log(`📚 HISTORY: Achievement for ${countryCode} in ${tournament.name}: ${achievement}`)
      }

      tournaments.push({
        tournamentId: tournament._id,
        tournamentName: tournament.name,
        year: tournament.year,
        hostCountry: tournament.hostCountry,
        hostCountryCode: tournament.hostCountryCode,
        achievement: achievement,
        finalPosition: finalPosition,
        participatedInTournament: isHost || isQualified,
        isWorldTournament: true
      })
    }

    // Calculate statistics - only count tournaments where the team participated
    const participatedTournaments = tournaments.filter(t => t.participatedInTournament)
    
    // Helper function to determine if a team reached at least a certain stage
    const reachedStage = (achievement, targetStage) => {
      const stageHierarchy = {
        'Did not qualify': 0,
        'Group stage ended': 1,
        '1/8 Final ended': 2,
        '1/4 Final ended': 3,
        '4th place': 4,
        '3rd place': 4,
        '2nd place': 4,
        '1st place': 4
      }
      
      const achievementLevel = stageHierarchy[achievement] || 0
      const targetLevel = stageHierarchy[targetStage] || 0
      
      return achievementLevel >= targetLevel
    }
    
    const statistics = {
      totalTournaments: participatedTournaments.length,
      wins: participatedTournaments.filter(t => t.achievement === '1st place').length,
      runnerUps: participatedTournaments.filter(t => t.achievement === '2nd place').length,
      // Count all teams that reached at least semifinals (3rd, 4th, 2nd, 1st place)
      semifinals: participatedTournaments.filter(t => 
        ['3rd place', '4th place', '2nd place', '1st place'].includes(t.achievement)
      ).length,
      // Count all teams that reached at least quarterfinals (1/4 final ended or better)
      quarterFinals: participatedTournaments.filter(t => 
        reachedStage(t.achievement, '1/4 Final ended')
      ).length,
      // Count all teams that reached at least round of 16 (1/8 final ended or better)
      roundOf16: participatedTournaments.filter(t => 
        reachedStage(t.achievement, '1/8 Final ended')
      ).length,
      failedQualification: tournaments.filter(t => t.achievement === 'Did not qualify').length,
      bestResult: getBestResult(participatedTournaments.map(t => ({ achievement: t.achievement })))
    }

    console.log(`📚 HISTORY: Returning ${tournaments.length} tournaments with statistics:`, statistics)

    res.json({
      countryCode: countryCode.toUpperCase(),
      worldId,
      statistics,
      tournaments
    })

  } catch (error) {
    console.error('📚 HISTORY: Error fetching country tournament history:', error)
    console.error('📚 HISTORY: Error stack:', error.stack)
    res.status(500).json({ error: 'Failed to fetch tournament history', details: error.message })
  }
})

// Helper function to determine country's achievement in a tournament
function determineCountryAchievement(countryCode, tournament, knockoutMatches, standings) {
  console.log(`📚 ACHIEVEMENT: Determining achievement for ${countryCode}`)
  console.log(`📚 ACHIEVEMENT: Tournament status: ${tournament.status}`)
  console.log(`📚 ACHIEVEMENT: Found ${knockoutMatches.length} knockout matches`)
  
  // First check if tournament has winner/runner-up directly stored
  if (tournament.status === 'completed' && tournament.winner) {
    console.log(`📚 ACHIEVEMENT: Tournament has winner: ${tournament.winner.name || tournament.winner.code}`)
    if (tournament.winner.code === countryCode || tournament.winner.name === countryCode) {
      return '1st place'
    }
    if (tournament.runnerUp && (tournament.runnerUp.code === countryCode || tournament.runnerUp.name === countryCode)) {
      return '2nd place'
    }
  }
  
  // Helper function to check if a team matches the country code
  const teamMatches = (team) => {
    if (!team) return false
    
    // Extract country code from various formats
    let teamCountryCode = null
    
    // If teamId has format "CONF_COUNTRY", extract country part
    if (team.teamId && typeof team.teamId === 'string' && team.teamId.includes('_')) {
      teamCountryCode = team.teamId.split('_')[1]
    } else {
      teamCountryCode = team.code || team.countryCode || team.teamId || team.country || team.name
    }
    
    // Normalize and compare
    if (teamCountryCode) {
      return teamCountryCode.toUpperCase() === countryCode
    }
    return false
  }

  // Check if won the tournament (final winner)
  const final = knockoutMatches.find(m => m.round === 'final' && m.status === 'completed')
  console.log(`📚 ACHIEVEMENT: Final match:`, final ? { 
    homeTeam: final.homeTeam?.name || final.homeTeam?.countryName,
    awayTeam: final.awayTeam?.name || final.awayTeam?.countryName,
    winner: final.winner?.name || final.winner?.countryName,
    score: `${final.homeScore}-${final.awayScore}`
  } : 'None')
  
  if (final && final.winner && teamMatches(final.winner)) {
    console.log(`📚 ACHIEVEMENT: ${countryCode} won the tournament!`)
    return '1st place'
  }

  // Check if runner-up (lost final)
  if (final && final.status === 'completed') {
    if (teamMatches(final.homeTeam) && !teamMatches(final.winner)) {
      console.log(`📚 ACHIEVEMENT: ${countryCode} was runner-up (lost as home team)`)
      return '2nd place'
    }
    if (teamMatches(final.awayTeam) && !teamMatches(final.winner)) {
      console.log(`📚 ACHIEVEMENT: ${countryCode} was runner-up (lost as away team)`)
      return '2nd place'
    }
  }

  // Check third place playoff
  const thirdPlace = knockoutMatches.find(m => m.round === 'third_place' && m.status === 'completed')
  if (thirdPlace) {
    if (teamMatches(thirdPlace.winner)) {
      console.log(`📚 ACHIEVEMENT: ${countryCode} finished 3rd place`)
      return '3rd place'
    }
    if ((teamMatches(thirdPlace.homeTeam) || teamMatches(thirdPlace.awayTeam)) && !teamMatches(thirdPlace.winner)) {
      console.log(`📚 ACHIEVEMENT: ${countryCode} finished 4th place`)
      return '4th place'
    }
  }

  // Check semifinal elimination
  const semifinals = knockoutMatches.filter(m => m.round === 'semifinal' && m.status === 'completed')
  console.log(`📚 ACHIEVEMENT: Semifinals:`, semifinals.length)
  
  for (const match of semifinals) {
    if ((teamMatches(match.homeTeam) || teamMatches(match.awayTeam)) && !teamMatches(match.winner)) {
      console.log(`📚 ACHIEVEMENT: ${countryCode} lost in semifinals`)
      // If there's no third place match or they didn't play in it, they're 4th
      if (!thirdPlace || (!teamMatches(thirdPlace.homeTeam) && !teamMatches(thirdPlace.awayTeam))) {
        return '4th place'
      }
    }
  }

  // Check quarterfinal elimination
  const quarterfinals = knockoutMatches.filter(m => m.round === 'quarterfinal' && m.status === 'completed')
  console.log(`📚 ACHIEVEMENT: Quarterfinals:`, quarterfinals.length)
  
  for (const match of quarterfinals) {
    if ((teamMatches(match.homeTeam) || teamMatches(match.awayTeam)) && !teamMatches(match.winner)) {
      console.log(`📚 ACHIEVEMENT: ${countryCode} lost in quarterfinals`)
      return '1/4 Final ended'
    }
  }

  // Check round of 16 elimination
  const round16 = knockoutMatches.filter(m => m.round === 'round16' && m.status === 'completed')
  console.log(`📚 ACHIEVEMENT: Round of 16:`, round16.length)
  
  for (const match of round16) {
    if ((teamMatches(match.homeTeam) || teamMatches(match.awayTeam)) && !teamMatches(match.winner)) {
      console.log(`📚 ACHIEVEMENT: ${countryCode} lost in round of 16`)
      return '1/8 Final ended'
    }
  }

  // Check group standings to see if they advanced or were eliminated
  const teamStanding = standings.find(s => {
    if (!s.team) return false
    
    // Extract country code from team
    let standingCountryCode = null
    if (s.team.teamId && typeof s.team.teamId === 'string' && s.team.teamId.includes('_')) {
      standingCountryCode = s.team.teamId.split('_')[1]
    } else {
      standingCountryCode = s.team.code || s.team.countryCode || s.team.teamId || s.team.country || s.teamName
    }
    
    return standingCountryCode && standingCountryCode.toUpperCase() === countryCode
  })
  
  console.log(`📚 ACHIEVEMENT: Team standing:`, teamStanding)

  // If participated but no knockout matches, ended in group stage
  return 'Group stage ended'
}

// Helper function to get final position number
function getFinalPosition(achievement) {
  switch (achievement) {
    case '1st place': return 1
    case '2nd place': return 2
    case '3rd place': return 3
    case '4th place': return 4
    default: return null
  }
}

// Helper function to determine best result
function getBestResult(history) {
  if (history.length === 0) return 'No tournaments played'
  
  const achievements = history.map(h => h.achievement)
  
  if (achievements.includes('1st place')) return 'Winner'
  if (achievements.includes('2nd place')) return 'Runner-up'
  if (achievements.includes('3rd place')) return 'Third place'
  if (achievements.includes('4th place')) return 'Fourth place'
  if (achievements.includes('1/4 Final ended')) return 'Quarter-finals'
  if (achievements.includes('1/8 Final ended')) return 'Round of 16'
  if (achievements.includes('Group stage ended')) return 'Group stage'
  if (achievements.includes('Qualification ended')) return 'Qualification playoffs'
  
  return 'Did not qualify'
}

export default router