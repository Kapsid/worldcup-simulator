<template>
  <div class="team-roster">
    <div class="roster-header">
      <div class="header-info">
        <h3>
          <CountryFlag :country-code="team.code || team.countryCode" :size="32" />
          {{ team.name }} Squad
        </h3>
        <div class="squad-stats">
          <span class="stat">{{ players.length }} Players</span>
          <span class="stat">Avg Age: {{ averageAge }}</span>
          <span class="stat">{{ experiencedPlayers }} Caps</span>
        </div>
      </div>
      <div class="view-toggles">
        <button 
          @click="viewMode = 'list'"
          :class="{ active: viewMode === 'list' }"
          class="view-toggle"
        >
          <i class="fas fa-list"></i>
          List
        </button>
        <button 
          @click="viewMode = 'formation'"
          :class="{ active: viewMode === 'formation' }"
          class="view-toggle"
        >
          <i class="fas fa-users"></i>
          Formation
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      Loading squad...
    </div>

    <div v-else-if="error" class="error-state">
      <i class="fas fa-exclamation-triangle"></i>
      {{ error }}
    </div>

    <!-- List View -->
    <div v-else-if="viewMode === 'list'" class="roster-list">
      <!-- No Players Found Message -->
      <div v-if="players.length === 0" class="no-players-message">
        <i class="fas fa-users"></i>
        <h4>No Players Found</h4>
        <p>Player roster is not available for this team yet.</p>
        <div class="debug-info" v-if="error">
          <small>{{ error }}</small>
        </div>
        <button @click="loadRoster" class="btn-primary" :disabled="loading">
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
          Retry Loading
        </button>
      </div>
      
      <!-- Position Groups -->
      <div v-for="positionGroup in positionGroups" :key="positionGroup.name" class="position-group">
        <h4 class="position-title">
          <i :class="positionGroup.icon"></i>
          {{ positionGroup.name }}
          <span class="player-count">({{ positionGroup.players.length }})</span>
        </h4>
        
        <div class="players-grid">
          <div 
            v-for="player in positionGroup.players" 
            :key="player._id"
            @click="selectPlayer(player)"
            class="player-card"
          >
            <div class="player-avatar">
              <img :src="getPlayerAvatar(player)" :alt="player.displayName">
              <div class="jersey-number">{{ player.jerseyNumber }}</div>
              <div v-if="player.isCaptain" class="captain-badge">C</div>
              <div v-else-if="player.isViceCaptain" class="captain-badge">VC</div>
            </div>
            
            <div class="player-info">
              <h5 class="player-name">{{ player.displayName }}</h5>
              <div class="player-details">
                <span class="position">{{ player.detailedPosition }}</span>
                <span class="age">{{ player.age }}y</span>
                <span class="rating">{{ player.overallRating }}</span>
              </div>
              <div class="player-stats">
                <span class="caps">{{ player.internationalCaps }} caps</span>
                <span v-if="player.position !== 'Goalkeeper'" class="goals">
                  {{ player.internationalGoals }} goals
                </span>
                <span v-else class="clean-sheets">
                  {{ player.internationalCleanSheets }} CS
                </span>
              </div>
            </div>

            <div class="player-status">
              <div :class="`form-indicator form-${player.currentForm.toLowerCase()}`">
                {{ player.currentForm.charAt(0) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Formation View -->
    <div v-else-if="viewMode === 'formation'" class="formation-view">
      <div class="formation-info">
        <h4>{{ tactics.formation.name }} - {{ tactics.playStyle.name }}</h4>
        <p class="formation-desc">{{ tactics.formation.description }}</p>
      </div>
      
      <div class="football-pitch">
        <div class="pitch-overlay">
          <!-- Formation visualization would go here -->
          <div class="formation-placeholder">
            <i class="fas fa-users"></i>
            <p>Formation visualization coming soon</p>
            <small>{{ tactics.formation.name }} with {{ tactics.playStyle.name }} style</small>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import { getPlayerAvatarUrl } from '../utils/avatarGenerator.js'
import CountryFlag from './CountryFlag.vue'
import { API_URL } from '../config/api.js'

export default {
  name: 'TeamRoster',
  components: {
    CountryFlag
  },
  props: {
    team: {
      type: Object,
      required: true
    },
    tournamentId: {
      type: String,
      default: null
    },
    worldId: {
      type: String,
      default: null
    },
    isQualifying: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      players: [],
      tactics: {
        formation: { name: '4-4-2', description: 'Classic balanced formation' },
        playStyle: { name: 'Balanced', description: 'Adaptable approach' }
      },
      loading: false,
      error: '',
      viewMode: 'list' // 'list' or 'formation'
    }
  },
  computed: {
    positionGroups() {
      const groups = [
        {
          name: 'Goalkeepers',
          icon: 'fas fa-hand-paper',
          players: this.players.filter(p => p.position === 'Goalkeeper')
        },
        {
          name: 'Defenders',
          icon: 'fas fa-shield-alt',
          players: this.players.filter(p => p.position === 'Defender')
        },
        {
          name: 'Midfielders',
          icon: 'fas fa-circle',
          players: this.players.filter(p => p.position === 'Midfielder')
        },
        {
          name: 'Forwards',
          icon: 'fas fa-rocket',
          players: this.players.filter(p => p.position === 'Forward')
        }
      ]

      // Sort players within each group by overall rating (descending)
      groups.forEach(group => {
        group.players.sort((a, b) => b.overallRating - a.overallRating)
      })

      return groups.filter(group => group.players.length > 0)
    },

    averageAge() {
      if (this.players.length === 0) return 0
      const totalAge = this.players.reduce((sum, player) => sum + player.age, 0)
      return Math.round(totalAge / this.players.length * 10) / 10
    },

    experiencedPlayers() {
      return this.players.reduce((sum, player) => sum + player.internationalCaps, 0)
    }
  },
  async mounted() {
    await this.loadRoster()
  },
  methods: {
    async loadRoster() {
      console.log('🏆 ROSTER: Starting to load roster')
      console.log('🏆 ROSTER: Team data:', this.team)
      console.log('🏆 ROSTER: Tournament ID:', this.tournamentId)
      console.log('🏆 ROSTER: World ID:', this.worldId)
      
      this.loading = true
      this.error = ''

      try {
        const token = localStorage.getItem('token')
        
        // Try different team identifier properties
        const teamIdentifier = this.team.code || this.team.countryCode || this.team._id || this.team.teamId
        console.log('🏆 ROSTER: Team identifier:', teamIdentifier)
        
        if (!teamIdentifier) {
          throw new Error('No valid team identifier found')
        }
        
        const params = new URLSearchParams({
          teamCode: teamIdentifier
        })
        
        if (this.tournamentId) params.append('tournamentId', this.tournamentId)
        if (this.worldId) params.append('worldId', this.worldId)

        const apiUrl = `${API_URL}/players/team?${params}`
        console.log('🏆 ROSTER: API URL:', apiUrl)

        let response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        console.log('🏆 ROSTER: Response status:', response.status)
        
        // If the primary endpoint fails, try alternative endpoints
        if (!response.ok) {
          console.log('🏆 ROSTER: Primary endpoint failed, trying alternatives...')
          
          // Try multiple alternative endpoints
          const alternatives = [
            `${API_URL}/teams/${teamIdentifier}/players`,
            `${API_URL}/tournaments/${this.tournamentId}/teams/${teamIdentifier}/players`,
            `${API_URL}/worlds/${this.worldId}/teams/${teamIdentifier}/players`,
            `${API_URL}/players?teamCode=${teamIdentifier}`,
            `${API_URL}/players?teamId=${teamIdentifier}`
          ]
          
          for (const altUrl of alternatives) {
            console.log('🏆 ROSTER: Trying alternative:', altUrl)
            try {
              response = await fetch(altUrl, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              })
              console.log('🏆 ROSTER: Alternative response status:', response.status)
              if (response.ok) {
                console.log('🏆 ROSTER: Success with alternative endpoint!')
                break
              }
            } catch (altError) {
              console.log('🏆 ROSTER: Alternative failed:', altError.message)
            }
          }
        }
        
        if (response.ok) {
          const data = await response.json()
          console.log('🏆 ROSTER: Response data:', data)
          console.log('🏆 ROSTER: Players found:', data.players?.length || data.length || 0)
          
          // Handle different response formats
          this.players = data.players || data || []
          this.tactics = data.tactics || this.tactics
        } else {
          const errorText = await response.text()
          console.error('🏆 ROSTER: API error:', response.status, errorText)
          this.error = `Failed to load team roster (${response.status})`
        }
      } catch (error) {
        console.error('🏆 ROSTER: Network error:', error)
        this.error = 'Network error. Please try again.'
      } finally {
        this.loading = false
        console.log('🏆 ROSTER: Loading completed. Players count:', this.players.length)
      }
    },

    selectPlayer(player) {
      console.log('🏃 NAVIGATION: Navigating to player detail:', player.displayName)
      // Navigate to player detail page with context
      const query = {
        teamCode: this.team.code,
      }
      if (this.tournamentId) query.tournamentId = this.tournamentId
      if (this.worldId) query.worldId = this.worldId
      if (this.isQualifying) {
        query.isQualifying = 'true'
        // For qualifying teams, we need the original route teamId, not the country code
        query.qualifyingTeamId = this.$route?.params?.teamId || this.team.code
      }
      
      this.$router.push({
        path: `/player/${player._id}`,
        query
      })
    },


    getPlayerAvatar(player) {
      console.log('🖼️ AVATAR: Getting avatar for player:', player.displayName)
      console.log('🖼️ AVATAR: Player data:', { avatarSeed: player.avatarSeed, nationality: player.nationality })
      
      try {
        const avatarUrl = getPlayerAvatarUrl(player)
        console.log('🖼️ AVATAR: Generated URL length:', avatarUrl?.length || 0)
        console.log('🖼️ AVATAR: URL starts with:', avatarUrl?.substring(0, 50))
        return avatarUrl
      } catch (error) {
        console.error('🖼️ AVATAR: Error getting avatar:', error)
        return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#ccc"/></svg>'
      }
    },

    getCountryName(code) {
      // Simple country code to name mapping for common codes
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
.team-roster {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: 2rem;
  backdrop-filter: blur(20px);
}

.roster-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-info h3 {
  color: var(--fifa-dark-blue);
  font-size: 1.5rem;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.team-flag {
  font-size: 1.8rem;
}

.squad-stats {
  display: flex;
  gap: 16px;
  color: rgba(0, 51, 102, 0.8);
  font-size: 0.9rem;
}

.view-toggles {
  display: flex;
  gap: 8px;
}

.view-toggle {
  padding: 8px 16px;
  background: rgba(0, 102, 204, 0.1);
  border: 1px solid rgba(0, 102, 204, 0.3);
  border-radius: var(--radius-md);
  color: var(--fifa-dark-blue);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
}

.view-toggle:hover {
  background: rgba(0, 102, 204, 0.2);
  color: var(--fifa-dark-blue);
}

.view-toggle.active {
  background: var(--fifa-gold);
  color: var(--dark);
  border-color: var(--fifa-gold);
}

.loading-state, .error-state {
  text-align: center;
  padding: 3rem;
  color: var(--fifa-dark-blue);
}

.loading-state i {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.position-group {
  margin-bottom: 2rem;
}

.position-title {
  color: var(--fifa-dark-blue);
  font-size: 1.2rem;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.player-count {
  color: var(--fifa-gold);
  font-weight: normal;
}

.players-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.player-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.player-card:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.player-card.selected {
  background: rgba(255, 215, 0, 0.1);
  border-color: var(--fifa-gold);
}

.player-avatar {
  position: relative;
  flex-shrink: 0;
}

.player-avatar img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.jersey-number {
  position: absolute;
  bottom: -8px;
  right: -8px;
  background: var(--fifa-dark-blue);
  color: var(--white);
  font-size: 0.7rem;
  font-weight: bold;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.captain-badge {
  position: absolute;
  top: -8px;
  left: -8px;
  background: var(--fifa-gold);
  color: var(--dark);
  font-size: 0.7rem;
  font-weight: bold;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.player-info {
  flex: 1;
}

.player-name {
  color: var(--fifa-dark-blue);
  font-size: 1rem;
  margin: 0 0 4px 0;
  font-weight: var(--font-weight-semibold);
}

.player-details {
  display: flex;
  gap: 12px;
  margin-bottom: 4px;
  font-size: 0.85rem;
}

.position {
  background: var(--fifa-blue);
  color: var(--white);
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.75rem;
}

.age {
  color: rgba(0, 51, 102, 0.7);
}

.rating {
  color: var(--fifa-gold);
  font-weight: bold;
}

.player-stats {
  display: flex;
  gap: 12px;
  font-size: 0.8rem;
  color: rgba(0, 51, 102, 0.6);
}

.form-indicator {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: bold;
}

.form-excellent {
  background: #4ade80;
  color: var(--dark);
}

.form-good {
  background: #22d3ee;
  color: var(--dark);
}

.form-average {
  background: #facc15;
  color: var(--dark);
}

.form-poor {
  background: #ef4444;
  color: var(--white);
}

.formation-view {
  padding: 2rem 0;
}

.formation-info {
  text-align: center;
  margin-bottom: 2rem;
}

.formation-info h4 {
  color: var(--fifa-dark-blue);
  font-size: 1.3rem;
  margin: 0 0 8px 0;
}

.formation-desc {
  color: rgba(0, 51, 102, 0.7);
  margin: 0;
}

.football-pitch {
  background: linear-gradient(90deg, #2d5016 0%, #4a7c23 50%, #2d5016 100%);
  border: 2px solid var(--white);
  border-radius: var(--radius-lg);
  min-height: 400px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.formation-placeholder {
  text-align: center;
  color: var(--white);
}

.formation-placeholder i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.no-players-message {
  text-align: center;
  padding: 3rem 2rem;
  color: rgba(0, 51, 102, 0.7);
}

.no-players-message i {
  font-size: 3rem;
  color: rgba(0, 51, 102, 0.3);
  margin-bottom: 1rem;
}

.no-players-message h4 {
  color: var(--fifa-dark-blue);
  margin: 0 0 0.5rem 0;
}

.no-players-message p {
  margin: 0 0 1rem 0;
}

.debug-info {
  background: rgba(255, 68, 68, 0.1);
  border: 1px solid rgba(255, 68, 68, 0.2);
  border-radius: var(--radius-md);
  padding: 0.5rem;
  margin: 1rem 0;
  font-family: monospace;
  font-size: 0.8rem;
  color: var(--fifa-red);
}

@media (max-width: 768px) {
  .roster-header {
    flex-direction: column;
    gap: 16px;
  }

  .players-grid {
    grid-template-columns: 1fr;
  }
}
</style>