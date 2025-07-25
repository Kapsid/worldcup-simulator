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
              <CountryFlag :country-code="team.countryCode" :size="24" />
              <div class="team-info">
                <span class="team-name">{{ team.countryName }}</span>
                <span class="team-ranking">FIFA #{{ team.worldRanking || team.fifaRanking || team.ranking || '?' }}</span>
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
              :disabled="loading || animatedDrawInProgress"
              class="btn-primary draw-all-btn"
            >
              <i v-if="loading" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-random"></i>
              Draw All Teams
            </button>
            <button 
              @click="startAnimatedDraw" 
              :disabled="loading || animatedDrawInProgress"
              class="btn-secondary animated-draw-btn"
            >
              <i v-if="animatedDrawInProgress" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-magic"></i>
              Animated Draw
            </button>
            <button 
              @click="clearDraw" 
              :disabled="loading || animatedDrawInProgress"
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

      <!-- Combined Draw and Groups View -->
      <div v-if="animatedDrawInProgress" class="animated-draw-split-view">
        <!-- Left Side: Animated Draw -->
        <div class="animated-draw-container compact">
          <div class="draw-ceremony">
            <div class="ceremony-header">
              <h4>🏆 World Cup Draw</h4>
              <p>{{ drawStatusText }}</p>
            </div>
            
            <div class="draw-stage compact">
              <!-- Ball Opening Animation -->
              <div v-if="showBallAnimation" class="ball-container">
                <div class="draw-ball compact" :class="{ 'opening': ballOpening, 'opened': ballOpened }">
                  <div class="ball-sphere">
                    <div class="ball-top"></div>
                    <div class="ball-bottom"></div>
                  </div>
                  <div v-if="ballOpened" class="team-reveal">
                    <CountryFlag :country-code="currentDrawnTeam?.countryCode" :size="32" />
                    <div class="team-name">{{ currentDrawnTeam?.countryName }}</div>
                  </div>
                </div>
              </div>

              <!-- Group Assignment Animation -->
              <div v-if="showGroupAssignment" class="group-assignment compact">
                <div class="assignment-text">
                  <span class="team-info">
                    {{ currentDrawnTeam?.countryFlag }} {{ currentDrawnTeam?.countryName }}
                  </span>
                  <span class="arrow">→</span>
                  <span class="group-info">Group {{ currentTargetGroup }}</span>
                </div>
              </div>
            </div>

            <div class="ceremony-progress">
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: `${animationProgress}%` }"
                ></div>
              </div>
              <p>{{ currentPotName }} - Team {{ currentTeamIndex + 1 }} of {{ totalTeamsInCurrentPot }}</p>
            </div>

            <div class="ceremony-controls compact">
              <div class="control-buttons">
                <button 
                  @click="togglePause" 
                  class="btn-icon"
                  :disabled="!animatedDrawInProgress"
                  :title="animatedDrawPaused ? 'Resume' : 'Pause'"
                >
                  <i :class="animatedDrawPaused ? 'fas fa-play' : 'fas fa-pause'"></i>
                </button>
                <button 
                  @click="finishAnimationManually" 
                  class="btn-icon"
                  :disabled="!animatedDrawInProgress"
                  title="Finish Now"
                >
                  <i class="fas fa-forward"></i>
                </button>
                <button 
                  @click="adjustSpeed" 
                  class="btn-icon"
                  :disabled="!animatedDrawInProgress"
                  :title="'Speed: ' + getSpeedText()"
                >
                  <i class="fas fa-tachometer-alt"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Side: Live Groups -->
        <div class="groups-preview live">
          <h4>Live Draw Results</h4>
          <div class="groups-grid compact">
            <div 
              v-for="group in groups" 
              :key="group.groupLetter"
              class="group-card compact"
              :class="{ 'group-complete': group.teams.length === 4, 'group-active': currentTargetGroup === group.groupLetter }"
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
                  <CountryFlag :country-code="team.countryCode" :size="20" />
                  <span class="team-name">{{ team.countryName }}</span>
                  <span class="team-pot">P{{ getTeamPot(team) }}</span>
                </div>
                <div 
                  v-for="i in Math.max(0, 4 - group.teams.length)" 
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

      <div class="groups-preview" v-show="!animatedDrawInProgress || (groups.some(g => g.teams.length > 0) && !animatedDrawInProgress)">
        <h4>{{ animatedDrawInProgress ? 'Live Draw Results' : 'Groups Preview' }}</h4>
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
                <CountryFlag :country-code="team.countryCode" :size="20" />
                <span class="team-name">{{ team.countryName }}</span>
                <span class="team-pot">P{{ getTeamPot(team) }}</span>
              </div>
              <div 
                v-for="i in Math.max(0, 4 - group.teams.length)" 
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
                <CountryFlag :country-code="team.countryCode" :size="20" />
                <span class="team-name">{{ team.countryName }}</span>
                <span class="team-pot">Pot {{ getTeamPot(team) }}</span>
                <span class="team-ranking">FIFA #{{ team.worldRanking || team.fifaRanking || team.ranking || '?' }}</span>
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
import CountryFlag from './CountryFlag.vue'

