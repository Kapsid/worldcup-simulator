<template>
  <div class="player-detail">
    <AppHeader 
      :username="username" 
      :subscription-tier="subscriptionTier"
      :user-avatar="userAvatar"
      @logout="handleLogout" 
    />
    
    <Breadcrumbs 
      :current-player="player" 
    />
    
    <main class="main-content">
      <div class="player-container">
        <div v-if="loading" class="loading-state">
          <i class="fas fa-spinner fa-spin"></i>
          Loading player details...
        </div>
        
        <div v-else-if="!player" class="error-state">
          <div class="error-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <h3>Player not found</h3>
          <p>The player you're looking for doesn't exist.</p>
          <button @click="goBack" class="btn-primary">
            <i class="fas fa-arrow-left"></i>
            Go Back
          </button>
        </div>
        
        <div v-else class="player-detail-content">
          <!-- Player Header -->
          <div class="player-header glass-white">
            <div class="back-navigation">
              <button @click="goBack" class="back-btn">
                <i class="fas fa-arrow-left"></i>
                {{ backButtonText }}
              </button>
            </div>
            
            <div class="player-main-info">
              <div class="player-avatar-section">
                <div class="player-avatar-large">
                  <img :src="getPlayerAvatar(player)" :alt="player.displayName">
                  <div class="jersey-number-large">{{ player.jerseyNumber }}</div>
                  <div v-if="player.isCaptain" class="captain-badge-large">
                    <i class="fas fa-star"></i>
                    Captain
                  </div>
                  <div v-else-if="player.isViceCaptain" class="captain-badge-large vice">
                    <i class="fas fa-star-half-alt"></i>
                    Vice Captain
                  </div>
                </div>
                
                <div class="player-ratings">
                  <div class="rating-circle">
                    <div class="rating-value">{{ player.overallRating }}</div>
                    <div class="rating-label">Overall</div>
                  </div>
                  <div class="rating-circle">
                    <div class="rating-value">{{ player.potential }}</div>
                    <div class="rating-label">Potential</div>
                  </div>
                </div>
              </div>
              
              <div class="player-info-section">
                <h1>{{ player.displayName }}</h1>
                <div class="player-basic-info">
                  <div class="info-item">
                    <i class="fas fa-flag"></i>
                    <span>{{ getCountryName(player.nationality) }}</span>
                  </div>
                  <div class="info-item">
                    <i class="fas fa-running"></i>
                    <span>{{ player.position }} ({{ player.detailedPosition }})</span>
                  </div>
                  <div class="info-item">
                    <i class="fas fa-calendar"></i>
                    <span>{{ player.age }} years old</span>
                  </div>
                  <div class="info-item">
                    <i class="fas fa-ruler-vertical"></i>
                    <span>{{ player.height }}cm</span>
                  </div>
                  <div class="info-item">
                    <i class="fas fa-shoe-prints"></i>
                    <span>{{ player.preferredFoot }} footed</span>
                  </div>
                </div>
                
                <!-- International Career Stats -->
                <div class="international-stats">
                  <h3>International Career</h3>
                  <div class="international-grid">
                    <div class="intl-stat">
                      <div class="stat-number">{{ player.internationalCaps }}</div>
                      <div class="stat-label">Caps</div>
                    </div>
                    <div v-if="player.position !== 'Goalkeeper'" class="intl-stat">
                      <div class="stat-number">{{ player.internationalGoals }}</div>
                      <div class="stat-label">Goals</div>
                    </div>
                    <div v-if="player.position !== 'Goalkeeper'" class="intl-stat">
                      <div class="stat-number">{{ player.internationalAssists }}</div>
                      <div class="stat-label">Assists</div>
                    </div>
                    <div v-if="player.position === 'Goalkeeper'" class="intl-stat">
                      <div class="stat-number">{{ player.internationalCleanSheets }}</div>
                      <div class="stat-label">Clean Sheets</div>
                    </div>
                    <div v-if="player.debutYear" class="intl-stat">
                      <div class="stat-number">{{ player.debutYear }}</div>
                      <div class="stat-label">Debut Year</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Tournament Stats -->
          <div class="player-stats-section">
            <div class="stats-card glass-white">
              <div class="card-header">
                <h3>Tournament History</h3>
                <i class="fas fa-trophy"></i>
              </div>
              
              <div v-if="allTournamentStats.length > 0" class="tournament-history-content">
                <div v-for="tournament in allTournamentStats" :key="tournament.tournamentId" class="tournament-item">
                  <div class="tournament-header">
                    <h4>{{ tournament.tournamentName }}</h4>
                    <span class="tournament-year">{{ tournament.year }}</span>
                  </div>
                  
                  <!-- Qualification Stats -->
                  <div v-if="tournament.qualification" class="phase-stats">
                    <h5 class="phase-title">Qualification</h5>
                    <div class="stats-grid">
                      <div class="stat-item">
                        <span class="stat-number">{{ tournament.qualification.matchesStarted || 0 }}</span>
                        <span class="stat-label">Starts</span>
                      </div>
                      <div v-if="player.position !== 'Goalkeeper'" class="stat-item">
                        <span class="stat-number">{{ tournament.qualification.goals || 0 }}</span>
                        <span class="stat-label">Goals</span>
                      </div>
                      <div v-if="player.position === 'Goalkeeper'" class="stat-item">
                        <span class="stat-number">{{ tournament.qualification.cleanSheets || 0 }}</span>
                        <span class="stat-label">Clean Sheets</span>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Tournament Stats -->
                  <div v-if="tournament.tournament" class="phase-stats">
                    <h5 class="phase-title">Tournament</h5>
                    <div class="stats-grid">
                      <div class="stat-item">
                        <span class="stat-number">{{ tournament.tournament.matchesStarted || 0 }}</span>
                        <span class="stat-label">Starts</span>
                      </div>
                      <div v-if="player.position !== 'Goalkeeper'" class="stat-item">
                        <span class="stat-number">{{ tournament.tournament.goals || 0 }}</span>
                        <span class="stat-label">Goals</span>
                      </div>
                      <div v-if="player.position === 'Goalkeeper'" class="stat-item">
                        <span class="stat-number">{{ tournament.tournament.cleanSheets || 0 }}</span>
                        <span class="stat-label">Clean Sheets</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div v-else class="no-stats-content">
                <i class="fas fa-chart-line"></i>
                <p>No tournament statistics available</p>
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
import { getPlayerAvatarUrl } from '../utils/avatarGenerator.js'
import { API_URL } from '../config/api.js'

