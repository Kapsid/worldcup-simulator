import { confederations } from '../../data/confederations.js'

class GroupGenerationService {
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
      const { numGroups, teamsPerGroup } = this.calculateOptimalGroupDistribution(
        confederationId, 
        totalTeams, 
        confederation.qualificationSlots
      )

      // Distribute teams into groups using ranking tiers with shuffling
      const distributedTeams = this.distributeTeamsIntoGroups(teams, numGroups, teamsPerGroup)

      // Create groups
      for (let i = 0; i < numGroups; i++) {
        const groupTeams = distributedTeams[i] || []
        groups.push({
          groupId: `${confederationId}_group_${i + 1}`,
          name: `Group ${String.fromCharCode(65 + i)}`,
          teams: groupTeams.map(team => ({
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
      }
    }

    return groups
  }

  // Calculate optimal group distribution
  calculateOptimalGroupDistribution(confederationId, totalTeams, qualificationSlots) {
    const minTeamsPerGroup = 4
    let numGroups, teamsPerGroup

    if (confederationId === 'uefa') {
      // UEFA: Prefer groups of 5-6 teams (more realistic)
      const preferredTeamsPerGroup = [5, 6]
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

    return { numGroups, teamsPerGroup }
  }

  // Distribute teams into groups using ranking tiers with shuffling
  distributeTeamsIntoGroups(teams, numGroups, teamsPerGroup) {
    const sortedTeams = [...teams].sort((a, b) => (a.ranking || 999) - (b.ranking || 999))
    const groups = Array(numGroups).fill(null).map(() => [])

    // Create ranking tiers based on the number of teams per tier
    const teamsPerTier = Math.ceil(sortedTeams.length / numGroups)
    const tiers = []
    
    for (let i = 0; i < sortedTeams.length; i += teamsPerTier) {
      const tier = sortedTeams.slice(i, i + teamsPerTier)
      // Shuffle teams within each tier for more realistic draws
      this.shuffleArray(tier)
      tiers.push(tier)
    }

    // Distribute teams from each tier to groups
    let groupIndex = 0
    for (const tier of tiers) {
      for (const team of tier) {
        groups[groupIndex].push(team)
        groupIndex = (groupIndex + 1) % numGroups
      }
    }

    return groups
  }

  // Shuffle array in place (Fisher-Yates algorithm)
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]
    }
  }

  // Generate match fixtures for a group
  generateGroupMatches(group, confederationId, homeAwayMatches = false) {
    const teams = group.teams
    const matches = []
    let matchId = 1
    
    if (homeAwayMatches) {
      // Generate home and away matches
      for (let i = 0; i < teams.length; i++) {
        for (let j = 0; j < teams.length; j++) {
          if (i !== j) {
            matches.push({
              matchId: `${group.groupId}_${matchId}`,
              homeTeam: teams[i],
              awayTeam: teams[j],
              homeScore: 0,
              awayScore: 0,
              played: false,
              matchday: Math.floor((matchId - 1) / (teams.length / 2)) + 1,
              groupId: group.groupId,
              confederationId: confederationId
            })
            matchId++
          }
        }
      }
    } else {
      // Generate single round-robin matches
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          matches.push({
            matchId: `${group.groupId}_${matchId}`,
            homeTeam: teams[i],
            awayTeam: teams[j],
            homeScore: 0,
            awayScore: 0,
            played: false,
            matchday: Math.floor((matchId - 1) / (teams.length / 2)) + 1,
            groupId: group.groupId,
            confederationId: confederationId
          })
          matchId++
        }
      }
    }
    
    return matches
  }
}

export default new GroupGenerationService()