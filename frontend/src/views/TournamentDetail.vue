<template>
  <div class="tournament-detail">
    <AppHeader 
      :username="username" 
      :subscription-tier="subscriptionTier"
      @logout="handleLogout" 
    />
    
    <main class="main-content">
      <div class="tournament-container">
        <div v-if="loading" class="loading-state">
          <i class="fas fa-spinner fa-spin"></i>
          Loading tournament...
        </div>
        
        <div v-else-if="!tournament" class="error-state">
          <div class="error-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <h3>Tournament not found</h3>
          <p>The tournament you're looking for doesn't exist or you don't have access to it.</p>
          <button @click="$router.push('/tournaments')" class="btn-primary">
            <i class="fas fa-arrow-left"></i>
            Back to Tournaments
          </button>
        </div>
        
        <div v-else class="tournament-detail-content">
          <!-- Tournament Header -->
          <div class="tournament-header glass-white">
            <div class="back-navigation">
              <button @click="$router.push('/tournaments')" class="back-btn">
                <i class="fas fa-arrow-left"></i>
                Back to Tournaments
              </button>
            </div>
            
            <div class="tournament-info">
              <div class="host-section">
                <div class="country-display">
                  <span class="country-flag">{{ getCountryFlag(tournament.hostCountryCode) }}</span>
                  <div class="country-info">
                    <h1>{{ tournament.name }}</h1>
                    <p class="host-label">Hosted by {{ tournament.hostCountry }}</p>
                  </div>
                </div>
                
                <div class="status-section">
                  <span :class="`status-badge status-${tournament.status}`">
                    {{ formatStatus(tournament.status) }}
                  </span>
                  <button v-if="tournament.status !== 'completed'" @click="toggleEditMode" class="edit-btn">
                    <i :class="editMode ? 'fas fa-times' : 'fas fa-edit'"></i>
                    {{ editMode ? 'Cancel' : 'Edit' }}
                  </button>
                </div>
              </div>
              
              <!-- Edit Form -->
              <div v-if="editMode" class="edit-form">
                <form @submit.prevent="updateTournament" class="tournament-form">
                  <div class="form-row">
                    <div class="form-group">
                      <label for="editName">Tournament Name</label>
                      <input 
                        type="text" 
                        id="editName"
                        v-model="editForm.name" 
                        required
                        minlength="3"
                        maxlength="100"
                        class="input"
                        :class="{ 'error': editErrors.name }"
                      />
                      <span v-if="editErrors.name" class="field-error">{{ editErrors.name }}</span>
                    </div>
                    
                    <div class="form-group">
                      <label for="editStatus">Status</label>
                      <select 
                        id="editStatus"
                        v-model="editForm.status" 
                        class="input select"
                      >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                  
                  <div class="form-group">
                    <label for="editHost">Host Country</label>
                    <select 
                      id="editHost"
                      v-model="editForm.selectedCountryCode" 
                      class="input select"
                      :class="{ 'error': editErrors.hostCountry }"
                    >
                      <option 
                        v-for="country in countries" 
                        :key="country.code"
                        :value="country.code"
                      >
                        {{ country.flag }} {{ country.name }}
                      </option>
                    </select>
                    <span v-if="editErrors.hostCountry" class="field-error">{{ editErrors.hostCountry }}</span>
                  </div>
                  
                  <div class="form-actions">
                    <button type="button" @click="toggleEditMode" class="btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" :disabled="updating" class="btn-primary">
                      <i v-if="updating" class="fas fa-spinner fa-spin"></i>
                      <i v-else class="fas fa-save"></i>
                      {{ updating ? 'Saving...' : 'Save Changes' }}
                    </button>
                  </div>
                  
                  <p v-if="updateError" class="error-message">{{ updateError }}</p>
                </form>
              </div>
              
              <!-- Tournament Meta -->
              <div class="tournament-meta">
                <div class="meta-item">
                  <i class="fas fa-calendar"></i>
                  <span>Created {{ formatDate(tournament.createdAt) }}</span>
                </div>
                <div class="meta-item">
                  <i class="fas fa-clock"></i>
                  <span>Last opened {{ formatDate(tournament.lastOpenedAt) }}</span>
                </div>
                <div class="meta-item">
                  <i class="fas fa-user"></i>
                  <span>Created by {{ tournament.createdBy?.name || 'Unknown' }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Tournament Content -->
          <div class="tournament-content">
            <div class="content-grid">
              <!-- Tournament Settings -->
              <div class="content-card glass-white">
                <div class="card-header">
                  <h3>Tournament Settings</h3>
                  <i class="fas fa-cog"></i>
                </div>
                <div class="card-content">
                  <div class="setting-item">
                    <span class="setting-label">Maximum Teams</span>
                    <span class="setting-value">{{ tournament.settings?.maxTeams || 32 }}</span>
                  </div>
                  <div class="setting-item">
                    <span class="setting-label">Group Stage</span>
                    <span class="setting-value">
                      <i :class="tournament.settings?.groupStage ? 'fas fa-check text-success' : 'fas fa-times text-danger'"></i>
                      {{ tournament.settings?.groupStage ? 'Enabled' : 'Disabled' }}
                    </span>
                  </div>
                  <div class="setting-item">
                    <span class="setting-label">Knockout Stage</span>
                    <span class="setting-value">
                      <i :class="tournament.settings?.knockoutStage ? 'fas fa-check text-success' : 'fas fa-times text-danger'"></i>
                      {{ tournament.settings?.knockoutStage ? 'Enabled' : 'Disabled' }}
                    </span>
                  </div>
                </div>
              </div>
              
              <!-- Quick Actions -->
              <div class="content-card glass-white">
                <div class="card-header">
                  <h3>Quick Actions</h3>
                  <i class="fas fa-bolt"></i>
                </div>
                <div class="card-content">
                  <div class="action-grid">
                    <button @click="toggleTeamManagement" class="action-card" :disabled="tournament.status !== 'draft'">
                      <i class="fas fa-users"></i>
                      <span>Manage Teams</span>
                    </button>
                    <button @click="toggleDraw" class="action-card" :disabled="tournament.status === 'draft' || tournament.status === 'cancelled'">
                      <i class="fas fa-random"></i>
                      <span>World Cup Draw</span>
                      <small v-if="tournament.status === 'completed'" style="display: block; font-size: 0.7rem; color: #007bff;">View Only</small>
                      <small v-else-if="tournament.status !== 'active'" style="display: block; font-size: 0.7rem; color: #666;">Status: {{ tournament.status }}</small>
                      <small v-else-if="tournament.teamCount !== 32" style="display: block; font-size: 0.7rem; color: #666;">Teams: {{ tournament.teamCount }}/32</small>
                    </button>
                    <button class="action-card" :disabled="!tournament.canActivate || tournament.status !== 'draft'" @click="activateTournament">
                      <i class="fas fa-play"></i>
                      <span>Start Tournament</span>
                    </button>
                    <button @click="toggleMatches" class="action-card" :disabled="tournament.status === 'draft' || tournament.status === 'cancelled'">
                      <i class="fas fa-futbol"></i>
                      <span>Group Matches</span>
                      <small v-if="tournament.status === 'completed'" style="display: block; font-size: 0.7rem; color: #007bff;">View Only</small>
                      <small v-else-if="tournament.status !== 'active'" style="display: block; font-size: 0.7rem; color: #666;">Status: {{ tournament.status }}</small>
                    </button>
                    <button @click="toggleStandings" class="action-card" :disabled="tournament.status === 'draft' || tournament.status === 'cancelled'">
                      <i class="fas fa-chart-bar"></i>
                      <span>Group Standings</span>
                      <small v-if="tournament.status === 'completed'" style="display: block; font-size: 0.7rem; color: #007bff;">View Only</small>
                      <small v-else-if="tournament.status !== 'active'" style="display: block; font-size: 0.7rem; color: #666;">Status: {{ tournament.status }}</small>
                    </button>
                    <button @click="toggleKnockout" class="action-card" :disabled="tournament.status === 'draft' || tournament.status === 'cancelled'">
                      <i class="fas fa-trophy"></i>
                      <span>Knockout Stage</span>
                      <small v-if="tournament.status === 'completed'" style="display: block; font-size: 0.7rem; color: #007bff;">View Only</small>
                      <small v-else-if="tournament.status !== 'active'" style="display: block; font-size: 0.7rem; color: #666;">Status: {{ tournament.status }}</small>
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- Team Management -->
              <div v-if="showTeamManagement" class="content-card glass-white full-width">
                <div class="card-header">
                  <h3>Team Management</h3>
                  <button @click="toggleTeamManagement" class="close-section-btn">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
                <div class="card-content">
                  <TeamManagement 
                    :tournament="tournament" 
                    :read-only="tournament.status === 'completed'"
                    @teams-updated="handleTeamsUpdated"
                  />
                </div>
              </div>

              <!-- World Cup Draw -->
              <div v-if="showDraw" class="content-card glass-white full-width">
                <div class="card-header">
                  <h3>World Cup Draw</h3>
                  <button @click="toggleDraw" class="close-section-btn">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
                <div class="card-content">
                  <WorldCupDraw 
                    :tournament="tournament" 
                    :read-only="tournament.status === 'completed'"
                    @proceed-to-matches="handleProceedToMatches"
                  />
                </div>
              </div>

              <!-- Group Matches -->
              <div v-if="showMatches" class="content-card glass-white full-width">
                <div class="card-header">
                  <h3>Group Matches</h3>
                  <button @click="toggleMatches" class="close-section-btn">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
                <div class="card-content">
                  <GroupMatches 
                    :tournament="tournament" 
                    :read-only="tournament.status === 'completed'"
                    @matches-generated="handleMatchesGenerated"
                    @match-simulated="handleMatchSimulated"
                    @matchday-simulated="handleMatchdaySimulated"
                  />
                </div>
              </div>

              <!-- Group Standings -->
              <div v-if="showStandings" class="content-card glass-white full-width">
                <div class="card-header">
                  <h3>Group Standings</h3>
                  <button @click="toggleStandings" class="close-section-btn">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
                <div class="card-content">
                  <GroupStandings 
                    :tournament="tournament" 
                    :read-only="tournament.status === 'completed'"
                    ref="standings"
                  />
                </div>
              </div>

              <!-- Knockout Stage -->
              <div v-if="showKnockout" class="content-card glass-white full-width">
                <div class="card-header">
                  <h3>Knockout Stage</h3>
                  <button @click="toggleKnockout" class="close-section-btn">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
                <div class="card-content">
                  <KnockoutBracket 
                    :tournament="tournament" 
                    :read-only="tournament.status === 'completed'"
                    @bracket-generated="handleBracketGenerated"
                    @match-simulated="handleKnockoutMatchSimulated"
                    @round-simulated="handleKnockoutRoundSimulated"
                  />
                </div>
              </div>

              <!-- Tournament Progress -->
              <div class="content-card glass-white full-width">
                <div class="card-header">
                  <h3>Tournament Progress</h3>
                  <i class="fas fa-chart-line"></i>
                </div>
                <div class="card-content">
                  <div class="progress-info">
                    <p>This tournament is currently in <strong>{{ formatStatus(tournament.status) }}</strong> status.</p>
                    <div class="team-progress">
                      <div class="progress-item">
                        <span class="progress-label">Teams Selected:</span>
                        <span class="progress-value">{{ tournament.teamCount || 0 }}/{{ tournament.settings?.maxTeams || 32 }}</span>
                      </div>
                      <div class="progress-item">
                        <span class="progress-label">Status:</span>
                        <span class="progress-value" :class="{ 'ready': tournament.canActivate, 'not-ready': !tournament.canActivate }">
                          {{ tournament.canActivate ? 'Ready to Activate' : 'Teams Needed' }}
                        </span>
                      </div>
                    </div>
                    <div class="progress-steps">
                      <div class="step" :class="{ active: tournament.teamCount === tournament.settings?.maxTeams }">
                        <i class="fas fa-users"></i>
                        <span>Team Setup</span>
                      </div>
                      <div class="step" :class="{ active: tournament.status === 'active' || tournament.status === 'completed' }">
                        <i class="fas fa-random"></i>
                        <span>World Cup Draw</span>
                      </div>
                      <div class="step" :class="{ active: tournament.status === 'completed' }">
                        <i class="fas fa-play"></i>
                        <span>Group Stage</span>
                      </div>
                      <div class="step" :class="{ active: tournament.status === 'completed' }">
                        <i class="fas fa-trophy"></i>
                        <span>Completed</span>
                      </div>
                    </div>
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
import TeamManagement from '../components/TeamManagement.vue'
import WorldCupDraw from '../components/WorldCupDraw.vue'
import GroupMatches from '../components/GroupMatches.vue'
import GroupStandings from '../components/GroupStandings.vue'
import KnockoutBracket from '../components/KnockoutBracket.vue'

export default {
  name: 'TournamentDetail',
  components: {
    AppHeader,
    TeamManagement,
    WorldCupDraw,
    GroupMatches,
    GroupStandings,
    KnockoutBracket
  },
  data() {
    return {
      username: '',
      subscriptionTier: 'basic',
      tournament: null,
      countries: [],
      loading: false,
      editMode: false,
      updating: false,
      updateError: '',
      editErrors: {},
      editForm: {
        name: '',
        status: '',
        selectedCountryCode: ''
      },
      showTeamManagement: false,
      showDraw: false,
      showMatches: false,
      showStandings: false,
      showKnockout: false
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
    
    this.loadTournament()
    this.loadCountries()
    this.loadUserProfile()
  },
  methods: {
    async loadTournament() {
      this.loading = true
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/tournaments/${this.$route.params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          this.tournament = await response.json()
        } else if (response.status === 404) {
          this.tournament = null
        } else {
          console.error('Failed to load tournament')
        }
      } catch (error) {
        console.error('Error loading tournament:', error)
      } finally {
        this.loading = false
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
    
    toggleEditMode() {
      this.editMode = !this.editMode
      
      if (this.editMode && this.tournament) {
        // Initialize edit form with current values
        this.editForm = {
          name: this.tournament.name,
          status: this.tournament.status,
          selectedCountryCode: this.tournament.hostCountryCode
        }
        this.editErrors = {}
        this.updateError = ''
      }
    },
    
    validateEditForm() {
      this.editErrors = {}
      
      if (!this.editForm.name || this.editForm.name.length < 3) {
        this.editErrors.name = 'Tournament name must be at least 3 characters long'
      }
      
      if (this.editForm.name && this.editForm.name.length > 100) {
        this.editErrors.name = 'Tournament name must not exceed 100 characters'
      }
      
      if (!this.editForm.selectedCountryCode) {
        this.editErrors.hostCountry = 'Please select a host country'
      }
      
      return Object.keys(this.editErrors).length === 0
    },
    
    async updateTournament() {
      if (!this.validateEditForm()) {
        return
      }
      
      this.updating = true
      this.updateError = ''
      
      try {
        const selectedCountry = this.countries.find(c => c.code === this.editForm.selectedCountryCode)
        
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/tournaments/${this.tournament._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: this.editForm.name,
            status: this.editForm.status,
            hostCountry: selectedCountry.name,
            hostCountryCode: selectedCountry.code
          })
        })
        
        const data = await response.json()
        
        if (response.ok) {
          this.tournament = data.tournament
          this.editMode = false
        } else {
          this.updateError = data.error || 'Failed to update tournament'
        }
      } catch (error) {
        this.updateError = 'Network error. Please try again.'
      } finally {
        this.updating = false
      }
    },
    
    getCountryFlag(countryCode) {
      const country = this.countries.find(c => c.code === countryCode)
      return country ? country.flag : '🏴'
    },
    
    formatStatus(status) {
      const statusMap = {
        'draft': 'Draft',
        'active': 'Active',
        'completed': 'Completed',
        'cancelled': 'Cancelled'
      }
      return statusMap[status] || status
    },
    
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString()
    },
    
    toggleTeamManagement() {
      this.showTeamManagement = !this.showTeamManagement
      if (this.showTeamManagement) {
        this.showDraw = false
        this.showMatches = false
        this.showStandings = false
        this.showKnockout = false
      }
    },

    toggleDraw() {
      this.showDraw = !this.showDraw
      if (this.showDraw) {
        this.showTeamManagement = false
        this.showMatches = false
        this.showStandings = false
        this.showKnockout = false
      }
    },

    async handleTeamsUpdated() {
      // Reload tournament data to get updated team count and activation status
      await this.loadTournament()
    },

    handleProceedToMatches() {
      this.showDraw = false
      this.showMatches = true
    },

    toggleMatches() {
      this.showMatches = !this.showMatches
      if (this.showMatches) {
        this.showTeamManagement = false
        this.showDraw = false
        this.showStandings = false
        this.showKnockout = false
      }
    },

    toggleStandings() {
      this.showStandings = !this.showStandings
      if (this.showStandings) {
        this.showTeamManagement = false
        this.showDraw = false
        this.showMatches = false
        this.showKnockout = false
      }
    },

    toggleKnockout() {
      this.showKnockout = !this.showKnockout
      if (this.showKnockout) {
        this.showTeamManagement = false
        this.showDraw = false
        this.showMatches = false
        this.showStandings = false
      }
    },

    handleMatchesGenerated() {
      if (this.$refs.standings) {
        this.$refs.standings.refreshStandings()
      }
    },

    handleMatchSimulated() {
      if (this.$refs.standings) {
        this.$refs.standings.refreshStandings()
      }
    },

    handleMatchdaySimulated() {
      if (this.$refs.standings) {
        this.$refs.standings.refreshStandings()
      }
    },

    handleBracketGenerated() {
      // Knockout bracket has been generated
    },

    handleKnockoutMatchSimulated() {
      // Reload tournament data to check for completion
      this.loadTournament()
    },

    handleKnockoutRoundSimulated() {
      // Reload tournament data to check for completion
      this.loadTournament()
    },

    async activateTournament() {
      if (!confirm('Are you sure you want to activate this tournament? Once activated, you cannot modify the teams.')) {
        return
      }

      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/tournaments/${this.tournament._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            status: 'active'
          })
        })

        const data = await response.json()

        if (response.ok) {
          this.tournament = data.tournament
          this.showTeamManagement = false
        } else {
          alert(data.error || 'Failed to activate tournament')
        }
      } catch (error) {
        alert('Network error. Please try again.')
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
    
    handleLogout() {
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      this.$router.push('/')
    }
  }
}
</script>