export default {
  name: 'PlayerDetail',
  components: {
    AppHeader,
    Breadcrumbs
  },
  data() {
    return {
      username: '',
      subscriptionTier: 'basic',
      userAvatar: null,
      player: null,
      loading: true,
      error: '',
      allTournamentStats: []
    }
  },
  computed: {
    playerId() {
      return this.$route.params.playerId
    },
    teamContext() {
      return {
        tournamentId: this.$route.query.tournamentId,
        worldId: this.$route.query.worldId,
        teamCode: this.$route.query.teamCode,
        isQualifying: this.$route.query.isQualifying === 'true',
        qualifyingTeamId: this.$route.query.qualifyingTeamId
      }
    },
    backButtonText() {
      if (this.$route.query.from === 'match-detail') {
        return 'Back to Match Detail'
      }
      return 'Back to Team Roster'
    }
  },
  async mounted() {
    this.username = localStorage.getItem('username') || 'User'
    
    const token = localStorage.getItem('token')
    if (!token) {
      this.$router.push('/')
      return
    }
    
    await this.loadPlayer()
    this.loadUserProfile()
    // Always try to load tournament stats
    this.loadTournamentStats()
  },
  methods: {
    async loadPlayer() {
      this.loading = true
      this.error = ''
      
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/players/${this.playerId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          this.player = await response.json()
        } else if (response.status === 404) {
          this.player = null
        } else {
          this.error = 'Failed to load player'
        }
      } catch (error) {
        this.error = 'Network error. Please try again.'
      } finally {
        this.loading = false
      }
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

    async loadTournamentStats() {
      try {
        const token = localStorage.getItem('token')
        
        // Load all player stats across all tournaments
        const response = await fetch(
          `${API_URL}/players/${this.playerId}/tournament-history`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        )
        
        if (response.ok) {
          const tournamentHistory = await response.json()
          this.allTournamentStats = tournamentHistory.map(tournament => ({
            tournamentId: tournament.tournamentId,
            tournamentName: tournament.tournamentName || `Tournament ${tournament.tournamentId.substring(0, 8)}`,
            year: tournament.year || new Date().getFullYear(),
            qualification: tournament.qualification ? {
              matchesStarted: tournament.qualification.starts || 0,
              goals: tournament.qualification.goals || 0,
              cleanSheets: tournament.qualification.cleanSheets || 0
            } : null,
            tournament: tournament.tournament ? {
              matchesStarted: tournament.tournament.starts || 0,
              goals: tournament.tournament.goals || 0,
              cleanSheets: tournament.tournament.cleanSheets || 0
            } : null
          }))
        } else {
          // Fallback: if endpoint doesn't exist, try the old approach for current tournament
          if (this.teamContext.tournamentId) {
            await this.loadCurrentTournamentStats()
          }
        }
      } catch (error) {
        console.error('Failed to load tournament stats:', error)
        // Fallback for current tournament
        if (this.teamContext.tournamentId) {
          await this.loadCurrentTournamentStats()
        }
      }
    },

    async loadCurrentTournamentStats() {
      try {
        const token = localStorage.getItem('token')
        const tournamentId = this.teamContext.tournamentId
        
        const currentTournament = {
          tournamentId: tournamentId,
          tournamentName: 'Current Tournament',
          year: new Date().getFullYear(),
          qualification: null,
          tournament: null
        }
        
        // Load qualification stats
        const qualResponse = await fetch(
          `${API_URL}/matches/${tournamentId}/player-stats/${this.playerId}?competitionType=qualification`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        )
        
        if (qualResponse.ok) {
          const qualStats = await qualResponse.json()
          if (qualStats && (qualStats.matchesStarted > 0 || qualStats.appearances > 0)) {
            currentTournament.qualification = {
              matchesStarted: qualStats.matchesStarted || qualStats.appearances || 0,
              goals: qualStats.goals || 0,
              cleanSheets: qualStats.cleanSheets || 0
            }
          }
        }
        
        // Load tournament stats
        const tournResponse = await fetch(
          `${API_URL}/matches/${tournamentId}/player-stats/${this.playerId}?competitionType=tournament`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        )
        
        if (tournResponse.ok) {
          const tournStats = await tournResponse.json()
          if (tournStats && (tournStats.matchesStarted > 0 || tournStats.appearances > 0)) {
            currentTournament.tournament = {
              matchesStarted: tournStats.matchesStarted || tournStats.appearances || 0,
              goals: tournStats.goals || 0,
              cleanSheets: tournStats.cleanSheets || 0
            }
          }
        }
        
        // Only add if there are any stats
        if (currentTournament.qualification || currentTournament.tournament) {
          this.allTournamentStats = [currentTournament]
        }
      } catch (error) {
        console.error('Failed to load current tournament stats:', error)
      }
    },
    
    handleLogout() {
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      this.$router.push('/')
    },
    
    goBack() {
      // Check if we came from match detail
      if (this.$route.query.from === 'match-detail' && this.$route.query.matchId && this.$route.query.tournamentId) {
        // Go back to the match detail page
        const path = `/tournament/${this.$route.query.tournamentId}/match/${this.$route.query.matchId}`
        console.log('🏃 NAVIGATION: Going back to match detail:', path)
        this.$router.push(path)
        return
      }

      // Try to go back to the team roster with context
      if (this.teamContext.tournamentId) {
        if (this.teamContext.isQualifying && this.teamContext.qualifyingTeamId) {
          // Go to qualifying team detail route using the qualifying team ID
          const path = `/tournament/${this.teamContext.tournamentId}/qualifying-team/${this.teamContext.qualifyingTeamId}`
          console.log('🏃 NAVIGATION: Going back to qualifying team:', path)
          this.$router.push(path)
        } else if (this.teamContext.teamCode) {
          // Go to regular team detail route - use teamCode as teamId
          const path = `/tournament/${this.teamContext.tournamentId}/team/${this.teamContext.teamCode}`
          console.log('🏃 NAVIGATION: Going back to team:', path)
          this.$router.push(path)
        } else {
          // Otherwise just go back in history
          console.log('🏃 NAVIGATION: Going back in history (no team context)')
          this.$router.go(-1)
        }
      } else {
        // Otherwise just go back in history
        console.log('🏃 NAVIGATION: Going back in history (no tournament context)')
        this.$router.go(-1)
      }
    },
    
    getPlayerAvatar(player) {
      console.log('🖼️ AVATAR: Player detail getting avatar for:', player.displayName)
      return getPlayerAvatarUrl(player)
    },
    
    getCountryName(code) {
      const countryNames = {
        'USA': 'United States',
        'ENG': 'England',
        'GER': 'Germany',
        'FRA': 'France',
        'ESP': 'Spain',
        'ITA': 'Italy',
        'BRA': 'Brazil',
        'ARG': 'Argentina',
        'NED': 'Netherlands',
        'POR': 'Portugal',
        'JPN': 'Japan',
        'MEX': 'Mexico'
      }
      return countryNames[code] || code
    }
  }
}
</script>

