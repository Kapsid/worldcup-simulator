import Qualification from '../models/Qualification.js'
import Tournament from '../models/Tournament.js'
import { confederations } from '../data/confederations.js'
import { countries } from '../data/countries.js'

class QualificationService {
  // Generate teams for each confederation (ALL teams, excluding host)
  generateConfederationTeams(confederationId, hostCountryCode) {
    const confederation = confederations.find(c => c.id === confederationId)
    if (!confederation) return []

    // Get ALL countries from this confederation
    let confederationCountries = countries.filter(country => 
      country.confederation === confederationId
    )

    // Remove host country if it's in this confederation
    if (hostCountryCode) {
      confederationCountries = confederationCountries.filter(
        country => country.code !== hostCountryCode
      )
    }

    // Sort by FIFA ranking (best teams first)
    confederationCountries.sort((a, b) => (a.fifaRanking || 999) - (b.fifaRanking || 999))

    return confederationCountries.map((country, index) => ({
      teamId: `${confederationId}_${country.code}`,
      name: country.name,
      country: country.name,
      flag: country.flag,
      ranking: country.fifaRanking || 999,
      confederationRank: index + 1
    }))
  }

  // Generate groups for a confederation with equal team distribution
  generateConfederationGroups(confederationId, teams) {
    const confederation = confederations.find(c => c.id === confederationId)
    if (!confederation) return []

    const groups = []
    const totalTeams = teams.length

    if (confederation.format === 'single_league') {
      // CONMEBOL: Single league with all teams
      groups.push({
        groupId: `${confederationId}_league`,
        name: 'League Table',
        teams: teams.map(team => ({
          ...team,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0
        }))
      })
    } else {
      // All other confederations: Group stage with EQUAL team distribution
      const qualificationSlots = confederation.qualificationSlots
      const minTeamsPerGroup = 4
      
      // Calculate number of groups to ensure all groups have the same number of teams
      let numGroups, teamsPerGroup
      
      if (confederationId === 'uefa') {
        // UEFA: Respect maximum 7 teams per group
        const maxTeamsPerGroup = 7
        teamsPerGroup = Math.min(maxTeamsPerGroup, Math.ceil(totalTeams / Math.max(1, qualificationSlots)))
        
        // Find number of groups that creates equal distribution
        for (let candidateTeamsPerGroup = teamsPerGroup; candidateTeamsPerGroup >= minTeamsPerGroup; candidateTeamsPerGroup--) {
          if (totalTeams % candidateTeamsPerGroup === 0) {
            // Perfect division
            teamsPerGroup = candidateTeamsPerGroup
            numGroups = totalTeams / candidateTeamsPerGroup
            break
          }
        }
        
        // If no perfect division found, use the closest
        if (!numGroups) {
          teamsPerGroup = Math.min(maxTeamsPerGroup, Math.ceil(totalTeams / Math.ceil(totalTeams / maxTeamsPerGroup)))
          numGroups = Math.ceil(totalTeams / teamsPerGroup)
        }
      } else {
        // Other confederations: Find optimal equal distribution
        // Try different team per group sizes to find one that divides evenly
        for (let candidateTeamsPerGroup = minTeamsPerGroup; candidateTeamsPerGroup <= totalTeams; candidateTeamsPerGroup++) {
          if (totalTeams % candidateTeamsPerGroup === 0) {
            const candidateNumGroups = totalTeams / candidateTeamsPerGroup
            
            // Check if this works with qualification slots
            if (candidateNumGroups <= qualificationSlots) {
              teamsPerGroup = candidateTeamsPerGroup
              numGroups = candidateNumGroups
              break
            }
          }
        }
        
        // If no perfect division found, use the closest to minimum groups
        if (!numGroups) {
          numGroups = Math.min(qualificationSlots, Math.ceil(totalTeams / minTeamsPerGroup))
          teamsPerGroup = Math.ceil(totalTeams / numGroups)
        }
      }
      
      // Create empty groups
      for (let i = 0; i < numGroups; i++) {
        groups.push({
          groupId: `${confederationId}_group_${String.fromCharCode(65 + i)}`,
          name: `Group ${String.fromCharCode(65 + i)}`,
          teams: []
        })
      }

      // Sort teams by FIFA ranking (best teams first)
      const sortedTeams = [...teams].sort((a, b) => (a.ranking || 999) - (b.ranking || 999))
      
      // Simple snake draft distribution for balanced groups
      const distributedTeams = []
      let teamIndex = 0
      
      // First pass: distribute teams in round-robin fashion
      for (let round = 0; round < Math.ceil(totalTeams / numGroups); round++) {
        for (let groupIndex = 0; groupIndex < numGroups && teamIndex < totalTeams; groupIndex++) {
          if (round % 2 === 0) {
            // Even rounds: go left to right (0, 1, 2, 3...)
            distributedTeams[groupIndex] = distributedTeams[groupIndex] || []
            distributedTeams[groupIndex].push(sortedTeams[teamIndex])
          } else {
            // Odd rounds: go right to left (3, 2, 1, 0...) for snake draft
            const snakeIndex = numGroups - 1 - groupIndex
            distributedTeams[snakeIndex] = distributedTeams[snakeIndex] || []
            distributedTeams[snakeIndex].push(sortedTeams[teamIndex])
          }
          teamIndex++
        }
      }
      
      // Add distributed teams to groups
      for (let groupIndex = 0; groupIndex < numGroups; groupIndex++) {
        if (distributedTeams[groupIndex]) {
          for (const team of distributedTeams[groupIndex]) {
            groups[groupIndex].teams.push({
              ...team,
              played: 0,
              won: 0,
              drawn: 0,
              lost: 0,
              goalsFor: 0,
              goalsAgainst: 0,
              goalDifference: 0,
              points: 0
            })
          }
        }
      }

      // Filter out any empty groups
      return groups.filter(group => group.teams.length >= minTeamsPerGroup)
    }

    return groups
  }

