<template>
  <div class="team-detail">
    <AppHeader 
      :username="username" 
      :subscription-tier="subscriptionTier"
      @logout="handleLogout" 
    />
    
    <main class="main-content">
      <div class="team-container">
        <div v-if="loading" class="loading-state">
          <i class="fas fa-spinner fa-spin"></i>
          Loading team details...
        </div>
        
        <div v-else-if="!team" class="error-state">
          <div class="error-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <h3>Team not found</h3>
          <p>The team you're looking for doesn't exist in this tournament.</p>
          <button @click="goBack" class="btn-primary">
            <i class="fas fa-arrow-left"></i>
            Go Back
          </button>
        </div>
        
        <div v-else class="team-detail-content">
          <!-- Team Header -->
          <div class="team-header glass-white">
            <div class="back-navigation">
              <button @click="goBack" class="back-btn">
                <i class="fas fa-arrow-left"></i>
                Back to Tournament
              </button>
            </div>
            
            <div class="team-info">
              <div class="team-display">
                <span class="team-flag">{{ countryInfo?.flag || '🏴' }}</span>
                <div class="team-details">
                  <h1>{{ team.name }}</h1>
                  <p class="team-subtitle">{{ tournament?.name || 'World Cup' }}</p>
                </div>
              </div>
              
              <div class="team-stats-summary">
                <div class="stat-item">
                  <span class="stat-label">FIFA Ranking</span>
                  <span class="stat-value">#{{ countryInfo?.fifaRanking || 'N/A' }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Group</span>
                  <span class="stat-value">{{ team.group || 'N/A' }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Team Content -->
          <div class="team-content">
            <div class="content-grid">
              <!-- Country Information -->
              <div class="content-card glass-white">
                <div class="card-header">
                  <h3>Country Information</h3>
                  <i class="fas fa-globe"></i>
                </div>
                <div class="card-content">
                  <div class="country-info">
                    <div class="info-item">
                      <span class="info-label">Capital City</span>
                      <span class="info-value">{{ countryInfo?.capital || 'N/A' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Population</span>
                      <span class="info-value">{{ countryInfo?.population || 'N/A' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">FIFA Ranking</span>
                      <span class="info-value">#{{ countryInfo?.fifaRanking || 'N/A' }}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Tournament Performance -->
              <div class="content-card glass-white">
                <div class="card-header">
                  <h3>Tournament Performance</h3>
                  <i class="fas fa-chart-line"></i>
                </div>
                <div class="card-content">
                  <div class="performance-stats">
                    <div class="stat-row">
                      <span class="stat-label">Matches Played</span>
                      <span class="stat-value">{{ matchStats.played }}</span>
                    </div>
                    <div class="stat-row">
                      <span class="stat-label">Wins</span>
                      <span class="stat-value wins">{{ matchStats.wins }}</span>
                    </div>
                    <div class="stat-row">
                      <span class="stat-label">Draws</span>
                      <span class="stat-value draws">{{ matchStats.draws }}</span>
                    </div>
                    <div class="stat-row">
                      <span class="stat-label">Losses</span>
                      <span class="stat-value losses">{{ matchStats.losses }}</span>
                    </div>
                    <div class="stat-row">
                      <span class="stat-label">Goals For</span>
                      <span class="stat-value">{{ matchStats.goalsFor }}</span>
                    </div>
                    <div class="stat-row">
                      <span class="stat-label">Goals Against</span>
                      <span class="stat-value">{{ matchStats.goalsAgainst }}</span>
                    </div>
                    <div class="stat-row">
                      <span class="stat-label">Goal Difference</span>
                      <span class="stat-value" :class="{ 'positive': matchStats.goalDifference > 0, 'negative': matchStats.goalDifference < 0 }">
                        {{ matchStats.goalDifference > 0 ? '+' : '' }}{{ matchStats.goalDifference }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Match History -->
              <div class="content-card glass-white full-width">
                <div class="card-header">
                  <h3>Match History</h3>
                  <i class="fas fa-history"></i>
                </div>
                <div class="card-content">
                  <div v-if="matches.length === 0" class="empty-matches">
                    <i class="fas fa-calendar-times"></i>
                    <p>No matches played yet</p>
                  </div>
                  <div v-else class="matches-list">
                    <div 
                      v-for="match in matches" 
                      :key="match._id"
                      class="match-item"
                      :class="{ 'completed': match.status === 'completed', 'scheduled': match.status === 'scheduled' }"
                    >
                      <div class="match-info">
                        <div class="match-teams">
                          <span class="team-name" :class="{ 'current-team': match.homeTeam.name === team.name }">
                            {{ getCountryFlag(match.homeTeam.countryCode) }} {{ match.homeTeam.name }}
                          </span>
                          <span class="vs">vs</span>
                          <span class="team-name" :class="{ 'current-team': match.awayTeam.name === team.name }">
                            {{ getCountryFlag(match.awayTeam.countryCode) }} {{ match.awayTeam.name }}
                          </span>
                        </div>
                        <div class="match-details">
                          <span class="match-round">{{ formatMatchRound(match) }}</span>
                          <span class="match-date">{{ formatDate(match.scheduledDate) }}</span>
                        </div>
                      </div>
                      <div class="match-score">
                        <span v-if="match.status === 'completed'" class="score">
                          {{ match.homeScore }} - {{ match.awayScore }}
                        </span>
                        <span v-else class="scheduled-label">Scheduled</span>
                      </div>
                      <div class="match-result">
                        <span v-if="match.status === 'completed'" class="result-badge" :class="getMatchResult(match)">
                          {{ getMatchResultText(match) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Player Roster (Placeholder) -->
              <div class="content-card glass-white">
                <div class="card-header">
                  <h3>Player Roster</h3>
                  <i class="fas fa-users"></i>
                </div>
                <div class="card-content">
                  <div class="placeholder-section">
                    <div class="placeholder-icon">
                      <i class="fas fa-user-plus"></i>
                    </div>
                    <h4>Coming Soon</h4>
                    <p>Player roster and detailed statistics will be available in a future update.</p>
                  </div>
                </div>
              </div>
              
              <!-- Team Statistics (Placeholder) -->
              <div class="content-card glass-white">
                <div class="card-header">
                  <h3>Detailed Statistics</h3>
                  <i class="fas fa-chart-bar"></i>
                </div>
                <div class="card-content">
                  <div class="placeholder-section">
                    <div class="placeholder-icon">
                      <i class="fas fa-chart-pie"></i>
                    </div>
                    <h4>Coming Soon</h4>
                    <p>Advanced team statistics, formation analysis, and performance metrics will be available in a future update.</p>
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

export default {
  name: 'TeamDetail',
  components: {
    AppHeader
  },
  data() {
    return {
      username: '',
      subscriptionTier: 'basic',
      team: null,
      tournament: null,
      matches: [],
      countries: [],
      loading: false,
      matchStats: {
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0
      }
    }
  },
  computed: {
    countryInfo() {
      if (!this.team) return null
      return this.countries.find(c => c.code === this.team.countryCode)
    }
  },
  mounted() {
    this.username = localStorage.getItem('username') || 'User'
    
    // Check if user is authenticated
    const token = localStorage.getItem('token')
    if (!token) {
      this.$router.push('/')
      return
    }
    
    this.loadTeamData()
    this.loadUserProfile()
  },
  methods: {
    async loadTeamData() {
      this.loading = true
      try {
        await Promise.all([
          this.loadTournament(),
          this.loadTeam(),
          this.loadCountries(),
          this.loadTeamMatches()
        ])
        this.calculateMatchStats()
      } catch (error) {
        console.error('Error loading team data:', error)
      } finally {
        this.loading = false
      }
    },
    
    async loadTournament() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/tournaments/${this.$route.params.tournamentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          this.tournament = await response.json()
        }
      } catch (error) {
        console.error('Error loading tournament:', error)
      }
    },
    
    async loadTeam() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/teams/${this.$route.params.tournamentId}/${this.$route.params.teamId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          this.team = await response.json()
        }
      } catch (error) {
        console.error('Error loading team:', error)
      }
    },
    
    async loadCountries() {
      try {
        const response = await fetch('http://localhost:3001/api/tournaments/countries')
        if (response.ok) {
          this.countries = await response.json()
        }
      } catch (error) {
        console.error('Error loading countries:', error)
      }
    },
    
    async loadTeamMatches() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/matches/${this.$route.params.tournamentId}/team/${this.$route.params.teamId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          this.matches = await response.json()
        }
      } catch (error) {
        console.error('Error loading team matches:', error)
      }
    },
    
    calculateMatchStats() {
      if (!this.team || !this.matches.length) return
      
      const stats = {
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0
      }
      
      this.matches.forEach(match => {
        if (match.status === 'completed') {
          stats.played++
          
          const isHome = match.homeTeam._id === this.team._id
          const teamScore = isHome ? match.homeScore : match.awayScore
          const opponentScore = isHome ? match.awayScore : match.homeScore
          
          stats.goalsFor += teamScore
          stats.goalsAgainst += opponentScore
          
          if (teamScore > opponentScore) {
            stats.wins++
          } else if (teamScore === opponentScore) {
            stats.draws++
          } else {
            stats.losses++
          }
        }
      })
      
      stats.goalDifference = stats.goalsFor - stats.goalsAgainst
      this.matchStats = stats
    },
    
    getMatchResult(match) {
      if (match.status !== 'completed') return ''
      
      const isHome = match.homeTeam._id === this.team._id
      const teamScore = isHome ? match.homeScore : match.awayScore
      const opponentScore = isHome ? match.awayScore : match.homeScore
      
      if (teamScore > opponentScore) return 'win'
      if (teamScore === opponentScore) return 'draw'
      return 'loss'
    },
    
    getMatchResultText(match) {
      const result = this.getMatchResult(match)
      return result.charAt(0).toUpperCase() + result.slice(1)
    },
    
    formatMatchRound(match) {
      if (match.round) return `Round ${match.round}`
      if (match.matchday) return `Matchday ${match.matchday}`
      return 'Tournament Match'
    },
    
    getCountryFlag(countryCode) {
      const country = this.countries.find(c => c.code === countryCode)
      return country ? country.flag : '🏴'
    },
    
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString()
    },
    
    goBack() {
      this.$router.go(-1)
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
    
    handleLogout() {
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      this.$router.push('/')
    }
  }
}
</script>

<style scoped>
.team-detail {
  min-height: 100vh;
  background: linear-gradient(135deg, #0066CC 0%, #003366 100%);
}

.main-content {
  padding: 2rem;
  display: flex;
  justify-content: center;
}

.team-container {
  width: 100%;
  max-width: 1200px;
}

.loading-state, .error-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--white);
}

.loading-state i, .error-state .error-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.error-state h3 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.error-state p {
  opacity: 0.8;
  margin-bottom: 2rem;
}

.team-header {
  padding: 32px;
  border-radius: var(--radius-xl);
  margin-bottom: 24px;
}

.back-navigation {
  margin-bottom: 24px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  color: var(--fifa-blue);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  padding: 8px 0;
  transition: all 0.3s ease;
}

.back-btn:hover {
  color: var(--fifa-dark-blue);
}

.team-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.team-display {
  display: flex;
  align-items: center;
  gap: 16px;
}

.team-flag {
  font-size: 4rem;
}

.team-details h1 {
  font-size: 2.5rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
  margin: 0 0 8px 0;
}

.team-subtitle {
  color: var(--gray);
  font-size: 1.1rem;
  margin: 0;
}

.team-stats-summary {
  display: flex;
  gap: 32px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  text-align: center;
}

.stat-label {
  color: var(--gray);
  font-size: 0.9rem;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
}

.team-content {
  margin-top: 24px;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.content-card {
  padding: 24px;
  border-radius: var(--radius-xl);
}

.content-card.full-width {
  grid-column: 1 / -1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-header h3 {
  font-size: 1.25rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
  margin: 0;
}

.card-header i {
  color: var(--fifa-blue);
  font-size: 1.25rem;
}

.country-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  color: var(--gray);
  font-weight: var(--font-weight-medium);
}

.info-value {
  font-weight: var(--font-weight-semibold);
  color: var(--fifa-dark-blue);
}

.performance-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.stat-row .stat-label {
  color: var(--gray);
  font-weight: var(--font-weight-medium);
}

.stat-row .stat-value {
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
}

.stat-row .stat-value.wins {
  color: #28a745;
}

.stat-row .stat-value.draws {
  color: #ffc107;
}

.stat-row .stat-value.losses {
  color: #dc3545;
}

.stat-row .stat-value.positive {
  color: #28a745;
}

.stat-row .stat-value.negative {
  color: #dc3545;
}

.empty-matches {
  text-align: center;
  padding: 2rem;
  color: var(--gray);
}

.empty-matches i {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.matches-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.match-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-radius: var(--radius-lg);
  background: rgba(0, 102, 204, 0.05);
  border: 1px solid rgba(0, 102, 204, 0.1);
}

.match-item.completed {
  background: rgba(40, 167, 69, 0.05);
  border-color: rgba(40, 167, 69, 0.1);
}

.match-info {
  flex: 1;
}

.match-teams {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.team-name {
  font-weight: var(--font-weight-semibold);
  color: var(--fifa-dark-blue);
}

.team-name.current-team {
  color: var(--fifa-blue);
  font-weight: var(--font-weight-bold);
}

.vs {
  color: var(--gray);
  font-size: 0.9rem;
}

.match-details {
  display: flex;
  gap: 16px;
  color: var(--gray);
  font-size: 0.9rem;
}

.match-score {
  font-size: 1.25rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
}

.scheduled-label {
  color: var(--gray);
  font-size: 0.9rem;
  font-weight: var(--font-weight-medium);
}

.result-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
}

.result-badge.win {
  background: rgba(40, 167, 69, 0.2);
  color: #28a745;
}

.result-badge.draw {
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
}

.result-badge.loss {
  background: rgba(220, 53, 69, 0.2);
  color: #dc3545;
}

.placeholder-section {
  text-align: center;
  padding: 2rem;
  color: var(--gray);
}

.placeholder-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}

.placeholder-section h4 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
  color: var(--fifa-dark-blue);
}

.placeholder-section p {
  opacity: 0.8;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .main-content {
    padding: 1rem;
  }
  
  .team-header {
    padding: 24px;
  }
  
  .team-info {
    flex-direction: column;
    gap: 16px;
  }
  
  .team-display {
    text-align: center;
  }
  
  .team-details h1 {
    font-size: 2rem;
  }
  
  .team-flag {
    font-size: 3rem;
  }
  
  .team-stats-summary {
    flex-direction: column;
    gap: 16px;
  }
  
  .content-grid {
    grid-template-columns: 1fr;
  }
  
  .match-item {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .match-details {
    flex-direction: column;
    gap: 8px;
  }
}
</style>