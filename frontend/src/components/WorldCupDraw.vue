<template>
  <div class="world-cup-draw">
    <div class="draw-header">
      <div class="header-title">
        <h3>World Cup Draw</h3>
        <div v-if="readOnly" class="read-only-badge">
          <i class="fas fa-eye"></i>
          View Only
        </div>
      </div>
      <div class="draw-phase-indicator">
        <div class="phase-step" :class="{ active: currentPhase === 'pots' }">
          <i class="fas fa-layer-group"></i>
          <span>Pots</span>
        </div>
        <div class="phase-step" :class="{ active: currentPhase === 'draw' }">
          <i class="fas fa-random"></i>
          <span>Draw</span>
        </div>
        <div class="phase-step" :class="{ active: currentPhase === 'groups' }">
          <i class="fas fa-users"></i>
          <span>Groups</span>
        </div>
      </div>
    </div>

    <!-- Pots Phase -->
    <div v-if="currentPhase === 'pots'" class="pots-phase">
      <div class="phase-actions" v-if="!readOnly">
        <button 
          @click="generatePots" 
          :disabled="loading || pots.length > 0"
          class="btn-primary"
        >
          <i v-if="loading" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-layer-group"></i>
          {{ pots.length > 0 ? 'Pots Generated' : 'Generate Pots' }}
        </button>
        <button 
          v-if="pots.length > 0"
          @click="proceedToDraw" 
          class="btn-secondary"
        >
          <i class="fas fa-arrow-right"></i>
          Proceed to Draw
        </button>
      </div>

      <div v-if="pots.length > 0" class="pots-grid">
        <div v-for="pot in pots" :key="pot.potNumber" class="pot-card">
          <div class="pot-header">
            <h4>Pot {{ pot.potNumber }}</h4>
            <span class="team-count">{{ pot.teams.length }} teams</span>
          </div>
          <div class="pot-teams">
            <div 
              v-for="team in pot.teams" 
              :key="team._id"
              class="team-item"
              :class="{ 'host-team': team.isHost }"
            >
              <div class="team-flag">{{ team.countryFlag }}</div>
              <div class="team-info">
                <span class="team-name">{{ team.countryName }}</span>
                <span class="team-ranking">FIFA #{{ team.fifaRanking }}</span>
                <span v-if="team.isHost" class="host-badge">
                  <i class="fas fa-home"></i>
                  Host
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Draw Phase -->
    <div v-if="currentPhase === 'draw'" class="draw-phase">
      <div class="draw-controls" v-if="!readOnly">
        <div class="control-group">
          <h4>Draw Options</h4>
          <div class="draw-buttons">
            <button 
              @click="drawAllTeams" 
              :disabled="loading"
              class="btn-primary draw-all-btn"
            >
              <i v-if="loading" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-random"></i>
              Draw All Teams
            </button>
            <button 
              @click="clearDraw" 
              :disabled="loading"
              class="btn-danger clear-draw-btn"
            >
              <i class="fas fa-trash"></i>
              Clear Draw
            </button>
          </div>
        </div>

        <div class="control-group">
          <h4>Draw by Pot</h4>
          <div class="pot-draw-buttons">
            <button 
              v-for="pot in pots" 
              :key="pot.potNumber"
              @click="drawPot(pot.potNumber)" 
              :disabled="loading"
              class="btn-secondary pot-draw-btn"
            >
              <i class="fas fa-dice"></i>
              Draw Pot {{ pot.potNumber }}
            </button>
          </div>
        </div>

      </div>

      <div class="groups-preview">
        <h4>Groups Preview</h4>
        <div class="groups-grid">
          <div 
            v-for="group in groups" 
            :key="group.groupLetter"
            class="group-card"
            :class="{ 'group-complete': group.teams.length === 4 }"
          >
            <div class="group-header">
              <h5>Group {{ group.groupLetter }}</h5>
              <span class="group-status">{{ group.teams.length }}/4</span>
            </div>
            <div class="group-teams">
              <div 
                v-for="team in group.teams" 
                :key="team._id"
                class="group-team"
                :class="{ 'host-team': team.isHost }"
              >
                <span class="team-flag">{{ team.countryFlag }}</span>
                <span class="team-name">{{ team.countryName }}</span>
                <span class="team-pot">P{{ getTeamPot(team) }}</span>
              </div>
              <div 
                v-for="i in (4 - group.teams.length)" 
                :key="'empty-' + i"
                class="empty-slot"
              >
                <span class="empty-text">TBD</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Groups Phase -->
    <div v-if="currentPhase === 'groups'" class="groups-phase">
      <div class="phase-actions" v-if="!readOnly">
        <button 
          @click="backToDraw" 
          class="btn-secondary"
        >
          <i class="fas fa-arrow-left"></i>
          Back to Draw
        </button>
        <button 
          @click="proceedToMatches" 
          :disabled="!allGroupsComplete"
          class="btn-primary"
        >
          <i class="fas fa-arrow-right"></i>
          Proceed to Matches
        </button>
      </div>

      <div class="final-groups">
        <h4>Final Groups</h4>
        <div class="groups-grid">
          <div 
            v-for="group in groups" 
            :key="group.groupLetter"
            class="group-card final-group"
          >
            <div class="group-header">
              <h5>Group {{ group.groupLetter }}</h5>
              <span class="group-status complete">{{ group.teams.length }}/4</span>
            </div>
            <div class="group-teams">
              <div 
                v-for="(team, index) in group.teams" 
                :key="team._id"
                class="group-team"
                :class="{ 'host-team': team.isHost }"
              >
                <span class="team-position">{{ index + 1 }}.</span>
                <span class="team-flag">{{ team.countryFlag }}</span>
                <span class="team-name">{{ team.countryName }}</span>
                <span class="team-pot">Pot {{ getTeamPot(team) }}</span>
                <span class="team-ranking">FIFA #{{ team.fifaRanking }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <p v-if="error" class="error-message">{{ error }}</p>
  </div>
