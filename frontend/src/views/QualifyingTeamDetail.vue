<template>
  <div class="qualifying-team-detail">
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
          <p>The team you're looking for doesn't exist in qualification.</p>
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
                Back to Qualification
              </button>
            </div>
            
            <div class="team-info">
              <div class="team-display">
                <span class="team-flag">{{ team.flag || countryInfo?.flag || '🏴' }}</span>
                <div class="team-details">
                  <h1>{{ team.name }}</h1>
                  <p class="team-subtitle">{{ tournament?.name || 'World Cup' }} Qualification</p>
                </div>
              </div>
              
              <div class="team-stats-summary">
                <div class="stat-item">
                  <span class="stat-label">World Ranking</span>
                  <span class="stat-value">#{{ countryInfo?.worldRanking || 'N/A' }}</span>
                </div>
                <div class="stat-item" v-if="team.confederation">
                  <span class="stat-label">Confederation</span>
                  <span class="stat-value">{{ team.confederation }}</span>
                </div>
                <div class="stat-item" v-if="qualificationGroup">
                  <span class="stat-label">Group</span>
                  <span class="stat-value">{{ getGroupName(qualificationGroup) }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Content Tabs -->
          <div class="content-tabs">
            <button 
              class="tab-btn" 
              :class="{ active: activeTab === 'roster' }"
              @click="activeTab = 'roster'"
            >
              <i class="fas fa-users"></i>
              Team Roster
            </button>
            <button 
              class="tab-btn" 
              :class="{ active: activeTab === 'matches' }"
              @click="activeTab = 'matches'"
            >
              <i class="fas fa-futbol"></i>
              Qualification Matches
            </button>
            <button 
              class="tab-btn" 
              :class="{ active: activeTab === 'history' }"
              @click="activeTab = 'history'"
            >
              <i class="fas fa-history"></i>
              Tournament History
            </button>
          </div>
          
          <!-- Tab Content -->
          <div class="tab-content">
            <!-- Roster Tab -->
            <div v-if="activeTab === 'roster'" class="roster-tab">
              <div class="content-card glass-white roster-section">
                <TeamRoster 
                  v-if="team"
                  :team="rosterTeamData"
                  :tournament-id="$route.params.tournamentId"
                  :world-id="tournament?.worldId"
                  :is-qualifying="true"
                />
                <div v-else class="placeholder-section">
                  <div class="placeholder-icon">
                    <i class="fas fa-user-plus"></i>
                  </div>
                  <h4>Loading Team Data</h4>
                  <p>Please wait while we load the team information.</p>
                </div>
              </div>
            </div>
            
            <!-- Matches Tab -->
            <div v-if="activeTab === 'matches'" class="matches-tab">
              <div class="content-card glass-white">
                <div class="card-header">
                  <h3>Qualification Matches</h3>
                  <i class="fas fa-futbol"></i>
                </div>
                <div class="card-content">
                  <div v-if="qualificationMatches.length === 0" class="empty-matches">
                    <i class="fas fa-calendar-times"></i>
                    <p>No qualification matches found</p>
                  </div>
                  <div v-else class="matches-list">
                    <div 
                      v-for="match in qualificationMatches" 
                      :key="match.matchId"
                      class="match-item"
                      :class="{ 'completed': match.played, 'clickable': match.played }"
                      @click="viewMatch(match)"
                    >
                      <div class="match-info">
                        <div class="match-teams">
                          <span class="team-name" :class="{ 'current-team': match.homeTeam.name === team.name }">
                            {{ match.homeTeam.flag }} {{ match.homeTeam.name }}
                          </span>
                          <span class="vs">vs</span>
                          <span class="team-name" :class="{ 'current-team': match.awayTeam.name === team.name }">
                            {{ match.awayTeam.flag }} {{ match.awayTeam.name }}
                          </span>
                        </div>
                        <div class="match-details">
                          <span class="match-round">Qualification MD {{ match.matchday }}</span>
                          <span class="match-date">{{ formatDate(match.date) }}</span>
                          <span class="match-type">Qualification</span>
                        </div>
                      </div>
                      <div class="match-score">
                        <span v-if="match.played" class="score">
                          {{ match.homeScore }} - {{ match.awayScore }}
                        </span>
                        <span v-else class="scheduled-label">Scheduled</span>
                      </div>
                      <div class="match-result">
                        <span v-if="match.played" class="result-badge" :class="getMatchResult(match)">
                          {{ getMatchResultText(match) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- History Tab -->
            <div v-if="activeTab === 'history'" class="history-tab">
              <div class="content-card glass-white">
                <div class="card-header">
                  <h3>Tournament History</h3>
                  <i class="fas fa-history"></i>
                </div>
                <div class="card-content">
                  <div v-if="loadingHistory" class="loading-history">
                    <i class="fas fa-spinner fa-spin"></i>
                    Loading tournament history...
                  </div>
                  
                  <div v-else-if="tournamentHistory" class="history-content">
                    <!-- Best Result Card -->
                    <div class="best-result-card">
                      <div class="best-result-header">
                        <i class="fas fa-trophy"></i>
                        <h4>Best Result Ever</h4>
                      </div>
                      <div class="best-result-value">{{ tournamentHistory.statistics.bestResult }}</div>
                    </div>

                    <!-- Statistics Summary -->
                    <div class="statistics-grid">
                      <div class="stat-card">
                        <div class="stat-number">{{ tournamentHistory.statistics.totalTournaments }}</div>
                        <div class="stat-label">Tournaments</div>
                      </div>
                      <div class="stat-card">
                        <div class="stat-number">{{ tournamentHistory.statistics.wins }}</div>
                        <div class="stat-label">Wins</div>
                      </div>
                      <div class="stat-card">
                        <div class="stat-number">{{ tournamentHistory.statistics.runnerUps }}</div>
                        <div class="stat-label">Runner-ups</div>
                      </div>
                      <div class="stat-card">
                        <div class="stat-number">{{ tournamentHistory.statistics.groupStage }}</div>
                        <div class="stat-label">Group Stage</div>
                      </div>
                    </div>

                    <!-- Tournament List -->
                    <div class="tournament-history-list">
                      <h4>Tournament Appearances</h4>
                      <div v-if="tournamentHistory.tournaments.length === 0" class="no-history">
                        <i class="fas fa-calendar-times"></i>
                        <p>No tournament history found</p>
                      </div>
                      <div v-else class="history-items">
                        <div 
                          v-for="tournament in tournamentHistory.tournaments" 
                          :key="tournament.tournamentId"
                          class="history-item"
                          :class="{ 'world-tournament': tournament.isWorldTournament }"
                        >
                          <div class="tournament-info">
                            <div class="tournament-year">{{ tournament.year }}</div>
                            <div class="tournament-details">
                              <div class="tournament-name">{{ tournament.name }}</div>
                              <div class="tournament-host">{{ getCountryFlag(tournament.hostCountryCode) }} {{ tournament.hostCountry }}</div>
                              <div v-if="tournament.isWorldTournament" class="world-badge">
                                <i class="fas fa-globe"></i>
                                {{ tournament.worldName }}
                              </div>
                            </div>
                          </div>
                          <div class="tournament-result">
                            <div class="result-badge" :class="getResultClass(tournament.result)">
                              {{ tournament.result }}
                            </div>
                            <div v-if="tournament.position" class="position-badge">
                              {{ getPositionSuffix(tournament.position) }}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div v-else class="no-history-data">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Unable to load tournament history</p>
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
import TeamRoster from '../components/TeamRoster.vue'

export default {
  name: 'QualifyingTeamDetail',
  components: {
    AppHeader,
    TeamRoster
  },
  data() {
    return {
      username: '',
      subscriptionTier: 'basic',
      team: null,
      tournament: null,
      qualificationMatches: [],
      countries: [],
      loading: false,
      activeTab: 'roster',
      qualificationGroup: null,
      tournamentHistory: null,
      loadingHistory: false
    }
  },
  computed: {
    countryInfo() {
      if (!this.team) return null
      return this.countries.find(c => c.code === this.team.country || c.name === this.team.name)
    },

    rosterTeamData() {
      if (!this.team) return null
      
      console.log('🏆 ROSTER DATA: Team object:', this.team)
      console.log('🏆 ROSTER DATA: Country info:', this.countryInfo)
      
      // Use country code from countryInfo, fallback to team data
      const teamCode = this.countryInfo?.code || this.team.countryCode || this.team.code || this.team.country || this.team.name
      console.log('🏆 ROSTER DATA: Using team code:', teamCode)
      
      return {
        code: teamCode,
        name: this.team.name,
        flag: this.team.flag || this.countryInfo?.flag || '🏴'
      }
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
          this.loadQualificationData(),
          this.loadCountries()
        ])
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
    
    async loadQualificationData() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/qualification/${this.$route.params.tournamentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const qualificationData = await response.json()
          let teamFound = false
          let qualMatches = []
          
          // Search through all confederations for the team
          if (qualificationData && qualificationData.confederations) {
            for (const confed of qualificationData.confederations) {
              if (confed.groups) {
                for (const group of confed.groups) {
                  if (group.teams) {
                    const foundTeam = group.teams.find(t => t.teamId === this.$route.params.teamId)
                    if (foundTeam) {
                      this.team = {
                        ...foundTeam,
                        confederation: confed.name
                      }
                      this.qualificationGroup = group.groupId
                      teamFound = true
                    }
                  }
                }
              }
              
              // Get matches for this team
              if (confed.matches) {
                for (const match of confed.matches) {
                  if (match.homeTeam.teamId === this.$route.params.teamId || 
                      match.awayTeam.teamId === this.$route.params.teamId) {
                    qualMatches.push(match)
                  }
                }
              }
            }
          }
          
          if (!teamFound) {
            this.team = null
          }
          
          // Sort matches by matchday
          this.qualificationMatches = qualMatches.sort((a, b) => (a.matchday || 1) - (b.matchday || 1))
        }
      } catch (error) {
        console.error('Error loading qualification data:', error)
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
    
    getMatchResult(match) {
      if (!match.played) return ''
      
      const isHome = match.homeTeam.teamId === this.$route.params.teamId
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
    
    getGroupName(groupId) {
      if (!groupId) return ''
      // Extract group letter from groupId (e.g., 'uefa_group_A' -> 'Group A')
      const parts = groupId.split('_')
      if (parts.length >= 3) {
        return `Group ${parts[parts.length - 1]}`
      }
      return groupId
    },
    
    formatDate(dateString) {
      if (!dateString) return 'TBD'
      return new Date(dateString).toLocaleDateString()
    },
    
    viewMatch(match) {
      if (match.played) {
        this.$router.push(`/tournament/${this.$route.params.tournamentId}/match/${match.matchId}`)
      }
    },
    
    goBack() {
      this.$router.push(`/tournament/${this.$route.params.tournamentId}`)
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
    },
    
    async loadTournamentHistory() {
      if (!this.team || this.tournamentHistory) return
      
      this.loadingHistory = true
      try {
        const token = localStorage.getItem('token')
        
        // Try to find country code from the countries list
        let countryCode = this.team.country || this.team.countryCode
        
        if (!countryCode && this.countries.length > 0) {
          // Try to find by name match
          const country = this.countries.find(c => 
            c.name === this.team.name || 
            c.name.toLowerCase() === this.team.name.toLowerCase()
          )
          if (country) {
            countryCode = country.code
          }
        }
        
        // If still no code, use the team name as fallback
        if (!countryCode) {
          countryCode = this.team.name
        }
        
        console.log('Loading tournament history for team:', this.team)
        console.log('Using country code:', countryCode)
        console.log('API URL:', `http://localhost:3001/api/teams/history/${countryCode}`)
        
        const response = await fetch(`http://localhost:3001/api/teams/history/${countryCode}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        console.log('Response status:', response.status)
        console.log('Response ok:', response.ok)
        
        if (response.ok) {
          this.tournamentHistory = await response.json()
          console.log('Tournament history loaded:', this.tournamentHistory)
        } else {
          const errorData = await response.json()
          console.error('API Error:', errorData)
        }
      } catch (error) {
        console.error('Error loading tournament history:', error)
      } finally {
        this.loadingHistory = false
      }
    },
    
    getResultClass(result) {
      switch (result.toLowerCase()) {
        case 'winner': return 'result-winner'
        case 'runner-up': return 'result-runner-up'
        case 'semi-finals': return 'result-semi'
        case 'quarter-finals': return 'result-quarter'
        case 'round of 16': return 'result-round16'
        case 'group stage': return 'result-group'
        default: return 'result-default'
      }
    },
    
    getPositionSuffix(position) {
      if (position === 1) return '1st'
      if (position === 2) return '2nd'
      if (position === 3) return '3rd'
      return `${position}th`
    },
    
    getCountryFlag(countryCode) {
      const country = this.countries.find(c => c.code === countryCode)
      return country ? country.flag : '🏴'
    }
  },
  
  watch: {
    activeTab(newTab) {
      if (newTab === 'history' && !this.tournamentHistory) {
        this.loadTournamentHistory()
      }
    }
  }
}
</script>

<style scoped>
.qualifying-team-detail {
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

.content-tabs {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.1);
  color: var(--white);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-weight: var(--font-weight-semibold);
  transition: all 0.3s ease;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.tab-btn.active {
  background: var(--fifa-blue);
  border-color: var(--fifa-blue);
  color: var(--white);
}

.tab-content {
  margin-top: 24px;
}

.content-card {
  padding: 24px;
  border-radius: var(--radius-xl);
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
  background: rgba(255, 193, 7, 0.05);
  border: 1px solid rgba(255, 193, 7, 0.2);
  transition: all 0.3s ease;
}

.match-item.completed {
  background: rgba(255, 193, 7, 0.08);
  border-color: rgba(255, 193, 7, 0.3);
}

.match-item.clickable {
  cursor: pointer;
}

.match-item.clickable:hover {
  background: rgba(255, 193, 7, 0.12);
  border-color: rgba(255, 193, 7, 0.4);
  transform: translateY(-1px);
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

.match-type {
  background: rgba(255, 193, 7, 0.2);
  color: #e6a700;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
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

.loading-history {
  text-align: center;
  padding: 2rem;
  color: var(--gray);
}

.loading-history i {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.history-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.best-result-card {
  background: linear-gradient(135deg, var(--fifa-gold) 0%, #ffc107 100%);
  color: var(--white);
  padding: 20px;
  border-radius: var(--radius-lg);
  text-align: center;
}

.best-result-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px;
}

.best-result-header h4 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: var(--font-weight-semibold);
}

.best-result-value {
  font-size: 1.5rem;
  font-weight: var(--font-weight-bold);
}

.statistics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.stat-card {
  background: rgba(0, 102, 204, 0.05);
  border: 1px solid rgba(0, 102, 204, 0.1);
  border-radius: var(--radius-lg);
  padding: 16px;
  text-align: center;
}

.stat-number {
  font-size: 2rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-blue);
  margin-bottom: 4px;
}

.stat-label {
  color: var(--gray);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tournament-history-list h4 {
  color: var(--fifa-dark-blue);
  margin-bottom: 16px;
  font-size: 1.25rem;
}

.no-history {
  text-align: center;
  padding: 2rem;
  color: var(--gray);
}

.no-history i {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.history-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: rgba(0, 102, 204, 0.05);
  border: 1px solid rgba(0, 102, 204, 0.1);
  border-radius: var(--radius-lg);
  transition: all 0.3s ease;
}

.history-item.world-tournament {
  border-color: var(--fifa-gold);
  background: rgba(255, 193, 7, 0.05);
}

.history-item:hover {
  background: rgba(0, 102, 204, 0.08);
  border-color: rgba(0, 102, 204, 0.2);
}

.tournament-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.tournament-year {
  font-size: 1.5rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-blue);
  min-width: 60px;
}

.tournament-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tournament-name {
  font-weight: var(--font-weight-semibold);
  color: var(--fifa-dark-blue);
}

.tournament-host {
  color: var(--gray);
  font-size: 0.9rem;
}

.world-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--fifa-gold);
  font-size: 0.8rem;
  font-weight: var(--font-weight-medium);
}

.tournament-result {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.result-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
}

.result-badge.result-winner {
  background: rgba(40, 167, 69, 0.2);
  color: #28a745;
}

.result-badge.result-runner-up {
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
}

.result-badge.result-semi,
.result-badge.result-quarter,
.result-badge.result-round16 {
  background: rgba(0, 102, 204, 0.2);
  color: var(--fifa-blue);
}

.result-badge.result-group {
  background: rgba(156, 163, 175, 0.2);
  color: #6b7280;
}

.position-badge {
  font-size: 0.8rem;
  color: var(--gray);
  font-weight: var(--font-weight-medium);
}

.no-history-data {
  text-align: center;
  padding: 2rem;
  color: var(--gray);
}

.no-history-data i {
  font-size: 2rem;
  margin-bottom: 1rem;
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
  
  .content-tabs {
    flex-direction: column;
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

.roster-section {
  padding: 0 !important;
}

.roster-section .content-card {
  border-radius: 0;
  border: none;
  background: transparent;
}
</style>