  // Generate all matches for all groups with proper round-robin
  generateAllMatches(confederations) {
    const allMatches = []
    
    // First, generate all matches for each confederation and organize by round
    const confederationMatches = {}
    let maxRounds = 0

    for (const confederation of confederations) {
      confederationMatches[confederation.confederationId] = {}
      
      for (const group of confederation.groups) {
        const groupMatches = this.generateAllGroupMatches(
          confederation.confederationId, 
          group
        )
        
        // Organize matches by round
        const matchesByRound = this.organizeMatchesByRound(groupMatches, group.teams.length)
        
        for (const [round, matches] of Object.entries(matchesByRound)) {
          const roundNum = parseInt(round)
          if (!confederationMatches[confederation.confederationId][roundNum]) {
            confederationMatches[confederation.confederationId][roundNum] = []
          }
          confederationMatches[confederation.confederationId][roundNum].push(...matches)
          maxRounds = Math.max(maxRounds, roundNum)
        }
      }
    }

    // Now assign matchdays - each round across all confederations gets a matchday
    for (let round = 1; round <= maxRounds; round++) {
      for (const confederation of confederations) {
        const roundMatches = confederationMatches[confederation.confederationId][round] || []
        
        roundMatches.forEach(match => {
          match.round = round
          match.matchday = round
          allMatches.push(match)
        })
      }
    }

    return allMatches
  }