export default {
  name: 'WorldCupDraw',
  components: {
    CountryFlag
  },
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
      error: '',
      // Animated draw properties
      animatedDrawInProgress: false,
      animatedDrawPaused: false,
      showBallAnimation: false,
      showGroupAssignment: false,
      ballOpening: false,
      ballOpened: false,
      currentDrawnTeam: null,
      currentTargetGroup: '',
      currentPotName: '',
      currentTeamIndex: 0,
      totalTeamsInCurrentPot: 0,
      animationProgress: 0,
      drawStatusText: '',
      animatedDrawData: null,
      animationSpeed: 1, // 1 = normal, 2 = fast, 3 = very fast
      lastAddedTeamId: null
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
          this.initializeGroups()
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
          // Initialize groups structure if needed
          if (this.groups.length === 0) {
            this.initializeGroups()
          }
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

    async startAnimatedDraw() {
      try {
        // First, get the draw data from the API (same as drawAllTeams but don't update UI yet)
        this.loading = true
        this.error = ''

        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/draw/${this.tournament._id}/draw/all`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        const data = await response.json()

        if (response.ok) {
          this.animatedDrawData = data.groups
          this.loading = false
          this.startDrawAnimation()
        } else {
          this.error = data.error || 'Failed to start animated draw'
          this.loading = false
        }
      } catch (error) {
        this.error = 'Network error. Please try again.'
        this.loading = false
      }
    },

    async startDrawAnimation() {
      this.animatedDrawInProgress = true
      this.animationProgress = 0
      this.drawStatusText = 'Preparing the draw ceremony...'
      
      // Initialize groups if they don't exist or clear existing ones
      if (this.groups.length === 0) {
        this.groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(letter => ({
          groupLetter: letter,
          teams: []
        }))
      } else {
        this.groups = this.groups.map(group => ({
          ...group,
          teams: []
        }))
      }

      // Get draw order from pots
      const drawOrder = []
      for (let potNum = 1; potNum <= 4; potNum++) {
        const pot = this.pots.find(p => p.potNumber === potNum)
        if (pot) {
          // Get the final assignments for this pot from the draw data
          const potAssignments = this.extractPotAssignments(pot, potNum)
          drawOrder.push({
            potNumber: potNum,
            potName: `Pot ${potNum}`,
            assignments: potAssignments
          })
        }
      }

      // Animate each pot
      for (let potIndex = 0; potIndex < drawOrder.length; potIndex++) {
        const pot = drawOrder[potIndex]
        this.currentPotName = pot.potName
        this.totalTeamsInCurrentPot = pot.assignments.length

        for (let teamIndex = 0; teamIndex < pot.assignments.length; teamIndex++) {
          this.currentTeamIndex = teamIndex
          const assignment = pot.assignments[teamIndex]
          
          await this.animateTeamDraw(assignment)
          
          // Update progress
          this.animationProgress = ((potIndex * 8 + teamIndex + 1) / 32) * 100
        }
      }

      // Finish ceremony
      this.drawStatusText = '🎉 Draw complete! Welcome to the World Cup!'
      await this.sleep(2000)
      
      this.animatedDrawInProgress = false
      this.resetAnimationState()
    },

    extractPotAssignments(pot, potNumber) {
      const assignments = []
      
      // Find where each team from this pot ended up in the final draw
      for (const team of pot.teams) {
        for (const group of this.animatedDrawData) {
          const foundTeam = group.teams.find(t => t._id === team._id)
          if (foundTeam) {
            assignments.push({
              team: team,
              targetGroup: group.groupLetter
            })
            break
          }
        }
      }
      
      // Shuffle assignments to simulate random draw order
      return this.shuffleArray(assignments)
    },

    async animateTeamDraw(assignment) {
      this.currentDrawnTeam = assignment.team
      this.currentTargetGroup = assignment.targetGroup
      this.drawStatusText = `Drawing from ${this.currentPotName}...`

      // Show ball animation
      this.showBallAnimation = true
      this.showGroupAssignment = false
      this.ballOpening = false
      this.ballOpened = false

      await this.sleepWithPause(300)

      // Start ball opening
      this.ballOpening = true
      this.drawStatusText = 'Opening the ball...'
      
      await this.sleepWithPause(500)

      // Ball opened, reveal team
      this.ballOpened = true
      this.drawStatusText = `${assignment.team.countryName} has been drawn!`
      
      await this.sleepWithPause(800)

      // Hide ball, show group assignment
      this.showBallAnimation = false
      this.showGroupAssignment = true
      this.drawStatusText = `Assigning ${assignment.team.countryName} to Group ${assignment.targetGroup}...`
      
      await this.sleepWithPause(600)

      // Add team to the group in UI
      const targetGroup = this.groups.find(g => g.groupLetter === assignment.targetGroup)
      if (targetGroup) {
        targetGroup.teams.push(assignment.team)
      }

      this.drawStatusText = `${assignment.team.countryName} assigned to Group ${assignment.targetGroup}!`
      
      await this.sleepWithPause(400)

      // Hide group assignment
      this.showGroupAssignment = false
    },

    resetAnimationState() {
      this.showBallAnimation = false
      this.showGroupAssignment = false
      this.ballOpening = false
      this.ballOpened = false
      this.currentDrawnTeam = null
      this.currentTargetGroup = ''
      this.currentPotName = ''
      this.currentTeamIndex = 0
      this.totalTeamsInCurrentPot = 0
      this.animationProgress = 0
      this.drawStatusText = ''
      this.animatedDrawData = null
      this.animatedDrawPaused = false
      this.animationSpeed = 1
    },

    shuffleArray(array) {
      const shuffled = [...array]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      return shuffled
    },

    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms))
    },

    async sleepWithPause(baseMs) {
      // Adjust timing based on speed setting
      const ms = baseMs / this.animationSpeed
      
      return new Promise((resolve) => {
        const checkPause = () => {
          if (!this.animatedDrawPaused && this.animatedDrawInProgress) {
            setTimeout(resolve, ms)
          } else if (!this.animatedDrawInProgress) {
            resolve() // If animation was stopped, resolve immediately
          } else {
            // If paused, check again in 100ms
            setTimeout(checkPause, 100)
          }
        }
        checkPause()
      })
    },

    togglePause() {
      this.animatedDrawPaused = !this.animatedDrawPaused
      if (this.animatedDrawPaused) {
        this.drawStatusText = '⏸️ Draw paused - Click Resume to continue'
      }
    },

    adjustSpeed() {
      this.animationSpeed = this.animationSpeed >= 3 ? 1 : this.animationSpeed + 1
    },

    getSpeedText() {
      switch (this.animationSpeed) {
        case 1: return 'Normal'
        case 2: return 'Fast'
        case 3: return 'Very Fast'
        default: return 'Normal'
      }
    },

    async finishAnimationManually() {
      if (!this.animatedDrawInProgress) return
      
      // Set final groups data
      this.groups = this.animatedDrawData
      
      // End animation
      this.animatedDrawInProgress = false
      this.resetAnimationState()
      this.drawStatusText = '✅ Draw completed manually!'
      
      // Brief message then clear
      await this.sleep(1500)
      this.drawStatusText = ''
    },

    getTeamPot(team) {
      for (const pot of this.pots) {
        if (pot.teams.some(potTeam => potTeam._id === team._id)) {
          return pot.potNumber
        }
      }
      return '?'
    },

    initializeGroups() {
      // Initialize empty groups structure
      this.groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(letter => ({
        groupLetter: letter,
        teams: []
      }))
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
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

@media (max-width: 1200px) {
  .pots-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .pots-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
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
  gap: 4px;
}

.team-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background: rgba(0, 102, 204, 0.05);
  border-radius: var(--radius-sm);
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.team-item:hover {
  background: rgba(0, 102, 204, 0.1);
}

.team-item.host-team {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1));
  border: 1px solid rgba(255, 215, 0, 0.3);
}

.team-flag {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.team-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex: 1;
  min-width: 0;
}

.team-name {
  font-weight: var(--font-weight-semibold);
  color: var(--fifa-dark-blue);
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.team-ranking {
  font-size: 0.7rem;
  color: var(--gray);
}

.host-badge {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 1px 4px;
  background: var(--fifa-gold);
  color: var(--fifa-dark-blue);
  border-radius: 6px;
  font-size: 0.55rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  flex-shrink: 0;
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

/* Split View Layout for Animated Draw */
.animated-draw-split-view {
  display: grid;
  grid-template-columns: 40% 60%;
  gap: 1.5rem;
  margin: 1rem 0;
  height: 80vh;
  max-height: 700px;
  min-height: 500px;
}

/* Animated Draw Styles */
.animated-draw-container {
  margin: 2rem 0;
  padding: 2rem;
  background: linear-gradient(135deg, rgba(0, 102, 204, 0.1), rgba(0, 102, 204, 0.05));
  border-radius: var(--radius-xl);
  border: 2px solid rgba(0, 102, 204, 0.2);
}

.animated-draw-container.compact {
  margin: 0;
  padding: 1.5rem;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.draw-ceremony {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.ceremony-header h4 {
  font-size: 1.8rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
  margin: 0 0 0.5rem 0;
}

.animated-draw-container.compact .ceremony-header h4 {
  font-size: 1.4rem;
  margin-bottom: 0.25rem;
}

.ceremony-header p {
  font-size: 1.1rem;
  color: var(--fifa-blue);
  margin: 0 0 2rem 0;
  font-weight: var(--font-weight-semibold);
}

.animated-draw-container.compact .ceremony-header p {
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.draw-stage {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 2rem 0;
}

.draw-stage.compact {
  min-height: 180px;
  margin: 0.5rem 0;
}

.ball-container {
  perspective: 1000px;
}

.draw-ball {
  position: relative;
  width: 200px;
  height: 200px;
  margin: 0 auto;
  transform-style: preserve-3d;
  transition: all 0.8s ease;
}

.draw-ball.compact {
  width: 150px;
  height: 150px;
}

.ball-sphere {
  width: 100%;
  height: 100%;
  position: relative;
  border-radius: 50%;
  background: linear-gradient(45deg, #ff6b35, #ff8e53);
  box-shadow: 
    0 0 20px rgba(255, 107, 53, 0.4),
    inset -10px -10px 20px rgba(0, 0, 0, 0.2);
  transform-style: preserve-3d;
  animation: ballFloat 2s ease-in-out infinite;
}

.ball-top, .ball-bottom {
  position: absolute;
  width: 100%;
  height: 50%;
  border-radius: 100px 100px 0 0;
  transition: all 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.ball-top {
  top: 0;
  background: linear-gradient(180deg, #ff6b35, #ff8e53);
  transform-origin: bottom center;
}

.ball-bottom {
  bottom: 0;
  background: linear-gradient(0deg, #ff6b35, #ff8e53);
  border-radius: 0 0 100px 100px;
  transform-origin: top center;
}

.draw-ball.opening .ball-top {
  transform: rotateX(-90deg);
}

.draw-ball.opening .ball-bottom {
  transform: rotateX(90deg);
}

.draw-ball.opened .ball-top {
  transform: rotateX(-120deg);
}

.draw-ball.opened .ball-bottom {
  transform: rotateX(120deg);
}

.team-reveal {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  animation: teamReveal 0.8s ease 0.5s forwards;
  z-index: 10;
}

.team-reveal .team-flag {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

.team-reveal .team-name {
  font-size: 1.2rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
  background: rgba(255, 255, 255, 0.95);
  padding: 0.5rem 1rem;
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.group-assignment {
  animation: groupAssignmentSlide 0.8s ease;
}

.assignment-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  font-size: 1.5rem;
  font-weight: var(--font-weight-bold);
}

.group-assignment.compact .assignment-text {
  gap: 1rem;
  font-size: 1.2rem;
}

.team-info {
  color: var(--fifa-blue);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.arrow {
  color: var(--fifa-gold);
  font-size: 2rem;
  animation: arrowPulse 1s ease infinite;
}

.group-info {
  color: var(--fifa-dark-blue);
  background: var(--fifa-gold);
  padding: 0.5rem 1.5rem;
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
}

.ceremony-controls {
  margin: 1.5rem 0;
}

.control-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.control-btn {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-semibold);
  transition: all 0.3s ease;
  min-width: 120px;
}

.control-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ceremony-progress {
  margin-top: 2rem;
}

.animated-draw-container.compact .ceremony-progress {
  margin-top: 1rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(0, 102, 204, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--fifa-blue), var(--fifa-gold));
  border-radius: 4px;
  transition: width 0.5s ease;
}

.ceremony-progress p {
  color: var(--fifa-blue);
  font-weight: var(--font-weight-semibold);
  margin: 0;
}

.animated-draw-btn {
  background: linear-gradient(135deg, var(--fifa-gold), #FFE55C) !important;
  color: var(--fifa-dark-blue) !important;
  border: none !important;
  font-weight: var(--font-weight-bold) !important;
}

.animated-draw-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #FFE55C, var(--fifa-gold)) !important;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(255, 215, 0, 0.3) !important;
}

/* Animations */
@keyframes ballFloat {
  0%, 100% { transform: translateY(0px) rotateY(0deg); }
  50% { transform: translateY(-10px) rotateY(180deg); }
}

@keyframes teamReveal {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.5);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes groupAssignmentSlide {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes arrowPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

/* Live draw group updates */
.group-team {
  animation: teamSlideIn 0.5s ease;
}

@keyframes teamSlideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
    background-color: rgba(255, 215, 0, 0.3);
  }
  to {
    opacity: 1;
    transform: translateX(0);
    background-color: transparent;
  }
}

@media (max-width: 768px) {
  .animated-draw-container {
    padding: 1rem;
    margin: 1rem 0;
  }
  
  .draw-ball {
    width: 150px;
    height: 150px;
  }
  
  .team-reveal .team-flag {
    font-size: 2rem;
  }
  
  .team-reveal .team-name {
    font-size: 1rem;
  }
  
  .assignment-text {
    flex-direction: column;
    gap: 1rem;
    font-size: 1.2rem;
  }
  
  .ceremony-header h4 {
    font-size: 1.4rem;
  }

  .control-buttons {
    flex-direction: column;
    align-items: center;
  }

  .control-btn {
    min-width: 160px;
  }

  .animated-draw-split-view {
    grid-template-columns: 1fr;
    gap: 1rem;
    height: auto;
    max-height: none;
  }

  .groups-grid.compact {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }

  .group-card.compact .group-team .team-name {
    font-size: 0.7rem;
  }
}

/* Compact controls for split view */
.ceremony-controls.compact {
  margin-top: 0.5rem;
}

.ceremony-controls.compact .control-buttons {
  gap: 0.5rem;
  justify-content: center;
}

.btn-icon {
  background: var(--fifa-blue);
  color: var(--white);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.btn-icon:hover:not(:disabled) {
  background: var(--fifa-dark-blue);
  transform: translateY(-2px);
}

.btn-icon:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Live groups preview */
.groups-preview.live {
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-xl);
  padding: 1.5rem;
  height: 100%;
  overflow-y: auto;
}

.groups-preview.live h4 {
  margin: 0 0 1rem 0;
  color: var(--fifa-gold);
  font-size: 1.3rem;
  text-align: center;
}

.groups-grid.compact {
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.group-card.compact {
  padding: 0.5rem;
  min-height: 120px;
  font-size: 0.8rem;
  width: 100%;
  max-width: 200px;
}

.group-card.compact .group-header h5 {
  font-size: 0.8rem;
  margin-bottom: 0.2rem;
}

.group-card.compact .group-header .group-status {
  font-size: 0.7rem;
}

.group-card.compact .group-teams {
  gap: 0.15rem;
}

.group-card.compact .group-team {
  padding: 0.2rem 0.3rem;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.group-card.compact .group-team .team-flag {
  font-size: 0.9rem;
  flex-shrink: 0;
}

.group-card.compact .group-team .team-name {
  font-size: 0.65rem;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-card.compact .group-team .team-pot {
  font-size: 0.6rem;
  flex-shrink: 0;
}

.group-card.compact .empty-slot {
  padding: 0.2rem 0.3rem;
  font-size: 0.6rem;
  min-height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Active group highlight */
.group-card.group-active {
  border-color: var(--fifa-gold) !important;
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
  animation: pulse-gold 2s infinite;
}

@keyframes pulse-gold {
  0%, 100% { 
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
  }
  50% { 
    box-shadow: 0 0 25px rgba(255, 215, 0, 0.5);
  }
}

/* Just added team animation */
.group-team.just-added {
  animation: team-added 1.5s ease-out;
}

@keyframes team-added {
  0% {
    transform: scale(1.2) rotate(5deg);
    background: rgba(255, 215, 0, 0.3);
  }
  50% {
    transform: scale(1.1);
    background: rgba(255, 215, 0, 0.2);
  }
  100% {
    transform: scale(1);
    background: transparent;
  }
}
</style>