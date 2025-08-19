import fs from 'fs/promises'
import path from 'path'

class DataManagementService {
  constructor() {
    this.dataPath = path.join(process.cwd(), 'data')
  }

  // Helper method to get country code by name
  getCountryCodeByName(countryName) {
    // Common country name to code mappings
    const countryMap = {
      'Uruguay': 'URU', 'Argentina': 'ARG', 'Italy': 'ITA', 'Czechoslovakia': 'CZE',
      'France': 'FRA', 'Hungary': 'HUN', 'Brazil': 'BRA', 'Switzerland': 'SUI',
      'West Germany': 'GER', 'Germany': 'GER', 'Sweden': 'SWE', 'England': 'ENG',
      'Mexico': 'MEX', 'Netherlands': 'NED', 'Spain': 'ESP', 'South Africa': 'RSA',
      'Russia': 'RUS', 'Qatar': 'QAT', 'USA': 'USA', 'Canada': 'CAN'
    }
    return countryMap[countryName] || 'UNK'
  }

  // Generic method to read any data file
  async readDataFile(filename) {
    try {
      const filePath = path.join(this.dataPath, filename)
      
      // Import the data file directly using dynamic import
      const { default: defaultExport, ...namedExports } = await import(`file://${filePath}`)
      
      // Return the first named export or default export
      const exportKeys = Object.keys(namedExports)
      if (exportKeys.length > 0) {
        return namedExports[exportKeys[0]]
      }
      return defaultExport || []
    } catch (error) {
      console.error(`Error reading ${filename}:`, error)
      throw new Error(`Failed to read ${filename}`)
    }
  }

  // Generic method to write any data file
  async writeDataFile(filename, data, exportName) {
    try {
      const filePath = path.join(this.dataPath, filename)
      const content = `export const ${exportName} = ${JSON.stringify(data, null, 2)}\n`
      await fs.writeFile(filePath, content, 'utf8')
      return true
    } catch (error) {
      console.error(`Error writing ${filename}:`, error)
      throw new Error(`Failed to write ${filename}`)
    }
  }

  // Countries management
  async getCountries() {
    return await this.readDataFile('countries.js')
  }

  async updateCountries(countries) {
    return await this.writeDataFile('countries.js', countries, 'countries')
  }

  async addCountry(country) {
    const countries = await this.getCountries()
    
    // Check for duplicate code
    if (countries.find(c => c.code === country.code)) {
      throw new Error('Country code already exists')
    }
    
    countries.push(country)
    
    // Sort by world ranking
    countries.sort((a, b) => (a.worldRanking || 999) - (b.worldRanking || 999))
    
    return await this.updateCountries(countries)
  }

  async updateCountry(code, updates) {
    const countries = await this.getCountries()
    const index = countries.findIndex(c => c.code === code)
    
    if (index === -1) {
      throw new Error('Country not found')
    }
    
    countries[index] = { ...countries[index], ...updates }
    
    // Re-sort by world ranking if it was updated
    if (updates.worldRanking !== undefined) {
      countries.sort((a, b) => (a.worldRanking || 999) - (b.worldRanking || 999))
    }
    
    return await this.updateCountries(countries)
  }

  async deleteCountry(code) {
    const countries = await this.getCountries()
    const filteredCountries = countries.filter(c => c.code !== code)
    
    if (filteredCountries.length === countries.length) {
      throw new Error('Country not found')
    }
    
    return await this.updateCountries(filteredCountries)
  }

  // Confederations management
  async getConfederations() {
    return await this.readDataFile('confederations.js')
  }

  async updateConfederations(confederations) {
    return await this.writeDataFile('confederations.js', confederations, 'confederations')
  }

  async updateConfederation(id, updates) {
    const confederations = await this.getConfederations()
    const index = confederations.findIndex(c => c.id === id)
    
    if (index === -1) {
      throw new Error('Confederation not found')
    }
    
    confederations[index] = { ...confederations[index], ...updates }
    return await this.updateConfederations(confederations)
  }

  // Cities management
  async getCities() {
    const citiesData = await this.readDataFile('cities.js')
    
    // Transform countryCities object to array format for the admin
    if (citiesData && typeof citiesData === 'object' && !Array.isArray(citiesData)) {
      const citiesArray = []
      let id = 1
      
      for (const [countryCode, data] of Object.entries(citiesData)) {
        const cities = data.cities || []
        for (const cityName of cities) {
          citiesArray.push({
            id: id++,
            name: cityName,
            country: countryCode,
            isCapital: cityName === data.capital,
            capital: data.capital
          })
        }
      }
      
      return citiesArray
    }
    
    return citiesData || []
  }

