<template>
  <div class="qualification-manager">
    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      Loading qualification data...
    </div>
    
    <div v-else class="qualification-content">
      <!-- Header -->
      <div class="qualification-header">
        <div class="header-info">
          <h2>FIFA World Cup Qualification</h2>
          <p class="subtitle">Continental qualification tournaments to determine World Cup participants</p>
        </div>
        <div class="qualification-progress">
          <div class="progress-stats">
            <div class="stat-item">
              <span class="stat-value">{{ totalQualifiedTeams }}</span>
              <span class="stat-label">Qualified</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ totalSlots }}</span>
              <span class="stat-label">Total Slots</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ completedMatchdays }}</span>
              <span class="stat-label">Matchdays</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Confederation Tabs -->
      <div class="confederation-tabs">
        <button 
          v-for="confederation in confederations" 
          :key="confederation.id"
          @click="activeConfederation = confederation.id"
          :class="['tab-button', { active: activeConfederation === confederation.id }]"
          :style="{ '--conf-color': confederation.color }"
        >
          <span class="tab-flag">{{ confederation.flag }}</span>
          <span class="tab-name">{{ confederation.name }}</span>
          <span class="tab-slots">{{ Math.floor(confederation.qualificationSlots) }} slots</span>
        </button>
      </div>

      <!-- Unified Qualified Teams Section -->
      <div v-if="allQualifiedTeams.length > 0" class="unified-qualified-section">
        <div class="qualified-header" @click="showQualifiedTeams = !showQualifiedTeams">
          <h3>
            <i class="fas fa-trophy"></i>
            Qualified Teams ({{ totalQualifiedTeams }}/{{ totalSlots }})
          </h3>
          <button class="toggle-btn">
            <i :class="showQualifiedTeams ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
          </button>
        </div>
        <div v-if="showQualifiedTeams" class="all-qualified-teams">
          <div v-for="team in allQualifiedTeams" :key="team.teamId || team.name" class="unified-team-card">
            <div class="team-info">
              <span class="team-flag">{{ team.flag }}</span>
              <span class="team-name">{{ team.name }}</span>
            </div>
            <div class="team-confederation">
              <span class="confederation-badge" :class="'conf-' + team.confederation">
                {{ team.confederationName }}
              </span>
            </div>
            <div class="qualification-method">
              <span class="method-badge" :class="getQualificationMethodClass(team.qualificationMethod)">
                {{ formatQualificationMethod(team.qualificationMethod) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Active Confederation Content -->
      <div v-if="activeConfederationData" class="confederation-content">
        <div class="confederation-header">
          <h3>{{ activeConfederationData.fullName }}</h3>
          <p>{{ activeConfederationData.description }}</p>
        </div>

        <!-- Qualification Tables/Groups -->
        <div class="qualification-tables">
          <div v-if="!qualificationStarted" class="not-started">
            <i class="fas fa-play-circle"></i>
            <h4>Qualification Not Started</h4>
            <p>Start the qualification process to see groups and matches</p>
          </div>
          <div v-else class="qualification-content">
            <!-- Show groups and matches for active confederation -->
            <div v-if="getActiveConfederationData()" class="confederation-qualification">
              
              <!-- Sub-navigation tabs -->
              <div class="sub-navigation">
                <button 
                  @click="activeSubTab = 'groups'"
                  :class="['sub-tab', { active: activeSubTab === 'groups' }]"
                >
                  <i class="fas fa-layer-group"></i>
                  Groups & Standings
                </button>
                <button 
                  @click="activeSubTab = 'matches'"
                  :class="['sub-tab', { active: activeSubTab === 'matches' }]"
                >
                  <i class="fas fa-futbol"></i>
                  Matches
                </button>
                <button 
                  v-if="activeConfederation === 'ofc'"
                  @click="activeSubTab = 'playoff'"
                  :class="['sub-tab', { active: activeSubTab === 'playoff' }]"
                >
                  <i class="fas fa-medal"></i>
                  Play off
                </button>
                <button 
                  @click="activeSubTab = 'qualified'"
                  :class="['sub-tab', { active: activeSubTab === 'qualified' }]"
                >
                  <i class="fas fa-trophy"></i>
                  Qualified ({{ getQualifiedFromConfederation(activeConfederation).length }})
                </button>
              </div>

              <!-- Sub-tab content -->
              <div class="sub-tab-content">
                <!-- Groups & Standings Tab -->
                <div v-if="activeSubTab === 'groups'" class="groups-tab">
                  <div v-if="getActiveConfederationData().groups && getActiveConfederationData().groups.length > 0" class="groups-grid">
                    <div v-for="group in getActiveConfederationData().groups" :key="group.groupId" class="group-table">
                      <div class="group-header">
                        <h5>{{ group.name }}</h5>
                      </div>
                      <div class="group-standings">
                        <table class="standings-table">
                          <thead>
                            <tr>
                              <th>Team</th>
                              <th>P</th>
                              <th>W</th>
                              <th>D</th>
                              <th>L</th>
                              <th>GF</th>
                              <th>GA</th>
                              <th>GD</th>
                              <th>Pts</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="(team, index) in group.teams" :key="team.teamId" :class="getTeamQualificationClass(team, index, group)">
                              <td class="team-cell">
                                <span class="team-flag">{{ team.flag }}</span>
                                <span class="team-name">{{ team.name }}</span>
                              </td>
                              <td>{{ team.played }}</td>
                              <td>{{ team.won }}</td>
                              <td>{{ team.drawn }}</td>
                              <td>{{ team.lost }}</td>
                              <td>{{ team.goalsFor }}</td>
                              <td>{{ team.goalsAgainst }}</td>
                              <td>{{ team.goalDifference }}</td>
                              <td class="points">{{ team.points }}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Matches Tab -->
                <div v-else-if="activeSubTab === 'matches'" class="matches-tab">
                  <div v-if="getActiveConfederationData().matches && getActiveConfederationData().matches.length > 0" class="matches-section">
                    <!-- Matchday Tabs -->
                    <div class="matchday-tabs">
                      <button
                        v-for="matchday in getGroupedMatchdays()"
                        :key="matchday.matchday"
                        @click="activeMatchday = matchday.matchday"
                        :class="['matchday-tab', { active: activeMatchday === matchday.matchday }]"
                      >
                        <span class="tab-title">Matchday {{ matchday.matchday }}</span>
                        <span class="tab-count">{{ matchday.matches.length }} matches</span>
                      </button>
                    </div>

                    <!-- Active Matchday Content -->
                    <div v-if="getActiveMatchdayData()" class="matchday-content">
                      <div class="matchday-header">
                        <h5>Matchday {{ activeMatchday }}</h5>
                        <div class="matchday-info">
                          <span class="match-count">{{ getActiveMatchdayData().matches.length }} matches</span>
                          <span class="played-count">
                            {{ getActiveMatchdayData().matches.filter(m => m.played).length }} played
                          </span>
                        </div>
                      </div>

                      <div class="matches-list">
                        <div v-for="match in getActiveMatchdayData().matches" :key="match.matchId" class="match-item">
                          <div class="match-info">
                            <span class="group">{{ getGroupName(match.groupId) }}</span>
                          </div>
                          <div class="match-teams">
                            <div class="team home-team">
                              <span class="team-flag">{{ match.homeTeam.flag }}</span>
                              <span class="team-name">{{ match.homeTeam.name }}</span>
                            </div>
                            <div class="match-score">
                              <span v-if="match.played" class="score">{{ match.homeScore }} - {{ match.awayScore }}</span>
                              <span v-else class="vs">vs</span>
                            </div>
                            <div class="team away-team">
                              <span class="team-name">{{ match.awayTeam.name }}</span>
                              <span class="team-flag">{{ match.awayTeam.flag }}</span>
                            </div>
                          </div>
                          <div class="match-actions">
                            <button 
                              v-if="!match.played"
                              @click="simulateIndividualMatch(match)"
                              :disabled="simulatingMatch === match.matchId"
                              class="simulate-match-btn"
                            >
                              <i v-if="simulatingMatch === match.matchId" class="fas fa-spinner fa-spin"></i>
                              <i v-else class="fas fa-play"></i>
                            </button>
                            <span v-else class="match-status played">Played</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Play off Tab -->
                <div v-else-if="activeSubTab === 'playoff'" class="playoff-tab">
                  <div class="playoff-section">
                    <div class="playoff-header">
                      <h4>
                        <i class="fas fa-medal"></i>
                        Play off Matches
                      </h4>
                    </div>
                    
                    <div class="playoff-content">
                      <div v-if="getPlayoffMatches().length > 0" class="playoff-matches">
                        <div v-for="match in getPlayoffMatches()" :key="match.matchId" class="playoff-match">
                          <div class="match-info">
                            <div class="match-leg">
                              <i class="fas fa-medal"></i>
                              <span>{{ match.description }}</span>
                            </div>
                          </div>
                          <div class="match-teams">
                            <div class="team home-team">
                              <span class="team-flag">{{ match.homeTeam?.flag || '🏴' }}</span>
                              <span class="team-name">{{ match.homeTeam?.name || 'TBD' }}</span>
                            </div>
                            <div class="match-score">
                              <span v-if="match.played" class="score">{{ match.homeScore }} - {{ match.awayScore }}</span>
                              <span v-else class="vs">vs</span>
                            </div>
                            <div class="team away-team">
                              <span class="team-name">{{ match.awayTeam?.name || 'TBD' }}</span>
                              <span class="team-flag">{{ match.awayTeam?.flag || '🏴' }}</span>
                            </div>
                          </div>
                          <div class="match-actions">
                            <button 
                              v-if="!match.played"
                              @click="simulatePlayoffMatch(match)"
                              :disabled="simulatingPlayoffMatch === match.matchId"
                              class="simulate-match-btn"
                            >
                              <i v-if="simulatingPlayoffMatch === match.matchId" class="fas fa-spinner fa-spin"></i>
                              <i v-else class="fas fa-play"></i>
                              Simulate
                            </button>
                            <span v-else class="match-completed">
                              <i class="fas fa-check"></i>
                              Completed
                            </span>
                          </div>
                        </div>
                        
                        <div v-if="getPlayoffWinner()" class="playoff-winner">
                          <div class="winner-header">
                            <h5>
                              <i class="fas fa-trophy"></i>
                              Playoff Winner
                            </h5>
                          </div>
                          <div class="winner-team">
                            <span class="team-flag">{{ getPlayoffWinner().flag }}</span>
                            <span class="team-name">{{ getPlayoffWinner().name }}</span>
                            <span class="qualification-badge">World Cup Qualified</span>
                          </div>
                        </div>
                      </div>
                      <div v-else class="empty-playoff">
                        <i class="fas fa-calendar-alt"></i>
                        <p>No playoff matches scheduled for this confederation yet.</p>
                        <p class="help-text">Playoff matches will appear here when group stages are complete.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Qualified Teams Tab -->
                <div v-else-if="activeSubTab === 'qualified'" class="qualified-tab">
                  <div v-if="getQualifiedFromConfederation(activeConfederation).length > 0" class="qualified-teams-section">
                    <div class="qualified-teams-grid">
                      <div v-for="team in getQualifiedFromConfederation(activeConfederation)" :key="team.teamId" class="qualified-team-card">
                        <div class="team-info">
                          <span class="team-flag">{{ team.flag }}</span>
                          <span class="team-name">{{ team.name }}</span>
                        </div>
                        <div class="qualification-method">
                          <span :class="getQualificationMethodClass(team.qualificationMethod)">
                            {{ formatQualificationMethod(team.qualificationMethod) }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-else class="no-qualified-teams">
                    <i class="fas fa-trophy"></i>
                    <p>No teams have qualified yet from this confederation.</p>
                    <p>Complete the group stage to see qualified teams.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Qualification Summary (when finalized) -->
      <div v-if="qualificationFinalized && allQualifiedTeams.length > 0" class="qualification-summary">
        <h3>🏆 Qualification Complete!</h3>
        <p>{{ allQualifiedTeams.length }} teams have qualified for the World Cup:</p>
        <div class="final-qualified-teams">
          <div v-for="team in allQualifiedTeams" :key="team.teamId || team.name" class="final-team-card">
            <span class="team-flag">{{ team.flag }}</span>
            <span class="team-name">{{ team.name || team.country }}</span>
            <span class="team-confederation">{{ team.confederationName || getConfederationName(team.confederation) }}</span>
          </div>
        </div>
        <div class="qualification-actions">
          <button 
            @click="goToTournament" 
            :disabled="finalizing"
            class="btn-success action-btn"
          >
            <i v-if="finalizing" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-arrow-right"></i>
            {{ finalizing ? 'Preparing Tournament...' : 'GO TO TOURNAMENT' }}
          </button>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="qualification-actions">
        <button 
          v-if="!qualificationStarted"
          @click="startQualification"
          :disabled="starting"
          class="btn-primary action-btn"
        >
          <i v-if="starting" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-play"></i>
          {{ starting ? 'Starting...' : 'Start Qualification' }}
        </button>
        
        <button 
          v-if="qualificationStarted && activeConfederation && !getActiveConfederationData()?.completed && hasUnplayedMatches()"
          @click="simulateNextConfederationMatchday"
          :disabled="simulating"
          class="btn-primary action-btn"
        >
          <i v-if="simulating" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-forward"></i>
          {{ simulating ? 'Simulating...' : `Simulate Next ${activeConfederationData?.name} Matchday` }}
        </button>

        <button 
          v-if="qualificationStarted && activeConfederation && !getActiveConfederationData()?.completed && hasUnplayedMatches()"
          @click="simulateAllConfederationMatches"
          :disabled="simulatingAll"
          class="btn-secondary action-btn"
        >
          <i v-if="simulatingAll" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-fast-forward"></i>
          {{ simulatingAll ? 'Simulating All...' : `Simulate All ${activeConfederationData?.name} Matches` }}
        </button>

        <button 
          v-if="qualificationStarted"
          @click="regenerateQualification"
          :disabled="regenerating"
          class="btn-secondary action-btn"
        >
          <i v-if="regenerating" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-refresh"></i>
          {{ regenerating ? 'Regenerating...' : 'Regenerate Qualification' }}
        </button>

        <button 
          v-if="allQualificationComplete && !qualificationFinalized"
          @click="finalizeQualification"
          :disabled="finalizing"
          class="btn-success action-btn"
        >
          <i v-if="finalizing" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-check"></i>
          {{ finalizing ? 'Finalizing...' : 'Finalize Qualification & Start Tournament' }}
        </button>

        <button 
          v-if="qualificationFinalized"
          @click="goToTournament"
          class="btn-success action-btn"
        >
          <i class="fas fa-arrow-right"></i>
          Go to Tournament
        </button>
      </div>

      <!-- Error Display -->
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'QualificationManager',
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
      loading: true,
      starting: false,
      simulating: false,
      simulatingAll: false,
      finalizing: false,
      regenerating: false,
      simulatingMatch: null,
      simulatingPlayoffMatch: null,
      error: '',
      activeConfederation: 'uefa',
      confederations: [],
      qualificationData: null,
      qualificationStarted: false,
      qualificationFinalized: false,
      qualifiedTeams: [],
      completedMatchdays: 0,
      totalSlots: 32,
      activeMatchday: 1,
      activeSubTab: 'groups', // groups, matches, standings
      showQualifiedTeams: false
    }
  },
  watch: {
    // Auto-select first unfinished matchday when confederation changes
    activeConfederation() {
      this.activeMatchday = this.defaultActiveMatchday
      // Reset playoff tab if switching away from OFC
      if (this.activeSubTab === 'playoff' && this.activeConfederation !== 'ofc') {
        this.activeSubTab = 'groups'
      }
    },
    
    // Auto-select first unfinished matchday when qualification data loads
    qualificationData() {
      this.activeMatchday = this.defaultActiveMatchday
    }
  },
  computed: {
    activeConfederationData() {
      return this.confederations.find(conf => conf.id === this.activeConfederation)
    },
    allQualificationComplete() {
      if (!this.qualificationData || !this.qualificationData.confederations) return false
      
      // Check if all confederations are completed
      const allConfederationsComplete = this.qualificationData.confederations.every(conf => conf.completed)
      
      // Also check if we have qualified teams
      const hasQualifiedTeams = this.qualificationData.confederations.some(conf => 
        conf.qualifiedTeams && conf.qualifiedTeams.length > 0
      )
      
      return allConfederationsComplete && hasQualifiedTeams
    },

    // Get all qualified teams including host
    allQualifiedTeams() {
      const qualifiedFromConfederations = this.qualificationData?.confederations?.flatMap(conf => 
        (conf.qualifiedTeams || []).map(team => ({
          ...team,
          confederation: conf.confederationId,
          confederationName: this.getConfederationName(conf.confederationId)
        }))
      ) || []
      
      // Add host country
      const hostTeam = this.tournament?.hostCountry ? {
        name: this.tournament.hostCountry,
        flag: this.tournament.hostCountryFlag || '🏆',
        country: this.tournament.hostCountry,
        confederation: 'host',
        confederationName: 'Host',
        qualificationMethod: 'host'
      } : null
      
      return hostTeam ? [hostTeam, ...qualifiedFromConfederations] : qualifiedFromConfederations
    },

    // Total qualified teams count (including host)
    totalQualifiedTeams() {
      return this.allQualifiedTeams.length
    }
  },
  async mounted() {
    await this.loadQualificationData()
  },
  methods: {
    async loadQualificationData() {
      this.loading = true
      try {
        // Load confederation data
        const response = await fetch('http://localhost:3001/api/qualification/confederations')
        if (response.ok) {
          this.confederations = await response.json()
        }
        
        // Load qualification status for this tournament
        const token = localStorage.getItem('token')
        const qualResponse = await fetch(`http://localhost:3001/api/qualification/${this.tournament._id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (qualResponse.ok) {
          this.qualificationData = await qualResponse.json()
          this.qualificationStarted = this.qualificationData.started
          this.qualificationFinalized = this.qualificationData.completed
          this.qualifiedTeams = this.qualificationData.qualifiedTeams || []
          this.completedMatchdays = this.qualificationData.completedMatchdays || 0
        }
      } catch (error) {
        this.error = 'Failed to load qualification data'
        console.error('Error loading qualification data:', error)
      } finally {
        this.loading = false
      }
    },
    
    async startQualification() {
      this.starting = true
      this.error = ''
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/qualification/${this.tournament._id}/start`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          await this.loadQualificationData()
          this.$emit('qualification-started')
        } else {
          const data = await response.json()
          this.error = data.error || 'Failed to start qualification'
        }
      } catch (error) {
        this.error = 'Network error. Please try again.'
      } finally {
        this.starting = false
      }
    },
    
    async simulateNextMatchday() {
      this.simulating = true
      this.error = ''
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/qualification/${this.tournament._id}/simulate-matchday`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          await this.loadQualificationData()
          this.$emit('matchday-simulated')
        } else {
          const data = await response.json()
          this.error = data.error || 'Failed to simulate matchday'
        }
      } catch (error) {
        this.error = 'Network error. Please try again.'
      } finally {
        this.simulating = false
      }
    },

    async simulateNextConfederationMatchday() {
      this.simulating = true
      this.error = ''
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/qualification/${this.tournament._id}/simulate-confederation-matchday/${this.activeConfederation}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          await this.loadQualificationData()
          this.$emit('confederation-matchday-simulated', {
            confederationId: data.confederationId,
            confederationName: data.confederationName,
            matchesPlayed: data.matchesPlayed,
            matchday: data.matchday
          })
        } else {
          const data = await response.json()
          this.error = data.error || 'Failed to simulate confederation matchday'
        }
      } catch (error) {
        this.error = 'Network error. Please try again.'
      } finally {
        this.simulating = false
      }
    },
    
    async finalizeQualification() {
      this.finalizing = true
      this.error = ''
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/qualification/${this.tournament._id}/finalize`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const result = await response.json()
          await this.loadQualificationData()
          this.$emit('qualification-completed', result)
          
          // Show success message
          this.error = `Qualification finalized! ${result.totalQualified} teams qualified for the tournament.`
        } else {
          const data = await response.json()
          this.error = data.error || 'Failed to finalize qualification'
        }
      } catch (error) {
        this.error = 'Network error. Please try again.'
      } finally {
        this.finalizing = false
      }
    },

    async goToTournament() {
      // Add qualified teams to tournament as regular teams
      this.finalizing = true
      this.error = ''
      
      try {
        const token = localStorage.getItem('token')
        
        // Add qualified teams to tournament
        const response = await fetch(`http://localhost:3001/api/teams/${this.tournament._id}/add-qualified`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          // Navigate to tournament detail page
          this.$router.push(`/tournament/${this.tournament._id}`)
        } else {
          const data = await response.json()
          this.error = data.error || 'Failed to add qualified teams to tournament'
        }
      } catch (error) {
        this.error = 'Network error. Please try again.'
      } finally {
        this.finalizing = false
      }
    },
    
    getConfederationTeams(confederationId) {
      // This will be implemented to return teams for a specific confederation
      return []
    },
    
    getQualifiedFromConfederation(confederationId) {
      if (!this.qualificationData || !this.qualificationData.confederations) return []
      const confederation = this.qualificationData.confederations.find(c => c.confederationId === confederationId)
      return confederation ? confederation.qualifiedTeams || [] : []
    },

    hasUnplayedMatches() {
      const activeConfData = this.getActiveConfederationData()
      if (!activeConfData || !activeConfData.matches) return false
      
      return activeConfData.matches.some(match => !match.played)
    },
    
    getConfederationMatchdays(confederationId) {
      // This will be implemented to return matchdays for a specific confederation
      return []
    },

    getActiveConfederationData() {
      if (!this.qualificationData || !this.qualificationData.confederations) return null
      return this.qualificationData.confederations.find(conf => conf.confederationId === this.activeConfederation)
    },

    getGroupName(groupId) {
      const activeConfData = this.getActiveConfederationData()
      if (!activeConfData || !activeConfData.groups) return 'Unknown Group'
      const group = activeConfData.groups.find(g => g.groupId === groupId)
      return group ? group.name : 'Unknown Group'
    },

    getGroupedMatchdays() {
      const activeConfData = this.getActiveConfederationData()
      if (!activeConfData || !activeConfData.matches) return []
      
      const matchdays = {}
      activeConfData.matches.forEach(match => {
        if (!matchdays[match.matchday]) {
          matchdays[match.matchday] = {
            matchday: match.matchday,
            matches: []
          }
        }
        matchdays[match.matchday].matches.push(match)
      })
      
      return Object.values(matchdays).sort((a, b) => a.matchday - b.matchday)
    },

    getTeamQualificationClass(team, index, group) {
      const activeConfData = this.getActiveConfederationData()
      if (!activeConfData) return ''
      
      const confederation = this.confederations.find(c => c.id === this.activeConfederation)
      if (!confederation) return ''
      
      // Direct qualification only - no playoffs
      const totalSlots = confederation.qualificationSlots
      const groups = activeConfData.groups || []
      const numGroups = groups.length
      
      if (confederation.format === 'single_league') {
        // CONMEBOL: Single league, top teams qualify directly
        if (index < totalSlots) return 'qualified'
      } else if (confederation.format === 'groups_direct') {
        // New logic: Handle balanced qualification
        if (numGroups <= totalSlots) {
          // All group winners qualify, plus some runners-up
          if (index === 0) {
            // Group winner always qualifies
            return 'qualified'
          } else if (index === 1) {
            // Runner-up might qualify based on being best runner-up
            const remainingSlots = totalSlots - numGroups
            if (remainingSlots > 0) {
              return 'qualified-maybe' // Visual indication for potential qualification
            }
          }
        } else {
          // More groups than slots - only best group winners qualify
          if (index === 0) {
            return 'qualified-maybe' // Group winner might qualify
          }
        }
      }
      
      return ''
    },

    async regenerateQualification() {
      this.regenerating = true
      this.error = ''
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/qualification/${this.tournament._id}/regenerate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          await this.loadQualificationData()
          this.$emit('qualification-regenerated')
        } else {
          const data = await response.json()
          this.error = data.error || 'Failed to regenerate qualification'
        }
      } catch (error) {
        this.error = 'Network error. Please try again.'
      } finally {
        this.regenerating = false
      }
    },

    async simulateIndividualMatch(match) {
      this.simulatingMatch = match.matchId
      this.error = ''
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/qualification/${this.tournament._id}/simulate-match`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            matchId: match.matchId
          })
        })
        
        if (response.ok) {
          await this.loadQualificationData()
          this.$emit('match-simulated', match)
        } else {
          const data = await response.json()
          this.error = data.error || 'Failed to simulate match'
        }
      } catch (error) {
        this.error = 'Network error. Please try again.'
      } finally {
        this.simulatingMatch = null
      }
    },

    async simulateAllConfederationMatches() {
      this.simulatingAll = true
      this.error = ''
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/qualification/${this.tournament._id}/simulate-confederation/${this.activeConfederation}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          await this.loadQualificationData()
          this.$emit('confederation-completed', {
            confederationId: data.confederationId,
            confederationName: data.confederationName,
            matchesPlayed: data.matchesPlayed,
            completed: data.completed
          })
        } else {
          const data = await response.json()
          this.error = data.error || 'Failed to simulate confederation matches'
        }
      } catch (error) {
        this.error = 'Network error. Please try again.'
      } finally {
        this.simulatingAll = false
      }
    },

    getConfederationStatus(confederationId) {
      if (!this.qualificationData || !this.qualificationData.confederations) return 'Not Started'
      const confederation = this.qualificationData.confederations.find(c => c.confederationId === confederationId)
      if (!confederation) return 'Not Started'
      
      if (confederation.completed) return 'Complete'
      if (confederation.started) return 'In Progress'
      return 'Not Started'
    },

    formatQualificationMethod(method) {
      switch (method) {
        case 'direct': return 'Direct'
        case 'group_winner': return 'Group Winner'
        case 'best_runner_up': return 'Best Runner-up'
        case 'next_round': return 'Next Round'
        default: return method
      }
    },

    getQualificationMethodClass(method) {
      switch (method) {
        case 'direct': return 'method-direct'
        case 'group_winner': return 'method-direct'
        case 'best_runner_up': return 'method-direct'
        case 'next_round': return 'method-next-round'
        default: return ''
      }
    },

    getConfederationName(confederationId) {
      const confederation = this.confederations.find(c => c.id === confederationId)
      return confederation ? confederation.name : confederationId.toUpperCase()
    },
    
    getConfederationById(confederationId) {
      return this.confederations.find(c => c.id === confederationId) || {}
    },

    getActiveMatchdayData() {
      const matchdays = this.getGroupedMatchdays()
      return matchdays.find(md => md.matchday === this.activeMatchday) || null
    },

    // Get the first unfinished matchday (or first matchday if all are finished)
    defaultActiveMatchday() {
      const matchdays = this.getGroupedMatchdays()
      if (matchdays.length === 0) return 1
      
      // Find first matchday with unplayed matches
      const unfinishedMatchday = matchdays.find(md => 
        md.matches.some(match => !match.played)
      )
      
      // If found, return it; otherwise return the first matchday
      return unfinishedMatchday ? unfinishedMatchday.matchday : matchdays[0].matchday
    },

    // Get playoff matches for active confederation
    getPlayoffMatches() {
      if (!this.qualificationData || !this.qualificationData.confederations) {
        return []
      }
      
      const confederation = this.qualificationData.confederations.find(
        conf => conf.confederationId === this.activeConfederation
      )
      
      if (!confederation || !confederation.playoffs || !confederation.playoffs.available) {
        return []
      }
      
      return confederation.playoffs.matches || []
    },

    // Get playoff winner
    getPlayoffWinner() {
      if (!this.qualificationData || !this.qualificationData.confederations) {
        return null
      }
      
      const confederation = this.qualificationData.confederations.find(
        conf => conf.confederationId === this.activeConfederation
      )
      
      if (!confederation || !confederation.playoffs) {
        return null
      }
      
      return confederation.playoffs.winner
    },

    // Simulate playoff match
    async simulatePlayoffMatch(match) {
      if (!this.tournament._id || this.simulatingPlayoffMatch) return
      
      this.simulatingPlayoffMatch = match.matchId
      this.error = ''
      
      try {
        const response = await fetch(`http://localhost:3001/api/qualification/${this.tournament._id}/simulate-ofc-playoff`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            matchId: match.matchId
          })
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to simulate playoff match')
        }
        
        const data = await response.json()
        console.log('Playoff match simulated:', data)
        
        // Refresh qualification data
        await this.loadQualificationData()
        
        this.$emit('playoff-match-simulated', data)
        
      } catch (error) {
        console.error('Error simulating playoff match:', error)
        this.error = error.message
      } finally {
        this.simulatingPlayoffMatch = null
      }
    }
  }
}
</script>

