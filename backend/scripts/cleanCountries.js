import { countries } from '../data/countries.js'
import fs from 'fs'

// Create a map to store unique countries by code
const uniqueCountriesMap = new Map()

// Process each country, keeping the most complete version
countries.forEach(country => {
  const existing = uniqueCountriesMap.get(country.code)
  
  if (!existing) {
    // First occurrence, just add it
    uniqueCountriesMap.set(country.code, country)
  } else {
    // Merge data, preferring non-null values
    const merged = {
      ...existing,
      ...country,
      // Keep existing values if new ones are undefined
      capital: country.capital || existing.capital,
      population: country.population || existing.population,
      confederation: country.confederation || existing.confederation,
      fifaRanking: country.fifaRanking || existing.fifaRanking
    }
    uniqueCountriesMap.set(country.code, merged)
  }
})

// Convert map to array and sort by FIFA ranking
const uniqueCountries = Array.from(uniqueCountriesMap.values())
  .sort((a, b) => (a.fifaRanking || 999) - (b.fifaRanking || 999))

// Generate the new countries.js content
const fileContent = `export const countries = ${JSON.stringify(uniqueCountries, null, 2)}

export const getCountryByCode = (code) => {
  return countries.find(country => country.code === code)
}

export const getCountryByName = (name) => {
  return countries.find(country => country.name.toLowerCase() === name.toLowerCase())
}

export const getTopRankedTeams = (count = 32, excludeHost = null) => {
  let topTeams = countries
    .filter(country => !excludeHost || country.code !== excludeHost)
    .sort((a, b) => a.fifaRanking - b.fifaRanking)
    .slice(0, count)
  
  return topTeams
}

export const getBest31PlusHost = (hostCountryCode) => {
  const hostCountry = getCountryByCode(hostCountryCode)
  if (!hostCountry) return []
  
  // Get top 31 teams excluding host
  const top31 = getTopRankedTeams(31, hostCountryCode)
  
  // Check if host is already in top 31
  const hostInTop31 = top31.some(team => team.code === hostCountryCode)
  
  if (hostInTop31) {
    // Host is in top 31, so get top 32
    return getTopRankedTeams(32)
  } else {
    // Host not in top 31, so add host to the list
    return [...top31, hostCountry]
  }
}
`

// Write the cleaned file
fs.writeFileSync('../data/countries.js', fileContent, 'utf8')

console.log(`Cleaned countries data:`)
console.log(`- Original: ${countries.length} entries`)
console.log(`- Unique: ${uniqueCountries.length} countries`)
console.log(`- Removed: ${countries.length - uniqueCountries.length} duplicates`)

// Verify all confederations have teams
const confederationCounts = {}
uniqueCountries.forEach(country => {
  if (country.confederation) {
    confederationCounts[country.confederation] = (confederationCounts[country.confederation] || 0) + 1
  }
})

console.log('\nCountries per confederation:')
Object.entries(confederationCounts).forEach(([conf, count]) => {
  console.log(`- ${conf.toUpperCase()}: ${count} countries`)
})