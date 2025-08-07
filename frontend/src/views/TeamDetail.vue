<template>
  <div class="team-detail">
    <AppHeader 
      :username="username" 
      :subscription-tier="subscriptionTier"
      :user-avatar="userAvatar"
      @logout="handleLogout" 
    />
    
    <Breadcrumbs 
      :current-team="team" 
      :current-tournament="tournament" 
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
                <CountryFlag :country-code="team.countryCode" :size="32" />
                <div class="team-details">
                  <h1>{{ team.countryName || team.name }}</h1>
                  <p class="team-subtitle">{{ tournament?.name || 'World Cup' }}</p>
                </div>
              </div>
              
              <div class="team-stats-summary">
                <div class="stat-item">
                  <span class="stat-label">FIFA Ranking</span>
                  <span class="stat-value">#{{ countryInfo?.fifaRanking || countryInfo?.worldRanking || team.fifaRanking || team.worldRanking || '--' }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Group</span>
                  <span class="stat-value">{{ team.group || team.groupName || '--' }}</span>
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
              Match History
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
                  <h3>Match History</h3>
                  <i class="fas fa-futbol"></i>
                </div>
                <div class="card-content">
                  <div v-if="allMatches.length === 0" class="empty-matches">
                    <i class="fas fa-calendar-times"></i>
                    <p>No matches played yet</p>
                  </div>
                  <div v-else class="matches-list">
                    <div 
                      v-for="match in allMatches" 
                      :key="match._id"
                      class="match-item"
                      :class="{ 'completed': match.status === 'completed', 'scheduled': match.status === 'scheduled', 'qualification': match.isQualification, 'knockout': match.isKnockout }"
                    >
                      <div class="match-info">
                        <div class="match-teams">
                          <span class="team-name" :class="{ 'current-team': match.homeTeam.name === team.name }">
                            <CountryFlag :country-code="match.homeTeam.countryCode" :size="24" />
                            {{ match.homeTeam.name }}
                          </span>
                          <span class="vs">vs</span>
                          <span class="team-name" :class="{ 'current-team': match.awayTeam.name === team.name }">
                            <CountryFlag :country-code="match.awayTeam.countryCode" :size="24" />
                            {{ match.awayTeam.name }}
                          </span>
                        </div>
                        <div class="match-details">
                          <span class="match-round">{{ formatMatchRound(match) }}</span>
                          <span class="match-date">{{ formatDate(match.scheduledDate || match.date) }}</span>
                          <span v-if="match.isQualification" class="match-type">Qualification</span>
                          <span v-if="match.isKnockout" class="match-type knockout">Knockout</span>
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
                        <div class="stat-number">{{ tournamentHistory.statistics.semifinals }}</div>
                        <div class="stat-label">1/2 Final</div>
                      </div>
                      <div class="stat-card">
                        <div class="stat-number">{{ tournamentHistory.statistics.quarterFinals }}</div>
                        <div class="stat-label">1/4 Final</div>
                      </div>
                      <div class="stat-card">
                        <div class="stat-number">{{ tournamentHistory.statistics.roundOf16 }}</div>
                        <div class="stat-label">1/8 Final</div>
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
                              <div class="tournament-name">{{ tournament.tournamentName }}</div>
                              <div class="tournament-host">
                                <CountryFlag :country-code="tournament.hostCountryCode" :size="20" />
                                {{ tournament.hostCountry }}
                              </div>
                              <div v-if="tournament.isWorldTournament" class="world-badge">
                                <i class="fas fa-globe"></i>
                                World Tournament
                              </div>
                            </div>
                          </div>
                          <div class="tournament-result">
                            <div class="result-badge" :class="getResultClass(tournament.achievement)">
                              {{ tournament.achievement }}
                            </div>
                            <div v-if="tournament.finalPosition" class="position-badge">
                              {{ getPositionSuffix(tournament.finalPosition) }}
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
import Breadcrumbs from '../components/Breadcrumbs.vue'
import CountryFlag from '../components/CountryFlag.vue'
import TeamRoster from '../components/TeamRoster.vue'
import { API_URL } from '../config/api.js'

