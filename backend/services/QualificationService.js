import Qualification from '../models/Qualification.js'
import Tournament from '../models/Tournament.js'
import World from '../models/World.js'
import TournamentNewsService from './TournamentNewsService.js'
import PlayerGenerationService from './PlayerGenerationService.js'
import BasicEnhancedMatchService from './BasicEnhancedMatchService.js'
import PlayerStatsUpdateService from './PlayerStatsUpdateService.js'
import { confederations } from '../data/confederations.js'
import { countries } from '../data/countries.js'

// Create a ranking lookup map for faster access
const rankingLookup = new Map()
countries.forEach(country => {
  rankingLookup.set(country.name, country.worldRanking || 999)
})

class QualificationService {
  constructor() {
    this.currentWorld = null  // Store current world data for ranking lookups
  }

  /**
   * Load world context for a tournament
   */
  async loadWorldContext(tournamentId) {
    try {
      const tournament = await Tournament.findById(tournamentId)
      if (tournament && tournament.worldId) {
        this.currentWorld = await World.findById(tournament.worldId)
      } else {
        this.currentWorld = null
      }
    } catch (error) {
      console.error('Error loading world context:', error)
      this.currentWorld = null
    }
  }

  // Generate teams for each confederation (ALL teams, excluding host for qualification)
  generateConfederationTeams(confederationId, hostCountryCode) {
    const confederation = confederations.find(c => c.id === confederationId)
    if (!confederation) return []

    // Get ALL countries from this confederation
    let confederationCountries = countries.filter(country => 
      country.confederation === confederationId
    )

    // Remove host country from confederation teams (host gets automatic qualification)
    if (hostCountryCode) {
      confederationCountries = confederationCountries.filter(country => 
        country.code !== hostCountryCode
      )
    }
    
    console.log(`QualificationService: Generating teams for ${confederationId}: ${confederationCountries.length} countries total` + 
      (hostCountryCode ? ` (excluding host: ${hostCountryCode})` : ''))

    // Sort by ranking (world rankings if available, otherwise world ranking)
    confederationCountries.sort((a, b) => this.getTeamRanking(a) - this.getTeamRanking(b))

    return confederationCountries.map((country, index) => {
      const team = {
        teamId: `${confederationId}_${country.code}`,
        name: country.name,
        country: country.name,
        flag: country.flag,
        ranking: country.worldRanking || 999,
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
      } else if (confederationId === 'caf' || confederationId === 'afc') {
        // CAF and AFC: Always 8 groups for playoff system
        numGroups = 8
        teamsPerGroup = Math.ceil(totalTeams / 8)
      } else {
        // Other confederations: Find optimal equal distribution
        // Try different team per group sizes to find one that divides evenly
        for (let candidateTeamsPerGroup = minTeamsPerGroup; candidateTeamsPerGroup <= totalTeams; candidateTeamsPerGroup++) {
          if (totalTeams % candidateTeamsPerGroup === 0) {
            const candidateNumGroups = totalTeams / candidateTeamsPerGroup
            
            // Check if this creates reasonable group size
            if (candidateNumGroups >= qualificationSlots) {
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

      // Sort teams by ranking (world rankings if available, otherwise world ranking)
      const sortedTeams = [...teams].sort((a, b) => this.getTeamRanking(a) - this.getTeamRanking(b))
      
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
    const isDoubleRoundRobin = confederationId === 'uefa' || confederationId === 'conmebol' || confederationId === 'caf' || confederationId === 'ofc' || confederationId === 'afc'

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

        // For double round-robin confederations, add the return match
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

      // Load world data if tournament belongs to a world
      if (tournament.worldId) {
        this.currentWorld = await World.findById(tournament.worldId)
      } else {
        this.currentWorld = null
      }

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
          qualifiedTeams: [],
          qualificationSlots: confederation.qualificationSlots  // Use original slots
        }


        // Add playoff structure for OFC, CAF, and AFC
        if (confederation.id === 'ofc' || confederation.id === 'caf' || confederation.id === 'afc') {
          confederationData.playoffs = {
            available: false,
            completed: false,
            matches: [],
            winners: confederation.id === 'ofc' ? null : [] // OFC has 1 winner, others have multiple winners
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

      // Generate player squads for all qualifying teams
      console.log('Starting player squad generation for all qualifying teams...')
      let totalTeamsGenerated = 0
      let totalTeamsToGenerate = 0
      
      // Count total teams first
      for (const confederationData of qualificationData.confederations) {
        for (const group of confederationData.groups) {
          totalTeamsToGenerate += group.teams.length
        }
      }
      
      console.log(`Need to generate squads for ${totalTeamsToGenerate} teams total`)
      
      for (const confederationData of qualificationData.confederations) {
        console.log(`Generating squads for ${confederationData.name} confederation...`)
        for (const group of confederationData.groups) {
          for (const team of group.teams) {
            try {
              // Extract country code from team data
              const countryCode = countries.find(c => c.name === team.country)?.code || team.name.substring(0, 3).toUpperCase()
              
              // Check if team already has players for this world/tournament
              if (tournament.worldId) {
                // For world tournaments, check if team has world-level players
                const existingWorldPlayers = await PlayerGenerationService.getTeamPlayers(
                  countryCode,
                  null, // No tournament ID - get world-level players
                  tournament.worldId.toString()
                )
                
                if (existingWorldPlayers.length > 0) {
                  console.log(`🔄 ROSTER: Team ${team.country} already has ${existingWorldPlayers.length} world players - preserving roster`)
                  continue // Skip generation, preserve existing players
                } else {
                  console.log(`🔄 ROSTER: Generating initial squad for team: ${team.country} (${countryCode}) at world level`)
                  await PlayerGenerationService.generateSquad(
                    countryCode,
                    null, // No tournament ID - generate at world level
                    tournament.worldId.toString(),
                    tournament.year || new Date().getFullYear()
                  )
                }
              } else {
                // For standalone tournaments, check tournament-specific players
                const existingTournamentPlayers = await PlayerGenerationService.getTeamPlayers(
                  countryCode,
                  tournamentId,
                  null
                )
                
                if (existingTournamentPlayers.length > 0) {
                  console.log(`🔄 ROSTER: Team ${team.country} already has ${existingTournamentPlayers.length} tournament players - preserving roster`)
                  continue // Skip generation, preserve existing players
                } else {
                  console.log(`🔄 ROSTER: Generating squad for team: ${team.country} (${countryCode})`)
                  await PlayerGenerationService.generateSquad(
                    countryCode,
                    tournamentId,
                    null,
                    tournament.year || new Date().getFullYear()
                  )
                }
              }
              
              totalTeamsGenerated++
              
              if (totalTeamsGenerated % 5 === 0) {
                console.log(`✓ Generated squads for ${totalTeamsGenerated}/${totalTeamsToGenerate} teams... (${Math.round(totalTeamsGenerated/totalTeamsToGenerate*100)}%)`)
              }
            } catch (squadError) {
              console.error(`❌ Error generating squad for ${team.country}:`, squadError)
              // Continue with other teams even if one fails
            }
          }
        }
      }
      
      console.log(`✅ Player squad generation completed for ${totalTeamsGenerated}/${totalTeamsToGenerate} qualifying teams`)

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

  // Convert world ranking to power (1-20 scale)
  calculateTeamPower(worldRanking) {
    // Handle undefined/null rankings (fallback to worst ranking)
    if (!worldRanking || worldRanking === null || worldRanking === undefined) {
      console.log('WARNING: calculateTeamPower called with invalid ranking:', worldRanking)
      return 1
    }
    
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

  getTeamRanking(team) {
    // First try to use world rankings if available
    if (this.currentWorld && this.currentWorld.countryRankings) {
      const worldRanking = this.currentWorld.countryRankings.find(
        ranking => ranking.code === team.countryCode || ranking.code === team.code
      )
      if (worldRanking) {
        return worldRanking.rank || 999
      }
    }
    
    // Fallback to existing system
    return team.ranking || rankingLookup.get(team.name) || rankingLookup.get(team.country) || 999
  }

  simulateMatch(homeTeam, awayTeam) {
    // Get rankings using world rankings if available, otherwise world rankings
    let homeRanking = this.getTeamRanking(homeTeam)
    let awayRanking = this.getTeamRanking(awayTeam)
    
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
  determineQualifiedTeams(confederationId, groups, hostCountryCode) {
    const confederation = confederations.find(c => c.id === confederationId)
    if (!confederation) return []

    // OFC, CAF, and AFC use playoff system - check if playoff is complete
    if (['ofc', 'caf', 'afc'].includes(confederationId)) {
      // Don't determine qualified teams here - they are set directly in playoff simulation
      // Return empty array to avoid overriding playoff winners
      return []
    }

    const qualifiedTeams = []
    // Use the confederation's qualification slots (already adjusted for host if needed)
    const totalSlots = confederation.qualificationSlots
    
    console.log(`Determining qualified teams for ${confederationId}: ${totalSlots} slots available`)

    // Collect all group winners and runners-up
    const groupResults = []
    
    for (const group of groups) {
      // Check if this confederation plays home and away matches
      const isDoubleRoundRobin = confederationId === 'uefa' || confederationId === 'conmebol' || confederationId === 'caf' || confederationId === 'ofc' || confederationId === 'afc'
      
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
          // For UEFA, use average points per match to make it fair for groups of different sizes
          if (confederationId === 'uefa') {
            runnersUp.sort((a, b) => {
              const avgA = a.played > 0 ? a.points / a.played : 0
              const avgB = b.played > 0 ? b.points / b.played : 0
              
              if (avgB !== avgA) return avgB - avgA  // Higher average points first
              if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
              return b.goalsFor - a.goalsFor
            })
          } else {
            // For other confederations, use total points
            runnersUp.sort((a, b) => {
              if (b.points !== a.points) return b.points - a.points
              if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
              return b.goalsFor - a.goalsFor
            })
          }

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

  // Check and populate playoff matches when groups are complete
  checkAndPopulatePlayoffs(confederation) {
    if (!['ofc', 'caf', 'afc'].includes(confederation.confederationId) || !confederation.playoffs) {
      return
    }

    // Skip if already populated
    if (confederation.playoffs.available) {
      return
    }

    // Check if all groups are complete
    const groupWinners = []
    for (const group of confederation.groups) {
      const n = group.teams.length
      // Check if this confederation plays home and away matches
      const isDoubleRoundRobin = ['uefa', 'conmebol', 'caf', 'ofc', 'afc'].includes(confederation.confederationId)
      // Each team plays against every other team (once or twice)
      const matchesPerTeam = isDoubleRoundRobin ? 2 * (n - 1) : (n - 1)
      
      // Check if all teams have played all their matches
      const allTeamsComplete = group.teams.every(team => team.played === matchesPerTeam)
      
      console.log(`${confederation.confederationId} playoff check - Group ${group.name}: Teams played ${group.teams.map(t => t.played).join(',')} matches (expected ${matchesPerTeam} each)`)
      
      if (allTeamsComplete) {
        // Group is complete, get winner
        const winner = group.teams[0].toObject ? group.teams[0].toObject() : group.teams[0] // Handle both Mongoose and plain objects
        groupWinners.push({
          ...winner,
          groupName: group.name
        })
      }
    }

    let requiredGroupWinners
    if (confederation.confederationId === 'ofc') {
      requiredGroupWinners = 2
    } else if (confederation.confederationId === 'caf') {
      requiredGroupWinners = 8  // CAF has 8 groups
    } else {
      requiredGroupWinners = 8  // AFC has 8 groups
    }
    
    console.log(`${confederation.confederationId}: Found ${groupWinners.length} group winners, required: ${requiredGroupWinners}`)
    
    if (groupWinners.length === requiredGroupWinners) {
      // All groups complete, create playoff matches
      console.log(`${confederation.confederationId}: Creating playoff matches...`)
      confederation.playoffs.matches = []
      
      if (confederation.confederationId === 'ofc') {
        // OFC: 2 group winners, home-and-away playoff for 1 qualifier
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
      } else if (confederation.confederationId === 'caf') {
        // CAF: 8 group winners, home-and-away playoff matches for 4 qualifiers
        // Randomly shuffle group winners and pair them up for 4 matches
        const shuffledWinners = [...groupWinners].sort(() => Math.random() - 0.5)
        
        for (let i = 0; i < 4; i++) {
          const team1 = shuffledWinners[i * 2]
          const team2 = shuffledWinners[i * 2 + 1]
          
          // First leg
          confederation.playoffs.matches.push({
            matchId: `caf_playoff_${team1.teamId}_vs_${team2.teamId}_leg1`,
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
            description: `CAF Playoff ${i + 1} - First Leg`
          })
          
          // Second leg
          confederation.playoffs.matches.push({
            matchId: `caf_playoff_${team2.teamId}_vs_${team1.teamId}_leg2`,
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
            description: `CAF Playoff ${i + 1} - Second Leg`
          })
        }
      } else {
        // AFC: 8 group winners, home-and-away playoff matches for 4 qualifiers
        // Randomly shuffle group winners and pair them up for 4 matches
        const shuffledWinners = [...groupWinners].sort(() => Math.random() - 0.5)
        
        for (let i = 0; i < 4; i++) {
          const team1 = shuffledWinners[i * 2]
          const team2 = shuffledWinners[i * 2 + 1]
          
          // First leg
          confederation.playoffs.matches.push({
            matchId: `${confederation.confederationId}_playoff_${team1.teamId}_vs_${team2.teamId}_leg1`,
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
            description: `Playoff ${i + 1} - First Leg`
          })
          
          // Second leg
          confederation.playoffs.matches.push({
            matchId: `${confederation.confederationId}_playoff_${team2.teamId}_vs_${team1.teamId}_leg2`,
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
            description: `Playoff ${i + 1} - Second Leg`
          })
        }
      }

      confederation.playoffs.available = true
      console.log(`${confederation.confederationId}: Playoffs populated with ${confederation.playoffs.matches.length} matches`)
    }
  }

  // Update confederation status
  updateConfederationStatus(qualification) {
    for (const confederation of qualification.confederations) {
      // Check and populate playoffs if ready
      this.checkAndPopulatePlayoffs(confederation)
      
      let qualifiedFromConfederation = this.determineQualifiedTeams(
        confederation.confederationId, 
        confederation.groups,
        qualification.hostCountryCode
      )
      
      // For confederations with playoffs, preserve qualified teams if playoffs are complete
      if (['ofc', 'caf', 'afc'].includes(confederation.confederationId) && 
          confederation.playoffs && 
          confederation.playoffs.completed && 
          confederation.qualifiedTeams && 
          confederation.qualifiedTeams.length > 0) {
        console.log(`${confederation.confederationId.toUpperCase()}: Using existing qualified teams from completed playoffs`)
        qualifiedFromConfederation = confederation.qualifiedTeams
      }
      
      const totalMatches = confederation.matches.length
      const playedMatches = confederation.matches.filter(m => m.played).length
      
      // For OFC, also check playoff completion
      if (confederation.confederationId === 'ofc' && confederation.playoffs) {
        const playoffMatches = confederation.playoffs.matches || []
        const playoffPlayed = playoffMatches.filter(m => m.played).length
        const allPlayoffComplete = playoffMatches.length > 0 && playoffPlayed === playoffMatches.length
        
        confederation.completed = playedMatches === totalMatches && allPlayoffComplete
        
        // If playoffs are complete, ensure the winners are in qualified teams
        if (confederation.playoffs.completed) {
          if (confederation.confederationId === 'ofc' && confederation.playoffs.winner) {
            console.log(`OFC playoff complete, winner is:`, confederation.playoffs.winner.name || confederation.playoffs.winner.country)
            
            // Check if qualified teams list is empty or doesn't contain the winner
            if (!confederation.qualifiedTeams || confederation.qualifiedTeams.length === 0) {
              console.log('OFC qualified teams list is empty, adding playoff winner')
              qualifiedFromConfederation = [{
                teamId: confederation.playoffs.winner.teamId,
                name: confederation.playoffs.winner.name,
                country: confederation.playoffs.winner.country,
                flag: confederation.playoffs.winner.flag,
                qualificationMethod: 'PLAYOFF WINNER'
              }]
            } else {
              console.log(`OFC playoff complete, keeping existing qualified teams:`, 
                confederation.qualifiedTeams.map(t => t.name || t.country))
              qualifiedFromConfederation = confederation.qualifiedTeams
            }
          } else if (['caf', 'afc'].includes(confederation.confederationId) && confederation.playoffs.winners && confederation.playoffs.winners.length > 0) {
            console.log(`${confederation.confederationId.toUpperCase()} playoffs complete, winners are:`, confederation.playoffs.winners.map(w => w.name || w.country))
            
            if (!confederation.qualifiedTeams || confederation.qualifiedTeams.length === 0) {
              console.log(`${confederation.confederationId.toUpperCase()} qualified teams list is empty, adding playoff winners`)
              qualifiedFromConfederation = confederation.playoffs.winners.map(winner => ({
                teamId: winner.teamId,
                name: winner.name,
                country: winner.country,
                flag: winner.flag,
                qualificationMethod: 'PLAYOFF WINNER'
              }))
            } else {
              console.log(`${confederation.confederationId.toUpperCase()} playoffs complete, keeping existing qualified teams:`, 
                confederation.qualifiedTeams.map(t => t.name || t.country))
              qualifiedFromConfederation = confederation.qualifiedTeams
            }
          }
        }
      } else if (['caf', 'afc'].includes(confederation.confederationId) && confederation.playoffs) {
        // CAF and AFC: Check both group stage and playoff completion
        const playoffMatches = confederation.playoffs.matches || []
        const playoffPlayed = playoffMatches.filter(m => m.played).length
        const allPlayoffComplete = playoffMatches.length > 0 && playoffPlayed === playoffMatches.length
        
        confederation.completed = playedMatches === totalMatches && allPlayoffComplete
        
        // Debug logging for CAF/AFC qualification completion
        console.log(`${confederation.confederationId.toUpperCase()} completion check:`, {
          groupsComplete: playedMatches === totalMatches,
          playoffComplete: allPlayoffComplete,
          playoffMatches: playoffMatches.length,
          playoffPlayed: playoffPlayed,
          qualifiedCount: qualifiedFromConfederation.length
        })
      } else {
        // Other confederations with group qualification
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
        
        // Standard confederations complete when all matches are played
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
      console.log(`🚀 SIMULATION CALLED: simulateNextMatchday for tournament ${tournamentId}`)
      // Load world context for ranking lookups
      await this.loadWorldContext(tournamentId)
      
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
          
          // Update player statistics for international caps and goals
          await this.updatePlayerStatsForQualificationMatch(match, result, tournamentId)
          
          // Apply enhanced simulation for qualification matches
          try {
            console.log(`About to run enhanced simulation for qualification match: ${match.matchId}`)
            await this.simulateEnhancedQualificationMatch(match, tournamentId)
            console.log(`Enhanced simulation completed for qualification match: ${match.matchId}`)
          } catch (enhancedError) {
            console.error('Enhanced qualification simulation failed:', enhancedError)
          }
          
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
      console.log(`🚀 SIMULATION CALLED: simulateNextMatchdayForConfederation for tournament ${tournamentId}, confederation ${confederationId}`)
      // Load world context for ranking lookups
      await this.loadWorldContext(tournamentId)
      
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
        
        // Update player statistics for international caps and goals
        await this.updatePlayerStatsForQualificationMatch(match, result, tournamentId)
        
        // Apply enhanced simulation for qualification matches
        try {
          await this.simulateEnhancedQualificationMatch(match, tournamentId)
        } catch (enhancedError) {
          console.error('Enhanced qualification simulation failed:', enhancedError)
        }
        
        const group = confederation.groups.find(g => g.groupId === match.groupId)
        if (group) {
          this.updateGroupStandings(group, match)
        }
        
        // Generate news for this qualification match
        const homeTeamData = {
          countryName: match.homeTeam.name,
          worldRanking: this.getTeamRanking(match.homeTeam)
        }
        const awayTeamData = {
          countryName: match.awayTeam.name,
          worldRanking: this.getTeamRanking(match.awayTeam)
        }
        
        await TournamentNewsService.processMatchResult(
          tournamentId,
          match,
          homeTeamData,
          awayTeamData
        )
        
        matchesPlayed++
      }

      this.updateConfederationStatus(qualification)
      await qualification.save()
      
      // Check if confederation completed and generate news
      if (matchesPlayed > 0) {
        // Check if this was the final matchday for the confederation
        if (confederation.completed) {
          await TournamentNewsService.notifyMilestone(tournamentId, 'qualification_complete', {
            confederation: confederation.name,
            qualifiedTeams: confederation.qualified ? confederation.qualified.length : 0
          })
        }
      }
      
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

  // Simulate specific matchday for a specific confederation
  async simulateSpecificMatchday(tournamentId, confederationId, matchday) {
    try {
      console.log(`🚀 SIMULATION CALLED: simulateSpecificMatchday for tournament ${tournamentId}, confederation ${confederationId}, matchday ${matchday}`)
      // Load world context for ranking lookups
      await this.loadWorldContext(tournamentId)
      
      const qualification = await Qualification.findOne({ tournament: tournamentId })
      if (!qualification || !qualification.started) {
        throw new Error('Qualification not started')
      }

      const confederation = qualification.confederations.find(conf => conf.confederationId === confederationId)
      if (!confederation) {
        throw new Error('Confederation not found')
      }

      // Get all matches for this specific matchday that haven't been played yet
      const matchesToPlay = confederation.matches.filter(
        match => match.matchday === matchday && !match.played
      )

      if (matchesToPlay.length === 0) {
        throw new Error(`No unplayed matches for matchday ${matchday}`)
      }

      let matchesPlayed = 0
      for (const match of matchesToPlay) {
        const result = this.simulateMatch(match.homeTeam, match.awayTeam)
        match.homeScore = result.homeScore
        match.awayScore = result.awayScore
        match.played = true
        
        // Update player statistics for international caps and goals
        await this.updatePlayerStatsForQualificationMatch(match, result, tournamentId)
        
        // Apply enhanced simulation for qualification matches
        try {
          await this.simulateEnhancedQualificationMatch(match, tournamentId)
        } catch (enhancedError) {
          console.error('Enhanced qualification simulation failed:', enhancedError)
        }
        
        const group = confederation.groups.find(g => g.groupId === match.groupId)
        if (group) {
          this.updateGroupStandings(group, match)
        }
        
        // Generate news for this qualification match
        const homeTeamData = {
          countryName: match.homeTeam.name,
          worldRanking: this.getTeamRanking(match.homeTeam)
        }
        const awayTeamData = {
          countryName: match.awayTeam.name,
          worldRanking: this.getTeamRanking(match.awayTeam)
        }
        
        await TournamentNewsService.processMatchResult(
          tournamentId,
          match,
          homeTeamData,
          awayTeamData
        )
        
        matchesPlayed++
      }

      this.updateConfederationStatus(qualification)
      await qualification.save()
      
      return { 
        matchesPlayed, 
        confederationId, 
        confederationName: confederation.name,
        matchday
      }
    } catch (error) {
      console.error('Error simulating specific matchday:', error)
      throw error
    }
  }

  // Simulate individual match
  async simulateIndividualMatch(tournamentId, matchId) {
    try {
      console.log(`QUALIFICATION SERVICE: simulateIndividualMatch called with tournamentId: ${tournamentId}, matchId: ${matchId}`)
      // Load world context for ranking lookups
      await this.loadWorldContext(tournamentId)
      
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

      // Apply enhanced simulation for individual qualification match
      try {
        // Write to log file instead since console is not showing
        const fs = await import('fs')
        let logMessage = `  -> Starting enhanced simulation for match ${matchId}\n`
        fs.appendFileSync('/tmp/backend-debug.log', logMessage)
        
        console.log(`🚀 INDIVIDUAL MATCH: Starting enhanced simulation for match ${matchId}`)
        console.error(`🚀 INDIVIDUAL MATCH: Starting enhanced simulation for match ${matchId}`) // Try console.error
        process.stdout.write(`🚀 INDIVIDUAL MATCH: Starting enhanced simulation for match ${matchId}\n`) // Force stdout
        await this.simulateEnhancedQualificationMatch(targetMatch, tournamentId)
        
        logMessage = `  -> Enhanced simulation completed for match ${matchId}\n`
        fs.appendFileSync('/tmp/backend-debug.log', logMessage)
        console.log(`✅ INDIVIDUAL MATCH: Enhanced simulation completed for match ${matchId}`)
        console.error(`✅ INDIVIDUAL MATCH: Enhanced simulation completed for match ${matchId}`) // Try console.error
      } catch (enhancedError) {
        console.error(`❌ INDIVIDUAL MATCH: Enhanced qualification simulation failed for ${matchId}:`, enhancedError.message)
        console.error('Stack trace:', enhancedError.stack)
      }
      
      const group = targetConfederation.groups.find(g => g.groupId === targetMatch.groupId)
      if (group) {
        this.updateGroupStandings(group, targetMatch)
      }

      this.updateConfederationStatus(qualification)
      await qualification.save()
      
      // Generate news for this qualification match
      const homeTeamData = {
        countryName: targetMatch.homeTeam.name,
        worldRanking: this.getTeamRanking(targetMatch.homeTeam)
      }
      const awayTeamData = {
        countryName: targetMatch.awayTeam.name,
        worldRanking: this.getTeamRanking(targetMatch.awayTeam)
      }
      
      await TournamentNewsService.processMatchResult(
        tournamentId,
        targetMatch,
        homeTeamData,
        awayTeamData
      )
      
      return { match: targetMatch, updated: true }
    } catch (error) {
      console.error('Error simulating individual match:', error)
      throw error
    }
  }

  // Simulate all matches for a confederation
  async simulateAllConfederationMatches(tournamentId, confederationId) {
    try {
      console.log(`🚀 SIMULATION CALLED: simulateAllConfederationMatches for tournament ${tournamentId}, confederation ${confederationId}`)
      // Load world context for ranking lookups
      await this.loadWorldContext(tournamentId)
      
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
        
        // Update player statistics for international caps and goals
        await this.updatePlayerStatsForQualificationMatch(match, result, tournamentId)
        
        // Apply enhanced simulation for qualification matches
        try {
          await this.simulateEnhancedQualificationMatch(match, tournamentId)
        } catch (enhancedError) {
          console.error('Enhanced qualification simulation failed:', enhancedError)
        }
        
        const group = confederation.groups.find(g => g.groupId === match.groupId)
        if (group) {
          this.updateGroupStandings(group, match)
        }
        
        // Generate news for this qualification match
        const homeTeamData = {
          countryName: match.homeTeam.name,
          worldRanking: this.getTeamRanking(match.homeTeam)
        }
        const awayTeamData = {
          countryName: match.awayTeam.name,
          worldRanking: this.getTeamRanking(match.awayTeam)
        }
        
        await TournamentNewsService.processMatchResult(
          tournamentId,
          match,
          homeTeamData,
          awayTeamData
        )
        
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

      // Debug confederation completion status
      console.log('🔍 FINALIZATION DEBUG: Checking confederation completion status')
      const completionStatus = qualification.confederations.map(conf => ({
        id: conf.confederationId,
        completed: conf.completed,
        totalMatches: conf.matches?.length || 0,
        playedMatches: conf.matches?.filter(m => m.played).length || 0,
        qualifiedTeams: conf.qualifiedTeams?.length || 0,
        groups: conf.groups?.length || 0
      }))
      console.log('📊 Confederation status:', completionStatus)

      const allComplete = qualification.confederations.every(conf => conf.completed)
      if (!allComplete) {
        const incompleteConfs = qualification.confederations.filter(conf => !conf.completed)
        console.log('❌ INCOMPLETE CONFEDERATIONS:', incompleteConfs.map(c => ({
          id: c.confederationId,
          totalMatches: c.matches?.length || 0,
          playedMatches: c.matches?.filter(m => m.played).length || 0,
          completed: c.completed
        })))
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
          hasPlayoffs: ['ofc', 'caf', 'afc'].includes(confederation.confederationId) && confederation.playoffs,
          playoffCompleted: confederation.playoffs?.completed || false,
          playoffWinners: confederation.playoffs?.winners?.map(w => w.name || w.country) || 
                          (confederation.playoffs?.winner ? [confederation.playoffs.winner.name] : [])
        })
        
        // Special debug for confederations with playoffs
        if (['ofc', 'caf', 'afc'].includes(confederation.confederationId)) {
          console.log(`${confederation.confederationId.toUpperCase()} DETAILED DEBUG:`, {
            playoffAvailable: confederation.playoffs?.available,
            playoffCompleted: confederation.playoffs?.completed,
            playoffMatches: confederation.playoffs?.matches?.map(m => ({
              matchId: m.matchId,
              played: m.played,
              homeTeam: m.homeTeam?.name,
              awayTeam: m.awayTeam?.name,
              homeScore: m.homeScore,
              awayScore: m.awayScore
            })),
            playoffWinners: confederation.playoffs?.winners?.map(w => w.name || w.country) || 
                           (confederation.playoffs?.winner ? [confederation.playoffs.winner.name] : []),
            qualifiedTeams: confederation.qualifiedTeams?.map(t => ({
              name: t.name || t.country,
              method: t.qualificationMethod
            }))
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

      // Update tournament with qualified teams (keep status as active)
      const TournamentService = await import('./TournamentService.js')
      await TournamentService.default.updateTournament(tournamentId, tournament.createdBy, {
        qualifiedTeams: qualifiedTeams,
        teamCount: qualifiedTeams.length,
        canActivate: qualifiedTeams.length === 32
      })

      console.log('✅ Tournament updated with qualified teams')

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

  // Simulate playoff match (OFC, CAF, AFC)
  async simulatePlayoffMatch(tournamentId, matchId) {
    try {
      console.log(`🚀 SIMULATION CALLED: simulatePlayoffMatch for tournament ${tournamentId}, matchId ${matchId}`)
      // Load world context for ranking lookups
      await this.loadWorldContext(tournamentId)
      
      const qualification = await Qualification.findOne({ tournament: tournamentId })
      if (!qualification || !qualification.started) {
        throw new Error('Qualification not started')
      }

      // Find which confederation this match belongs to
      let confederation = null
      let confederationId = null
      
      for (const conf of qualification.confederations) {
        if (['ofc', 'caf', 'afc'].includes(conf.confederationId) && conf.playoffs && conf.playoffs.matches) {
          const match = conf.playoffs.matches.find(m => m.matchId === matchId)
          if (match) {
            confederation = conf
            confederationId = conf.confederationId
            break
          }
        }
      }

      if (!confederation || !confederation.playoffs) {
        throw new Error('Playoffs not available for this match')
      }

      if (!confederation.playoffs.available) {
        throw new Error('Playoff teams not yet determined. Complete group stages first.')
      }

      const match = confederation.playoffs.matches.find(m => m.matchId === matchId)
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

      // For CAF/AFC, update winners after each pair completion
      if (['caf', 'afc'].includes(confederationId)) {
        // CAF/AFC: Calculate winners for any completed pairs
        const winners = []
        
        // Group matches by playoff pair (every 2 matches is one two-leg tie)
        for (let i = 0; i < confederation.playoffs.matches.length; i += 2) {
          const match1 = confederation.playoffs.matches[i]     // First leg
          const match2 = confederation.playoffs.matches[i + 1] // Second leg
          
          if (match1.played && match2.played) {
            const team1Goals = match1.homeScore + match2.awayScore
            const team2Goals = match1.awayScore + match2.homeScore
            
            let winner
            if (team1Goals > team2Goals) {
              winner = match1.homeTeam
            } else if (team2Goals > team1Goals) {
              winner = match1.awayTeam
            } else {
              // If tied on aggregate, check away goals rule
              const team1AwayGoals = match2.awayScore // Team 1's away goals in second leg
              const team2AwayGoals = match1.awayScore // Team 2's away goals in first leg
              
              if (team1AwayGoals > team2AwayGoals) {
                winner = match1.homeTeam
              } else if (team2AwayGoals > team1AwayGoals) {
                winner = match1.awayTeam
              } else {
                // Still tied after away goals - simulate extra time and penalties
                console.log(`Playoff tie ${Math.floor(i / 2) + 1}: Aggregate and away goals tied, simulating extra time and penalties`)
                winner = this.simulateExtraTimeAndPenalties(match1.homeTeam, match1.awayTeam)
              }
            }
            
            winners.push({
              teamId: winner.teamId,
              name: winner.name,
              country: winner.country,
              flag: winner.flag,
              qualificationMethod: 'PLAYOFF WINNER'
            })
          }
        }
        
        // Update winners and qualified teams
        confederation.playoffs.winners = winners
        confederation.qualifiedTeams = winners
        
        // Check if all matches are complete
        const allMatchesPlayed = confederation.playoffs.matches.every(m => m.played)
        if (allMatchesPlayed) {
          confederation.playoffs.completed = true
        }
        
        console.log(`${confederationId.toUpperCase()} PLAYOFF UPDATE:`, {
          playedMatches: confederation.playoffs.matches.filter(m => m.played).length,
          totalMatches: confederation.playoffs.matches.length,
          winners: winners.map(w => w.name || w.country),
          winnersCount: winners.length,
          completed: confederation.playoffs.completed,
          qualifiedTeamsSet: confederation.qualifiedTeams?.length || 0
        })
      } else if (confederationId === 'ofc') {
        // Check if all playoff matches are complete
        const allMatchesPlayed = confederation.playoffs.matches.every(m => m.played)
        if (allMatchesPlayed) {
          // OFC: Calculate aggregate winner from 2 matches
          const match1 = confederation.playoffs.matches[0]
          const match2 = confederation.playoffs.matches[1]
          
          const team1Goals = match1.homeScore + match2.awayScore
          const team2Goals = match1.awayScore + match2.homeScore
          
          let winner
          if (team1Goals > team2Goals) {
            winner = match1.homeTeam
          } else if (team2Goals > team1Goals) {
            winner = match1.awayTeam
          } else {
            // If tied on aggregate, check away goals rule
            const team1AwayGoals = match2.awayScore // Team 1's away goals in second leg
            const team2AwayGoals = match1.awayScore // Team 2's away goals in first leg
            
            if (team1AwayGoals > team2AwayGoals) {
              winner = match1.homeTeam
            } else if (team2AwayGoals > team1AwayGoals) {
              winner = match1.awayTeam
            } else {
              // Still tied after away goals - simulate extra time and penalties
              console.log(`OFC Playoff: Aggregate and away goals tied, simulating extra time and penalties`)
              winner = this.simulateExtraTimeAndPenalties(match1.homeTeam, match1.awayTeam)
            }
          }

          confederation.playoffs.winner = winner
          confederation.playoffs.completed = true
          
          // Add qualified team
          const qualifiedTeam = {
            teamId: winner.teamId,
          name: winner.name,
          country: winner.country,
          flag: winner.flag,
          qualificationMethod: 'PLAYOFF WINNER'
          }
          
          confederation.qualifiedTeams = [qualifiedTeam]
          
          console.log('OFC PLAYOFF WINNER DETERMINED:', {
            winner: winner.name || winner.country,
            allPlayoffMatches: confederation.playoffs.matches.map(m => ({
              matchId: m.matchId,
              homeTeam: m.homeTeam?.name,
              awayTeam: m.awayTeam?.name,
              homeScore: m.homeScore,
              awayScore: m.awayScore,
              played: m.played
            }))
          })
        }
      }

      await qualification.save()
      
      return { match: match, updated: true }
    } catch (error) {
      console.error('Error simulating playoff match:', error)
      throw error
    }
  }

  // Legacy function for backward compatibility
  async simulateOFCPlayoffMatch(tournamentId, matchId) {
    return this.simulatePlayoffMatch(tournamentId, matchId)
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

  // Simulate extra time and penalty shootout for tied playoff matches
  simulateExtraTimeAndPenalties(team1, team2) {
    console.log(`Simulating extra time and penalties: ${team1.name || team1.country} vs ${team2.name || team2.country}`)
    
    // First, simulate extra time (30 minutes)
    // Extra time goals are typically rare, using lower scoring probability
    const extraTimeGoalsTeam1 = Math.random() < 0.15 ? 1 : (Math.random() < 0.05 ? 2 : 0)
    const extraTimeGoalsTeam2 = Math.random() < 0.15 ? 1 : (Math.random() < 0.05 ? 2 : 0)
    
    if (extraTimeGoalsTeam1 > extraTimeGoalsTeam2) {
      console.log(`${team1.name || team1.country} wins in extra time (${extraTimeGoalsTeam1}-${extraTimeGoalsTeam2})`)
      return team1
    } else if (extraTimeGoalsTeam2 > extraTimeGoalsTeam1) {
      console.log(`${team2.name || team2.country} wins in extra time (${extraTimeGoalsTeam1}-${extraTimeGoalsTeam2})`)
      return team2
    }
    
    // Still tied after extra time - go to penalties
    console.log(`Still tied after extra time (${extraTimeGoalsTeam1}-${extraTimeGoalsTeam2}), going to penalty shootout`)
    
    // Simulate penalty shootout
    // Each team has 5 penalty attempts initially
    let team1Penalties = 0
    let team2Penalties = 0
    
    // Regular 5 penalties each
    for (let i = 0; i < 5; i++) {
      // Team 1 penalty (80% success rate)
      if (Math.random() < 0.8) team1Penalties++
      
      // Team 2 penalty (80% success rate)  
      if (Math.random() < 0.8) team2Penalties++
    }
    
    // If still tied after 5 penalties each, continue sudden death
    while (team1Penalties === team2Penalties) {
      const team1Scores = Math.random() < 0.8
      const team2Scores = Math.random() < 0.8
      
      if (team1Scores && !team2Scores) {
        team1Penalties++
        break
      } else if (team2Scores && !team1Scores) {
        team2Penalties++
        break
      } else if (team1Scores && team2Scores) {
        team1Penalties++
        team2Penalties++
        // Continue to next round
      }
      // If both miss, continue to next round
    }
    
    const winner = team1Penalties > team2Penalties ? team1 : team2
    console.log(`${winner.name || winner.country} wins on penalties (${team1Penalties}-${team2Penalties})`)
    
    return winner
  }

  /**
   * Extract country code from teamId (e.g., "uefa_MLT" -> "MLT")
   */
  extractCountryCode(teamId) {
    if (!teamId) return teamId
    // Handle formats like "uefa_MLT", "conmebol_BRA", etc.
    const parts = teamId.split('_')
    return parts.length > 1 ? parts[parts.length - 1] : teamId
  }

  /**
   * Apply enhanced simulation to qualification matches
   */
  async simulateEnhancedQualificationMatch(qualificationMatch, tournamentId) {
    try {
      console.log(`QUALIFICATION ENHANCED: Starting simulation for match ${qualificationMatch.matchId}`)
      
      // Create a mock Match object for the enhanced simulation
      const mockMatch = {
        _id: `qualification_${tournamentId}_${qualificationMatch.matchId}`,
        tournament: tournamentId,
        homeTeam: {
          countryCode: this.extractCountryCode(qualificationMatch.homeTeam.teamId || qualificationMatch.homeTeam.country),
          name: qualificationMatch.homeTeam.name || qualificationMatch.homeTeam.country,
          code: this.extractCountryCode(qualificationMatch.homeTeam.teamId || qualificationMatch.homeTeam.country)
        },
        awayTeam: {
          countryCode: this.extractCountryCode(qualificationMatch.awayTeam.teamId || qualificationMatch.awayTeam.country),
          name: qualificationMatch.awayTeam.name || qualificationMatch.awayTeam.country,
          code: this.extractCountryCode(qualificationMatch.awayTeam.teamId || qualificationMatch.awayTeam.country)
        },
        homeScore: qualificationMatch.homeScore,
        awayScore: qualificationMatch.awayScore,
        status: 'completed'
      }

      console.log(`QUALIFICATION ENHANCED: Mock match created with ID: ${mockMatch._id}`)
      console.log(`QUALIFICATION ENHANCED: Match details - ${mockMatch.homeTeam.name} ${mockMatch.homeScore}-${mockMatch.awayScore} ${mockMatch.awayTeam.name}`)

      // Load world context for enhanced simulation
      await this.loadWorldContext(tournamentId)
      console.log(`QUALIFICATION ENHANCED: World context loaded, currentWorld exists: ${!!this.currentWorld}`)
      
      // Apply enhanced simulation using the BasicEnhancedMatchService
      console.log(`QUALIFICATION ENHANCED: About to call BasicEnhancedMatchService.simulateBasicMatchDetails`)
      
      // Log to file since console isn't showing
      const fs = await import('fs')
      let logMessage = `  -> About to call BasicEnhancedMatchService.simulateBasicMatchDetails\n`
      fs.appendFileSync('/tmp/backend-debug.log', logMessage)
      
      const result = await BasicEnhancedMatchService.simulateBasicMatchDetails(mockMatch, 'qualification', this.currentWorld)
      
      logMessage = `  -> BasicEnhancedMatchService.simulateBasicMatchDetails returned: ${result ? 'SUCCESS' : 'NULL'}\n`
      fs.appendFileSync('/tmp/backend-debug.log', logMessage)
      console.log(`QUALIFICATION ENHANCED: BasicEnhancedMatchService returned:`, result ? 'SUCCESS' : 'NULL/UNDEFINED')
      
      console.log(`Enhanced qualification match simulation completed for ${qualificationMatch.homeTeam.country} vs ${qualificationMatch.awayTeam.country}`)
      
    } catch (error) {
      console.error('Error in enhanced qualification match simulation:', error)
      throw error
    }
  }

  /**
   * Update player statistics after a qualification match
   */
  async updatePlayerStatsForQualificationMatch(match, result, tournamentId) {
    try {
      console.log(`🔥 STATS: Starting player stats update for qualification match`)
      console.log(`🔥 STATS: Match:`, match.homeTeam.country || match.homeTeam.name, 'vs', match.awayTeam.country || match.awayTeam.name)
      console.log(`🔥 STATS: Result:`, result)
      console.log(`🔥 STATS: Tournament ID:`, tournamentId)
      
      // Get tournament info
      const tournament = await Tournament.findById(tournamentId)
      if (!tournament || !tournament.worldId) {
        console.log('🔥 STATS: Skipping player stats update - not a world tournament')
        return
      }
      
      console.log(`🔥 STATS: Tournament found:`, tournament.name, 'World ID:', tournament.worldId)

      // Get team country codes
      const homeCountryCode = match.homeTeam.country || match.homeTeam.name
      const awayCountryCode = match.awayTeam.country || match.awayTeam.name

      // Convert team names to country codes
      const homeCode = countries.find(c => c.name === homeCountryCode)?.code || homeCountryCode
      const awayCode = countries.find(c => c.name === awayCountryCode)?.code || awayCountryCode

      // Get all players from both teams - try tournament-specific first, then world-level
      let homeTeamPlayers = await PlayerGenerationService.getTeamPlayers(
        homeCode,
        tournament._id.toString(), // Try tournament-specific first
        null
      )
      
      if (homeTeamPlayers.length === 0) {
        homeTeamPlayers = await PlayerGenerationService.getTeamPlayers(
          homeCode,
          null, // Fall back to world-level players
          tournament.worldId.toString()
        )
      }

      let awayTeamPlayers = await PlayerGenerationService.getTeamPlayers(
        awayCode,
        tournament._id.toString(), // Try tournament-specific first
        null
      )
      
      if (awayTeamPlayers.length === 0) {
        awayTeamPlayers = await PlayerGenerationService.getTeamPlayers(
          awayCode,
          null, // Fall back to world-level players
          tournament.worldId.toString()
        )
      }

      if (homeTeamPlayers.length === 0 || awayTeamPlayers.length === 0) {
        console.log(`Warning: No players found for teams ${homeCode} or ${awayCode}`)
        console.log(`Home team ${homeCode}: ${homeTeamPlayers.length} players`)
        console.log(`Away team ${awayCode}: ${awayTeamPlayers.length} players`)
        return
      }
      
      console.log(`✅ Found players - Home team ${homeCode}: ${homeTeamPlayers.length}, Away team ${awayCode}: ${awayTeamPlayers.length}`)

      // Simulate basic goal distribution
      const homeGoals = result.homeScore || 0
      const awayGoals = result.awayScore || 0
      
      const goalScorers = {}
      const assistProviders = {}
      
      // Randomly distribute goals to forwards and midfielders
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

      console.log(`🔥 STATS: About to call updateTeamMatchStats with:`)
      console.log(`🔥 STATS: Home player IDs:`, homePlayerIds.slice(0, 3), '... (showing first 3)')
      console.log(`🔥 STATS: Away player IDs:`, awayPlayerIds.slice(0, 3), '... (showing first 3)')
      console.log(`🔥 STATS: Goal scorers:`, goalScorers)
      console.log(`🔥 STATS: World ID:`, tournament.worldId.toString())
      console.log(`🔥 STATS: Tournament ID:`, tournament._id.toString())

      await PlayerStatsUpdateService.updateTeamMatchStats(
        homePlayerIds,
        awayPlayerIds,
        goalScorers,
        assistProviders,
        cleanSheetKeeper,
        tournament.worldId.toString(),
        tournament._id.toString()
      )

      console.log(`✅ Updated player stats for qualification match: ${homeCountryCode} vs ${awayCountryCode}`)

    } catch (error) {
      console.error('Error updating player stats for qualification match:', error)
    }
  }
}

export default new QualificationService()