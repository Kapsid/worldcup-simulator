import { confederations } from '../../data/confederations.js'
import { countries } from '../../data/countries.js'

// Create a ranking lookup map for faster access
const rankingLookup = new Map()
countries.forEach(country => {
  rankingLookup.set(country.name, country.fifaRanking || 999)
})

class TeamGenerationService {
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

  // Get team ranking for match calculations
  getTeamRanking(teamName) {
    return rankingLookup.get(teamName) || 999
  }

  // Get confederation info
  getConfederationInfo(confederationId) {
    return confederations.find(c => c.id === confederationId)
  }

  // Get all confederations
  getAllConfederations() {
    return confederations
  }

  // Get countries for a confederation
  getConfederationCountries(confederationId) {
    return countries.filter(country => country.confederation === confederationId)
  }

  // Get country by code
  getCountryByCode(countryCode) {
    return countries.find(country => country.code === countryCode)
  }

  // Get country by name
  getCountryByName(countryName) {
    return countries.find(country => country.name === countryName)
  }
}

export default new TeamGenerationService()