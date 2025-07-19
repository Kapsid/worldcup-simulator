import World from '../models/World.js'
import { countries } from '../data/countries.js'

class WorldRankingService {
  
  // Initialize world rankings with base FIFA rankings
  async initializeWorldRankings(worldId) {
    try {
      const world = await World.findById(worldId)
      if (!world) {
        throw new Error('World not found')
      }

      if (world.countryRankings && world.countryRankings.length > 0) {
        console.log('World rankings already initialized')
        return world.countryRankings
      }

      // Initialize with FIFA rankings but convert to world-specific points
      const initialRankings = countries.map(country => {
        // Convert FIFA ranking to points (1st = 2000, 50th = 1500, 100th = 1000, etc.)
        const basePoints = Math.max(800, 2200 - (country.fifaRanking * 8))
        
        return {
          code: country.code,
          name: country.name,
          flag: country.flag,
          points: basePoints,
          previousPoints: basePoints,
          rank: country.fifaRanking,
          previousRank: country.fifaRanking,
          rankChange: 0,
          confederation: country.confederation,
          tournamentHistory: []
        }
      })

      // Sort by points and assign ranks
      initialRankings.sort((a, b) => b.points - a.points)
      initialRankings.forEach((country, index) => {
        country.rank = index + 1
        country.previousRank = index + 1
      })

      world.countryRankings = initialRankings
      await world.save()

      console.log('Initialized world rankings for', world.name, 'with', initialRankings.length, 'countries')
      return initialRankings
    } catch (error) {
      console.error('Error initializing world rankings:', error)
      throw error
    }
  }

  // Calculate points based on tournament performance
  calculatePerformancePoints(performance, tournamentYear, worldBeginningYear) {
    const basePoints = {
      'group': 50,
      'round16': 120,
      'quarter': 200,
      'semi': 350,
      'final': 500,
      'winner': 750
    }

    // Bonus for recent tournaments (more weight for newer tournaments)
    const yearsSinceStart = tournamentYear - worldBeginningYear
    const recencyMultiplier = Math.max(0.8, 1.0 - (yearsSinceStart * 0.02))

    return Math.round(basePoints[performance] * recencyMultiplier)
  }

  // Calculate points from qualification results
  calculateQualificationPoints(qualificationStats) {
    const { wins, draws, losses, goalsFor, goalsAgainst, qualified } = qualificationStats
    
    // Base points for match results
    const winPoints = wins * 8
    const drawPoints = draws * 4
    const lossPoints = losses * -2
    
    // Goal difference bonus/penalty (capped at ±50)
    const goalDifference = goalsFor - goalsAgainst
    const goalDiffPoints = Math.max(-50, Math.min(50, goalDifference * 2))
    
    // Qualification bonus
    const qualificationBonus = qualified ? 40 : -20
    
    // Total qualification points (with 0.5 weight to make it less impactful than tournament performance)
    const totalPoints = (winPoints + drawPoints + lossPoints + goalDiffPoints + qualificationBonus) * 0.5
    
    return Math.round(totalPoints)
  }

  // Update rankings after tournament completion  
  async updateRankingsAfterTournament(worldId, tournamentResults, qualificationResults = null) {
    try {
      const world = await World.findById(worldId)
      if (!world) {
        throw new Error('World not found')
      }

      // Initialize rankings if not already done
      if (!world.countryRankings || world.countryRankings.length === 0) {
        await this.initializeWorldRankings(worldId)
        // Reload world after initialization
        const updatedWorld = await World.findById(worldId)
        world.countryRankings = updatedWorld.countryRankings
      }

      console.log('Updating rankings after tournament for world:', world.name)

      // Store previous points and ranks
      world.countryRankings.forEach(country => {
        country.previousPoints = country.points
        country.previousRank = country.rank
      })

      // Apply points from qualification if available
      if (qualificationResults && qualificationResults.length > 0) {
        console.log('Applying qualification points...')
        for (const qualResult of qualificationResults) {
          const country = world.countryRankings.find(c => c.code === qualResult.countryCode)
          if (country) {
            const qualPoints = this.calculateQualificationPoints(qualResult)
            country.points += qualPoints
            console.log(`${country.name}: +${qualPoints} qualification points (W:${qualResult.wins} D:${qualResult.draws} L:${qualResult.losses})`)
          }
        }
      }

      // Apply points based on tournament results
      for (const result of tournamentResults) {
        const country = world.countryRankings.find(c => c.code === result.countryCode)
        if (country) {
          const pointsEarned = this.calculatePerformancePoints(
            result.performance, 
            result.year, 
            world.beginningYear
          )
          
          country.points += pointsEarned
          
          // Add to tournament history
          country.tournamentHistory.push({
            year: result.year,
            performance: result.performance,
            pointsEarned: pointsEarned
          })

          // Keep only last 10 tournaments in history
          if (country.tournamentHistory.length > 10) {
            country.tournamentHistory = country.tournamentHistory.slice(-10)
          }

          console.log(`Updated ${country.name}: ${country.previousPoints} -> ${country.points} (+${pointsEarned} for ${result.performance})`)
        }
      }

      // Recalculate ranks
      world.countryRankings.sort((a, b) => b.points - a.points)
      world.countryRankings.forEach((country, index) => {
        const newRank = index + 1
        country.rankChange = country.previousRank - newRank
        country.rank = newRank
      })

      await world.save()

      console.log('Rankings updated successfully')
      return world.countryRankings
    } catch (error) {
      console.error('Error updating rankings:', error)
      throw error
    }
  }

