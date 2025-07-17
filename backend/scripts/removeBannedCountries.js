import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { countries } from '../data/countries.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Countries to remove
const bannedCountries = ['Russia', 'Belarus', 'Monaco']

// Filter out banned countries
const filteredCountries = countries.filter(country => 
  !bannedCountries.includes(country.name)
)

console.log(`Original countries: ${countries.length}`)
console.log(`Countries after removal: ${filteredCountries.length}`)
console.log(`Removed: ${countries.length - filteredCountries.length} countries`)

// Write the updated countries data
const outputPath = path.join(__dirname, '../data/countries.js')
const content = `export const countries = ${JSON.stringify(filteredCountries, null, 2)}`

fs.writeFileSync(outputPath, content)

console.log('\nRemoved countries:')
bannedCountries.forEach(name => {
  const country = countries.find(c => c.name === name)
  if (country) {
    console.log(`- ${country.name} (${country.code}) - ${country.confederation}`)
  }
})

console.log('\nCountries data updated successfully!')