<style scoped>
.tournament-detail {
  min-height: 100vh;
  background: linear-gradient(135deg, #0066CC 0%, #003366 100%);
}

.main-content {
  padding: 2rem;
  display: flex;
  justify-content: center;
}

.tournament-container {
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

.tournament-header {
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

.tournament-info {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.host-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.country-display {
  display: flex;
  align-items: center;
  gap: 16px;
}

.country-flag {
  font-size: 3rem;
}

.country-info h1 {
  font-size: 2.5rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
  margin: 0 0 8px 0;
}

.host-label {
  color: var(--gray);
  font-size: 1.1rem;
  margin: 0;
}

.status-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-badge {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-draft {
  background: rgba(108, 117, 125, 0.2);
  color: #6c757d;
}

.status-active {
  background: rgba(40, 167, 69, 0.2);
  color: #28a745;
}

.status-completed {
  background: rgba(0, 123, 255, 0.2);
  color: #007bff;
}

.status-cancelled {
  background: rgba(220, 53, 69, 0.2);
  color: #dc3545;
}

.edit-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: transparent;
  border: 1px solid var(--fifa-blue);
  color: var(--fifa-blue);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: var(--font-weight-semibold);
  transition: all 0.3s ease;
}

.edit-btn:hover {
  background: var(--fifa-blue);
  color: var(--white);
}

.edit-form {
  padding: 24px;
  background: rgba(0, 102, 204, 0.05);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(0, 102, 204, 0.1);
}

.tournament-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 8px;
  color: var(--fifa-dark-blue);
  font-weight: var(--font-weight-semibold);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.field-error {
  color: var(--fifa-red);
  font-size: 0.8rem;
  margin-top: 6px;
  font-weight: var(--font-weight-medium);
}

.form-actions {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}

.form-actions button {
  flex: 1;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.tournament-meta {
  display: flex;
  gap: 32px;
  padding-top: 24px;
  border-top: 1px solid rgba(0, 102, 204, 0.1);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--gray);
  font-size: 0.9rem;
}

.meta-item i {
  width: 16px;
  color: var(--fifa-blue);
}

.tournament-content {
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

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  color: var(--gray);
  font-weight: var(--font-weight-medium);
}

.setting-value {
  font-weight: var(--font-weight-semibold);
  color: var(--fifa-dark-blue);
  display: flex;
  align-items: center;
  gap: 8px;
}

.text-success {
  color: #28a745;
}

.text-danger {
  color: #dc3545;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  background: rgba(0, 102, 204, 0.05);
  border: 1px solid rgba(0, 102, 204, 0.1);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--fifa-blue);
  font-weight: var(--font-weight-semibold);
}

.action-card:not(:disabled):hover {
  background: var(--fifa-blue);
  color: var(--white);
  transform: translateY(-2px);
}

.action-card:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.close-section-btn {
  background: none;
  border: none;
  color: var(--gray);
  cursor: pointer;
  padding: 8px;
  border-radius: var(--radius-md);
  transition: all 0.3s ease;
}

.close-section-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  color: var(--fifa-dark-blue);
}

.team-progress {
  display: flex;
  gap: 32px;
  margin-bottom: 24px;
  padding: 16px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.progress-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.progress-label {
  font-size: 0.9rem;
  color: var(--gray);
  font-weight: var(--font-weight-medium);
}

.progress-value {
  font-size: 1.1rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
}

.progress-value.ready {
  color: var(--fifa-green);
}

.progress-value.not-ready {
  color: #ff8800;
}

.action-card i {
  font-size: 1.5rem;
}

.progress-info p {
  color: var(--gray);
  margin-bottom: 24px;
}

.progress-steps {
  display: flex;
  gap: 24px;
  align-items: center;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border-radius: var(--radius-lg);
  transition: all 0.3s ease;
  opacity: 0.5;
}

.step.active {
  opacity: 1;
  background: rgba(0, 102, 204, 0.1);
  color: var(--fifa-blue);
}

.step i {
  font-size: 1.5rem;
}

.step span {
  font-size: 0.9rem;
  font-weight: var(--font-weight-semibold);
}

.error-message {
  color: var(--fifa-red);
  text-align: center;
  margin-top: 16px;
  padding: 12px;
  background: rgba(255, 68, 68, 0.1);
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 68, 68, 0.2);
  font-weight: var(--font-weight-medium);
}

@media (max-width: 768px) {
  .main-content {
    padding: 1rem;
  }
  
  .tournament-header {
    padding: 24px;
  }
  
  .host-section {
    flex-direction: column;
    gap: 16px;
  }
  
  .country-info h1 {
    font-size: 2rem;
  }
  
  .country-flag {
    font-size: 2.5rem;
  }
  
  .tournament-meta {
    flex-direction: column;
    gap: 16px;
  }
  
  .content-grid {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .action-grid {
    grid-template-columns: 1fr;
  }
  
  .progress-steps {
    flex-direction: column;
    gap: 16px;
  }
}
</style>