  // Extract qualification results from qualification data
  async extractQualificationResults(qualificationId) {
    try {
      const Qualification = (await import('../models/Qualification.js')).default
      const qualification = await Qualification.findById(qualificationId)
      
      if (!qualification) {
        console.log('No qualification data found')
        return []
      }

      const results = []
      
      // Process each confederation
      for (const confederation of qualification.confederations) {
        // Process each group in the confederation
        for (const group of confederation.groups) {
          // Process each team in the group
          for (const team of group.teams) {
            // Extract country code from teamId (format: "confederationId_countryCode")
            const countryCode = team.teamId.split('_')[1]
            
            // Check if this team qualified
            const qualified = confederation.qualifiedTeams?.some(qt => qt.teamId === team.teamId) || false
            
            results.push({
              countryCode,
              wins: team.won || 0,
              draws: team.drawn || 0,
              losses: team.lost || 0,
              goalsFor: team.goalsFor || 0,
              goalsAgainst: team.goalsAgainst || 0,
              qualified
            })
          }
        }
      }
      
      console.log(`Extracted qualification results for ${results.length} teams`)
      return results
    } catch (error) {
      console.error('Error extracting qualification results:', error)
      return []
    }
  }

  // Generate mock tournament results for testing
  generateMockTournamentResults(tournamentYear, winner, runnerUp, hostCountry) {
    const performances = [
      { countryCode: winner.code, performance: 'winner' },
      { countryCode: runnerUp.code, performance: 'final' },
    ]

    // Add some random countries with various performances
    const otherCountries = countries
      .filter(c => c.code !== winner.code && c.code !== runnerUp.code)
      .slice(0, 30) // Top 30 other countries

    // Semi-finalists
    for (let i = 0; i < 2; i++) {
      if (otherCountries[i]) {
        performances.push({
          countryCode: otherCountries[i].code,
          performance: 'semi'
        })
      }
    }

    // Quarter-finalists
    for (let i = 2; i < 6; i++) {
      if (otherCountries[i]) {
        performances.push({
          countryCode: otherCountries[i].code,
          performance: 'quarter'
        })
      }
    }

    // Round of 16
    for (let i = 6; i < 14; i++) {
      if (otherCountries[i]) {
        performances.push({
          countryCode: otherCountries[i].code,
          performance: 'round16'
        })
      }
    }

    // Group stage participants
    for (let i = 14; i < 30; i++) {
      if (otherCountries[i]) {
        performances.push({
          countryCode: otherCountries[i].code,
          performance: 'group'
        })
      }
    }

    // Add year to all results
    return performances.map(p => ({ ...p, year: tournamentYear }))
  }

  // Get rankings for a world
  async getWorldRankings(worldId) {
    try {
      const world = await World.findById(worldId)
      if (!world) {
        throw new Error('World not found')
      }

      if (!world.countryRankings || world.countryRankings.length === 0) {
        return await this.initializeWorldRankings(worldId)
      }

      return world.countryRankings.sort((a, b) => a.rank - b.rank)
    } catch (error) {
      console.error('Error getting world rankings:', error)
      throw error
    }
  }

  // Get host candidates with improved algorithm
  async getHostCandidates(worldId, excludeLastHosts = 2) {
    try {
      const world = await World.findById(worldId)
      if (!world) {
        throw new Error('World not found')
      }

      const rankings = await this.getWorldRankings(worldId)
      
      // Get last host countries to exclude
      const recentHosts = []
      if (world.simulatedHistory && world.simulatedHistory.length > 0) {
        const sortedHistory = world.simulatedHistory.sort((a, b) => b.year - a.year)
        for (let i = 0; i < Math.min(excludeLastHosts, sortedHistory.length); i++) {
          recentHosts.push(sortedHistory[i].host.code)
        }
      }

      console.log('Excluding recent hosts:', recentHosts)

      // Filter eligible countries (exclude recent hosts)
      const eligibleCountries = rankings.filter(country => 
        !recentHosts.includes(country.code)
      )

      // Select 3-8 candidates with bias toward lower-ranked countries
      const candidateCount = Math.floor(Math.random() * 6) + 3 // 3-8 candidates
      const candidates = []

      // Create weighted selection (lower rank = higher chance)
      const maxRank = eligibleCountries.length
      const weights = eligibleCountries.map((country, index) => {
        // Inverse ranking weight - rank 50 gets higher weight than rank 1
        const rankWeight = (maxRank - country.rank + 1) / maxRank
        // Add random factor for variety
        const randomFactor = 0.3 + Math.random() * 0.7
        return rankWeight * randomFactor
      })

      // Select candidates based on weights
      for (let i = 0; i < candidateCount; i++) {
        if (eligibleCountries.length === 0) break

        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
        let random = Math.random() * totalWeight
        
        let selectedIndex = 0
        for (let j = 0; j < weights.length; j++) {
          random -= weights[j]
          if (random <= 0) {
            selectedIndex = j
            break
          }
        }

        const selectedCountry = eligibleCountries[selectedIndex]
        
        // Calculate win chance based on ranking and random factors
        const rankFactor = (maxRank - selectedCountry.rank + 1) / maxRank
        const baseChance = 100 / candidateCount
        const rankBonus = rankFactor * 30 - 15 // Range: -15 to +15
        const randomBonus = (Math.random() - 0.5) * 20 // Range: -10 to +10
        
        const winChance = Math.max(5, Math.min(50, baseChance + rankBonus + randomBonus))

        candidates.push({
          ...selectedCountry,
          winChance: Math.round(winChance)
        })

        // Remove selected country and its weight
        eligibleCountries.splice(selectedIndex, 1)
        weights.splice(selectedIndex, 1)
      }

      console.log('Selected host candidates:', candidates.map(c => `${c.name} (Rank: ${c.rank}, Chance: ${c.winChance}%)`))
      
      return candidates
    } catch (error) {
      console.error('Error getting host candidates:', error)
      throw error
    }
  }
}

export default new WorldRankingService()