<template>
  <div class="qualification-manager">
    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      Loading qualification data...
    </div>
    
    <div v-else class="qualification-content">
      <!-- Confederation Tabs -->
      <ConfederationTabs 
        :confederations="confederations"
        :active-confederation="activeConfederation"
        @confederation-change="handleConfederationChange"
      />

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
            <div v-if="getActiveConfederationData()" class="confederation-qualification">
              <!-- Sub-navigation tabs -->
              <QualificationSubTabs 
                :active-tab="activeSubTab"
                :show-playoff-tab="['ofc', 'caf', 'afc'].includes(activeConfederation)"
                :qualified-count="getQualifiedFromConfederation(activeConfederation).length"
                @tab-change="handleSubTabChange"
              />

              <!-- Sub-tab content -->
              <div class="sub-tab-content">
                <!-- Groups & Standings Tab -->
                <div v-if="activeSubTab === 'groups'" class="groups-tab">
                  <div v-if="getActiveConfederationData().groups && getActiveConfederationData().groups.length > 0" class="groups-grid">
                    <GroupStandingsTable 
                      v-for="group in getActiveConfederationData().groups" 
                      :key="group.groupId"
                      :group="group"
                      :tournament-id="tournament._id"
                    />
                  </div>
                  <div v-else class="no-groups">
                    <i class="fas fa-layer-group"></i>
                    <p>No groups available for this confederation</p>
                  </div>
                </div>

                <!-- Matches Tab -->
                <div v-if="activeSubTab === 'matches'" class="matches-tab">
                  <MatchdaySelector 
                    :confederation-name="activeConfederationData.fullName"
                    :active-matchday="activeMatchday"
                    :available-matchdays="getAvailableMatchdays()"
                    :completed-matchdays="getCompletedMatchdays()"
                    :can-generate-matchday="canGenerateMatchday()"
                    :can-simulate-all="canSimulateAll()"
                    :simulating="simulating"
                    :simulating-all="simulatingAll"
                    @generate-matchday="generateMatchday"
                    @simulate-all-matches="simulateAllMatches"
                    @matchday-change="handleMatchdayChange"
                  />
                  
                  <MatchList 
                    :matches="getMatchesForActiveMatchday()"
                    :simulating-match="simulatingMatch"
                    :read-only="readOnly"
                    :tournament-id="tournament._id"
                    @simulate-match="simulateMatch"
                    @view-match="viewMatch"
                  />
                </div>

                <!-- Playoff Tab (OFC, CAF, AFC) -->
                <div v-if="activeSubTab === 'playoff' && ['ofc', 'caf', 'afc'].includes(activeConfederation)" class="playoff-tab">
                  <div class="playoff-matches">
                    <div v-if="getPlayoffMatches().length === 0" class="no-playoff">
                      <i class="fas fa-clock"></i>
                      <h4>Playoff matches not ready</h4>
                      <p>Complete all group matches to see playoff teams</p>
                    </div>
                    
                    <div v-else class="playoff-grid">
                      <div 
                        v-for="match in getPlayoffMatches()" 
                        :key="match.matchId"
                        class="playoff-match"
                      >
                        <div class="playoff-header">
                          <h5>{{ match.name || 'Playoff Match' }}</h5>
                          <span class="playoff-type">{{ match.type }}</span>
                        </div>
                        
                        <div class="playoff-teams">
                          <div class="team">
                            <span class="team-flag">{{ match.homeTeam?.flag || '🏴' }}</span>
                            <router-link 
                              v-if="match.homeTeam?.teamId"
                              :to="`/tournament/${tournament._id}/qualifying-team/${match.homeTeam.teamId}`" 
                              class="team-name clickable-team-playoff"
                            >
                              {{ match.homeTeam.name }}
                            </router-link>
                            <span v-else class="team-name">TBD</span>
                          </div>
                          
                          <div class="playoff-score">
                            <span v-if="match.played" class="score">
                              {{ match.homeScore }} - {{ match.awayScore }}
                            </span>
                            <span v-else class="vs">vs</span>
                          </div>
                          
                          <div class="team">
                            <router-link 
                              v-if="match.awayTeam?.teamId"
                              :to="`/tournament/${tournament._id}/qualifying-team/${match.awayTeam.teamId}`" 
                              class="team-name clickable-team-playoff"
                            >
                              {{ match.awayTeam.name }}
                            </router-link>
                            <span v-else class="team-name">TBD</span>
                            <span class="team-flag">{{ match.awayTeam?.flag || '🏴' }}</span>
                          </div>
                        </div>
                        
                        <div class="playoff-actions">
                          <button 
                            v-if="!match.played && !readOnly && match.homeTeam && match.awayTeam"
                            @click="simulatePlayoffMatch(match.matchId)"
                            :disabled="simulatingPlayoffMatch === match.matchId"
                            class="btn-simulate"
                          >
                            <i v-if="simulatingPlayoffMatch === match.matchId" class="fas fa-spinner fa-spin"></i>
                            <i v-else class="fas fa-play"></i>
                            Simulate
                          </button>
                          
                          <button 
                            @click="viewMatch(match.matchId)"
                            class="btn-view"
                          >
                            <i class="fas fa-eye"></i>
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Qualified Tab -->
                <div v-if="activeSubTab === 'qualified'" class="qualified-tab">
                  <div class="qualified-teams">
                    <div v-if="getQualifiedFromConfederation(activeConfederation).length === 0" class="no-qualified">
                      <i class="fas fa-trophy"></i>
                      <h4>No qualified teams yet</h4>
                      <p>Teams will appear here once qualification is complete</p>
                    </div>
                    
                    <div v-else class="qualified-grid">
                      <div 
                        v-for="team in getQualifiedFromConfederation(activeConfederation)" 
                        :key="team.teamId"
                        class="qualified-team"
                      >
                        <span class="team-flag">{{ team.flag }}</span>
                        <router-link 
                          :to="`/tournament/${tournament._id}/qualifying-team/${team.teamId}`" 
                          class="team-name clickable-team-qualified"
                        >
                          {{ team.name }}
                        </router-link>
                        <span class="team-rank">#{{ team.ranking }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ConfederationTabs from './qualification/ConfederationTabs.vue'