<style scoped>
.qualification-manager {
  width: 100%;
}

.loading-state {
  text-align: center;
  padding: 3rem;
  color: var(--gray);
}

.loading-state i {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.qualification-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid var(--glass-border);
}

.header-info h2 {
  color: var(--fifa-dark-blue);
  margin: 0 0 0.5rem 0;
  font-size: 1.8rem;
}

.subtitle {
  color: var(--gray);
  margin: 0;
  font-size: 1.1rem;
}

.qualification-progress {
  display: flex;
  gap: 1rem;
}

.progress-stats {
  display: flex;
  gap: 1.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-blue);
  line-height: 1;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--gray);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.confederation-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.tab-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid transparent;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
  text-align: center;
}

.tab-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.tab-button.active {
  background: rgba(255, 255, 255, 0.2);
  border-color: var(--conf-color);
  color: var(--conf-color);
}

.tab-flag {
  font-size: 1.5rem;
}

.tab-name {
  font-weight: var(--font-weight-bold);
  font-size: 0.9rem;
  color: var(--fifa-dark-blue);
}

.tab-slots {
  font-size: 0.8rem;
  color: var(--gray);
}

.confederation-content {
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.confederation-header {
  margin-bottom: 1.5rem;
}

.confederation-header h3 {
  color: var(--fifa-dark-blue);
  margin: 0 0 0.5rem 0;
  font-size: 1.4rem;
}

.confederation-header p {
  color: var(--gray);
  margin: 0;
}

.qualification-status {
  margin-bottom: 1.5rem;
}

.status-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.status-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
}