export default {
  name: 'TeamDetail',
  components: {
    AppHeader,
    Breadcrumbs,
    CountryFlag,
    TeamRoster
  },
  data() {
    return {
      username: '',
      subscriptionTier: 'basic',
      userAvatar: null,
      team: null,
      tournament: null,
      matches: [],
      qualificationMatches: [],
      knockoutMatches: [],
      countries: [],
      loading: false,
      activeTab: 'roster',
      tournamentHistory: null,
      loadingHistory: false
    }
  },
  computed: {
    countryInfo() {
      if (!this.team) return null
      return this.countries.find(c => c.code === this.team.countryCode)
    },

    rosterTeamData() {
      if (!this.team) return null
      return {
        code: this.team.countryCode,
        name: this.team.countryName || this.team.name,
        flag: this.countryInfo?.flag || '🏴'
      }
    },
    
    allMatches() {
      // Combine qualification, group, and knockout matches
      const combined = [...this.qualificationMatches, ...this.matches, ...this.knockoutMatches]
      
      console.log('All matches combined:', {
        qualification: this.qualificationMatches.length,
        group: this.matches.length,
        knockout: this.knockoutMatches.length,
        total: combined.length
      })
      
      // Sort by tournament progression order
      return combined.sort((a, b) => {
        // Define match type priority (lower number = earlier in tournament)
        const getMatchPriority = (match) => {
          if (match.isQualification) {
            // Qualification matches come first, sorted by matchday
            return (match.matchday || 1) * 100 // multiply by 100 to ensure they come before group stage
          }
          if (match.isKnockout) {
            // Knockout matches come after group stage
            const knockoutOrder = {
              'round16': 4000,
              'quarterfinal': 5000,
              'semifinal': 6000,
              'third_place': 7000,
              'final': 8000
            }
            return knockoutOrder[match.round] || 9000
          }
          // Group stage matches (matchday 1, 2, 3)
          return 3000 + (match.matchday || 1)
        }
        
        const priorityA = getMatchPriority(a)
        const priorityB = getMatchPriority(b)
        
        if (priorityA !== priorityB) {
          return priorityA - priorityB
        }
        
        // If same priority, sort by date
        const dateA = new Date(a.scheduledDate || a.date || 0)
        const dateB = new Date(b.scheduledDate || b.date || 0)
        return dateA - dateB
      })
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
          this.loadTeamMatches(),
          this.loadQualificationMatches(),
          this.loadKnockoutMatches()
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
        const response = await fetch(`${API_URL}/tournaments/${this.$route.params.tournamentId}`, {
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
        const response = await fetch(`${API_URL}/teams/${this.$route.params.tournamentId}/${this.$route.params.teamId}`, {
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
        const response = await fetch('${API_URL}/tournaments/countries')
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
        const response = await fetch(`${API_URL}/matches/${this.$route.params.tournamentId}/team/${this.$route.params.teamId}`, {
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
    
    async loadQualificationMatches() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/qualification/${this.$route.params.tournamentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const qualificationData = await response.json()
          let qualMatches = []
          
          // Extract team matches from qualification data
          if (qualificationData && qualificationData.confederations) {
            for (const confed of qualificationData.confederations) {
              if (confed.groups) {
                for (const group of confed.groups) {
                  if (group.matches) {
                    for (const match of group.matches) {
                      // Check if this team is in the match
                      if ((match.homeTeam && match.homeTeam.teamId === this.$route.params.teamId) ||
                          (match.awayTeam && match.awayTeam.teamId === this.$route.params.teamId)) {
                        qualMatches.push({
                          _id: match.matchId,
                          homeTeam: {
                            _id: match.homeTeam.teamId,
                            name: match.homeTeam.name,
                            countryName: match.homeTeam.name,
                            countryCode: match.homeTeam.country,
                            countryFlag: match.homeTeam.flag
                          },
                          awayTeam: {
                            _id: match.awayTeam.teamId,
                            name: match.awayTeam.name,
                            countryName: match.awayTeam.name,
                            countryCode: match.awayTeam.country,
                            countryFlag: match.awayTeam.flag
                          },
                          homeScore: match.homeScore,
                          awayScore: match.awayScore,
                          status: match.played ? 'completed' : 'scheduled',
                          matchday: match.matchday,
                          round: match.round,
                          date: match.date,
                          scheduledDate: match.date,
                          isQualification: true,
                          confederation: confed.name
                        })
                      }
                    }
                  }
                }
              }
            }
          }
          
          this.qualificationMatches = qualMatches
          console.log('Loaded qualification matches:', qualMatches.length, qualMatches)
        }
      } catch (error) {
        console.error('Error loading qualification matches:', error)
        // Don't fail if qualification matches can't be loaded
      }
    },
    
    async loadKnockoutMatches() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/knockout/${this.$route.params.tournamentId}/bracket`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const bracketData = await response.json()
          let knockoutMatches = []
          
          // Extract team matches from knockout bracket data
          if (bracketData && bracketData.matches) {
            for (const [round, matches] of Object.entries(bracketData.matches)) {
              for (const match of matches) {
                // Check if this team is in the match
                if ((match.homeTeam && match.homeTeam._id === this.$route.params.teamId) ||
                    (match.awayTeam && match.awayTeam._id === this.$route.params.teamId)) {
                  knockoutMatches.push({
                    _id: match._id,
                    homeTeam: {
                      _id: match.homeTeam?._id,
                      name: match.homeTeam?.countryName || match.homeTeam?.name,
                      countryName: match.homeTeam?.countryName,
                      countryCode: match.homeTeam?.countryCode,
                      countryFlag: match.homeTeam?.countryFlag
                    },
                    awayTeam: {
                      _id: match.awayTeam?._id,
                      name: match.awayTeam?.countryName || match.awayTeam?.name,
                      countryName: match.awayTeam?.countryName,
                      countryCode: match.awayTeam?.countryCode,
                      countryFlag: match.awayTeam?.countryFlag
                    },
                    homeScore: match.homeScore,
                    awayScore: match.awayScore,
                    homeExtraTimeScore: match.homeExtraTimeScore,
                    awayExtraTimeScore: match.awayExtraTimeScore,
                    homePenaltyScore: match.homePenaltyScore,
                    awayPenaltyScore: match.awayPenaltyScore,
                    status: match.status,
                    round: match.round,
                    matchPosition: match.matchPosition,
                    date: match.date,
                    scheduledDate: match.scheduledDate,
                    isKnockout: true,
                    decidedBy: match.decidedBy,
                    winner: match.winner
                  })
                }
              }
            }
          }
          
          this.knockoutMatches = knockoutMatches
          console.log('Loaded knockout matches:', knockoutMatches.length, knockoutMatches)
        }
      } catch (error) {
        console.error('Error loading knockout matches:', error)
        // Don't fail if knockout matches can't be loaded
      }
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
      if (match.isQualification) {
        if (match.confederation && match.matchday) {
          return `${match.confederation} Qualifying MD ${match.matchday}`
        }
        if (match.matchday) return `Qualifying MD ${match.matchday}`
        return 'Qualification Match'
      }
      if (match.isKnockout) {
        const roundNames = {
          'round16': 'Round of 16',
          'quarterfinal': 'Quarter-final',
          'semifinal': 'Semi-final',
          'final': 'Final',
          'third_place': 'Third Place Play-off'
        }
        return roundNames[match.round] || match.round
      }
      if (match.round) return `Round ${match.round}`
      if (match.matchday) return `Matchday ${match.matchday}`
      return 'Tournament Match'
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
        const response = await fetch(`${API_URL}/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const user = await response.json()
          this.subscriptionTier = user.subscriptionTier || 'basic'
          this.userAvatar = user.avatar || null
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
      if (!this.team || this.tournamentHistory || !this.tournament?.worldId) return
      
      this.loadingHistory = true
      try {
        const token = localStorage.getItem('token')
        
        // Extract country code from team
        let countryCode = this.team.countryCode
        if (!countryCode && this.team.name) {
          countryCode = this.team.name
        }
        
        console.log('🏆 HISTORY: Loading tournament history for', countryCode, 'in world', this.tournament.worldId)
        
        const response = await fetch(`${API_URL}/countries/${countryCode}/tournament-history?worldId=${this.tournament.worldId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          this.tournamentHistory = await response.json()
          console.log('🏆 HISTORY: Loaded tournament history:', this.tournamentHistory)
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
    
    getResultClass(achievement) {
      if (!achievement) return 'result-default'
      
      switch (achievement.toLowerCase()) {
        case '1st place': return 'result-winner'
        case '2nd place': return 'result-runner-up'
        case '3rd place':
        case '4th place': return 'result-semi'
        case '1/4 final ended': return 'result-quarter'
        case '1/8 final ended': return 'result-round16'
        case 'group stage ended': return 'result-group'
        case 'qualification ended':
        case 'did not qualify': return 'result-qualification'
        default: return 'result-default'
      }
    },
    
    getPositionSuffix(position) {
      if (position === 1) return '1st'
      if (position === 2) return '2nd'
      if (position === 3) return '3rd'
      return `${position}th`
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

.match-item.qualification {
  background: rgba(255, 193, 7, 0.05);
  border-color: rgba(255, 193, 7, 0.2);
}

.match-item.qualification.completed {
  background: rgba(255, 193, 7, 0.08);
  border-color: rgba(255, 193, 7, 0.3);
}

.match-item.knockout {
  background: rgba(220, 53, 69, 0.05);
  border-color: rgba(220, 53, 69, 0.2);
}

.match-item.knockout.completed {
  background: rgba(220, 53, 69, 0.08);
  border-color: rgba(220, 53, 69, 0.3);
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

.match-type.knockout {
  background: rgba(220, 53, 69, 0.2);
  color: #dc3545;
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

.roster-section {
  padding: 0 !important;
}

.roster-section .content-card {
  border-radius: 0;
  border: none;
  background: transparent;
}

/* Content Tabs */
.content-tabs {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 24px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-xl);
  backdrop-filter: blur(10px);
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: var(--font-weight-medium);
  font-size: 0.95rem;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--white);
}

.tab-btn.active {
  background: var(--white);
  color: var(--fifa-dark-blue);
  font-weight: var(--font-weight-semibold);
}

.tab-btn i {
  font-size: 1rem;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Tournament History Styles */
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

.result-badge.result-qualification {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.result-badge.result-default {
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

/* Mobile Responsiveness */
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
  
  .team-stats-summary {
    flex-direction: column;
    gap: 16px;
  }
  
  .content-tabs {
    flex-direction: column;
  }
  
  .statistics-grid {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 12px;
  }
  
  .stat-card {
    padding: 12px;
  }
  
  .stat-number {
    font-size: 1.5rem;
  }
  
  .stat-label {
    font-size: 0.75rem;
  }
  
  .history-item {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .tournament-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .tournament-result {
    align-items: flex-start;
  }
}
</style>