<style scoped>
.player-detail {
  min-height: 100vh;
  background: linear-gradient(135deg, #0066CC 0%, #003366 100%);
}

.main-content {
  padding: 2rem;
  display: flex;
  justify-content: center;
}

.player-container {
  width: 100%;
  max-width: 1200px;
}

.loading-state, .error-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--white);
}

.loading-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-state .error-icon {
  font-size: 4rem;
  margin-bottom: 2rem;
  color: var(--fifa-red);
}

.player-detail-content {
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.player-header {
  background: rgba(255, 255, 255, 0.95);
  border-radius: var(--radius-xl);
  padding: 2rem;
  margin-bottom: 2rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.back-navigation {
  margin-bottom: 2rem;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(0, 102, 204, 0.1);
  border: 1px solid rgba(0, 102, 204, 0.3);
  border-radius: var(--radius-md);
  color: var(--fifa-dark-blue);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.back-btn:hover {
  background: rgba(0, 102, 204, 0.2);
  transform: translateX(-2px);
}

.player-main-info {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 3rem;
  align-items: start;
}

.player-avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.player-avatar-large {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.player-avatar-large img {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid var(--fifa-gold);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.jersey-number-large {
  position: absolute;
  bottom: -10px;
  right: -10px;
  background: var(--fifa-dark-blue);
  color: var(--white);
  font-size: 1.5rem;
  font-weight: bold;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.captain-badge-large {
  margin-top: 1rem;
  background: var(--fifa-gold);
  color: var(--dark);
  padding: 8px 16px;
  border-radius: var(--radius-lg);
  font-size: 0.9rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 4px 16px rgba(255, 215, 0, 0.3);
}

.captain-badge-large.vice {
  background: #C0C0C0;
}

.player-ratings {
  display: flex;
  gap: 2rem;
}

.rating-circle {
  text-align: center;
}

.rating-value {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: var(--fifa-gold);
  color: var(--dark);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 8px;
  box-shadow: 0 4px 16px rgba(255, 215, 0, 0.3);
}

.rating-label {
  font-size: 0.9rem;
  color: var(--fifa-dark-blue);
  font-weight: 500;
}

.player-info-section h1 {
  color: var(--fifa-dark-blue);
  font-size: 2.5rem;
  margin: 0 0 1.5rem 0;
  font-weight: bold;
}

.player-basic-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.1rem;
  color: var(--fifa-dark-blue);
}

.info-item i {
  width: 24px;
  color: var(--fifa-gold);
}

.player-stats-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.stats-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: var(--radius-xl);
  padding: 2rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid rgba(0, 102, 204, 0.1);
}

.card-header h3 {
  color: var(--fifa-dark-blue);
  font-size: 1.3rem;
  margin: 0;
}

.card-header i {
  font-size: 1.5rem;
  color: var(--fifa-gold);
}

.status-grid {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: var(--white);
}

.status-icon.form { background: var(--fifa-blue); }
.status-icon.fitness { background: #22d3ee; }
.status-icon.morale { background: #4ade80; }

.status-details {
  flex: 1;
}

.status-label {
  display: block;
  color: var(--fifa-dark-blue);
  font-size: 0.9rem;
  opacity: 0.8;
  margin-bottom: 4px;
}

.status-value {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--fifa-dark-blue);
  margin-bottom: 8px;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: rgba(0, 102, 204, 0.2);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--fifa-blue);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-fill.morale {
  background: #4ade80;
}

.career-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 2rem;
}

.tournament-stats-section {
  margin-bottom: 2rem;
}

.tournament-stats-section:last-child {
  margin-bottom: 0;
}

.stats-section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--fifa-dark-blue);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid rgba(0, 102, 204, 0.2);
}

/* International Career in Main Card */
.international-stats {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid rgba(0, 102, 204, 0.1);
}

.international-stats h3 {
  margin-bottom: 1rem;
  color: var(--fifa-dark-blue);
  font-size: 1.2rem;
  font-weight: 600;
}

.international-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 1rem;
}

.intl-stat {
  text-align: center;
  padding: 0.75rem;
  background: rgba(0, 102, 204, 0.05);
  border-radius: 8px;
}

.intl-stat .stat-number {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--fifa-blue);
  display: block;
  margin-bottom: 0.25rem;
}