import QualificationSubTabs from './qualification/QualificationSubTabs.vue'
import GroupStandingsTable from './qualification/GroupStandingsTable.vue'
import MatchdaySelector from './qualification/MatchdaySelector.vue'
import MatchList from './qualification/MatchList.vue'
import { API_URL } from '../config/api.js'

export default {
  name: 'QualificationManagerRefactored',
  components: {
    ConfederationTabs,
    QualificationSubTabs,
    GroupStandingsTable,
    MatchdaySelector,
    MatchList
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
      loading: true,
      simulating: false,
      simulatingAll: false,
      simulatingMatch: null,
      simulatingPlayoffMatch: null,
      error: '',
      activeConfederation: 'uefa',
      confederations: [],
      qualificationData: null,
      qualificationStarted: false,
      qualificationFinalized: false,
      qualifiedTeams: [],
      activeMatchday: 1,
      activeSubTab: 'groups'
    }
  },
  computed: {
    activeConfederationData() {
      return this.confederations.find(conf => conf.id === this.activeConfederation)
    }
  },
  methods: {
    handleConfederationChange(confederationId) {
      this.activeConfederation = confederationId
      this.activeMatchday = this.defaultActiveMatchday()
      this.activeSubTab = 'groups'
    },
    
    handleSubTabChange(tabName) {
      this.activeSubTab = tabName
    },
    
    handleMatchdayChange(matchday) {
      this.activeMatchday = matchday
    },
    
    getActiveConfederationData() {
      if (!this.qualificationData || !this.qualificationData.confederations) return null
      return this.qualificationData.confederations.find(conf => conf.confederationId === this.activeConfederation)
    },
    
    getQualifiedFromConfederation(confederationId) {
      const confederation = this.getActiveConfederationData()
      return confederation?.qualifiedTeams || []
    },
    
    getAvailableMatchdays() {
      const confederation = this.getActiveConfederationData()
      if (!confederation || !confederation.matches) return []
      
      const matchdays = [...new Set(confederation.matches.map(m => m.matchday))].sort((a, b) => a - b)
      return matchdays
    },
    
    getCompletedMatchdays() {
      const confederation = this.getActiveConfederationData()
      if (!confederation || !confederation.matches) return []
      
      const matchdayCompletionMap = new Map()
      confederation.matches.forEach(match => {
        const matchday = match.matchday
        if (!matchdayCompletionMap.has(matchday)) {
          matchdayCompletionMap.set(matchday, { total: 0, completed: 0 })
        }
        const stats = matchdayCompletionMap.get(matchday)
        stats.total++
        if (match.played) stats.completed++
      })
      
      return Array.from(matchdayCompletionMap.entries())
        .filter(([_, stats]) => stats.total === stats.completed)
        .map(([matchday, _]) => matchday)
    },
    
    getMatchesForActiveMatchday() {
      const confederation = this.getActiveConfederationData()
      if (!confederation || !confederation.matches) return []
      
      return confederation.matches.filter(match => match.matchday === this.activeMatchday)
    },
    
    getPlayoffMatches() {
      const confederation = this.getActiveConfederationData()
      if (!confederation || !confederation.playoffs || !confederation.playoffs.matches) return []
      return confederation.playoffs.matches
    },
    
    canGenerateMatchday() {
      return !this.readOnly && this.qualificationStarted && !this.qualificationFinalized
    },
    
    canSimulateAll() {
      return !this.readOnly && this.qualificationStarted && !this.qualificationFinalized
    },
    
    defaultActiveMatchday() {
      const completedMatchdays = this.getCompletedMatchdays()
      const availableMatchdays = this.getAvailableMatchdays()
      
      // Find first unfinished matchday
      const firstUnfinished = availableMatchdays.find(md => !completedMatchdays.includes(md))
      return firstUnfinished || availableMatchdays[0] || 1
    },
    
    async generateMatchday() {
      this.simulating = true
      this.error = ''
      
      try {
        const response = await fetch(`${API_URL}/qualification/${this.tournament._id}/generate-matchday`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            confederationId: this.activeConfederation,
            matchday: this.activeMatchday
          })
        })
        
        if (response.ok) {
          await this.loadQualificationData()
        } else {
          const data = await response.json()
          this.error = data.error || 'Failed to generate matchday'
        }
      } catch (error) {
        this.error = 'Network error. Please try again.'
      } finally {
        this.simulating = false
      }
    },
    
    async simulateAllMatches() {
      this.simulatingAll = true
      this.error = ''
      
      try {
        const response = await fetch(`${API_URL}/qualification/${this.tournament._id}/simulate-all`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            confederationId: this.activeConfederation
          })
        })
        
        if (response.ok) {
          await this.loadQualificationData()
        } else {
          const data = await response.json()
          this.error = data.error || 'Failed to simulate matches'
        }
      } catch (error) {
        this.error = 'Network error. Please try again.'
      } finally {
        this.simulatingAll = false
      }
    },
    
    async simulateMatch(matchId) {
      this.simulatingMatch = matchId
      
      try {
        const response = await fetch(`${API_URL}/qualification/${this.tournament._id}/simulate-match`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ matchId })
        })
        
        if (response.ok) {
          await this.loadQualificationData()
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
    
    async simulatePlayoffMatch(matchId) {
      this.simulatingPlayoffMatch = matchId
      
      try {
        const response = await fetch(`${API_URL}/qualification/${this.tournament._id}/simulate-playoff`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ matchId })
        })
        
        if (response.ok) {
          await this.loadQualificationData()
        } else {
          const data = await response.json()
          this.error = data.error || 'Failed to simulate playoff match'
        }
      } catch (error) {
        this.error = 'Network error. Please try again.'
      } finally {
        this.simulatingPlayoffMatch = null
      }
    },
    
    viewMatch(matchId) {
      this.$router.push(`/match/${matchId}`)
    },
    
    async loadQualificationData() {
      this.loading = true
      
      try {
        const response = await fetch(`${API_URL}/qualification/${this.tournament._id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        
        if (response.ok) {
          this.qualificationData = await response.json()
          this.qualificationStarted = this.qualificationData.started
          this.qualificationFinalized = this.qualificationData.finalized
          this.qualifiedTeams = this.qualificationData.qualifiedTeams || []
          
          // Load confederations data
          await this.loadConfederations()
          
          // Set default active matchday
          this.activeMatchday = this.defaultActiveMatchday()
        } else {
          this.error = 'Failed to load qualification data'
        }
      } catch (error) {
        this.error = 'Network error. Please try again.'
      } finally {
        this.loading = false
      }
    },
    
    async loadConfederations() {
      try {
        const response = await fetch('${API_URL}/confederations')
        if (response.ok) {
          this.confederations = await response.json()
        }
      } catch (error) {
        console.error('Error loading confederations:', error)
      }
    }
  },
  
  mounted() {
    this.loadQualificationData()
  }
}
</script>

<style scoped>
.qualification-manager {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

.loading-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--white);
}

.loading-state i {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.confederation-content {
  margin-top: 2rem;
}

.confederation-header {
  text-align: center;
  margin-bottom: 2rem;
}

.confederation-header h3 {
  color: var(--white);
  font-size: 1.5rem;
  font-weight: var(--font-weight-bold);
  margin: 0 0 0.5rem 0;
}

.confederation-header p {
  color: var(--white);
  opacity: 0.8;
  margin: 0;
}

.not-started {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--white);
}

.not-started i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: var(--fifa-gold);
}

.not-started h4 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.no-groups,
.no-qualified,
.no-playoff {
  text-align: center;
  padding: 3rem 2rem;
  color: var(--white);
  opacity: 0.7;
}

.no-groups i,
.no-qualified i,
.no-playoff i {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.qualified-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.qualified-team {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(10px);
}

.qualified-team .team-flag {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.qualified-team .team-name {
  flex: 1;
  font-weight: var(--font-weight-medium);
  color: var(--white);
}

.clickable-team-qualified {
  color: var(--white);
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 2px 4px;
  border-radius: 4px;
  flex: 1;
  font-weight: var(--font-weight-medium);
}

.clickable-team-qualified:hover {
  color: var(--fifa-gold);
  text-decoration: underline;
  background-color: rgba(255, 255, 255, 0.1);
}

.clickable-team-playoff {
  color: var(--white);
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 2px 4px;
  border-radius: 4px;
  font-weight: var(--font-weight-medium);
}

.clickable-team-playoff:hover {
  color: var(--fifa-gold);
  text-decoration: underline;
  background-color: rgba(255, 255, 255, 0.1);
}

.qualified-team .team-rank {
  font-size: 0.85rem;
  color: var(--fifa-gold);
  font-weight: var(--font-weight-bold);
}

.playoff-grid {
  display: grid;
  gap: 1.5rem;
}

.playoff-match {
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  backdrop-filter: blur(10px);
}

.playoff-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.playoff-header h5 {
  color: var(--white);
  font-size: 1.1rem;
  font-weight: var(--font-weight-bold);
  margin: 0;
}

.playoff-type {
  background: rgba(255, 215, 0, 0.2);
  color: var(--fifa-gold);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
}

.playoff-teams {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.playoff-teams .team {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.playoff-teams .team:last-child {
  justify-content: flex-end;
  flex-direction: row-reverse;
}

.playoff-score {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  margin: 0 16px;
}

.playoff-score .score {
  font-size: 1.2rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-gold);
}

.playoff-score .vs {
  font-size: 0.9rem;
  color: var(--white);
  opacity: 0.7;
}

.playoff-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.btn-simulate,
.btn-view {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-simulate {
  background: var(--fifa-blue);
  color: var(--white);
}

.btn-simulate:hover:not(:disabled) {
  background: var(--fifa-dark-blue);
}

.btn-simulate:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-view {
  background: rgba(255, 255, 255, 0.1);
  color: var(--white);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-view:hover {
  background: rgba(255, 255, 255, 0.2);
}

@media (max-width: 768px) {
  .confederation-header h3 {
    font-size: 1.25rem;
  }
  
  .groups-grid {
    grid-template-columns: 1fr;
  }
  
  .qualified-grid {
    grid-template-columns: 1fr;
  }
}
</style>