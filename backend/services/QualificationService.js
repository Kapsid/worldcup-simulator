import Qualification from '../models/Qualification.js'
import Tournament from '../models/Tournament.js'
import { confederations } from '../data/confederations.js'
import { countries } from '../data/countries.js'

// Create a ranking lookup map for faster access
const rankingLookup = new Map()
countries.forEach(country => {
  rankingLookup.set(country.name, country.fifaRanking || 999)
})

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

    return confederationCountries.map((country, index) => {
      const team = {
        teamId: `${confederationId}_${country.code}`,
        name: country.name,
        country: country.name,
        flag: country.flag,
        ranking: country.fifaRanking || 999,
        confederationRank: index + 1
      }
      
      // Debug team generation
      if (Math.random() < 0.01) { // Log 1% of teams
        console.log('Generated team:', team)
      }
      
      return team
    })
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
        // UEFA: Prefer groups of 5-6 teams (more realistic)
        const preferredTeamsPerGroup = [5, 6] // Prefer 5 or 6 teams per group
        const maxTeamsPerGroup = 7
        
        // First try to find perfect division with preferred sizes
        for (const preferred of preferredTeamsPerGroup) {
          if (totalTeams % preferred === 0) {
            teamsPerGroup = preferred
            numGroups = totalTeams / preferred
            break
          }
        }
        
        // If no perfect division with preferred sizes, try all sizes from 5-7
        if (!numGroups) {
          for (let candidateTeamsPerGroup = 5; candidateTeamsPerGroup <= maxTeamsPerGroup; candidateTeamsPerGroup++) {
            if (totalTeams % candidateTeamsPerGroup === 0) {
              teamsPerGroup = candidateTeamsPerGroup
              numGroups = totalTeams / candidateTeamsPerGroup
              break
            }
          }
        }
        
        // If still no perfect division, use 5 or 6 teams per group (whichever gives closer to equal distribution)
        if (!numGroups) {
          const groups5 = Math.ceil(totalTeams / 5)
          const groups6 = Math.ceil(totalTeams / 6)
          
          // Choose the option that minimizes variance in group sizes
          const remainder5 = totalTeams % 5
          const remainder6 = totalTeams % 6
          
          if (remainder6 === 0 || (remainder6 > remainder5 && remainder5 !== 0)) {
            teamsPerGroup = 6
            numGroups = groups6
          } else {
            teamsPerGroup = 5
            numGroups = groups5
          }
        }
      } else if (confederationId === 'ofc') {
        // OFC: Always 2 groups for playoff system
        numGroups = 2
        teamsPerGroup = Math.ceil(totalTeams / 2)
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
      
      // Create pots based on ranking tiers (one pot per "tier" within groups)
      const numPots = teamsPerGroup
      const teamsPerPot = Math.ceil(totalTeams / numPots)
      const pots = []
      
      for (let potIndex = 0; potIndex < numPots; potIndex++) {
        const potStart = potIndex * teamsPerPot
        const potEnd = Math.min(potStart + teamsPerPot, totalTeams)
        const potTeams = sortedTeams.slice(potStart, potEnd)
        
        // Shuffle teams within this pot to randomize group assignments
        const shuffledPot = this.shuffleArray(potTeams)
        pots.push(shuffledPot)
      }
      
      // Distribute teams from shuffled pots using round-robin
      const distributedTeams = Array(numGroups).fill(null).map(() => [])
      
      // For each pot, distribute teams to groups in round-robin fashion
      for (let potIndex = 0; potIndex < pots.length; potIndex++) {
        const pot = pots[potIndex]
        
        for (let teamIndex = 0; teamIndex < pot.length; teamIndex++) {
          const groupIndex = teamIndex % numGroups
          distributedTeams[groupIndex].push(pot[teamIndex])
        }
      }
      
      // Add distributed teams to groups
      for (let groupIndex = 0; groupIndex < numGroups; groupIndex++) {
        if (distributedTeams[groupIndex]) {
          for (const team of distributedTeams[groupIndex]) {
            const groupTeam = {
              ...team,
              played: 0,
              won: 0,
              drawn: 0,
              lost: 0,
              goalsFor: 0,
              goalsAgainst: 0,
              goalDifference: 0,
              points: 0
            }
            
            // Debug group team creation
            if (Math.random() < 0.01) { // Log 1% of group teams
              console.log('Added team to group:', {
                name: groupTeam.name,
                ranking: groupTeam.ranking,
                originalRanking: team.ranking
              })
            }
            
            groups[groupIndex].teams.push(groupTeam)
          }
        }
      }

      // Filter out any empty groups (for UEFA, accept groups with 5+ teams)
      const minRequired = confederationId === 'uefa' ? 5 : minTeamsPerGroup
      return groups.filter(group => group.teams.length >= minRequired)
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

    // Check if this confederation plays home and away matches
    const isDoubleRoundRobin = confederationId === 'uefa' || confederationId === 'conmebol'

    // Generate all possible matches
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const teamA = teams[i]
        const teamB = teams[j]
        
        // First match: teamA at home
        matches.push({
          matchId: `${group.groupId}_${teamA.teamId}_vs_${teamB.teamId}`,
          groupId: group.groupId,
          homeTeam: {
            teamId: teamA.teamId,
            name: teamA.name,
            country: teamA.country,
            flag: teamA.flag,
            ranking: teamA.ranking
          },
          awayTeam: {
            teamId: teamB.teamId,
            name: teamB.name,
            country: teamB.country,
            flag: teamB.flag,
            ranking: teamB.ranking
          },
          homeScore: null,
          awayScore: null,
          played: false,
          date: new Date()
        })

        // For UEFA and CONMEBOL, add the return match
        if (isDoubleRoundRobin) {
          matches.push({
            matchId: `${group.groupId}_${teamB.teamId}_vs_${teamA.teamId}`,
            groupId: group.groupId,
            homeTeam: {
              teamId: teamB.teamId,
              name: teamB.name,
              country: teamB.country,
              flag: teamB.flag,
              ranking: teamB.ranking
            },
            awayTeam: {
              teamId: teamA.teamId,
              name: teamA.name,
              country: teamA.country,
              flag: teamA.flag,
              ranking: teamA.ranking
            },
            homeScore: null,
            awayScore: null,
            played: false,
            date: new Date()
          })
        }
      }
    }

    return matches
  }

  // Organize matches into rounds ensuring balanced distribution using round-robin algorithm
  organizeMatchesByRound(matches, numTeams) {
    if (matches.length === 0) return {}
    
    // Get all unique teams
    const allTeams = new Set()
    matches.forEach(match => {
      allTeams.add(match.homeTeam.teamId)
      allTeams.add(match.awayTeam.teamId)
    })
    const teamIds = Array.from(allTeams)
    const n = teamIds.length
    
    // Create match lookup for quick access
    const matchLookup = new Map()
    matches.forEach(match => {
      const key1 = `${match.homeTeam.teamId}-${match.awayTeam.teamId}`
      const key2 = `${match.awayTeam.teamId}-${match.homeTeam.teamId}`
      matchLookup.set(key1, match)
      matchLookup.set(key2, match)
    })
    
    const rounds = {}
    let round = 1
    
    // Round-robin scheduling using circle method
    if (n % 2 === 1) {
      // Odd number of teams - one team has bye each round
      for (let roundIdx = 0; roundIdx < n; roundIdx++) {
        rounds[round] = []
        
        for (let i = 0; i < Math.floor(n / 2); i++) {
          const team1Idx = (roundIdx + i) % n
          const team2Idx = (roundIdx + n - 1 - i) % n
          
          const team1 = teamIds[team1Idx]
          const team2 = teamIds[team2Idx]
          
          const key = `${team1}-${team2}`
          const match = matchLookup.get(key)
          
          if (match) {
            rounds[round].push(match)
          }
        }
        
        if (rounds[round].length > 0) {
          round++
        }
      }
    } else {
      // Even number of teams - perfect pairing
      for (let roundIdx = 0; roundIdx < n - 1; roundIdx++) {
        rounds[round] = []
        
        for (let i = 0; i < n / 2; i++) {
          let team1Idx, team2Idx
          
          if (i === 0) {
            team1Idx = 0
            team2Idx = roundIdx + 1
          } else {
            team1Idx = (roundIdx + i) % (n - 1) + 1
            team2Idx = (roundIdx + n - 1 - i) % (n - 1) + 1
          }
          
          const team1 = teamIds[team1Idx]
          const team2 = teamIds[team2Idx]
          
          const key = `${team1}-${team2}`
          const match = matchLookup.get(key)
          
          if (match) {
            rounds[round].push(match)
          }
        }
        
        if (rounds[round].length > 0) {
          round++
        }
      }
    }
    
    // Handle any remaining matches that weren't scheduled (e.g., return matches in double round-robin)
    const scheduledMatches = new Set()
    Object.values(rounds).forEach(roundMatches => {
      roundMatches.forEach(match => {
        scheduledMatches.add(match.matchId)
      })
    })
    
    const unscheduledMatches = matches.filter(match => !scheduledMatches.has(match.matchId))
    
    if (unscheduledMatches.length > 0) {
      // Schedule remaining matches using the same round-robin pattern
      const secondRoundStart = round
      
      if (n % 2 === 1) {
        for (let roundIdx = 0; roundIdx < n; roundIdx++) {
          const currentRound = secondRoundStart + roundIdx
          if (!rounds[currentRound]) rounds[currentRound] = []
          
          for (let i = 0; i < Math.floor(n / 2); i++) {
            const team1Idx = (roundIdx + i) % n
            const team2Idx = (roundIdx + n - 1 - i) % n
            
            const team1 = teamIds[team1Idx]
            const team2 = teamIds[team2Idx]
            
            // Look for return match
            const returnMatch = unscheduledMatches.find(match => 
              (match.homeTeam.teamId === team2 && match.awayTeam.teamId === team1) ||
              (match.homeTeam.teamId === team1 && match.awayTeam.teamId === team2)
            )
            
            if (returnMatch) {
              rounds[currentRound].push(returnMatch)
              const index = unscheduledMatches.indexOf(returnMatch)
              unscheduledMatches.splice(index, 1)
            }
          }
        }
      } else {
        for (let roundIdx = 0; roundIdx < n - 1; roundIdx++) {
          const currentRound = secondRoundStart + roundIdx
          if (!rounds[currentRound]) rounds[currentRound] = []
          
          for (let i = 0; i < n / 2; i++) {
            let team1Idx, team2Idx
            
            if (i === 0) {
              team1Idx = 0
              team2Idx = roundIdx + 1
            } else {
              team1Idx = (roundIdx + i) % (n - 1) + 1
              team2Idx = (roundIdx + n - 1 - i) % (n - 1) + 1
            }
            
            const team1 = teamIds[team1Idx]
            const team2 = teamIds[team2Idx]
            
            // Look for return match
            const returnMatch = unscheduledMatches.find(match => 
              (match.homeTeam.teamId === team2 && match.awayTeam.teamId === team1) ||
              (match.homeTeam.teamId === team1 && match.awayTeam.teamId === team2)
            )
            
            if (returnMatch) {
              rounds[currentRound].push(returnMatch)
              const index = unscheduledMatches.indexOf(returnMatch)
              unscheduledMatches.splice(index, 1)
            }
          }
        }
      }
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
        
        const confederationData = {
          confederationId: confederation.id,
          name: confederation.name,
          started: true,
          completed: false,
          currentRound: 1,
          groups: groups,
          matches: [], // Will be populated below
          qualifiedTeams: []
        }


        // Add playoff structure for OFC
        if (confederation.id === 'ofc') {
          confederationData.playoffs = {
            available: false,
            completed: false,
            matches: [],
            winner: null
          }
        }

        qualificationData.confederations.push(confederationData)
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
      
      if (qualification) {
        console.log('getQualificationData: Current confederation status before update:', 
          qualification.confederations.map(conf => ({
            id: conf.confederationId,
            completed: conf.completed,
            totalMatches: conf.matches?.length || 0,
            playedMatches: conf.matches?.filter(m => m.played).length || 0,
            qualifiedCount: conf.qualifiedTeams?.length || 0
          }))
        )
        
        // Always update confederation status when data is requested
        this.updateConfederationStatus(qualification)
        
        // Fix missing OFC team in finalized qualification
        if (qualification.completed) {
          const ofcConfederation = qualification.confederations.find(conf => conf.confederationId === 'ofc')
          console.log('OFC CONFEDERATION DETAILED DEBUG:', {
            ofcExists: !!ofcConfederation,
            hasPlayoffs: ofcConfederation?.playoffs !== undefined,
            playoffCompleted: ofcConfederation?.playoffs?.completed,
            playoffWinner: ofcConfederation?.playoffs?.winner,
            confederationQualifiedTeams: ofcConfederation?.qualifiedTeams,
            globalOFCTeam: qualification.qualifiedTeams.find(t => t.confederation === 'ofc'),
            totalGlobalTeams: qualification.qualifiedTeams.length,
            allGlobalTeams: qualification.qualifiedTeams.map(t => `${t.name} (${t.confederation})`)
          })
          
          if (ofcConfederation && ofcConfederation.playoffs && ofcConfederation.playoffs.completed) {
            const ofcTeamInGlobal = qualification.qualifiedTeams.find(t => t.confederation === 'ofc')
            if (!ofcTeamInGlobal && ofcConfederation.qualifiedTeams && ofcConfederation.qualifiedTeams.length > 0) {
              console.log('FIXING MISSING OFC TEAM IN GLOBAL QUALIFIED LIST')
              const ofcTeam = ofcConfederation.qualifiedTeams[0]
              qualification.qualifiedTeams.push({
                teamId: ofcTeam.teamId,
                name: ofcTeam.name || ofcTeam.country,
                country: ofcTeam.country || ofcTeam.name,
                flag: ofcTeam.flag,
                confederation: 'ofc',
                qualificationMethod: ofcTeam.qualificationMethod
              })
            }
          }
        }
        
        await qualification.save()
        
        console.log('getQualificationData: Current confederation status after update:', 
          qualification.confederations.map(conf => ({
            id: conf.confederationId,
            completed: conf.completed,
            totalMatches: conf.matches?.length || 0,
            playedMatches: conf.matches?.filter(m => m.played).length || 0,
            qualifiedCount: conf.qualifiedTeams?.length || 0
          }))
        )
      }
      
      return qualification
    } catch (error) {
      console.error('Error getting qualification data:', error)
      throw error
    }
  }

  // Convert FIFA ranking to power (1-20 scale)
  calculateTeamPower(fifaRanking) {
    // Handle undefined/null rankings (fallback to worst ranking)
    if (!fifaRanking || fifaRanking === null || fifaRanking === undefined) {
      console.log('WARNING: calculateTeamPower called with invalid ranking:', fifaRanking)
      return 1
    }
    
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
    // Get rankings from lookup if missing from team object
    let homeRanking = homeTeam.ranking || rankingLookup.get(homeTeam.name) || rankingLookup.get(homeTeam.country) || 150
    let awayRanking = awayTeam.ranking || rankingLookup.get(awayTeam.name) || rankingLookup.get(awayTeam.country) || 150
    
    // Debug logging to check rankings
    if (!homeTeam.ranking || !awayTeam.ranking) {
      console.log('Fixed missing rankings in qualifying match:', {
        home: { name: homeTeam.name, oldRanking: homeTeam.ranking, newRanking: homeRanking },
        away: { name: awayTeam.name, oldRanking: awayTeam.ranking, newRanking: awayRanking }
      })
    }
    
    // Additional debug for extreme cases
    if (Math.random() < 0.05) { // Log 5% of matches for debugging
      console.log('Qualifying match sim:', {
        home: `${homeTeam.name} (rank ${homeRanking})`,
        away: `${awayTeam.name} (rank ${awayRanking})`,
      })
    }
    
    const homePower = this.calculateTeamPower(homeRanking)
    const awayPower = this.calculateTeamPower(awayRanking)
    
    // Calculate power difference (-19 to +19)
    const powerDiff = homePower - awayPower
    
    // Debug power calculations occasionally
    if (Math.random() < 0.02) { // Log 2% of matches for power debugging
      console.log('Power calculation:', {
        home: `${homeTeam.name} (rank ${homeRanking} = power ${homePower})`,
        away: `${awayTeam.name} (rank ${awayRanking} = power ${awayPower})`,
        powerDiff
      })
    }
    
    // Home advantage (+2 power boost)
    const adjustedPowerDiff = powerDiff + 2
    
    // Surprise factor for qualifying - MUCH rarer and smaller (0.5% chance instead of 1%)
    let surpriseFactor = 0
    if (Math.random() < 0.005) {
      // Maximum surprise VERY limited for qualifying
      const maxSurprise = Math.max(1, 4 - Math.abs(powerDiff) / 3)
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
      
      // If home team is stronger, favor home wins - VERY MILD for qualifying
      if (finalPowerDiff > 0) {
        if (goalDiff > 0) {
          weight *= Math.pow(1.08, Math.min(finalPowerDiff, 12)) // Very mild boost for favorites in qualifying
        } else if (goalDiff < 0) {
          weight *= Math.pow(0.92, Math.min(finalPowerDiff, 12)) // Very mild reduction for upsets
        } else {
          // Draws become slightly less likely with bigger power differences
          weight *= Math.pow(0.98, Math.min(finalPowerDiff / 2, 8))
        }
      }
      // If away team is stronger, favor away wins - VERY MILD for qualifying
      else if (finalPowerDiff < 0) {
        if (goalDiff < 0) {
          weight *= Math.pow(1.08, Math.min(Math.abs(finalPowerDiff), 12)) // Very mild boost for favorites
        } else if (goalDiff > 0) {
          weight *= Math.pow(0.92, Math.min(Math.abs(finalPowerDiff), 12)) // Very mild reduction for upsets
        } else {
          // Draws become slightly less likely with bigger power differences
          weight *= Math.pow(0.98, Math.min(Math.abs(finalPowerDiff) / 2, 8))
        }
      }
      
      // For medium power differences (>7), start favoring the stronger team in qualifying
      if (Math.abs(finalPowerDiff) > 7 && Math.abs(finalPowerDiff) <= 12) {
        const favoredGoalDiff = finalPowerDiff > 0 ? goalDiff : -goalDiff
        if (favoredGoalDiff < 0) {
          // Upset result - make it less likely but still quite possible
          weight *= 0.85 // 15% reduction (was 25%)
        } else if (favoredGoalDiff === 0 && Math.abs(goalDiff) === 0) {
          // 0-0 draw with decent power gap
          weight *= 0.9 // 10% reduction (was 15%)
        }
      }
      
      // For large power differences (>12), favor the stronger team - MILD for qualifying
      if (Math.abs(finalPowerDiff) > 12) {
        const favoredGoalDiff = finalPowerDiff > 0 ? goalDiff : -goalDiff
        if (favoredGoalDiff < 0) {
          // Upset result - make it less likely but still possible
          weight *= 0.6 // 40% reduction (was 60%)
        } else if (favoredGoalDiff === 0 && Math.abs(goalDiff) === 0) {
          // 0-0 draw with huge power gap - somewhat less likely
          weight *= 0.7 // 30% reduction (was 40%)
        } else if (favoredGoalDiff > 0 && favoredGoalDiff < 2) {
          // Small wins when big difference expected - mild reduction
          weight *= 0.85 // Was 0.8
        }
        
        // Big power differences should lead to more goals
        const totalGoals = outcome.home + outcome.away
        if (totalGoals >= 4 && favoredGoalDiff > 2) {
          weight *= 1.3 // Increase high-scoring games when favorite dominates (was 1.5)
        }
      }
      
      // For extreme power differences (>17), make upsets rare - MODERATE for qualifying
      if (Math.abs(finalPowerDiff) > 17) {
        const favoredGoalDiff = finalPowerDiff > 0 ? goalDiff : -goalDiff
        if (favoredGoalDiff < 0) {
          weight *= 0.35 // 65% reduction - rare but not impossible (was 80%)
        } else if (favoredGoalDiff === 0) {
          weight *= 0.5 // 50% reduction for any draw (was 60%)
        } else if (favoredGoalDiff < 3) {
          // Expect bigger wins with huge power gaps
          weight *= 0.8 // Was 0.7
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

    // OFC uses playoff system - check if playoff is complete
    if (confederationId === 'ofc') {
      // Don't determine qualified teams here - they are set directly in playoff simulation
      // Return empty array to avoid overriding playoff winner
      return []
    }

    const qualifiedTeams = []
    const totalSlots = confederation.qualificationSlots

    // Collect all group winners and runners-up
    const groupResults = []
    
    for (const group of groups) {
      // Check if this confederation plays home and away matches
      const isDoubleRoundRobin = confederationId === 'uefa' || confederationId === 'conmebol'
      
      // Calculate total matches based on format
      const n = group.teams.length
      const totalMatches = isDoubleRoundRobin 
        ? n * (n - 1)  // Each team plays every other team twice
        : (n * (n - 1)) / 2  // Each team plays every other team once
      
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
      console.log(`${confederationId}: Not all groups complete. ${groupResults.length}/${groups.length} groups finished.`)
      return []
    }
    
    console.log(`${confederationId}: All groups complete. Determining qualified teams...`)

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

      if (numGroups >= totalSlots) {
        // If we have enough groups to fill all slots with group winners
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
      } else {
        // If we have fewer groups than slots, all group winners qualify plus best runners-up
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
      }
    }

    console.log(`${confederationId}: Qualified teams determined:`, qualifiedTeams.map(t => `${t.name || t.country} (${t.qualificationMethod})`))
    
    return qualifiedTeams
  }

  // Check and populate OFC playoff matches when groups are complete
  checkAndPopulateOFCPlayoffs(confederation) {
    if (confederation.confederationId !== 'ofc' || !confederation.playoffs) {
      return
    }

    // Skip if already populated
    if (confederation.playoffs.available) {
      return
    }

    // Check if both groups are complete
    const groupWinners = []
    for (const group of confederation.groups) {
      const n = group.teams.length
      const totalMatches = (n * (n - 1)) / 2
      const playedMatches = group.teams.reduce((sum, team) => sum + team.played, 0) / 2
      
      if (playedMatches === totalMatches) {
        // Group is complete, get winner
        const winner = group.teams[0].toObject() // Convert Mongoose subdocument to plain object
        groupWinners.push({
          ...winner,
          groupName: group.name
        })
      }
    }

    if (groupWinners.length === 2) {
      // Both groups complete, create playoff matches
      const [team1, team2] = groupWinners

      confederation.playoffs.matches = [
        {
          matchId: `ofc_playoff_${team1.teamId}_vs_${team2.teamId}_leg1`,
          homeTeam: {
            teamId: team1.teamId,
            name: team1.name,
            country: team1.country,
            flag: team1.flag,
            ranking: team1.ranking
          },
          awayTeam: {
            teamId: team2.teamId,
            name: team2.name,
            country: team2.country,
            flag: team2.flag,
            ranking: team2.ranking
          },
          homeScore: null,
          awayScore: null,
          played: false,
          leg: 1,
          description: 'First Leg'
        },
        {
          matchId: `ofc_playoff_${team2.teamId}_vs_${team1.teamId}_leg2`,
          homeTeam: {
            teamId: team2.teamId,
            name: team2.name,
            country: team2.country,
            flag: team2.flag,
            ranking: team2.ranking
          },
          awayTeam: {
            teamId: team1.teamId,
            name: team1.name,
            country: team1.country,
            flag: team1.flag,
            ranking: team1.ranking
          },
          homeScore: null,
          awayScore: null,
          played: false,
          leg: 2,
          description: 'Second Leg'
        }
      ]

      confederation.playoffs.available = true
    }
  }

  // Update confederation status
  updateConfederationStatus(qualification) {
    for (const confederation of qualification.confederations) {
      // Check and populate OFC playoffs if ready
      this.checkAndPopulateOFCPlayoffs(confederation)
      
      let qualifiedFromConfederation = this.determineQualifiedTeams(
        confederation.confederationId, 
        confederation.groups
      )
      
      const totalMatches = confederation.matches.length
      const playedMatches = confederation.matches.filter(m => m.played).length
      
      // For OFC, also check playoff completion
      if (confederation.confederationId === 'ofc' && confederation.playoffs) {
        const playoffMatches = confederation.playoffs.matches || []
        const playoffPlayed = playoffMatches.filter(m => m.played).length
        const allPlayoffComplete = playoffMatches.length > 0 && playoffPlayed === playoffMatches.length
        
        confederation.completed = playedMatches === totalMatches && allPlayoffComplete
        
        // If OFC playoff is complete, ensure the winner is in qualified teams
        if (confederation.playoffs.completed && confederation.playoffs.winner) {
          console.log(`OFC playoff complete, winner is:`, confederation.playoffs.winner.name || confederation.playoffs.winner.country)
          
          // Check if qualified teams list is empty or doesn't contain the winner
          if (!confederation.qualifiedTeams || confederation.qualifiedTeams.length === 0) {
            console.log('OFC qualified teams list is empty, adding playoff winner')
            qualifiedFromConfederation = [{
              teamId: confederation.playoffs.winner.teamId,
              name: confederation.playoffs.winner.name,
              country: confederation.playoffs.winner.country,
              flag: confederation.playoffs.winner.flag,
              qualificationMethod: 'playoff_winner'
            }]
          } else {
            console.log(`OFC playoff complete, keeping existing qualified teams:`, 
              confederation.qualifiedTeams.map(t => t.name || t.country))
            qualifiedFromConfederation = confederation.qualifiedTeams
          }
        }
      } else {
        // Debug logging for qualification completion
        console.log(`Confederation ${confederation.confederationId} completion check:`, {
          playedMatches,
          totalMatches,
          qualifiedCount: qualifiedFromConfederation.length,
          qualified: qualifiedFromConfederation.map(t => t.name || t.country),
          groups: confederation.groups.map(g => ({
            name: g.name,
            teams: g.teams.map(t => `${t.name || t.country} (${t.points}pts)`).slice(0, 3)
          }))
        })
        
        // Allow completion if all matches are played, even if qualification logic has issues
        confederation.completed = playedMatches === totalMatches
        
        // If we have no qualified teams but confederation is complete, try to populate with top teams
        if (confederation.completed && qualifiedFromConfederation.length === 0) {
          console.log(`WARNING: ${confederation.confederationId} completed but no qualified teams. Attempting to populate with top teams.`)
          
          // Get the confederation definition to know how many slots we need
          const confederationDef = confederations.find(c => c.id === confederation.confederationId)
          const slotsNeeded = confederationDef ? confederationDef.qualificationSlots : 1
          
          // Get all teams from all groups, sorted by performance
          const allTeams = confederation.groups.flatMap(group => group.teams)
          allTeams.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points
            if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
            return b.goalsFor - a.goalsFor
          })
          
          // Take top teams as qualified
          const topTeams = allTeams.slice(0, slotsNeeded)
          qualifiedFromConfederation = topTeams.map(team => ({
            ...team,
            qualificationMethod: 'top_performer'
          }))
          
          console.log(`Populated ${qualifiedFromConfederation.length} qualified teams for ${confederation.confederationId}:`, 
            qualifiedFromConfederation.map(t => t.name || t.country))
        }
      }
      
      // Update confederation qualified teams (after potential fallback population)
      confederation.qualifiedTeams = qualifiedFromConfederation
      
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
    
    // Debug overall completion status
    console.log('Overall qualification completion:', {
      allConfederationsComplete,
      confederationStatus: qualification.confederations.map(conf => ({
        id: conf.confederationId,
        completed: conf.completed,
        qualifiedCount: conf.qualifiedTeams?.length || 0
      })),
      totalQualifiedTeams: qualification.qualifiedTeams.length
    })
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
        const directQualifiers = confederation.qualifiedTeams || []
        
        console.log(`Finalization: Processing ${confederation.confederationId}:`, {
          completed: confederation.completed,
          qualifiedCount: directQualifiers.length,
          qualified: directQualifiers.map(t => t.name || t.country),
          hasPlayoffs: confederation.confederationId === 'ofc' && confederation.playoffs,
          playoffCompleted: confederation.confederationId === 'ofc' ? confederation.playoffs?.completed : 'N/A',
          playoffWinner: confederation.confederationId === 'ofc' ? confederation.playoffs?.winner?.name : 'N/A'
        })
        
        // Special debug for OFC
        if (confederation.confederationId === 'ofc') {
          console.log('OFC DETAILED DEBUG:', {
            playoffAvailable: confederation.playoffs?.available,
            playoffMatches: confederation.playoffs?.matches?.map(m => ({
              matchId: m.matchId,
              played: m.played,
              homeTeam: m.homeTeam?.name,
              awayTeam: m.awayTeam?.name,
              homeScore: m.homeScore,
              awayScore: m.awayScore
            })),
            playoffWinner: confederation.playoffs?.winner,
            qualifiedTeams: confederation.qualifiedTeams
          })
        }
        
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

  // Simulate OFC playoff match
  async simulateOFCPlayoffMatch(tournamentId, matchId) {
    try {
      const qualification = await Qualification.findOne({ tournament: tournamentId })
      if (!qualification || !qualification.started) {
        throw new Error('Qualification not started')
      }

      const ofcConfederation = qualification.confederations.find(conf => conf.confederationId === 'ofc')
      if (!ofcConfederation || !ofcConfederation.playoffs) {
        throw new Error('OFC playoffs not available')
      }

      if (!ofcConfederation.playoffs.available) {
        throw new Error('OFC playoff teams not yet determined. Complete group stages first.')
      }

      const match = ofcConfederation.playoffs.matches.find(m => m.matchId === matchId)
      if (!match) {
        throw new Error('Playoff match not found')
      }

      if (match.played) {
        throw new Error('Match already played')
      }

      const result = this.simulateMatch(match.homeTeam, match.awayTeam)
      match.homeScore = result.homeScore
      match.awayScore = result.awayScore
      match.played = true

      // Check if both legs are complete
      const allMatchesPlayed = ofcConfederation.playoffs.matches.every(m => m.played)
      if (allMatchesPlayed) {
        // Calculate aggregate winner
        const match1 = ofcConfederation.playoffs.matches[0]
        const match2 = ofcConfederation.playoffs.matches[1]
        
        const team1Goals = match1.homeScore + match2.awayScore
        const team2Goals = match1.awayScore + match2.homeScore
        
        let winner
        if (team1Goals > team2Goals) {
          winner = match1.homeTeam
        } else if (team2Goals > team1Goals) {
          winner = match1.awayTeam
        } else {
          // If tied, away goals rule or penalty shootout (simplified to random)
          winner = Math.random() > 0.5 ? match1.homeTeam : match1.awayTeam
        }

        ofcConfederation.playoffs.winner = winner
        ofcConfederation.playoffs.completed = true
        
        // Add qualified team
        const qualifiedTeam = {
          teamId: winner.teamId,
          name: winner.name,
          country: winner.country,
          flag: winner.flag,
          qualificationMethod: 'playoff_winner'
        }
        
        ofcConfederation.qualifiedTeams = [qualifiedTeam]
        
        console.log('OFC PLAYOFF WINNER DETERMINED:', {
          winner: winner.name || winner.country,
          qualifiedTeam,
          allPlayoffMatches: ofcConfederation.playoffs.matches.map(m => ({
            matchId: m.matchId,
            homeTeam: m.homeTeam?.name,
            awayTeam: m.awayTeam?.name,
            homeScore: m.homeScore,
            awayScore: m.awayScore,
            played: m.played
          }))
        })
      }

      await qualification.save()
      
      return { match: match, updated: true }
    } catch (error) {
      console.error('Error simulating OFC playoff match:', error)
      throw error
    }
  }

  // Helper method to shuffle array
  shuffleArray(array) {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }
}

export default new QualificationService()