  async updateCities(cities) {
    // Transform array format back to countryCities object format
    const countryCities = {}
    
    for (const city of cities) {
      const countryCode = city.country
      if (!countryCities[countryCode]) {
        countryCities[countryCode] = {
          capital: city.capital || city.name,
          cities: []
        }
      }
      
      if (!countryCities[countryCode].cities.includes(city.name)) {
        countryCities[countryCode].cities.push(city.name)
      }
      
      // Set capital if this city is marked as capital
      if (city.isCapital) {
        countryCities[countryCode].capital = city.name
      }
    }
    
    return await this.writeDataFile('cities.js', countryCities, 'countryCities')
  }

  async addCity(city) {
    const cities = await this.getCities()
    
    // Check for duplicate
    if (cities.find(c => c.name === city.name && c.country === city.country)) {
      throw new Error('City already exists in this country')
    }
    
    cities.push(city)
    cities.sort((a, b) => a.country.localeCompare(b.country) || a.name.localeCompare(b.name))
    
    return await this.updateCities(cities)
  }

  async updateCity(id, updates) {
    const cities = await this.getCities()
    const index = cities.findIndex(c => c.id === id)
    
    if (index === -1) {
      throw new Error('City not found')
    }
    
    cities[index] = { ...cities[index], ...updates }
    return await this.updateCities(cities)
  }

  async deleteCity(id) {
    const cities = await this.getCities()
    const filteredCities = cities.filter(c => c.id !== id)
    
    if (filteredCities.length === cities.length) {
      throw new Error('City not found')
    }
    
    return await this.updateCities(filteredCities)
  }

  // Tactics management
  async getTactics() {
    return await this.readDataFile('tactics.js')
  }

  async updateTactics(tactics) {
    return await this.writeDataFile('tactics.js', tactics, 'formations')
  }

  async addTactic(formation) {
    const tactics = await this.getTactics()
    
    if (tactics.find(t => t.name === formation.name)) {
      throw new Error('Formation already exists')
    }
    
    tactics.push(formation)
    return await this.updateTactics(tactics)
  }

  async updateTactic(name, updates) {
    const tactics = await this.getTactics()
    const index = tactics.findIndex(t => t.name === name)
    
    if (index === -1) {
      throw new Error('Formation not found')
    }
    
    tactics[index] = { ...tactics[index], ...updates }
    return await this.updateTactics(tactics)
  }

  async deleteTactic(name) {
    const tactics = await this.getTactics()
    const filteredTactics = tactics.filter(t => t.name !== name)
    
    if (filteredTactics.length === tactics.length) {
      throw new Error('Formation not found')
    }
    
    return await this.updateTactics(filteredTactics)
  }

  // World Cup History management
  async getWorldCupHistory() {
    const historyData = await this.readDataFile('worldCupHistory.js')
    
    // Transform the existing structure to admin-friendly format
    if (Array.isArray(historyData)) {
      return historyData.map(entry => ({
        year: entry.year,
        name: `${entry.year} FIFA World Cup`,
        hostCountries: entry.host ? [entry.host.name] : [],
        winner: entry.winner,
        runnerUp: entry.runnerUp,
        totalTeams: entry.teams,
        final: entry.final,
        // Add some mock data for missing fields
        totalMatches: entry.teams ? Math.floor(entry.teams * 2.5) : null,
        totalGoals: entry.teams ? Math.floor(entry.teams * 7) : null,
        totalAttendance: entry.teams ? Math.floor(entry.teams * 50000) : null
      }))
    }
    
    return historyData || []
  }

  async updateWorldCupHistory(history) {
    // Transform back to original format
    const originalFormat = history.map(entry => ({
      year: entry.year,
      host: entry.hostCountries && entry.hostCountries.length > 0 ? 
        { name: entry.hostCountries[0], code: this.getCountryCodeByName(entry.hostCountries[0]) } : 
        null,
      winner: entry.winner,
      runnerUp: entry.runnerUp,
      final: entry.final || {},
      teams: entry.totalTeams
    }))
    
    return await this.writeDataFile('worldCupHistory.js', originalFormat, 'worldCupHistory')
  }

  async addWorldCupEntry(entry) {
    const history = await this.getWorldCupHistory()
    
    if (history.find(h => h.year === entry.year)) {
      throw new Error('World Cup entry for this year already exists')
    }
    
    history.push(entry)
    history.sort((a, b) => b.year - a.year) // Sort by year descending
    
    return await this.updateWorldCupHistory(history)
  }

