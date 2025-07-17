<template>
  <div class="team-management">
    <div class="team-header">
      <div class="header-info">
        <div class="header-title">
          <h3>Team Management</h3>
          <div v-if="readOnly" class="read-only-badge">
            <i class="fas fa-eye"></i>
            View Only
          </div>
        </div>
        <div class="team-stats">
          <span class="team-count">{{ teamStats.teamCount }}/{{ teamStats.maxTeams }} Teams</span>
          <span v-if="teamStats.spotsRemaining > 0" class="spots-remaining">
            {{ teamStats.spotsRemaining }} spots remaining
          </span>
          <span v-else class="spots-full">Tournament Full</span>
        </div>
      </div>
      
      <div class="header-actions" v-if="!readOnly">
        <button 
          @click="autoFillTeams" 
          :disabled="loading || tournament.status !== 'draft'"
          class="btn-secondary auto-fill-btn"
        >
          <i v-if="loading" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-magic"></i>
          Auto-fill Best 31 + Host
        </button>
        <button 
          @click="clearAllTeams" 
          :disabled="loading || tournament.status !== 'draft' || teamStats.teamCount === 0"
          class="btn-danger clear-btn"
        >
          <i class="fas fa-trash"></i>
          Clear All
        </button>
      </div>
    </div>

    <!-- Add Team Section -->
    <div v-if="tournament.status === 'draft' && !readOnly" class="add-team-section">
      <div class="add-team-form">
        <select 
          v-model="selectedCountryCode" 
          class="country-select"
          :disabled="teamStats.spotsRemaining === 0"
        >
          <option value="">Select a country to add...</option>
          <option 
            v-for="country in availableCountries" 
            :key="country.code"
            :value="country.code"
          >
            {{ country.flag }} {{ country.name }} (FIFA #{{ country.fifaRanking }})
          </option>
        </select>
        <button 
          @click="addTeam" 
          :disabled="!selectedCountryCode || loading || teamStats.spotsRemaining === 0"
          class="btn-primary add-btn"
        >
          <i class="fas fa-plus"></i>
          Add Team
        </button>
      </div>
      <p v-if="error" class="error-message">{{ error }}</p>
    </div>

    <!-- Teams Grid -->
    <div class="teams-grid">
      <div 
        v-for="team in teams" 
        :key="team.countryCode"
        class="team-card"
        :class="{ 'host-team': team.isHost }"
      >
        <div class="team-info">
          <div class="team-flag">{{ team.countryFlag }}</div>
          <div class="team-details">
            <h4>{{ team.countryName }}</h4>
            <div class="team-meta">
              <span class="fifa-rank">FIFA Rank: {{ team.fifaRanking }}</span>
              <span v-if="team.isHost" class="host-badge">
                <i class="fas fa-home"></i>
                Host
              </span>
            </div>
          </div>
        </div>
        
        <button 
          v-if="tournament.status === 'draft' && !readOnly"
          @click="removeTeam(team.countryCode)" 
          :disabled="loading"
          class="remove-btn"
          :title="`Remove ${team.countryName}`"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="teams.length === 0" class="empty-teams">
      <div class="empty-icon">
        <i class="fas fa-users"></i>
      </div>
      <h4>No teams selected</h4>
      <p>Add teams to your tournament to get started. You need exactly {{ teamStats.maxTeams }} teams to activate the tournament.</p>
    </div>

    <!-- Activation Status -->
    <div class="activation-status">
      <div v-if="teamStats.canActivate" class="can-activate">
        <i class="fas fa-check-circle"></i>
        <span>Tournament ready to activate! All {{ teamStats.maxTeams }} teams selected.</span>
      </div>
      <div v-else class="cannot-activate">
        <i class="fas fa-exclamation-circle"></i>
        <span>Need {{ teamStats.spotsRemaining }} more team(s) to activate tournament.</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TeamManagement',
  props: {
    tournament: {
      type: Object,
      required: true
    },
    readOnly: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      teams: [],
      countries: [],
      selectedCountryCode: '',
      loading: false,
      error: '',
      teamStats: {
        teamCount: 0,
        maxTeams: 32,
        canActivate: false,
        spotsRemaining: 32
      }
    }
  },
  computed: {
    availableCountries() {
      const selectedCodes = this.teams.map(team => team.countryCode)
      return this.countries
        .filter(country => !selectedCodes.includes(country.code))
        .sort((a, b) => a.fifaRanking - b.fifaRanking)
    }
  },
  mounted() {
    this.loadTeams()
    this.loadCountries()
    this.loadTeamStats()
  },
  methods: {
    async loadTeams() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/teams/${this.tournament._id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          this.teams = await response.json()
        } else {
          console.error('Failed to load teams')
        }
      } catch (error) {
        console.error('Error loading teams:', error)
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

    async loadTeamStats() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/teams/${this.tournament._id}/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          this.teamStats = await response.json()
        }
      } catch (error) {
        console.error('Error loading team stats:', error)
      }
    },

    async addTeam() {
      if (!this.selectedCountryCode) return

      this.loading = true
      this.error = ''

      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/teams/${this.tournament._id}/add`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            countryCode: this.selectedCountryCode
          })
        })

        const data = await response.json()

        if (response.ok) {
          this.selectedCountryCode = ''
          await this.loadTeams()
          await this.loadTeamStats()
          this.$emit('teams-updated')
        } else {
          this.error = data.error || 'Failed to add team'
        }
      } catch (error) {
        this.error = 'Network error. Please try again.'
      } finally {
        this.loading = false
      }
    },

    async removeTeam(countryCode) {
      this.loading = true
      this.error = ''

      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/teams/${this.tournament._id}/remove/${countryCode}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          await this.loadTeams()
          await this.loadTeamStats()
          this.$emit('teams-updated')
        } else {
          const data = await response.json()
          this.error = data.error || 'Failed to remove team'
        }
      } catch (error) {
        this.error = 'Network error. Please try again.'
      } finally {
        this.loading = false
      }
    },

    async autoFillTeams() {
      this.loading = true
      this.error = ''

      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/teams/${this.tournament._id}/auto-fill`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        const data = await response.json()

        if (response.ok) {
          await this.loadTeams()
          await this.loadTeamStats()
          this.$emit('teams-updated')
        } else {
          this.error = data.error || 'Failed to auto-fill teams'
        }
      } catch (error) {
        this.error = 'Network error. Please try again.'
      } finally {
        this.loading = false
      }
    },

    async clearAllTeams() {
      if (!confirm('Are you sure you want to remove all teams? This action cannot be undone.')) {
        return
      }

      this.loading = true
      this.error = ''

      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/teams/${this.tournament._id}/clear`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          await this.loadTeams()
          await this.loadTeamStats()
          this.$emit('teams-updated')
        } else {
          const data = await response.json()
          this.error = data.error || 'Failed to clear teams'
        }
      } catch (error) {
        this.error = 'Network error. Please try again.'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.team-management {
  width: 100%;
}

.team-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px 0;
  border-bottom: 1px solid rgba(0, 102, 204, 0.1);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 8px;
}

.header-info h3 {
  font-size: 1.5rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
  margin: 0;
}

.read-only-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(156, 163, 175, 0.1);
  color: #6b7280;
  border-radius: var(--radius-md);
  font-size: 0.8rem;
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.team-stats {
  display: flex;
  gap: 16px;
  align-items: center;
}

.team-count {
  font-size: 1.1rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-blue);
}

.spots-remaining {
  font-size: 0.9rem;
  color: var(--gray);
}

.spots-full {
  font-size: 0.9rem;
  color: var(--fifa-green);
  font-weight: var(--font-weight-semibold);
}

.header-actions {
  display: flex;
  gap: 12px;
}

.auto-fill-btn, .clear-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  font-size: 0.9rem;
  border-radius: var(--radius-md);
}

.btn-danger {
  background: var(--fifa-red);
  color: var(--white);
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-danger:hover:not(:disabled) {
  background: #cc0000;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.add-team-section {
  margin-bottom: 24px;
  padding: 20px;
  background: rgba(0, 102, 204, 0.05);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(0, 102, 204, 0.1);
}

.add-team-form {
  display: flex;
  gap: 12px;
  align-items: center;
}

.country-select {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid rgba(0, 102, 204, 0.2);
  border-radius: var(--radius-md);
  background: var(--white);
  font-size: 0.9rem;
  cursor: pointer;
}

.country-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  white-space: nowrap;
}

.teams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.team-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--white);
  border: 1px solid rgba(0, 102, 204, 0.1);
  border-radius: var(--radius-lg);
  transition: all 0.3s ease;
}

.team-card:hover {
  border-color: rgba(0, 102, 204, 0.3);
  transform: translateY(-2px);
}

.team-card.host-team {
  border-color: var(--fifa-gold);
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 215, 0, 0.05));
}

.team-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.team-flag {
  font-size: 2rem;
}

.team-details h4 {
  font-size: 1.1rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
  margin: 0 0 4px 0;
}

.team-meta {
  display: flex;
  gap: 12px;
  align-items: center;
}

.fifa-rank {
  font-size: 0.8rem;
  color: var(--gray);
}

.host-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: var(--fifa-gold);
  color: var(--fifa-dark-blue);
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
}

.remove-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--fifa-red);
  border-radius: 50%;
  color: var(--fifa-red);
  cursor: pointer;
  transition: all 0.3s ease;
}

.remove-btn:hover:not(:disabled) {
  background: var(--fifa-red);
  color: var(--white);
}

.remove-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty-teams {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--gray);
}

.empty-teams .empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}

.empty-teams h4 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
  color: var(--fifa-dark-blue);
}

.activation-status {
  padding: 16px 20px;
  border-radius: var(--radius-lg);
  margin-top: 24px;
}

.can-activate {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--fifa-green);
  background: rgba(0, 170, 68, 0.1);
  padding: 16px 20px;
  border-radius: var(--radius-lg);
  border: 1px solid rgba(0, 170, 68, 0.2);
}

.can-activate i {
  font-size: 1.2rem;
}

.cannot-activate {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #ff8800;
  background: rgba(255, 136, 0, 0.1);
  padding: 16px 20px;
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 136, 0, 0.2);
}

.cannot-activate i {
  font-size: 1.2rem;
}

.error-message {
  color: var(--fifa-red);
  margin-top: 12px;
  padding: 12px;
  background: rgba(255, 68, 68, 0.1);
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 68, 68, 0.2);
  font-weight: var(--font-weight-medium);
}

@media (max-width: 768px) {
  .team-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .header-actions {
    justify-content: center;
  }

  .add-team-form {
    flex-direction: column;
  }

  .teams-grid {
    grid-template-columns: 1fr;
  }
  
  .team-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>