</template>

<script>
export default {
  name: 'WorldCupDraw',
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
      currentPhase: 'pots', // 'pots', 'draw', 'groups'
      pots: [],
      groups: [],
      loading: false,
      error: ''
    }
  },
  computed: {
    
    allGroupsComplete() {
      if (!this.groups || this.groups.length !== 8) {
        return false
      }
      return this.groups.every(group => group.teams && group.teams.length === 4)
    }
  },
  mounted() {
    this.loadPots()
    this.loadGroups()
  },
  watch: {
    currentPhase(newPhase) {
      if (newPhase === 'groups') {
        // Ensure groups are fully loaded when entering groups phase
        this.loadGroups()
      }
    }
  },
  methods: {
    async loadPots() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/draw/${this.tournament._id}/pots`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          this.pots = await response.json()
        }
      } catch (error) {
        console.error('Error loading pots:', error)
      }
    },

    async loadGroups() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/draw/${this.tournament._id}/groups`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          this.groups = await response.json()
        }
      } catch (error) {
        console.error('Error loading groups:', error)
      }
    },

    async generatePots() {
      this.loading = true
      this.error = ''

      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/draw/${this.tournament._id}/pots/generate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        const data = await response.json()

        if (response.ok) {
          this.pots = data.pots
          await this.loadGroups()
          // Reload pots to ensure team names are populated
          await this.loadPots()
        } else {
          this.error = data.error || 'Failed to generate pots'
        }
      } catch (error) {
        this.error = 'Network error. Please try again.'
      } finally {
        this.loading = false
      }
    },

    async drawAllTeams() {
      this.loading = true
      this.error = ''

      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/draw/${this.tournament._id}/draw/all`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        const data = await response.json()

        if (response.ok) {
          this.groups = data.groups
          this.currentPhase = 'groups'
          // Reload groups to ensure they're properly populated
          setTimeout(() => {
            this.loadGroups()
          }, 100)
        } else {
          this.error = data.error || 'Failed to draw teams'
        }
      } catch (error) {
        this.error = 'Network error. Please try again.'
      } finally {
        this.loading = false
      }
    },

    async drawPot(potNumber) {
      this.loading = true
      this.error = ''

      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/draw/${this.tournament._id}/draw/pot/${potNumber}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        const data = await response.json()

        if (response.ok) {
          this.groups = data.groups
          // Check if all groups are complete after drawing
          if (this.groups.length === 8 && this.groups.every(group => group.teams && group.teams.length === 4)) {
            this.currentPhase = 'groups'
          }
        } else {
          this.error = data.error || 'Failed to draw pot'
        }
      } catch (error) {
        this.error = 'Network error. Please try again.'
      } finally {
        this.loading = false
      }
    },


    async clearDraw() {
      if (!confirm('Are you sure you want to clear the draw? This will remove all team assignments.')) {
        return
      }

      this.loading = true
      this.error = ''

      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/draw/${this.tournament._id}/draw/clear`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        const data = await response.json()

        if (response.ok) {
          this.groups = data.groups
        } else {
          this.error = data.error || 'Failed to clear draw'
        }
      } catch (error) {
        this.error = 'Network error. Please try again.'
      } finally {
        this.loading = false
      }
    },

    getTeamPot(team) {
      for (const pot of this.pots) {
        if (pot.teams.some(potTeam => potTeam._id === team._id)) {
          return pot.potNumber
        }
      }
      return '?'
    },

    proceedToDraw() {
      this.currentPhase = 'draw'
    },

    backToDraw() {
      this.currentPhase = 'draw'
    },

    proceedToMatches() {
      this.$emit('proceed-to-matches')
    }
  }
}
</script>