.status-card i {
  font-size: 1.5rem;
  color: var(--fifa-blue);
}

.status-info {
  display: flex;
  flex-direction: column;
}

.status-value {
  font-size: 1.5rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
  line-height: 1;
}

.status-label {
  font-size: 0.8rem;
  color: var(--gray);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.qualification-structure {
  margin-bottom: 1.5rem;
}

.qualification-structure h4 {
  color: var(--fifa-dark-blue);
  margin: 0 0 0.75rem 0;
  font-size: 1.2rem;
}

.format-info {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.format-stage {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(0, 102, 204, 0.1);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  color: var(--fifa-dark-blue);
}

.format-stage i {
  color: var(--fifa-blue);
}

.qualification-tables {
  margin-bottom: 1.5rem;
}

.not-started {
  text-align: center;
  padding: 2rem;
  color: var(--gray);
}

.not-started i {
  font-size: 3rem;
  color: var(--fifa-blue);
  margin-bottom: 1rem;
}

.not-started h4 {
  color: var(--fifa-dark-blue);
  margin: 0 0 0.5rem 0;
}

.table-placeholder {
  text-align: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-md);
  border: 2px dashed var(--glass-border);
}

.table-placeholder h5 {
  color: var(--fifa-dark-blue);
  margin: 0 0 0.5rem 0;
}

.qualification-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: var(--font-weight-bold);
  border-radius: var(--radius-md);
  transition: all 0.3s ease;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.btn-success {
  background: var(--fifa-green);
  color: var(--white);
  border: none;
}

.btn-success:hover:not(:disabled) {
  background: #28a745;
}

.error-message {
  color: var(--fifa-red);
  text-align: center;
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(255, 68, 68, 0.1);
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 68, 68, 0.2);
}

