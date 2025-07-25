<template>
  <div class="world-detail">
    <AppHeader 
      :username="username" 
      :subscription-tier="subscriptionTier"
      @logout="handleLogout" 
    />
    
    <Breadcrumbs :current-world="world" />
    
    <main class="main-content">
      <div class="world-container">
        <!-- World Header -->
        <div class="world-header">
          <div class="world-info">
            <button @click="goBack" class="back-btn">
              <i class="fas fa-arrow-left"></i>
              Back to Worlds
            </button>
            <h1>{{ world.name }}</h1>
            <div class="world-meta">
              <span class="world-year">{{ world.beginningYear }}</span>
              <span class="data-type">{{ world.useRealHistoricData ? 'Real Historic Data' : 'Simulated Data' }}</span>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <i class="fas fa-spinner fa-spin"></i>
          Loading world details...
        </div>

        <!-- Host Selection Phase -->
        <div v-else-if="currentPhase === 'host-selection'" class="phase-container">
          <div class="phase-header">
            <h2>
              <i class="fas fa-globe"></i>
              Host Selection Process
            </h2>
            <p>Select the host country for {{ world.beginningYear }} World Cup</p>
          </div>

          <!-- Step 1: Generate Candidates -->
          <div v-if="!candidates.length" class="step-container">
            <div class="step-info">
              <h3>Step 1: Generate Host Candidates</h3>
              <p>FIFA will select 3-8 candidate countries based on rankings and capabilities</p>
              <div v-if="excludedConfederation" class="confederation-notice">
                <i class="fas fa-info-circle"></i>
                Note: Countries from {{ getConfederationName(excludedConfederation) }} are excluded (previous host's confederation)
              </div>
            </div>
            <button @click="generateCandidates" :disabled="generatingCandidates" class="btn-primary">
              <i v-if="generatingCandidates" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-dice"></i>
              {{ generatingCandidates ? 'Generating...' : 'Generate Candidates' }}
            </button>
          </div>

          <!-- Step 2: Show Candidates -->
          <div v-else-if="!votingComplete" class="candidates-container">
            <div class="step-info">
              <h3>Step 2: Host Candidates</h3>
              <p>{{ candidates.length }} countries have been nominated to host the {{ world.beginningYear }} World Cup</p>
            </div>
            
            <div class="candidates-grid">
              <div v-for="candidate in candidates" :key="candidate.code" class="candidate-card glass-white">
                <div class="candidate-flag"><CountryFlag :country-code="candidate.code" :size="32" /></div>
                <div class="candidate-info">
                  <h4>{{ candidate.name }}</h4>
                  <div class="candidate-stats">
                    <span class="ranking">World Rank: #{{ candidate.rank || candidate.worldRanking || 'N/A' }}</span>
                    <span class="points">Points: {{ candidate.points || 1500 }}</span>
                    <span class="chance">Win Chance: {{ candidate.winChance }}%</span>
                  </div>
                </div>
              </div>
            </div>

            <button @click="simulateVoting" :disabled="voting" class="btn-primary vote-btn">
              <i v-if="voting" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-vote-yea"></i>
              {{ voting ? 'Voting in Progress...' : 'Simulate FIFA Vote' }}
            </button>
          </div>

          <!-- Step 3: Voting Results -->
          <div v-else class="voting-results">
            <div class="step-info">
              <h3>Step 3: Voting Results</h3>
              <p>The FIFA Congress has decided!</p>
            </div>

            <div class="winner-announcement">
              <div class="winner-card glass-white">
                <div class="winner-flag"><CountryFlag :country-code="selectedHost.code" :size="48" /></div>
                <div class="winner-info">
                  <h2>{{ selectedHost.name }}</h2>
                  <p>Will host the {{ world.beginningYear }} FIFA World Cup</p>
                  <div class="winner-stats">
                    <span>World Ranking: #{{ selectedHost.rank || selectedHost.fifaRanking || 'N/A' }}</span>
                    <span>Points: {{ selectedHost.points || 1500 }}</span>
                    <span>Vote Share: {{ selectedHost.voteShare }}%</span>
                  </div>
                </div>
              </div>
            </div>

            <button @click="proceedToTournament" class="btn-primary proceed-btn">
              <i class="fas fa-forward"></i>
              Generate {{ world.beginningYear }} World Cup
            </button>
          </div>
        </div>

        <!-- Tournament Management Phase -->
        <div v-else-if="currentPhase === 'tournament-management'" class="phase-container">
          <div class="tournament-tabs">
            <button 
              v-for="tab in tabs" 
              :key="tab.id"
              @click="activeTab = tab.id"
              class="tab-btn"
              :class="{ active: activeTab === tab.id }"
            >
              <i :class="tab.icon"></i>
              {{ tab.name }}
            </button>
          </div>

          <!-- Current Tournament Tab -->
          <div v-if="activeTab === 'current'" class="tab-content">
            <div class="tournaments-section">
              <div class="section-header">
                <h3>Current Tournament</h3>
                <button 
                  @click="generateNewTournament" 
                  :disabled="hasActiveTournament || generatingTournament"
                  class="btn-primary"
                  :class="{ 'disabled': hasActiveTournament }"
                >
                  <i v-if="generatingTournament" class="fas fa-spinner fa-spin"></i>
                  <i v-else class="fas fa-plus"></i>
                  {{ generatingTournament ? 'Generating...' : 'Generate Next Tournament' }}
                </button>
              </div>
              
              <div v-if="hasActiveTournament" class="tournament-restriction-notice">
                <i class="fas fa-info-circle"></i>
                <span>Complete the current tournament to generate the next World Cup</span>
              </div>
              
              <div v-if="!currentTournament" class="empty-section">
                <i class="fas fa-play-circle"></i>
                <p>No tournament in progress</p>
                <small>Generate a new tournament to get started</small>
              </div>
              
              <div v-else>
                <div class="tournament-item glass-white current-tournament">
                  <div class="tournament-header">
                    <div class="tournament-title">
                      <h4>{{ currentTournament.name }}</h4>
                      <span class="host-country"><CountryFlag :country-code="currentTournament.hostCountry.code" :size="20" /> {{ currentTournament.hostCountry.name }}</span>
                    </div>
                    <div class="tournament-status">
                      <span :class="`status-badge status-${currentTournament.status}`">
                        {{ formatStatus(currentTournament.status) }}
                      </span>
                    </div>
                  </div>
                  <div class="tournament-info">
                    <span class="tournament-year">{{ currentTournament.year }}</span>
                    <span class="tournament-teams">{{ currentTournament.teams || 32 }} teams</span>
                  </div>
                  <div class="tournament-actions">
                    <button @click="openTournament(currentTournament)" class="action-btn primary">
                      <i class="fas fa-play"></i>
                      Continue
                    </button>
                    <button 
                      @click="simulateCompletion(currentTournament)" 
                      class="action-btn secondary"
                      title="Simulate tournament completion (demo)"
                    >
                      <i class="fas fa-fast-forward"></i>
                      Complete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Past Tournaments Tab -->
          <div v-if="activeTab === 'past'" class="tab-content">
            <div class="tournaments-section">
              <div class="section-header">
                <h3>Past Tournaments</h3>
                <div class="history-stats">
                  <span>{{ pastTournaments.length }} tournaments completed</span>
                </div>
              </div>
              
              <div v-if="pastTournaments.length === 0" class="empty-section">
                <i class="fas fa-trophy"></i>
                <p>No completed tournaments yet</p>
                <small>Complete your first tournament to see it here</small>
              </div>
              
              <div v-else class="tournaments-list">
                <div v-for="tournament in pastTournaments" :key="tournament.id" class="tournament-item glass-white">
                  <div class="tournament-header">
                    <div class="tournament-title">
                      <h4>{{ tournament.name }}</h4>
                      <span class="host-country"><CountryFlag :country-code="tournament.hostCountry.code" :size="20" /> {{ tournament.hostCountry.name }}</span>
                    </div>
                    <div class="tournament-status">
                      <span :class="`status-badge status-${tournament.status}`">
                        {{ formatStatus(tournament.status) }}
                      </span>
                    </div>
                  </div>
                  <div class="tournament-info">
                    <span class="tournament-year">{{ tournament.year }}</span>
                    <span class="tournament-teams">{{ tournament.teams || 32 }} teams</span>
                  </div>
                  <div class="tournament-actions">
                    <button @click="openTournament(tournament)" class="action-btn primary">
                      <i class="fas fa-eye"></i>
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- History Tab -->
          <div v-if="activeTab === 'history'" class="tab-content">
            <div class="history-section">
              <div class="section-header">
                <h3>World Cup History</h3>
                <div class="history-stats">
                  <span>{{ worldCupHistory.length }} tournaments played</span>
                </div>
              </div>
              
              <div v-if="worldCupHistory.length === 0" class="empty-section">
                <i class="fas fa-history"></i>
                <p>No World Cup history yet</p>
                <small>Complete tournaments to build history</small>
              </div>
              
              <div v-else class="history-timeline">
                <div v-for="entry in sortedWorldCupHistory" :key="entry.year" class="history-item glass-white">
                  <div class="history-year">{{ entry.year }}</div>
                  <div class="history-details">
                    <div class="history-main">
                      <div class="winner-section">
                        <span class="winner-flag"><CountryFlag v-if="entry.winner?.code" :country-code="entry.winner.code" :size="24" /><span v-else>🏆</span></span>
                        <span class="winner-name">{{ entry.winner?.name || 'Unknown Winner' }}</span>
                        <span class="champion-badge">Champion</span>
                      </div>
                      <div class="host-section">
                        <span class="host-flag"><CountryFlag v-if="entry.host?.code" :country-code="entry.host.code" :size="20" /><span v-else>🏴</span></span>
                        <span class="host-name">{{ entry.host?.name || 'Unknown Host' }}</span>
                      </div>
                    </div>
                    <div class="history-meta" v-if="entry.final">
                      <span class="final-score">{{ entry.final.score }}</span>
                      <span class="vs-separator">vs</span>
                      <span class="runner-up" v-if="entry.runnerUp"><CountryFlag v-if="entry.runnerUp?.code" :country-code="entry.runnerUp.code" :size="20" /><span v-else>🥈</span> {{ entry.runnerUp?.name || 'Unknown Runner-up' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Hall of Fame Tab -->
          <div v-if="activeTab === 'hall-of-fame'" class="tab-content">
            <div class="hall-of-fame-section">
              <div class="section-header">
                <h3>Hall of Fame</h3>
                <div class="hall-stats">
                  <span>{{ uniqueWinners.length }} unique champions</span>
                </div>
              </div>
              
              <div v-if="championshipStats.length === 0" class="empty-section">
                <i class="fas fa-crown"></i>
                <p>No champions yet</p>
                <small>Complete tournaments to build the Hall of Fame</small>
              </div>
              
              <div v-else class="hall-of-fame-content">
                <!-- Champions Summary -->
                <div class="champions-summary">
                  <h4>Most Successful Nations</h4>
                  <div class="champions-grid">
                    <div v-for="champion in championshipStats" :key="champion.code" class="champion-card glass-white">
                      <div class="champion-flag"><CountryFlag :country-code="champion.code" :size="32" /></div>
                      <div class="champion-info">
                        <h5>{{ champion.name }}</h5>
                        <div class="champion-stats">
                          <div class="stat-item">
                            <i class="fas fa-trophy"></i>
                            <span class="stat-value">{{ champion.titles }}</span>
                            <span class="stat-label">{{ champion.titles === 1 ? 'Title' : 'Titles' }}</span>
                          </div>
                          <div class="stat-item">
                            <i class="fas fa-medal"></i>
                            <span class="stat-value">{{ champion.finals }}</span>
                            <span class="stat-label">{{ champion.finals === 1 ? 'Final' : 'Finals' }}</span>
                          </div>
                          <div class="stat-item" v-if="champion.years.length > 0">
                            <i class="fas fa-calendar"></i>
                            <span class="stat-value">{{ champion.years.join(', ') }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Quick Stats -->
                <div class="quick-stats">
                  <div class="stat-card glass-white">
                    <i class="fas fa-trophy"></i>
                    <div class="stat-info">
                      <span class="stat-number">{{ worldCupHistory.length }}</span>
                      <span class="stat-text">Tournaments</span>
                    </div>
                  </div>
                  <div class="stat-card glass-white">
                    <i class="fas fa-crown"></i>
                    <div class="stat-info">
                      <span class="stat-number">{{ uniqueWinners.length }}</span>
                      <span class="stat-text">Unique Winners</span>
                    </div>
                  </div>
                  <div class="stat-card glass-white">
                    <i class="fas fa-globe"></i>
                    <div class="stat-info">
                      <span class="stat-number">{{ uniqueHosts.length }}</span>
                      <span class="stat-text">Host Nations</span>
                    </div>
                  </div>
                  <div class="stat-card glass-white" v-if="mostSuccessfulCountry">
                    <i class="fas fa-star"></i>
                    <div class="stat-info">
                      <span class="stat-number"><CountryFlag :country-code="mostSuccessfulCountry.code" :size="24" /></span>
                      <span class="stat-text">Most Titles</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Rankings Tab -->
          <div v-if="activeTab === 'rankings'" class="tab-content">
            <div class="rankings-section">
              <div class="section-header">
                <h3>FIFA World Rankings</h3>
                <div class="rankings-info">
                  <span>Updated after each tournament</span>
                </div>
              </div>
              
              <div class="rankings-table">
                <div class="rankings-header">
                  <span class="rank-position">Rank</span>
                  <span class="rank-country">Country</span>
                  <span class="rank-points">Points</span>
                  <span class="rank-change">Change</span>
                </div>
                
                <div class="rankings-list">
                  <div v-for="(country, index) in countryRankings" :key="country.code" class="ranking-item">
                    <span class="rank-position">{{ country.rank || (index + 1) }}</span>
                    <div class="rank-country">
                      <span class="country-flag"><CountryFlag :country-code="country.code" :size="20" /></span>
                      <span class="country-name">{{ country.name }}</span>
                    </div>
                    <span class="rank-points">{{ country.points || 1500 }}</span>
                    <span class="rank-change" :class="getRankChangeClass(country.rankChange)">
                      <i :class="getRankChangeIcon(country.rankChange)"></i>
                      {{ formatRankChange(country.rankChange) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import AppHeader from '../components/AppHeader.vue'
import Breadcrumbs from '../components/Breadcrumbs.vue'
import CountryFlag from '../components/CountryFlag.vue'

export default {
  name: 'WorldDetail',
  components: {
    AppHeader,
    Breadcrumbs,
    CountryFlag
  },
  data() {
    return {
      username: '',
      subscriptionTier: 'basic',
      loading: true,
      world: {},
      currentPhase: 'host-selection', // 'host-selection' or 'tournament-management'
      
      // Host Selection
      candidates: [],
      generatingCandidates: false,
      voting: false,
      votingComplete: false,
      selectedHost: null,
      excludedConfederation: null,
      
      // Tournament Management
      activeTab: 'current',
      tabs: [
        { id: 'current', name: 'Current Tournament', icon: 'fas fa-play-circle' },
        { id: 'past', name: 'Past Tournaments', icon: 'fas fa-trophy' },
        { id: 'history', name: 'History', icon: 'fas fa-history' },
        { id: 'hall-of-fame', name: 'Hall of Fame', icon: 'fas fa-crown' },
        { id: 'rankings', name: 'Rankings', icon: 'fas fa-list-ol' }
      ],
      tournaments: [],
      worldCupHistory: [],
      countryRankings: [],
      generatingTournament: false
    }
  },
  computed: {
    hasActiveTournament() {
      return this.tournaments.some(tournament => 
        tournament.status !== 'completed'
      )
    },
    currentTournament() {
      return this.tournaments.find(tournament => 
        tournament.status !== 'completed'
      )
    },
    pastTournaments() {
      return this.tournaments
        .filter(tournament => tournament.status === 'completed')
        .sort((a, b) => b.year - a.year) // Sort from newest to oldest
    },
    nextTournamentYear() {
      if (this.tournaments.length === 0) {
        return this.world.beginningYear
      }
      const lastYear = Math.max(...this.tournaments.map(t => t.year))
      return lastYear + 4
    },
    sortedWorldCupHistory() {
      return [...this.worldCupHistory].sort((a, b) => b.year - a.year)
    },
    uniqueWinners() {
      const winners = new Set()
      this.worldCupHistory.forEach(entry => {
        if (entry.winner && entry.winner.code) {
          winners.add(entry.winner.code)
        }
      })
      return Array.from(winners)
    },
    uniqueHosts() {
      const hosts = new Set()
      this.worldCupHistory.forEach(entry => {
        if (entry.host && entry.host.code) {
          hosts.add(entry.host.code)
        }
      })
      return Array.from(hosts)
    },
    championshipStats() {
      const stats = {}
      
      this.worldCupHistory.forEach(entry => {
        if (entry.winner && entry.winner.code) {
          const code = entry.winner.code
          if (!stats[code]) {
            stats[code] = {
              code: code,
              name: entry.winner.name,
              flag: entry.winner.flag,
              titles: 0,
              finals: 0,
              years: []
            }
          }
          stats[code].titles++
          stats[code].finals++
          stats[code].years.push(entry.year)
        }
        
        if (entry.runnerUp && entry.runnerUp.code) {
          const code = entry.runnerUp.code
          if (!stats[code]) {
            stats[code] = {
              code: code,
              name: entry.runnerUp.name,
              flag: entry.runnerUp.flag,
              titles: 0,
              finals: 0,
              years: []
            }
          }
          stats[code].finals++
        }
      })
      
      return Object.values(stats)
        .filter(stat => stat.titles > 0)
        .sort((a, b) => {
          if (b.titles !== a.titles) return b.titles - a.titles
          return b.finals - a.finals
        })
    },
    mostSuccessfulCountry() {
      return this.championshipStats[0] || null
    }
  },
  async mounted() {
    this.username = localStorage.getItem('username') || 'User'
    
    const token = localStorage.getItem('token')
    if (!token) {
      this.$router.push('/')
      return
    }
    
    await this.loadWorld()
    await this.loadUserProfile()
    await this.loadCountryRankings()
    await this.checkExcludedConfederation()
    
    // Start on past tournaments tab if no current tournament
    if (!this.currentTournament && this.pastTournaments.length > 0) {
      this.activeTab = 'past'
    }
  },
  methods: {
    async loadWorld() {
      this.loading = true
      try {
        const worldId = this.$route.params.id
        const token = localStorage.getItem('token')
        
        const response = await fetch(`http://localhost:3001/api/worlds/${worldId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          this.world = data.data
          
          // Determine current phase
          if (this.world.tournaments && this.world.tournaments.length > 0) {
            this.currentPhase = 'tournament-management'
            await this.loadTournaments()
            await this.loadWorldCupHistory()
          }
        } else {
          console.error('Failed to load world')
          this.$router.push('/worlds')
        }
      } catch (error) {
        console.error('Error loading world:', error)
        this.$router.push('/worlds')
      } finally {
        this.loading = false
      }
    },
    
    async loadUserProfile() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('http://localhost:3001/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const user = await response.json()
          this.subscriptionTier = user.subscriptionTier || 'basic'
        }
      } catch (error) {
        console.error('Error loading user profile:', error)
      }
    },
    
    async loadCountryRankings() {
      try {
        console.log('Loading world-specific rankings for world:', this.world._id)
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/worlds/${this.world._id}/rankings`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          this.countryRankings = data.data
          console.log('Loaded world rankings:', this.countryRankings.length, 'countries')
        } else {
          console.error('Failed to load world rankings, falling back to FIFA rankings')
          // Fallback to FIFA rankings
          const fallbackResponse = await fetch('http://localhost:3001/api/tournaments/countries')
          if (fallbackResponse.ok) {
            const countries = await fallbackResponse.json()
            this.countryRankings = countries
              .sort((a, b) => (a.worldRanking || 999) - (b.worldRanking || 999))
          }
        }
      } catch (error) {
        console.error('Error loading country rankings:', error)
      }
    },

    async checkExcludedConfederation() {
      try {
        const response = await fetch('http://localhost:3001/api/tournaments/countries')
        if (response.ok) {
          const countries = await response.json()
          this.excludedConfederation = this.getLastHostConfederation(countries)
        }
      } catch (error) {
        console.error('Error checking excluded confederation:', error)
      }
    },

    getLastHostConfederation(countries) {
      // Get the most recent tournament host from world's history
      let lastHostCode = null

      // Check worldCupHistory first (this includes both real and simulated history and is always up-to-date)
      if (this.worldCupHistory && this.worldCupHistory.length > 0) {
        const sortedHistory = [...this.worldCupHistory].sort((a, b) => b.year - a.year)
        lastHostCode = sortedHistory[0].host?.code
      } 
      // Fallback: check world's simulatedHistory directly
      else if (this.world.simulatedHistory && this.world.simulatedHistory.length > 0) {
        const sortedHistory = [...this.world.simulatedHistory].sort((a, b) => b.year - a.year)
        lastHostCode = sortedHistory[0].host?.code
      } 
      // If no simulated history, use real World Cup history up to the world's beginning year
      else if (this.world.useRealHistoricData) {
        // Use built-in real World Cup history and find the most recent tournament before this world's beginning
        const realHistory = [
          { year: 2022, host: { code: 'QAT' } },
          { year: 2018, host: { code: 'RUS' } },
          { year: 2014, host: { code: 'BRA' } },
          { year: 2010, host: { code: 'RSA' } },
          { year: 2006, host: { code: 'GER' } },
          { year: 2002, host: { code: 'JPN' } }, // Japan/Korea (using Japan as primary)
          { year: 1998, host: { code: 'FRA' } },
          { year: 1994, host: { code: 'USA' } },
          { year: 1990, host: { code: 'ITA' } },
          { year: 1986, host: { code: 'MEX' } },
          { year: 1982, host: { code: 'ESP' } },
          { year: 1978, host: { code: 'ARG' } },
          { year: 1974, host: { code: 'GER' } },
          { year: 1970, host: { code: 'MEX' } }
        ]
        
        const realHistoryBeforeWorld = realHistory
          .filter(wc => wc.year < this.world.beginningYear)
          .sort((a, b) => b.year - a.year)
        
        if (realHistoryBeforeWorld.length > 0) {
          lastHostCode = realHistoryBeforeWorld[0].host?.code
        }
      }

      if (!lastHostCode) {
        console.log('No previous host found, allowing all confederations')
        return null
      }

      // Find the confederation of the last host
      const lastHostCountry = countries.find(c => c.code === lastHostCode)
      if (lastHostCountry) {
        console.log(`Last host was ${lastHostCountry.name} (${lastHostCode}) from ${lastHostCountry.confederation}`)
        return lastHostCountry.confederation
      }

      console.log('Last host country not found in countries data')
      return null
    },

    getConfederationName(confederationCode) {
      const confederationNames = {
        'uefa': 'UEFA (Europe)',
        'conmebol': 'CONMEBOL (South America)', 
        'concacaf': 'CONCACAF (North & Central America)',
        'afc': 'AFC (Asia)',
        'caf': 'CAF (Africa)',
        'ofc': 'OFC (Oceania)'
      }
      return confederationNames[confederationCode] || confederationCode.toUpperCase()
    },
    
    async generateCandidates() {
      this.generatingCandidates = true
      
      try {
        // Load latest world cup history to get accurate last host info
        await this.loadWorldCupHistory()
        
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        const response = await fetch('http://localhost:3001/api/tournaments/countries')
        if (response.ok) {
          const countries = await response.json()
          
          // Determine the last host's confederation to exclude it
          const lastHostConfederation = this.getLastHostConfederation(countries)
          this.excludedConfederation = lastHostConfederation
          console.log('Last host confederation:', lastHostConfederation)
          
          // Select 3-8 candidates based on FIFA ranking, excluding last host's confederation
          const candidateCount = Math.floor(Math.random() * 6) + 3 // 3-8
          const topCountries = countries
            .filter(c => c.worldRanking && c.worldRanking <= 50)
            .filter(c => !lastHostConfederation || c.confederation !== lastHostConfederation)
            .sort((a, b) => a.worldRanking - b.worldRanking)
          
          const selectedCandidates = []
          const usedCountries = new Set()
          
          // Higher ranked countries have higher chance to be selected
          for (let i = 0; i < candidateCount && selectedCandidates.length < candidateCount; i++) {
            let country
            let attempts = 0
            do {
              const rankingWeight = Math.random() * Math.random() // Bias toward better rankings
              const index = Math.floor(rankingWeight * Math.min(topCountries.length, 30))
              country = topCountries[index]
              attempts++
            } while (country && usedCountries.has(country.code) && attempts < 50)
            
            if (country && !usedCountries.has(country.code)) {
              usedCountries.add(country.code)
              
              // Calculate win chance based on ranking
              const baseChance = 100 / candidateCount
              const rankingBonus = (50 - (country.worldRanking || 50)) / 50 * 30
              const winChance = Math.round(baseChance + rankingBonus + (Math.random() - 0.5) * 10)
              
              // Try to get world ranking for display if available
              const worldRanking = this.countryRankings.find(c => c.code === country.code)
              
              selectedCandidates.push({
                ...country,
                rank: worldRanking ? worldRanking.rank : country.worldRanking,
                points: worldRanking ? worldRanking.points : 1500,
                winChance: Math.max(5, Math.min(95, winChance))
              })
            }
          }
          
          this.candidates = selectedCandidates
        }
      } catch (error) {
        console.error('Error generating candidates:', error)
      } finally {
        this.generatingCandidates = false
      }
    },
    
    async simulateVoting() {
      this.voting = true
      
      try {
        // Simulate voting delay
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Select winner based on win chances
        const totalChance = this.candidates.reduce((sum, c) => sum + c.winChance, 0)
        let random = Math.random() * totalChance
        
        let winner = this.candidates[0]
        for (const candidate of this.candidates) {
          random -= candidate.winChance
          if (random <= 0) {
            winner = candidate
            break
          }
        }
        
        // Add vote share
        winner.voteShare = winner.winChance + Math.floor(Math.random() * 20) - 10
        winner.voteShare = Math.max(30, Math.min(70, winner.voteShare))
        
        this.selectedHost = winner
        this.votingComplete = true
      } catch (error) {
        console.error('Error simulating voting:', error)
      } finally {
        this.voting = false
      }
    },
    
    async proceedToTournament() {
      try {
        console.log('Creating tournament for', this.selectedHost.name, 'in', this.world.beginningYear)
        
        // Create the tournament via API
        const token = localStorage.getItem('token')
        const tournamentYear = this.world.beginningYear
        const response = await fetch('http://localhost:3001/api/tournaments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: `${tournamentYear} FIFA World Cup`,
            hostCountry: this.selectedHost.name,
            hostCountryCode: this.selectedHost.code,
            type: 'qualification',
            worldId: this.world._id,
            year: tournamentYear
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('Tournament created successfully:', data)
          
          // Update the world's tournament list
          if (!this.world.tournaments) {
            this.world.tournaments = []
          }
          this.world.tournaments.push(data.tournament)
          
          this.currentPhase = 'tournament-management'
          
          // Reload tournaments to get the latest data
          await this.loadTournaments()
          
          // Load history and rankings now that we're in tournament phase
          await this.loadWorldCupHistory()
        } else {
          const errorData = await response.json()
          console.error('Failed to create tournament:', errorData)
        }
      } catch (error) {
        console.error('Error creating tournament:', error)
      }
    },
    
    async loadTournaments() {
      // Load existing tournaments from the world
      if (this.world.tournaments) {
        this.tournaments = this.world.tournaments.map(tournament => {
          // Handle both populated and non-populated tournament data
          let hostCountry
          if (typeof tournament.hostCountry === 'string') {
            // Find the country in our rankings to get the flag
            const countryData = this.countryRankings.find(c => 
              c.code === tournament.hostCountryCode || c.name === tournament.hostCountry
            )
            hostCountry = {
              name: tournament.hostCountry,
              flag: countryData?.flag || '🏆',
              code: tournament.hostCountryCode || 'TBD'
            }
          } else {
            hostCountry = tournament.hostCountry || { name: 'TBD', flag: '🏆', code: 'TBD' }
          }
          
          return {
            id: tournament._id,
            name: tournament.name || `${tournament.year || this.world.beginningYear} FIFA World Cup`,
            year: tournament.year || this.world.beginningYear,
            hostCountry: hostCountry,
            status: tournament.status || 'upcoming',
            teams: tournament.teams || 32
          }
        })
      }
    },
    
    async loadWorldCupHistory() {
      try {
        console.log('Loading World Cup history for world:', this.world._id)
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/worlds/${this.world._id}/history`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('World Cup history loaded:', data.data.length, 'entries')
          this.worldCupHistory = data.data
        } else {
          console.error('Failed to load World Cup history:', response.status, response.statusText)
        }
      } catch (error) {
        console.error('Error loading World Cup history:', error)
      }
    },
    
    async generateNewTournament() {
      if (this.hasActiveTournament) {
        return
      }
      
      this.generatingTournament = true
      
      try {
        // Start new host selection process for next tournament
        this.currentPhase = 'host-selection'
        this.candidates = []
        this.votingComplete = false
        this.selectedHost = null
        
        // Update the world beginning year to next tournament year
        const nextYear = this.nextTournamentYear
        console.log('Starting host selection for', nextYear, 'World Cup')
        
        // We'll need to temporarily store the next tournament year
        this.world.beginningYear = nextYear
        
      } catch (error) {
        console.error('Error starting new tournament generation:', error)
      } finally {
        this.generatingTournament = false
      }
    },
    
    async openTournament(tournament) {
      console.log('Opening tournament:', tournament.name)
      
      // Navigate to tournament detail page
      // For now, we'll use the existing tournament route but pass the world context
      try {
        const token = localStorage.getItem('token')
        
        // Update last opened timestamp
        await fetch(`http://localhost:3001/api/tournaments/${tournament.id}/open`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        // Navigate to tournament detail with world context
        this.$router.push({
          path: `/tournament/${tournament.id}`,
          query: { worldId: this.world._id }
        })
        
      } catch (error) {
        console.error('Error opening tournament:', error)
      }
    },

    async simulateCompletion(tournament) {
      try {
        console.log('Simulating completion for:', tournament.name)
        
        // Generate random winner and runner-up from top countries
        const topCountries = this.countryRankings.slice(0, 20)
        const winner = topCountries[Math.floor(Math.random() * 8)] // Top 8
        const runnerUp = topCountries[Math.floor(Math.random() * 16) + 4] // Top 16, not winner
        
        const finalScore = `${Math.floor(Math.random() * 3) + 1}-${Math.floor(Math.random() * 3)}`
        
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/tournaments/${tournament.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            status: 'completed',
            winner: {
              name: winner.name,
              code: winner.code,
              flag: winner.flag
            },
            runnerUp: {
              name: runnerUp.name,
              code: runnerUp.code,
              flag: runnerUp.flag
            },
            finalScore: finalScore
          })
        })
        
        if (response.ok) {
          console.log('Tournament completion API call successful')
          
          // Update local tournament status
          const tournamentIndex = this.tournaments.findIndex(t => t.id === tournament.id)
          if (tournamentIndex !== -1) {
            this.tournaments[tournamentIndex].status = 'completed'
          }
          
          // Add a small delay to ensure the backend has processed the history update
          setTimeout(async () => {
            console.log('Reloading world data after tournament completion')
            await this.loadWorldCupHistory()
            await this.loadCountryRankings()
            console.log('History and rankings reloaded')
          }, 1000)
          
          console.log('Tournament completed successfully:', winner.name, 'defeated', runnerUp.name, finalScore)
        } else {
          const errorData = await response.json()
          console.error('Tournament completion failed:', errorData)
        }
      } catch (error) {
        console.error('Error completing tournament:', error)
      }
    },
    
    formatStatus(status) {
      const statusMap = {
        'upcoming': 'Upcoming',
        'qualification': 'Qualification',
        'group-stage': 'Group Stage', 
        'knockout': 'Knockout Stage',
        'completed': 'Completed'
      }
      return statusMap[status] || status
    },
    
    getRankChangeClass(change) {
      if (!change) return ''
      return change > 0 ? 'positive' : change < 0 ? 'negative' : ''
    },
    
    getRankChangeIcon(change) {
      if (!change || change === 0) return 'fas fa-minus'
      return change > 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down'
    },
    
    formatRankChange(change) {
      if (!change || change === 0) return '—'
      if (change > 0) return `+${change}`
      return change.toString()
    },
    
    goBack() {
      this.$router.push('/worlds')
    },
    
    handleLogout() {
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      this.$router.push('/')
    }
  }
}
</script>

<style scoped>
.world-detail {
  min-height: 100vh;
  background: linear-gradient(135deg, #0066CC 0%, #003366 100%);
}

.main-content {
  padding: 2rem;
  display: flex;
  justify-content: center;
}

.world-container {
  width: 100%;
  max-width: 1200px;
}

.world-header {
  margin-bottom: 2rem;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: var(--white);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 8px 16px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 16px;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.world-info h1 {
  color: var(--white);
  font-size: 2.5rem;
  font-weight: var(--font-weight-bold);
  margin: 0 0 8px 0;
}

.world-meta {
  display: flex;
  gap: 16px;
  color: rgba(255, 255, 255, 0.8);
}

.world-year {
  font-size: 1.1rem;
  font-weight: var(--font-weight-semibold);
}

.data-type {
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.loading-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--white);
}

.loading-state i {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.phase-container {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: 2rem;
  backdrop-filter: blur(20px);
}

.phase-header {
  text-align: center;
  margin-bottom: 2rem;
}

.phase-header h2 {
  color: var(--white);
  font-size: 2rem;
  font-weight: var(--font-weight-bold);
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.phase-header p {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
  margin: 0;
}

.step-container {
  text-align: center;
  padding: 2rem;
}

.confederation-notice {
  margin-top: 16px;
  padding: 12px 16px;
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: var(--radius-md);
  color: #f8c146;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: var(--font-weight-medium);
}

.step-info h3 {
  color: var(--white);
  font-size: 1.5rem;
  margin: 0 0 8px 0;
}

.step-info p {
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 2rem 0;
}

.candidates-container {
  text-align: center;
}

.candidates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin: 2rem 0;
}

.candidate-card {
  padding: 20px;
  border-radius: var(--radius-lg);
  text-align: center;
  transition: all 0.3s ease;
}

.candidate-card:hover {
  transform: translateY(-2px);
}

.candidate-flag {
  margin-bottom: 12px;
  display: flex;
  justify-content: center;
}

.candidate-info h4 {
  color: var(--fifa-dark-blue);
  margin: 0 0 12px 0;
  font-size: 1.1rem;
  font-weight: var(--font-weight-bold);
}

.candidate-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.9rem;
}

.ranking {
  color: var(--gray);
}

.chance {
  color: var(--fifa-blue);
  font-weight: var(--font-weight-semibold);
}

.vote-btn {
  margin-top: 2rem;
  padding: 16px 32px;
  font-size: 1.1rem;
}

.voting-results {
  text-align: center;
}

.winner-announcement {
  margin: 2rem 0;
}

.winner-card {
  padding: 2rem;
  border-radius: var(--radius-xl);
  max-width: 400px;
  margin: 0 auto;
}

.winner-flag {
  margin-bottom: 16px;
  display: flex;
  justify-content: center;
}

.winner-info h2 {
  color: var(--fifa-dark-blue);
  margin: 0 0 8px 0;
  font-size: 2rem;
}

.winner-info p {
  color: var(--gray);
  margin: 0 0 16px 0;
  font-size: 1.1rem;
}

.winner-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.9rem;
  color: var(--fifa-blue);
}

.proceed-btn {
  margin-top: 2rem;
  padding: 16px 32px;
  font-size: 1.1rem;
}

.tournament-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 2rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  padding: 4px;
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: var(--font-weight-medium);
}

.tab-btn:hover {
  color: var(--white);
  background: rgba(255, 255, 255, 0.1);
}

.tab-btn.active {
  background: var(--fifa-gold);
  color: var(--dark);
}

.tab-content {
  min-height: 400px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.section-header h3 {
  color: var(--white);
  font-size: 1.5rem;
  margin: 0;
}

.empty-section {
  text-align: center;
  padding: 3rem 2rem;
  color: rgba(255, 255, 255, 0.7);
}

.empty-section i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.tournaments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.current-tournament {
  border: 2px solid var(--fifa-gold);
  box-shadow: 0 4px 16px rgba(255, 215, 0, 0.2);
}

.tournament-item {
  padding: 20px;
  border-radius: var(--radius-lg);
}

.tournament-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.tournament-title h4 {
  color: var(--fifa-dark-blue);
  margin: 0 0 4px 0;
  font-size: 1.1rem;
}

.host-country {
  color: var(--gray);
  font-size: 0.9rem;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
}

.status-upcoming {
  background: rgba(108, 117, 125, 0.2);
  color: #6c757d;
}

.status-qualification {
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
}

.status-group-stage {
  background: rgba(0, 123, 255, 0.2);
  color: #007bff;
}

.status-knockout {
  background: rgba(220, 53, 69, 0.2);
  color: #dc3545;
}

.status-completed {
  background: rgba(40, 167, 69, 0.2);
  color: #28a745;
}

.tournament-info {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  color: var(--gray);
  font-size: 0.9rem;
}

.tournament-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-weight: var(--font-weight-semibold);
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  border: none;
  transition: all 0.3s ease;
}

.action-btn.primary {
  background: var(--fifa-blue);
  color: var(--white);
}

.action-btn.primary:hover {
  background: var(--fifa-dark-blue);
}

.tournament-restriction-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(255, 193, 7, 0.2);
  border: 1px solid rgba(255, 193, 7, 0.4);
  border-radius: var(--radius-md);
  color: #ffc107;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  font-weight: var(--font-weight-semibold);
}

.tournament-restriction-notice i {
  color: #ffc107;
}

.btn-primary.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary.disabled:hover {
  background: var(--fifa-blue);
  transform: none;
}

.history-timeline {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.history-item {
  padding: 16px 20px;
  border-radius: var(--radius-lg);
  display: flex;
  gap: 16px;
  align-items: center;
  transition: all 0.3s ease;
}

.history-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.history-year {
  font-size: 1.3rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-blue);
  min-width: 70px;
}

.history-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.history-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.winner-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.winner-flag {
  display: flex;
  align-items: center;
}

.winner-name {
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
  font-size: 0.95rem;
}

.champion-badge {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #333;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.host-section {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--gray);
  font-size: 0.85rem;
}

.host-flag {
  display: flex;
  align-items: center;
}

.history-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: var(--gray);
  padding-top: 4px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.final-score {
  font-weight: var(--font-weight-semibold);
  color: var(--fifa-blue);
}

.vs-separator {
  opacity: 0.6;
}

.runner-up {
  display: flex;
  align-items: center;
  gap: 4px;
}

.rankings-table {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.rankings-header {
  display: grid;
  grid-template-columns: 60px 1fr 100px 100px;
  gap: 16px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.1);
  color: var(--white);
  font-weight: var(--font-weight-semibold);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.rankings-list {
  max-height: 600px;
  overflow-y: auto;
}

.ranking-item {
  display: grid;
  grid-template-columns: 60px 1fr 100px 100px;
  gap: 16px;
  padding: 12px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.ranking-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.rank-position {
  color: var(--fifa-gold);
  font-weight: var(--font-weight-bold);
  text-align: center;
}

.rank-country {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--white);
}

.country-flag {
  display: flex;
  align-items: center;
}

.rank-points {
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
}

.rank-change {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 0.8rem;
  font-weight: var(--font-weight-semibold);
}

.rank-change.positive {
  color: #4ade80;
}

.rank-change.negative {
  color: #dc3545;
}

/* Hall of Fame Styles */
.hall-of-fame-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.champions-summary h4 {
  color: var(--white);
  font-size: 1.3rem;
  margin: 0 0 1rem 0;
  font-weight: var(--font-weight-bold);
}

.champions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.champion-card {
  padding: 20px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
}

.champion-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.champion-flag {
  min-width: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.champion-info {
  flex: 1;
}

.champion-info h5 {
  color: var(--fifa-dark-blue);
  font-size: 1.1rem;
  font-weight: var(--font-weight-bold);
  margin: 0 0 8px 0;
}

.champion-stats {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.stat-item i {
  color: var(--fifa-gold);
  width: 16px;
  text-align: center;
}

.stat-value {
  font-weight: var(--font-weight-semibold);
  color: var(--fifa-blue);
  min-width: 20px;
}

.stat-label {
  color: var(--gray);
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  padding: 20px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-card i {
  font-size: 2rem;
  color: var(--fifa-gold);
  min-width: 40px;
  text-align: center;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
}

.stat-text {
  font-size: 0.9rem;
  color: var(--gray);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.hall-stats {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .main-content {
    padding: 1rem;
  }
  
  .phase-container {
    padding: 1rem;
  }
  
  .candidates-grid {
    grid-template-columns: 1fr;
  }
  
  .tournament-tabs {
    flex-direction: column;
  }
  
  .section-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .rankings-header,
  .ranking-item {
    grid-template-columns: 50px 1fr 80px 80px;
    gap: 8px;
    padding: 12px 16px;
  }
}
</style>