<style scoped>
.world-cup-draw {
  width: 100%;
}

.draw-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(0, 102, 204, 0.1);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 16px;
}

.draw-header h3 {
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

.draw-phase-indicator {
  display: flex;
  gap: 24px;
}

.phase-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border-radius: var(--radius-lg);
  opacity: 0.5;
  transition: all 0.3s ease;
}

.phase-step.active {
  opacity: 1;
  background: rgba(0, 102, 204, 0.1);
  color: var(--fifa-blue);
}

.phase-step i {
  font-size: 1.5rem;
}

.phase-step span {
  font-size: 0.9rem;
  font-weight: var(--font-weight-semibold);
}

.phase-actions {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.pots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.pot-card {
  background: var(--white);
  border: 1px solid rgba(0, 102, 204, 0.1);
  border-radius: var(--radius-lg);
  padding: 20px;
  transition: all 0.3s ease;
}

.pot-card:hover {
  border-color: rgba(0, 102, 204, 0.3);
  transform: translateY(-2px);
}

.pot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.pot-header h4 {
  font-size: 1.2rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
  margin: 0;
}

.team-count {
  font-size: 0.9rem;
  color: var(--gray);
}

.pot-teams {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.team-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: rgba(0, 102, 204, 0.05);
  border-radius: var(--radius-md);
  transition: all 0.3s ease;
}

.team-item:hover {
  background: rgba(0, 102, 204, 0.1);
}

.team-item.host-team {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1));
  border: 1px solid rgba(255, 215, 0, 0.3);
}

.team-flag {
  font-size: 1.5rem;
}

.team-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.team-name {
  font-weight: var(--font-weight-semibold);
  color: var(--fifa-dark-blue);
}

.team-ranking {
  font-size: 0.8rem;
  color: var(--gray);
}

.host-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  background: var(--fifa-gold);
  color: var(--fifa-dark-blue);
  border-radius: 8px;
  font-size: 0.6rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
}

.draw-controls {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 32px;
  padding: 20px;
  background: rgba(0, 102, 204, 0.05);
  border-radius: var(--radius-lg);
}

.control-group h4 {
  font-size: 1.1rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
  margin: 0 0 12px 0;
}

.draw-buttons {
  display: flex;
  gap: 12px;
}

.draw-all-btn {
  background: var(--fifa-green);
}

.draw-all-btn:hover:not(:disabled) {
  background: #00aa44;
}

.clear-draw-btn {
  background: var(--fifa-red);
  color: var(--white);
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: var(--radius-md);
}

.clear-draw-btn:hover:not(:disabled) {
  background: #cc0000;
}

.clear-draw-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pot-draw-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pot-draw-btn {
  padding: 8px 16px;
  font-size: 0.9rem;
}


.groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.group-card {
  background: var(--white);
  border: 1px solid rgba(0, 102, 204, 0.1);
  border-radius: var(--radius-lg);
  padding: 16px;
  transition: all 0.3s ease;
}

.group-card:hover {
  border-color: rgba(0, 102, 204, 0.3);
}

.group-card.group-complete {
  border-color: var(--fifa-green);
  background: rgba(0, 170, 68, 0.05);
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.group-header h5 {
  font-size: 1.1rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
  margin: 0;
}

.group-status {
  font-size: 0.8rem;
  color: var(--gray);
}

.group-status.complete {
  color: var(--fifa-green);
  font-weight: var(--font-weight-bold);
}

.group-teams {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.group-team {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: rgba(0, 102, 204, 0.05);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
}

.group-team.host-team {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1));
}

.team-position {
  font-weight: var(--font-weight-bold);
  color: var(--fifa-blue);
  min-width: 16px;
}

.team-pot {
  padding: 2px 6px;
  background: rgba(0, 102, 204, 0.2);
  color: var(--fifa-blue);
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: var(--font-weight-bold);
}

.empty-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: var(--radius-md);
  border: 1px dashed rgba(0, 0, 0, 0.2);
}

.empty-text {
  font-size: 0.8rem;
  color: var(--gray);
  font-style: italic;
}

.final-group {
  border-color: var(--fifa-green);
  background: rgba(0, 170, 68, 0.05);
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
  .draw-header {
    flex-direction: column;
    gap: 16px;
  }

  .draw-phase-indicator {
    justify-content: center;
  }

  .phase-actions {
    flex-direction: column;
  }

  .draw-buttons {
    flex-direction: column;
  }

  .pot-draw-buttons {
    justify-content: center;
  }

}
</style>