  async updateWorldCupEntry(year, updates) {
    const history = await this.getWorldCupHistory()
    const index = history.findIndex(h => h.year === year)
    
    if (index === -1) {
      throw new Error('World Cup entry not found')
    }
    
    history[index] = { ...history[index], ...updates }
    return await this.updateWorldCupHistory(history)
  }

  async deleteWorldCupEntry(year) {
    const history = await this.getWorldCupHistory()
    const filteredHistory = history.filter(h => h.year !== year)
    
    if (filteredHistory.length === history.length) {
      throw new Error('World Cup entry not found')
    }
    
    return await this.updateWorldCupHistory(filteredHistory)
  }

  // Player Names management
  async getPlayerNames() {
    try {
      const filePath = path.join(this.dataPath, 'playerNames.js')
      const { playerNames } = await import(`file://${filePath}`)
      return playerNames || {}
    } catch (error) {
      console.error('Error reading player names:', error)
      return {}
    }
  }

  async updatePlayerNames(playerNames) {
    return await this.writeDataFile('playerNames.js', playerNames, 'playerNames')
  }

  async addPlayerNamesRegion(region, names) {
    const playerNames = await this.getPlayerNames()
    
    if (playerNames[region]) {
      throw new Error('Region already exists')
    }
    
    playerNames[region] = names
    return await this.updatePlayerNames(playerNames)
  }

  async updatePlayerNamesRegion(region, names) {
    const playerNames = await this.getPlayerNames()
    
    if (!playerNames[region]) {
      throw new Error('Region not found')
    }
    
    playerNames[region] = names
    return await this.updatePlayerNames(playerNames)
  }

  async deletePlayerNamesRegion(region) {
    const playerNames = await this.getPlayerNames()
    
    if (!playerNames[region]) {
      throw new Error('Region not found')
    }
    
    delete playerNames[region]
    return await this.updatePlayerNames(playerNames)
  }

  // Backup and restore functionality
  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupData = {
      timestamp,
      countries: await this.getCountries(),
      confederations: await this.getConfederations(),
      cities: await this.getCities(),
      tactics: await this.getTactics(),
      worldCupHistory: await this.getWorldCupHistory(),
      playerNames: await this.getPlayerNames()
    }
    
    const backupPath = path.join(this.dataPath, `backup-${timestamp}.json`)
    await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2), 'utf8')
    
    return backupPath
  }

  async restoreBackup(backupData) {
    // Validate backup data structure
    const requiredFields = ['countries', 'confederations', 'cities', 'tactics', 'worldCupHistory', 'playerNames']
    for (const field of requiredFields) {
      if (!backupData[field]) {
        throw new Error(`Invalid backup: missing ${field}`)
      }
    }

    // Restore all data files
    await this.updateCountries(backupData.countries)
    await this.updateConfederations(backupData.confederations)
    await this.updateCities(backupData.cities)
    await this.updateTactics(backupData.tactics)
    await this.updateWorldCupHistory(backupData.worldCupHistory)
    await this.updatePlayerNames(backupData.playerNames)

    return true
  }

  // Get all data overview
  async getDataOverview() {
    try {
      const [countries, confederations, cities, tactics, history, playerNames] = await Promise.all([
        this.getCountries(),
        this.getConfederations(),
        this.getCities(),
        this.getTactics(),
        this.getWorldCupHistory(),
        this.getPlayerNames()
      ])

      return {
        countries: {
          count: countries.length,
          confederations: [...new Set(countries.map(c => c.confederation))].length
        },
        confederations: {
          count: confederations.length,
          totalSlots: confederations.reduce((sum, c) => sum + (c.qualificationSlots || 0), 0)
        },
        cities: {
          count: cities.length,
          countries: [...new Set(cities.map(c => c.country))].length
        },
        tactics: {
          count: tactics.length,
          formations: tactics.map(t => t.name)
        },
        worldCupHistory: {
          count: history.length,
          yearRange: history.length > 0 ? {
            earliest: Math.min(...history.map(h => h.year)),
            latest: Math.max(...history.map(h => h.year))
          } : null
        },
        playerNames: {
          regions: Object.keys(playerNames).length,
          totalNames: Object.values(playerNames).reduce((sum, names) => {
            return sum + (names.firstNames?.length || 0) + (names.lastNames?.length || 0)
          }, 0)
        }
      }
    } catch (error) {
      console.error('Error getting data overview:', error)
      throw error
    }
  }
}

export default new DataManagementService()