/* Groups and Matches Styles */
.confederation-qualification {
  margin-top: 1rem;
}

.groups-section {
  margin-bottom: 2rem;
}

.groups-section h4 {
  color: var(--fifa-dark-blue);
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1rem;
}

.group-table {
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.group-header {
  background: var(--fifa-blue);
  color: var(--white);
  padding: 0.75rem;
  text-align: center;
}

.group-header h5 {
  margin: 0;
  font-size: 1rem;
  font-weight: var(--font-weight-bold);
}

.standings-table {
  width: 100%;
  border-collapse: collapse;
}

.standings-table th,
.standings-table td {
  padding: 0.5rem;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.standings-table th {
  background: rgba(255, 255, 255, 0.1);
  color: var(--fifa-dark-blue);
  font-weight: var(--font-weight-bold);
  font-size: 0.8rem;
  text-transform: uppercase;
}

.standings-table td {
  color: var(--fifa-dark-blue);
  font-size: 0.9rem;
}

.team-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.team-flag {
  font-size: 1.2rem;
}

.team-name {
  font-weight: var(--font-weight-semibold);
}

.points {
  font-weight: var(--font-weight-bold);
  color: var(--fifa-blue);
}

.qualified {
  background: rgba(76, 175, 80, 0.1);
  border-left: 3px solid #4caf50;
}

.qualified-maybe {
  background: rgba(255, 193, 7, 0.1);
  border-left: 3px solid #ffc107;
}


.qualified-teams-section {
  margin-bottom: 2rem;
}

.qualified-teams-section h4 {
  color: var(--fifa-dark-blue);
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.qualified-teams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.qualified-team-card {
  background: rgba(76, 175, 80, 0.1);
  border-left: 4px solid #4caf50;
  border-radius: var(--radius-md);
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.team-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.team-info .team-flag {
  font-size: 1.3rem;
}

.team-info .team-name {
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
}

.qualification-method {
  font-size: 0.8rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.method-direct {
  color: #4caf50;
}


.method-next-round {
  color: #2196f3;
}

.qualification-summary {
  background: rgba(76, 175, 80, 0.1);
  border: 2px solid #4caf50;
  border-radius: var(--radius-lg);
  padding: 2rem;
  margin-bottom: 2rem;
  text-align: center;
}

.qualification-summary h3 {
  color: #4caf50;
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  font-weight: var(--font-weight-bold);
}

.qualification-summary p {
  color: var(--fifa-dark-blue);
  margin: 0 0 1.5rem 0;
  font-size: 1.1rem;
}

.final-qualified-teams {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
}

.final-team-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  padding: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.final-team-card .team-flag {
  font-size: 1.2rem;
}

.final-team-card .team-name {
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
  flex: 1;
}

.final-team-card .team-confederation {
  font-size: 0.8rem;
  color: var(--gray);
  text-transform: uppercase;
}

.matches-section {
  margin-bottom: 2rem;
}

.matches-section h4 {
  color: var(--fifa-dark-blue);
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.matchdays-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.matchday-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-lg);
  padding: 1rem;
}

.matchday-title {
  color: var(--fifa-blue);
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.matches-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.match-item {
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  padding: 1rem;
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 1rem;
  align-items: center;
}

.match-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.matchday {
  font-size: 0.8rem;
  color: var(--fifa-blue);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
}

.group {
  font-size: 0.8rem;
  color: var(--gray);
}

.match-teams {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.team {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.team.away-team {
  flex-direction: row-reverse;
}

.team-flag {
  font-size: 1.2rem;
}

.team-name {
  font-weight: var(--font-weight-semibold);
  color: var(--fifa-dark-blue);
}

.match-score {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
}

.score {
  font-size: 1.2rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-blue);
}

.vs {
  color: var(--gray);
  font-size: 0.9rem;
}

.match-actions {
  display: flex;
  justify-content: center;
  align-items: center;
}

.simulate-match-btn {
  background: var(--fifa-blue);
  color: var(--white);
  border: none;
  border-radius: var(--radius-md);
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  min-width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.simulate-match-btn:hover:not(:disabled) {
  background: var(--fifa-dark-blue);
  transform: translateY(-2px);
}

.simulate-match-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.match-status {
  text-align: center;
}

.played {
  color: #4caf50;
  font-weight: var(--font-weight-bold);
  font-size: 0.8rem;
}

.upcoming {
  color: var(--gray);
  font-size: 0.8rem;
}

@media (max-width: 768px) {
  .qualification-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .progress-stats {
    flex-direction: column;
    gap: 1rem;
  }
  
  .confederation-tabs {
    flex-direction: column;
  }
  
  .tab-button {
    min-width: auto;
  }
  
  .status-cards {
    grid-template-columns: 1fr;
  }
  
  .qualification-actions {
    flex-direction: column;
  }

  .groups-grid {
    grid-template-columns: 1fr;
  }

  .match-item {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .match-teams {
    flex-direction: column;
    gap: 0.5rem;
  }

  .team.away-team {
    flex-direction: row;
  }
}

/* Unified Qualified Teams Section */
.unified-qualified-section {
  background: linear-gradient(135deg, #4caf50, #45a049);
  color: white;
  padding: 2rem;
  border-radius: var(--radius-lg);
  margin-bottom: 2rem;
}

.qualified-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 1rem;
  transition: all 0.2s ease;
}

.qualified-header:hover {
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-md);
  padding: 0.5rem 1rem;
}

.qualified-header h3 {
  margin: 0;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toggle-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.toggle-btn i {
  color: white;
  font-size: 1rem;
}

.all-qualified-teams {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.unified-team-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.unified-team-card .team-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.unified-team-card .team-flag {
  font-size: 1.2rem;
}

.unified-team-card .team-name {
  font-weight: 500;
  font-size: 0.9rem;
}

.unified-team-card .team-confederation {
  min-width: 60px;
}

.confederation-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.confederation-badge.conf-host {
  background: #ffd700;
  color: #000;
}

.confederation-badge.conf-uefa {
  background: #003366;
}

.confederation-badge.conf-conmebol {
  background: #ffd700;
  color: #000;
}

.confederation-badge.conf-concacaf {
  background: #ff6b35;
}

.confederation-badge.conf-afc {
  background: #ff4444;
}

.confederation-badge.conf-caf {
  background: #4caf50;
}

.confederation-badge.conf-ofc {
  background: #2196f3;
}

.qualification-method .method-badge {
  background: rgba(255, 255, 255, 0.15);
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 500;
}

/* Matchday Tabs */
.matchday-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.matchday-tab {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  min-width: 100px;
}

.matchday-tab:hover {
  background: var(--hover-bg);
  border-color: var(--fifa-blue);
}

.matchday-tab.active {
  background: var(--fifa-blue);
  color: white;
  border-color: var(--fifa-blue);
}

.matchday-tab .tab-title {
  font-weight: 500;
  font-size: 0.9rem;
}

.matchday-tab .tab-count {
  font-size: 0.75rem;
  opacity: 0.8;
}

.matchday-content {
  background: var(--card-bg);
  border-radius: var(--radius-md);
  padding: 1rem;
  border: 1px solid var(--border-color);
}

.matchday-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.matchday-header h5 {
  margin: 0;
  color: var(--fifa-dark-blue);
  font-size: 1.1rem;
}

.matchday-info {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: var(--gray);
}

/* Sub-navigation */
.sub-navigation {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1rem;
}

.sub-tab {
  background: transparent;
  border: none;
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--gray);
}

.sub-tab:hover {
  background: var(--hover-bg);
  color: var(--fifa-blue);
}

.sub-tab.active {
  background: var(--fifa-blue);
  color: white;
}

.sub-tab-content {
  min-height: 400px;
}

.groups-tab, .matches-tab, .playoff-tab, .qualified-tab {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.playoff-section {
  padding: 2rem;
}

.playoff-header {
  text-align: center;
  margin-bottom: 2rem;
}

.playoff-header h4 {
  font-size: 1.5rem;
  color: var(--fifa-blue);
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.playoff-header p {
  color: var(--gray);
  font-size: 0.9rem;
}

.empty-playoff {
  text-align: center;
  padding: 3rem;
  color: var(--gray);
}

.empty-playoff i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: var(--light-gray);
}

.empty-playoff p {
  margin-bottom: 0.5rem;
}

.empty-playoff .help-text {
  font-size: 0.85rem;
  color: var(--light-gray);
}

.playoff-matches {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.playoff-match {
  background: var(--white);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  box-shadow: var(--shadow-light);
  border: 1px solid var(--glass-border);
  transition: all 0.3s ease;
}

.playoff-match:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.playoff-match .match-info {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.match-leg {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--fifa-blue);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  font-weight: var(--font-weight-bold);
  font-size: 0.9rem;
}

.playoff-match .match-teams {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 1rem;
}

.playoff-match .team {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.playoff-match .team.away-team {
  justify-content: flex-end;
  flex-direction: row-reverse;
}

.playoff-match .team-flag {
  font-size: 1.5rem;
}

.playoff-match .team-name {
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
  font-size: 1.1rem;
}

.playoff-match .match-score {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  padding: 0.75rem;
  border-radius: var(--radius-sm);
  background: var(--light-bg);
}

.playoff-match .score {
  font-weight: var(--font-weight-bold);
  font-size: 1.2rem;
  color: var(--fifa-blue);
}

.playoff-match .vs {
  color: var(--gray);
  font-weight: var(--font-weight-medium);
}

.playoff-match .match-actions {
  display: flex;
  justify-content: center;
}

.playoff-match .simulate-match-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--fifa-green);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  transition: all 0.3s ease;
}

.playoff-match .simulate-match-btn:hover:not(:disabled) {
  background: #28a745;
  transform: translateY(-1px);
}

.playoff-match .simulate-match-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.playoff-match .match-completed {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--fifa-green);
  font-weight: var(--font-weight-bold);
}

.playoff-winner {
  margin-top: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, var(--fifa-gold), #ffd700);
  border-radius: var(--radius-lg);
  text-align: center;
  color: var(--fifa-dark-blue);
  box-shadow: var(--shadow-hover);
}

.playoff-winner .winner-header h5 {
  font-size: 1.3rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.playoff-winner .winner-team {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.playoff-winner .team-flag {
  font-size: 2rem;
}

.playoff-winner .team-name {
  font-size: 1.5rem;
  font-weight: var(--font-weight-bold);
}

.playoff-winner .qualification-badge {
  background: var(--fifa-dark-blue);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.no-qualified-teams {
  text-align: center;
  padding: 3rem;
  color: var(--gray);
}

.no-qualified-teams i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.no-qualified-teams p {
  margin: 0.5rem 0;
}
</style>