  // Generate all matches for a single group (complete round-robin)
  generateAllGroupMatches(confederationId, group) {
    const matches = []
    const teams = group.teams
    const n = teams.length

    if (n < 2) return matches

    // Generate all possible matches (complete round-robin)
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const homeTeam = teams[i]
        const awayTeam = teams[j]
        
        matches.push({
          matchId: `${group.groupId}_${homeTeam.teamId}_vs_${awayTeam.teamId}`,
          groupId: group.groupId,
          homeTeam: {
            teamId: homeTeam.teamId,
            name: homeTeam.name,
            country: homeTeam.country,
            flag: homeTeam.flag
          },
          awayTeam: {
            teamId: awayTeam.teamId,
            name: awayTeam.name,
            country: awayTeam.country,
            flag: awayTeam.flag
          },
          homeScore: null,
          awayScore: null,
          played: false,
          date: new Date()
        })
      }
    }

    return matches
  }

  // Organize matches into rounds ensuring each team plays at most once per round
  organizeMatchesByRound(matches, numTeams) {
    const rounds = {}
    const matchesCopy = [...matches]
    let round = 1

    while (matchesCopy.length > 0) {
      rounds[round] = []
      const usedTeams = new Set()

      for (let i = matchesCopy.length - 1; i >= 0; i--) {
        const match = matchesCopy[i]
        const homeTeamId = match.homeTeam.teamId
        const awayTeamId = match.awayTeam.teamId

        // Check if both teams are available for this round
        if (!usedTeams.has(homeTeamId) && !usedTeams.has(awayTeamId)) {
          rounds[round].push(match)
          usedTeams.add(homeTeamId)
          usedTeams.add(awayTeamId)
          matchesCopy.splice(i, 1)
        }
      }

      round++
    }

    return rounds
  }


  // Start qualification for a tournament
  async startQualification(tournamentId) {
    try {
      // Get tournament details to find host country
      const tournament = await Tournament.findById(tournamentId)
      if (!tournament) {
        throw new Error('Tournament not found')
      }

      const hostCountryCode = tournament.hostCountryCode

      // Check if qualification already exists
      let qualification = await Qualification.findOne({ tournament: tournamentId })
      
      if (qualification && qualification.started) {
        throw new Error('Qualification already started for this tournament')
      }

      // Create qualification structure
      const qualificationData = {
        tournament: tournamentId,
        started: true,
        completed: false,
        currentMatchday: 1,
        confederations: [],
        qualifiedTeams: []
      }

      // Generate data for each confederation
      for (const confederation of confederations) {
        const teams = this.generateConfederationTeams(confederation.id, hostCountryCode)
        const groups = this.generateConfederationGroups(confederation.id, teams)
        
        qualificationData.confederations.push({
          confederationId: confederation.id,
          name: confederation.name,
          started: true,
          completed: false,
          currentRound: 1,
          groups: groups,
          matches: [], // Will be populated below
          qualifiedTeams: []
        })
      }

      // Generate all matches with proper matchday scheduling
      const allMatches = this.generateAllMatches(qualificationData.confederations)

      // Assign matches to confederations
      for (const match of allMatches) {
        const confederation = qualificationData.confederations.find(conf => 
          match.groupId.startsWith(conf.confederationId)
        )
        if (confederation) {
          confederation.matches.push(match)
        }
      }

      // Save or update qualification
      if (qualification) {
        qualification = await Qualification.findOneAndUpdate(
          { tournament: tournamentId },
          qualificationData,
          { new: true }
        )
      } else {
        qualification = new Qualification(qualificationData)
        await qualification.save()
      }

      return qualification
    } catch (error) {
      console.error('Error starting qualification:', error)
      throw error
    }
  }

  // Rest of the methods remain the same...
  async getQualificationData(tournamentId) {
    try {
      const qualification = await Qualification.findOne({ tournament: tournamentId })
      return qualification
    } catch (error) {
      console.error('Error getting qualification data:', error)
      throw error
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

  simulateMatch(homeTeam, awayTeam) {
    const homePower = this.calculateTeamPower(homeTeam.ranking)
    const awayPower = this.calculateTeamPower(awayTeam.ranking)
    
    // Calculate power difference (-19 to +19)
    const powerDiff = homePower - awayPower
    
    // Home advantage (+2 power boost)
    const adjustedPowerDiff = powerDiff + 2
    
    // Surprise factor (1% chance, very limited based on power gap)
    let surpriseFactor = 0
    if (Math.random() < 0.01) {
      // Maximum surprise severely limited by power difference
      const maxSurprise = Math.max(2, 8 - Math.abs(powerDiff) / 2)
      surpriseFactor = Math.random() < 0.5 ? -maxSurprise : maxSurprise
    }
    const finalPowerDiff = adjustedPowerDiff + surpriseFactor
    
    // Base outcomes with realistic football scores
    const outcomes = [
      { home: 0, away: 0, weight: 8 },   // Boring draw
      { home: 1, away: 0, weight: 15 },  // Classic 1-0
      { home: 0, away: 1, weight: 15 },  // Away win
      { home: 1, away: 1, weight: 12 },  // Standard draw
      { home: 2, away: 0, weight: 12 },  // Comfortable win
      { home: 0, away: 2, weight: 12 },  // Away dominance
      { home: 2, away: 1, weight: 10 },  // Exciting match
      { home: 1, away: 2, weight: 10 },  // Comeback win
      { home: 3, away: 0, weight: 6 },   // Crushing victory
      { home: 0, away: 3, weight: 6 },   // Away thrashing
      { home: 2, away: 2, weight: 4 },   // High-scoring draw
      { home: 3, away: 1, weight: 4 },   // Dominant display
      { home: 1, away: 3, weight: 4 },   // Away masterclass
      { home: 4, away: 0, weight: 2 },   // Demolition
      { home: 0, away: 4, weight: 2 },   // Away destruction
      { home: 3, away: 2, weight: 2 },   // Thriller
      { home: 2, away: 3, weight: 2 },   // Away thriller
      { home: 4, away: 1, weight: 1 },   // Statement win
      { home: 1, away: 4, weight: 1 },   // Away statement
      { home: 5, away: 0, weight: 0.5 }, // Humiliation
      { home: 0, away: 5, weight: 0.5 }, // Away humiliation
      { home: 3, away: 3, weight: 0.5 }, // Goal fest
      { home: 4, away: 2, weight: 0.5 }, // High-scoring
      { home: 2, away: 4, weight: 0.5 }, // Away goal fest
      // Crazy results (very rare)
      { home: 6, away: 0, weight: 0.1 }, // Historic thrashing
      { home: 0, away: 6, weight: 0.1 }, // Historic away win
      { home: 5, away: 1, weight: 0.1 }, // Demolition job
      { home: 1, away: 5, weight: 0.1 }, // Away demolition
      { home: 4, away: 3, weight: 0.1 }, // Epic encounter
      { home: 3, away: 4, weight: 0.1 }, // Epic away win
      { home: 7, away: 0, weight: 0.05 }, // Legendary result
      { home: 0, away: 7, weight: 0.05 }, // Legendary away win
      { home: 5, away: 2, weight: 0.05 }, // Crazy scoreline
      { home: 2, away: 5, weight: 0.05 }, // Crazy away win
      { home: 4, away: 4, weight: 0.05 }, // Insane draw
      { home: 6, away: 1, weight: 0.02 }, // Unbelievable
      { home: 1, away: 6, weight: 0.02 }, // Unbelievable away
      { home: 8, away: 0, weight: 0.01 }, // Once in a lifetime
      { home: 0, away: 8, weight: 0.01 }  // Historic upset
    ]
    
    // Adjust weights based on power difference
    const adjustedOutcomes = outcomes.map(outcome => {
      let weight = outcome.weight
      const goalDiff = outcome.home - outcome.away
      
      // If home team is stronger, favor home wins
      if (finalPowerDiff > 0) {
        if (goalDiff > 0) {
          weight *= Math.pow(1.2, Math.min(finalPowerDiff, 18)) // Boost home wins significantly
        } else if (goalDiff < 0) {
          weight *= Math.pow(0.8, Math.min(finalPowerDiff, 18)) // Reduce away wins significantly
        } else {
          // Draws become much less likely with bigger power differences
          weight *= Math.pow(0.9, Math.min(finalPowerDiff / 1.5, 12))
        }
      }
      // If away team is stronger, favor away wins
      else if (finalPowerDiff < 0) {
        if (goalDiff < 0) {
          weight *= Math.pow(1.2, Math.min(Math.abs(finalPowerDiff), 18)) // Boost away wins significantly
        } else if (goalDiff > 0) {
          weight *= Math.pow(0.8, Math.min(Math.abs(finalPowerDiff), 18)) // Reduce home wins significantly
        } else {
          // Draws become much less likely with bigger power differences
          weight *= Math.pow(0.9, Math.min(Math.abs(finalPowerDiff) / 1.5, 12))
        }
      }
      
      // For large power differences (>8), heavily favor the stronger team
      if (Math.abs(finalPowerDiff) > 8) {
        const favoredGoalDiff = finalPowerDiff > 0 ? goalDiff : -goalDiff
        if (favoredGoalDiff < 0) {
          // Upset result - make it extremely rare
          weight *= 0.05 // 95% reduction
        } else if (favoredGoalDiff === 0 && Math.abs(goalDiff) === 0) {
          // 0-0 draw with huge power gap - very rare
          weight *= 0.1 // 90% reduction
        } else if (favoredGoalDiff > 0 && favoredGoalDiff < 2) {
          // Small wins when big difference expected - reduce slightly
          weight *= 0.7
        }
        
        // Big power differences should lead to more goals
        const totalGoals = outcome.home + outcome.away
        if (totalGoals >= 4 && favoredGoalDiff > 2) {
          weight *= 1.5 // Increase high-scoring games when favorite dominates
        }
      }
      
      // For extreme power differences (>12), make upsets virtually impossible
      if (Math.abs(finalPowerDiff) > 12) {
        const favoredGoalDiff = finalPowerDiff > 0 ? goalDiff : -goalDiff
        if (favoredGoalDiff < 0) {
          weight *= 0.01 // 99% reduction - almost impossible
        } else if (favoredGoalDiff === 0) {
          weight *= 0.02 // 98% reduction for any draw
        } else if (favoredGoalDiff < 3) {
          // Expect big wins with huge power gaps
          weight *= 0.5
        }
      }
      
      // Big power differences increase chances of big scorelines
      if (Math.abs(finalPowerDiff) > 8) {
        const totalGoals = outcome.home + outcome.away
        if (totalGoals >= 4) {
          weight *= 1.5 // Increase high-scoring games
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

  updateGroupStandings(group, match) {
    const homeTeam = group.teams.find(t => t.teamId === match.homeTeam.teamId)
    const awayTeam = group.teams.find(t => t.teamId === match.awayTeam.teamId)
    
    if (!homeTeam || !awayTeam) return
    
    homeTeam.played += 1
    awayTeam.played += 1
    
    homeTeam.goalsFor += match.homeScore
    homeTeam.goalsAgainst += match.awayScore
    awayTeam.goalsFor += match.awayScore
    awayTeam.goalsAgainst += match.homeScore
    
    homeTeam.goalDifference = homeTeam.goalsFor - homeTeam.goalsAgainst
    awayTeam.goalDifference = awayTeam.goalsFor - awayTeam.goalsAgainst
    
    if (match.homeScore > match.awayScore) {
      homeTeam.won += 1
      homeTeam.points += 3
      awayTeam.lost += 1
    } else if (match.homeScore < match.awayScore) {
      awayTeam.won += 1
      awayTeam.points += 3
      homeTeam.lost += 1
    } else {
      homeTeam.drawn += 1
      awayTeam.drawn += 1
      homeTeam.points += 1
      awayTeam.points += 1
    }
    
    group.teams.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
      return b.goalsFor - a.goalsFor
    })
  }

  // Determine qualified teams based on new structure
  determineQualifiedTeams(confederationId, groups) {
    const confederation = confederations.find(c => c.id === confederationId)
    if (!confederation) return []

    const qualifiedTeams = []
    const totalSlots = confederation.qualificationSlots

    // Collect all group winners and runners-up
    const groupResults = []
    
    for (const group of groups) {
      const totalMatches = (group.teams.length * (group.teams.length - 1)) / 2
      const playedMatches = group.teams.reduce((sum, team) => sum + team.played, 0) / 2
      
      if (playedMatches === totalMatches) {
        // Group is complete
        groupResults.push({
          groupId: group.groupId,
          winner: group.teams[0],
          runnerUp: group.teams[1] || null,
          allTeams: group.teams
        })
      }
    }

    // Only proceed if all groups are complete
    if (groupResults.length !== groups.length) {
      return []
    }

    if (confederation.format === 'single_league') {
      // CONMEBOL: Top teams qualify directly
      const leagueTable = groupResults[0].allTeams
      for (let i = 0; i < Math.min(totalSlots, leagueTable.length); i++) {
        qualifiedTeams.push({
          ...leagueTable[i],
          qualificationMethod: 'direct'
        })
      }
    } else {
      // Group stage: Ensure fair qualification distribution
      const winners = groupResults.map(gr => gr.winner).filter(Boolean)
      const runnersUp = groupResults.map(gr => gr.runnerUp).filter(Boolean)
      const numGroups = groupResults.length

      if (numGroups <= totalSlots) {
        // If we have fewer or equal groups than slots, all group winners qualify
        for (const winner of winners) {
          qualifiedTeams.push({
            ...winner,
            qualificationMethod: 'group_winner'
          })
        }

        // Fill remaining slots with best runners-up
        const remainingSlots = totalSlots - winners.length
        if (remainingSlots > 0) {
          runnersUp.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points
            if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
            return b.goalsFor - a.goalsFor
          })

          for (let i = 0; i < Math.min(remainingSlots, runnersUp.length); i++) {
            qualifiedTeams.push({
              ...runnersUp[i],
              qualificationMethod: 'best_runner_up'
            })
          }
        }
      } else {
        // If we have more groups than slots, select best group winners
        winners.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points
          if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
          return b.goalsFor - a.goalsFor
        })

        for (let i = 0; i < Math.min(totalSlots, winners.length); i++) {
          qualifiedTeams.push({
            ...winners[i],
            qualificationMethod: 'group_winner'
          })
        }
      }
    }

    return qualifiedTeams
  }

  // Update confederation status
  updateConfederationStatus(qualification) {
    for (const confederation of qualification.confederations) {
      const qualifiedFromConfederation = this.determineQualifiedTeams(
        confederation.confederationId, 
        confederation.groups
      )
      
      confederation.qualifiedTeams = qualifiedFromConfederation
      
      const totalMatches = confederation.matches.length
      const playedMatches = confederation.matches.filter(m => m.played).length
      confederation.completed = playedMatches === totalMatches && qualifiedFromConfederation.length > 0
      
      const directQualified = qualifiedFromConfederation.filter(t => 
        t.qualificationMethod === 'direct' || 
        t.qualificationMethod === 'group_winner' || 
        t.qualificationMethod === 'best_runner_up'
      )
      
      qualification.qualifiedTeams = qualification.qualifiedTeams.filter(t => 
        t.confederation !== confederation.confederationId
      )
      
      qualification.qualifiedTeams.push(...directQualified.map(team => ({
        ...team,
        confederation: confederation.confederationId
      })))
    }
    
    const allConfederationsComplete = qualification.confederations.every(conf => conf.completed)
    qualification.completed = allConfederationsComplete
  }

  // Simulate next matchday for all confederations
  async simulateNextMatchday(tournamentId) {
    try {
      const qualification = await Qualification.findOne({ tournament: tournamentId })
      if (!qualification || !qualification.started) {
        throw new Error('Qualification not started')
      }

      const currentMatchday = qualification.currentMatchday
      let matchesPlayed = 0

      for (const confederation of qualification.confederations) {
        const matchesToPlay = confederation.matches.filter(
          match => match.matchday === currentMatchday && !match.played
        )

        for (const match of matchesToPlay) {
          const result = this.simulateMatch(match.homeTeam, match.awayTeam)
          match.homeScore = result.homeScore
          match.awayScore = result.awayScore
          match.played = true
          
          const group = confederation.groups.find(g => g.groupId === match.groupId)
          if (group) {
            this.updateGroupStandings(group, match)
          }
          
          matchesPlayed++
        }
      }

      if (matchesPlayed > 0) {
        qualification.currentMatchday += 1
      }

      this.updateConfederationStatus(qualification)
      await qualification.save()
      
      return { matchesPlayed, currentMatchday: qualification.currentMatchday }
    } catch (error) {
      console.error('Error simulating matchday:', error)
      throw error
    }
  }

  // Simulate next matchday for a specific confederation
  async simulateNextMatchdayForConfederation(tournamentId, confederationId) {
    try {
      const qualification = await Qualification.findOne({ tournament: tournamentId })
      if (!qualification || !qualification.started) {
        throw new Error('Qualification not started')
      }

      const confederation = qualification.confederations.find(conf => conf.confederationId === confederationId)
      if (!confederation) {
        throw new Error('Confederation not found')
      }

      // Find next matchday for this confederation
      const playedMatchdays = new Set(confederation.matches.filter(m => m.played).map(m => m.matchday))
      const allMatchdays = [...new Set(confederation.matches.map(m => m.matchday))].sort((a, b) => a - b)
      
      let nextMatchday = null
      for (const matchday of allMatchdays) {
        if (!playedMatchdays.has(matchday)) {
          nextMatchday = matchday
          break
        }
      }

      if (!nextMatchday) {
        throw new Error('No more matchdays to simulate for this confederation')
      }

      const matchesToPlay = confederation.matches.filter(
        match => match.matchday === nextMatchday && !match.played
      )

      let matchesPlayed = 0
      for (const match of matchesToPlay) {
        const result = this.simulateMatch(match.homeTeam, match.awayTeam)
        match.homeScore = result.homeScore
        match.awayScore = result.awayScore
        match.played = true
        
        const group = confederation.groups.find(g => g.groupId === match.groupId)
        if (group) {
          this.updateGroupStandings(group, match)
        }
        
        matchesPlayed++
      }

      this.updateConfederationStatus(qualification)
      await qualification.save()
      
      return { 
        matchesPlayed, 
        confederationId, 
        confederationName: confederation.name,
        matchday: nextMatchday
      }
    } catch (error) {
      console.error('Error simulating confederation matchday:', error)
      throw error
    }
  }

  // Simulate individual match
  async simulateIndividualMatch(tournamentId, matchId) {
    try {
      const qualification = await Qualification.findOne({ tournament: tournamentId })
      if (!qualification || !qualification.started) {
        throw new Error('Qualification not started')
      }

      let targetMatch = null
      let targetConfederation = null
      
      for (const confederation of qualification.confederations) {
        const match = confederation.matches.find(m => m.matchId === matchId)
        if (match) {
          targetMatch = match
          targetConfederation = confederation
          break
        }
      }

      if (!targetMatch) {
        throw new Error('Match not found')
      }

      if (targetMatch.played) {
        throw new Error('Match already played')
      }

      const result = this.simulateMatch(targetMatch.homeTeam, targetMatch.awayTeam)
      targetMatch.homeScore = result.homeScore
      targetMatch.awayScore = result.awayScore
      targetMatch.played = true
      
      const group = targetConfederation.groups.find(g => g.groupId === targetMatch.groupId)
      if (group) {
        this.updateGroupStandings(group, targetMatch)
      }

      this.updateConfederationStatus(qualification)
      await qualification.save()
      
      return { match: targetMatch, updated: true }
    } catch (error) {
      console.error('Error simulating individual match:', error)
      throw error
    }
  }

  // Simulate all matches for a confederation
  async simulateAllConfederationMatches(tournamentId, confederationId) {
    try {
      const qualification = await Qualification.findOne({ tournament: tournamentId })
      if (!qualification || !qualification.started) {
        throw new Error('Qualification not started')
      }

      const confederation = qualification.confederations.find(conf => conf.confederationId === confederationId)
      if (!confederation) {
        throw new Error('Confederation not found')
      }

      const unplayedMatches = confederation.matches.filter(match => !match.played)
      let matchesPlayed = 0

      for (const match of unplayedMatches) {
        const result = this.simulateMatch(match.homeTeam, match.awayTeam)
        match.homeScore = result.homeScore
        match.awayScore = result.awayScore
        match.played = true
        
        const group = confederation.groups.find(g => g.groupId === match.groupId)
        if (group) {
          this.updateGroupStandings(group, match)
        }
        
        matchesPlayed++
      }

      this.updateConfederationStatus(qualification)
      await qualification.save()
      
      return { 
        matchesPlayed, 
        confederationId, 
        confederationName: confederation.name,
        completed: confederation.completed
      }
    } catch (error) {
      console.error('Error simulating all confederation matches:', error)
      throw error
    }
  }

  // Regenerate qualification
  async regenerateQualification(tournamentId) {
    try {
      await Qualification.findOneAndDelete({ tournament: tournamentId })
      return await this.startQualification(tournamentId)
    } catch (error) {
      console.error('Error regenerating qualification:', error)
      throw error
    }
  }

  // Finalize qualification
  async finalizeQualification(tournamentId) {
    try {
      const qualification = await Qualification.findOne({ tournament: tournamentId })
      if (!qualification || !qualification.started) {
        throw new Error('Qualification not started')
      }

      const allComplete = qualification.confederations.every(conf => conf.completed)
      if (!allComplete) {
        throw new Error('Not all confederations have completed qualification')
      }

      // Get tournament details to add host country
      const tournament = await Tournament.findById(tournamentId)
      if (!tournament) {
        throw new Error('Tournament not found')
      }

      const qualifiedTeams = []
      
      // Add host country first
      const hostTeam = {
        teamId: `host_${tournament.hostCountryCode}`,
        name: tournament.hostCountry,
        country: tournament.hostCountry,
        flag: tournament.hostCountryFlag || '🏆',
        confederation: 'host',
        qualificationMethod: 'host'
      }
      qualifiedTeams.push(hostTeam)
      
      // Add qualified teams from confederations (only essential data)
      for (const confederation of qualification.confederations) {
        const directQualifiers = confederation.qualifiedTeams
        qualifiedTeams.push(...directQualifiers.map(team => ({
          teamId: team.teamId,
          name: team.name || team.country,
          country: team.country || team.name,
          flag: team.flag,
          confederation: confederation.confederationId,
          qualificationMethod: team.qualificationMethod,
          // Don't include match statistics, played/won/drawn/lost, etc.
        })))
      }

      qualification.completed = true
      qualification.qualifiedTeams = qualifiedTeams
      
      await qualification.save()

      return {
        success: true,
        qualifiedTeams: qualifiedTeams,
        totalQualified: qualifiedTeams.length,
        readyForTournament: true
      }
    } catch (error) {
      console.error('Error finalizing qualification:', error)
      throw error
    }
  }
}

export default new QualificationService()