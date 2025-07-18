class MatchSchedulingService {
  // Generate round-robin matches with equal match distribution
  generateRoundRobinMatches(teams, confederationId, groupId, homeAwayMatches = false) {
    const matches = []
    const numTeams = teams.length
    
    if (numTeams < 2) return matches
    
    // If home/away matches, play each team twice
    const rounds = homeAwayMatches ? 2 : 1
    
    for (let round = 0; round < rounds; round++) {
      const roundMatches = this.generateSingleRoundRobin(teams, confederationId, groupId, round)
      matches.push(...roundMatches)
    }
    
    // Assign matchdays using circle method for even distribution
    return this.assignMatchdays(matches, numTeams, homeAwayMatches)
  }

  // Generate single round-robin matches
  generateSingleRoundRobin(teams, confederationId, groupId, round = 0) {
    const matches = []
    const numTeams = teams.length
    
    if (numTeams < 2) return matches
    
    // Handle odd number of teams by adding a "bye" team
    const workingTeams = [...teams]
    if (numTeams % 2 === 1) {
      workingTeams.push({ name: 'BYE', isBye: true })
    }
    
    const totalTeams = workingTeams.length
    const totalRounds = totalTeams - 1
    
    for (let matchday = 0; matchday < totalRounds; matchday++) {
      const roundMatches = this.generateMatchdayFixtures(
        workingTeams, 
        matchday, 
        confederationId, 
        groupId, 
        round
      )
      matches.push(...roundMatches)
    }
    
    return matches.filter(match => !match.homeTeam.isBye && !match.awayTeam.isBye)
  }

  // Generate fixtures for a specific matchday using circle method
  generateMatchdayFixtures(teams, matchday, confederationId, groupId, round = 0) {
    const matches = []
    const numTeams = teams.length
    
    // Fixed team (usually team 0) stays in position
    const fixedTeam = teams[0]
    const rotatingTeams = teams.slice(1)
    
    // Rotate teams for this matchday
    const rotatedTeams = this.rotateArray(rotatingTeams, matchday)
    const allTeams = [fixedTeam, ...rotatedTeams]
    
    // Pair teams for matches
    const halfTeams = numTeams / 2
    for (let i = 0; i < halfTeams; i++) {
      const homeTeam = allTeams[i]
      const awayTeam = allTeams[numTeams - 1 - i]
      
      // Skip if either team is a bye
      if (homeTeam.isBye || awayTeam.isBye) continue
      
      // For round 1 (second leg), swap home/away
      const actualHomeTeam = round === 1 ? awayTeam : homeTeam
      const actualAwayTeam = round === 1 ? homeTeam : awayTeam
      
      matches.push({
        matchId: `${groupId}_${matchday + 1}_${i + 1}_${round}`,
        homeTeam: actualHomeTeam,
        awayTeam: actualAwayTeam,
        homeScore: 0,
        awayScore: 0,
        played: false,
        matchday: matchday + 1 + (round * (numTeams - 1)),
        groupId: groupId,
        confederationId: confederationId
      })
    }
    
    return matches
  }

  // Assign matchdays to ensure even distribution
  assignMatchdays(matches, numTeams, homeAwayMatches = false) {
    const totalMatchdays = homeAwayMatches ? 2 * (numTeams - 1) : (numTeams - 1)
    
    // Group matches by their calculated matchday
    const matchdayGroups = new Map()
    
    matches.forEach(match => {
      const matchday = match.matchday
      if (!matchdayGroups.has(matchday)) {
        matchdayGroups.set(matchday, [])
      }
      matchdayGroups.get(matchday).push(match)
    })
    
    // Return matches with properly assigned matchdays
    return matches.map(match => ({
      ...match,
      matchday: Math.min(match.matchday, totalMatchdays)
    }))
  }

  // Rotate array by specified positions
  rotateArray(array, positions) {
    const len = array.length
    if (len === 0) return array
    
    const rotateBy = positions % len
    return array.slice(rotateBy).concat(array.slice(0, rotateBy))
  }

  // Generate matches for CONCACAF multi-round system
  generateCONCACAFMatches(teams, confederationId, phase = 1) {
    const matches = []
    
    if (phase === 1) {
      // First phase: groups of 4-5 teams, each play 2 matches
      const groupSize = teams.length <= 20 ? 4 : 5
      const numGroups = Math.ceil(teams.length / groupSize)
      
      for (let groupIndex = 0; groupIndex < numGroups; groupIndex++) {
        const startIndex = groupIndex * groupSize
        const groupTeams = teams.slice(startIndex, startIndex + groupSize)
        const groupId = `concacaf_phase1_group_${groupIndex + 1}`
        
        // Generate limited matches (each team plays 2 matches)
        const groupMatches = this.generateLimitedRoundRobin(
          groupTeams, 
          confederationId, 
          groupId, 
          2
        )
        matches.push(...groupMatches)
      }
    } else if (phase === 2) {
      // Second phase: best teams from phase 1 in new groups
      const groupSize = 4
      const numGroups = Math.ceil(teams.length / groupSize)
      
      for (let groupIndex = 0; groupIndex < numGroups; groupIndex++) {
        const startIndex = groupIndex * groupSize
        const groupTeams = teams.slice(startIndex, startIndex + groupSize)
        const groupId = `concacaf_phase2_group_${groupIndex + 1}`
        
        // Full round-robin for phase 2
        const groupMatches = this.generateRoundRobinMatches(
          groupTeams, 
          confederationId, 
          groupId, 
          false
        )
        matches.push(...groupMatches)
      }
    }
    
    return matches
  }

  // Generate limited round-robin (each team plays specified number of matches)
  generateLimitedRoundRobin(teams, confederationId, groupId, matchesPerTeam) {
    const matches = []
    const numTeams = teams.length
    
    if (numTeams < 2) return matches
    
    // Create all possible pairings
    const allPairings = []
    for (let i = 0; i < numTeams; i++) {
      for (let j = i + 1; j < numTeams; j++) {
        allPairings.push([i, j])
      }
    }
    
    // Track how many matches each team has
    const teamMatchCounts = new Array(numTeams).fill(0)
    const selectedPairings = []
    
    // Select pairings to ensure each team plays the desired number of matches
    for (const [i, j] of allPairings) {
      if (teamMatchCounts[i] < matchesPerTeam && teamMatchCounts[j] < matchesPerTeam) {
        selectedPairings.push([i, j])
        teamMatchCounts[i]++
        teamMatchCounts[j]++
      }
    }
    
    // Generate matches from selected pairings
    selectedPairings.forEach(([i, j], index) => {
      matches.push({
        matchId: `${groupId}_${index + 1}`,
        homeTeam: teams[i],
        awayTeam: teams[j],
        homeScore: 0,
        awayScore: 0,
        played: false,
        matchday: Math.floor(index / Math.floor(numTeams / 2)) + 1,
        groupId: groupId,
        confederationId: confederationId
      })
    })
    
    return matches
  }

  // Get next available matchday for a confederation
  getNextMatchday(confederationMatches) {
    if (!confederationMatches || confederationMatches.length === 0) return 1
    
    // Find the highest existing matchday
    const maxMatchday = Math.max(...confederationMatches.map(m => m.matchday || 1))
    return maxMatchday + 1
  }

  // Check if a matchday is complete
  isMatchdayComplete(matches, matchday) {
    const matchdayMatches = matches.filter(m => m.matchday === matchday)
    return matchdayMatches.length > 0 && matchdayMatches.every(m => m.played)
  }

  // Get completed matchdays
  getCompletedMatchdays(matches) {
    const matchdays = [...new Set(matches.map(m => m.matchday))].sort((a, b) => a - b)
    return matchdays.filter(matchday => this.isMatchdayComplete(matches, matchday))
  }

  // Get available matchdays
  getAvailableMatchdays(matches) {
    return [...new Set(matches.map(m => m.matchday))].sort((a, b) => a - b)
  }
}

export default new MatchSchedulingService()