.intl-stat .stat-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 500;
}

/* Tournament History */
.tournament-history-content {
  width: 100%;
}

.tournament-item {
  border-bottom: 2px solid rgba(0, 102, 204, 0.1);
  margin-bottom: 2rem;
  padding-bottom: 2rem;
}

.tournament-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.tournament-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.tournament-header h4 {
  color: var(--fifa-dark-blue);
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.no-stats-content {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}

.no-stats-content i {
  font-size: 2rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.no-stats-content p {
  font-size: 1rem;
  margin: 0;
}

.tournament-year {
  background: var(--fifa-blue);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
}

.phase-stats {
  margin-bottom: 1.5rem;
}

.phase-stats:last-child {
  margin-bottom: 0;
}

.phase-title {
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  padding-left: 0.5rem;
  border-left: 3px solid var(--fifa-blue);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 1rem;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  background: rgba(0, 102, 204, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(0, 102, 204, 0.1);
}

.stat-item .stat-number {
  font-size: 1.8rem;
  font-weight: bold;
  color: var(--fifa-blue);
  display: block;
  margin-bottom: 0.25rem;
}

.stat-item .stat-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.no-stats {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.no-stats i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.no-stats p {
  font-size: 1.1rem;
  margin: 0;
}

.career-stat {
  text-align: center;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: var(--fifa-gold);
  margin-bottom: 8px;
}

.stat-label {
  color: var(--fifa-dark-blue);
  font-size: 0.9rem;
  opacity: 0.8;
}

.form-excellent { color: #4ade80; }
.form-good { color: #22d3ee; }
.form-average { color: #facc15; }
.form-poor { color: #ef4444; }

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  background: var(--fifa-blue);
  color: var(--white);
  border: none;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: var(--fifa-dark-blue);
}

@media (max-width: 768px) {
  .player-main-info {
    grid-template-columns: 1fr;
    gap: 2rem;
    text-align: center;
  }
  
  .player-stats-section {
    grid-template-columns: 1fr;
  }
  
  .player-info-section h1 {
    font-size: 2rem;
  }
  
  .player-ratings {
    justify-content: center;
  }
}
</style>