<template>
  <div class="group-matches">
    <div class="matches-header">
      <h3>Group Stage Matches</h3>
      <div class="matches-actions">
        <button 
          v-if="!readOnly"
          @click="generateMatches" 
          :disabled="loading || matches.length > 0"
          class="btn-primary"
        >
          <i v-if="loading" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-calendar"></i>
          {{ matches.length > 0 ? 'Matches Generated' : 'Generate Matches' }}
        </button>
        <button 
          v-if="matches.length > 0 && !readOnly"
          @click="simulateAllMatches" 
          :disabled="loading || allMatchesCompleted"
          class="btn-secondary"
        >
          <i v-if="loading" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-play"></i>
          {{ allMatchesCompleted ? 'All Matches Completed' : 'Simulate All Matches' }}
        </button>
        <span v-if="readOnly && matches.length > 0" class="read-only-badge">
          <i class="fas fa-eye"></i>
          View Only
        </span>
      </div>
    </div>

    <div v-if="matches.length > 0" class="matches-container">
      <div class="matchday-tabs">
        <button 
          v-for="day in 3" 
          :key="day"
          @click="activeMatchday = day"
          :class="{ active: activeMatchday === day }"
          class="matchday-tab"
        >
          Matchday {{ day }}
          <span class="matchday-status">
            {{ getMatchdayStatus(day) }}
          </span>
        </button>
      </div>

      <div class="matchday-content">
        <div class="matchday-actions">
          <button 
            v-if="!readOnly"
            @click="simulateMatchday(activeMatchday)"
            :disabled="loading || isMatchdayCompleted(activeMatchday)"
            class="btn-primary simulate-matchday-btn"
          >
            <i v-if="loading" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-play"></i>
            {{ isMatchdayCompleted(activeMatchday) ? 'Matchday Completed' : `Simulate Matchday ${activeMatchday}` }}
          </button>
        </div>

        <div class="matches-grid">
          <div 
            v-for="match in getMatchesByMatchday(activeMatchday)" 
            :key="match._id"
            class="match-card"
            :class="{ 'match-completed': match.status === 'completed' }"
          >
            <div class="match-header">
              <span class="group-label">Group {{ match.group.groupLetter }}</span>
              <span class="match-status">
                {{ match.status === 'completed' ? 'Completed' : 'Scheduled' }}
              </span>
            </div>
            
            <div class="match-teams">
              <div class="team home-team">
                <div class="team-info">
                  <CountryFlag 
                    :country-code="match.homeTeam.countryCode || match.homeTeam.code" 
                    :size="24" 
                  />
                  <div 
                    class="team-position" 
                    :class="{
                      'advancing': isAdvancingPosition(getTeamPosition(match.homeTeam._id, match.group._id)),
                      'non-advancing': !isAdvancingPosition(getTeamPosition(match.homeTeam._id, match.group._id))
                    }"
                    v-if="getTeamPosition(match.homeTeam._id, match.group._id)"
                  >
                    {{ getTeamPosition(match.homeTeam._id, match.group._id) }}
                  </div>
                </div>
                <router-link 
                  :to="`/tournament/${tournament._id}/team/${match.homeTeam._id}`"
                  class="team-name clickable-team"
                >
                  {{ match.homeTeam.countryName }}
                </router-link>
              </div>
              
              <div class="match-score">
                <div class="score-display">
                  <span class="home-score">{{ match.homeScore ?? '-' }}</span>
                  <span class="score-separator">:</span>
                  <span class="away-score">{{ match.awayScore ?? '-' }}</span>
                </div>
                <div class="match-actions">
                  <button 
                    v-if="match.status === 'scheduled' && !readOnly"
                    @click="simulateMatch(match._id)"
                    :disabled="loading"
                    class="btn-small simulate-btn"
                  >
                    <i class="fas fa-play"></i>
                  </button>
                  <button 
                    @click="showMatchDetail(match)"
                    class="btn-small detail-btn"
                  >
                    <i class="fas fa-eye"></i>
                  </button>
                </div>
              </div>
              
              <div class="team away-team">
                <div class="team-info">
                  <CountryFlag 
                    :country-code="match.awayTeam.countryCode || match.awayTeam.code" 
                    :size="24" 
                  />
                  <div 
                    class="team-position" 
                    :class="{
                      'advancing': isAdvancingPosition(getTeamPosition(match.awayTeam._id, match.group._id)),
                      'non-advancing': !isAdvancingPosition(getTeamPosition(match.awayTeam._id, match.group._id))
                    }"
                    v-if="getTeamPosition(match.awayTeam._id, match.group._id)"
                  >
                    {{ getTeamPosition(match.awayTeam._id, match.group._id) }}
                  </div>
                </div>
                <router-link 
                  :to="`/tournament/${tournament._id}/team/${match.awayTeam._id}`"
                  class="team-name clickable-team"
                >
                  {{ match.awayTeam.countryName }}
                </router-link>
              </div>
            </div>
            
            <!-- Match Venue -->
            <div v-if="match.city" class="match-venue">
              <i class="fas fa-map-marker-alt"></i>
              <span>{{ match.city }}</span>
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
import { API_URL } from '../config/api.js'

export default {
  name: 'GroupMatches',
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
      matches: [],
      activeMatchday: 1,
      loading: false,
      error: '',
      groupStandings: {}
    }
  },
  computed: {
    allMatchesCompleted() {
      return this.matches.length > 0 && this.matches.every(match => match.status === 'completed')
    },
    
    firstUnfinishedMatchday() {
      for (let matchday = 1; matchday <= 3; matchday++) {
        if (!this.isMatchdayCompleted(matchday)) {
          return matchday
        }
      }
      return 1 // Default to 1 if all are completed
    }
  },
  mounted() {
    this.loadMatches()
  },
  methods: {
    async loadMatches() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/matches/${this.tournament._id}/matches`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          this.matches = await response.json()
          // Set active matchday to first unfinished one
          this.activeMatchday = this.firstUnfinishedMatchday
          // Load standings for position indicators
          await this.loadStandings()
        }
      } catch (error) {
        console.error('Error loading matches:', error)
      }
    },

    showMatchDetail(match) {
      // Navigate to match detail page
      this.$router.push(`/tournament/${this.tournament._id}/match/${match._id}`)
    },

    async generateMatches() {
      this.loading = true
      this.error = ''

      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/matches/${this.tournament._id}/generate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        const data = await response.json()

        if (response.ok) {
          await this.loadMatches()
          this.$emit('matches-generated')
        } else {
          this.error = data.error || 'Failed to generate matches'
        }
      } catch (error) {
        this.error = 'Network error. Please try again.'
      } finally {
        this.loading = false
      }
    },

    async simulateMatch(matchId) {
      this.loading = true
      this.error = ''

      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/matches/${this.tournament._id}/simulate/match/${matchId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        const data = await response.json()

        if (response.ok) {
          // Preserve current matchday when simulating individual matches
          const currentMatchday = this.activeMatchday
          await this.loadMatches()
          this.activeMatchday = currentMatchday
          this.$emit('match-simulated')
        } else {
          this.error = data.error || 'Failed to simulate match'
        }
      } catch (error) {
        this.error = 'Network error. Please try again.'
      } finally {
        this.loading = false
      }
    },

    async simulateMatchday(matchday) {
      this.loading = true
      this.error = ''

      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/matches/${this.tournament._id}/simulate/matchday/${matchday}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        const data = await response.json()

        if (response.ok) {
          await this.loadMatches()
          this.$emit('matchday-simulated')
        } else {
          this.error = data.error || 'Failed to simulate matchday'
        }
      } catch (error) {
        this.error = 'Network error. Please try again.'
      } finally {
        this.loading = false
      }
    },

    async simulateAllMatches() {
      for (let matchday = 1; matchday <= 3; matchday++) {
        if (!this.isMatchdayCompleted(matchday)) {
          await this.simulateMatchday(matchday)
        }
      }
    },

    getMatchesByMatchday(matchday) {
      return this.matches
        .filter(match => match.matchday === matchday)
        .sort((a, b) => {
          // First sort by group letter
          const groupCompare = a.group.groupLetter.localeCompare(b.group.groupLetter)
          if (groupCompare !== 0) return groupCompare
          
          // Then sort by match ID to ensure stable sort order
          return a._id.localeCompare(b._id)
        })
    },

    getMatchdayStatus(matchday) {
      const matchdayMatches = this.getMatchesByMatchday(matchday)
      const completedMatches = matchdayMatches.filter(match => match.status === 'completed')
      return `${completedMatches.length}/${matchdayMatches.length}`
    },

    isMatchdayCompleted(matchday) {
      const matchdayMatches = this.getMatchesByMatchday(matchday)
      return matchdayMatches.length > 0 && matchdayMatches.every(match => match.status === 'completed')
    },

    async loadStandings() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/matches/${this.tournament._id}/standings`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const allStandings = await response.json()
          
          // Organize standings by group
          this.groupStandings = {}
          allStandings.forEach(standing => {
            const groupId = standing.group._id
            if (!this.groupStandings[groupId]) {
              this.groupStandings[groupId] = []
            }
            this.groupStandings[groupId].push({
              teamId: standing.team._id,
              position: this.groupStandings[groupId].length + 1,
              points: standing.points || 0,
              played: standing.played || 0
            })
          })
          
          // Sort each group by points (descending), then by other criteria if needed
          Object.keys(this.groupStandings).forEach(groupId => {
            this.groupStandings[groupId].sort((a, b) => b.points - a.points)
            // Update positions after sorting
            this.groupStandings[groupId].forEach((team, index) => {
              team.position = index + 1
            })
          })
        }
      } catch (error) {
        console.error('Error loading standings:', error)
      }
    },
    
    getTeamPosition(teamId, groupId) {
      if (!this.groupStandings[groupId]) return null
      const team = this.groupStandings[groupId].find(t => t.teamId === teamId)
      return team ? team.position : null
    },
    
    isAdvancingPosition(position) {
      // In tournament groups, top 2 positions advance (green), others are blue
      return position <= 2
    }

  },
  beforeUnmount() {
    // Component cleanup
  }
}
</script>

<style scoped>
.group-matches {
  width: 100%;
}

.matches-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(0, 102, 204, 0.1);
}

.matches-header h3 {
  font-size: 1.5rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
  margin: 0;
}

.matches-actions {
  display: flex;
  gap: 16px;
  align-items: center;
}

.read-only-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(0, 123, 255, 0.1);
  color: #007bff;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: var(--font-weight-semibold);
}

.matchday-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 2px solid rgba(0, 102, 204, 0.1);
}

.matchday-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 24px;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: var(--font-weight-semibold);
  color: var(--gray);
  transition: all 0.3s ease;
  border-bottom: 2px solid transparent;
}

.matchday-tab.active {
  color: var(--fifa-blue);
  border-bottom-color: var(--fifa-blue);
}

.matchday-tab:hover {
  color: var(--fifa-blue);
}

.matchday-status {
  font-size: 0.8rem;
  color: var(--gray);
}

.matchday-actions {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.simulate-matchday-btn {
  background: var(--fifa-green);
}

.simulate-matchday-btn:hover:not(:disabled) {
  background: #00aa44;
}

.matches-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.match-card {
  background: var(--white);
  border: 1px solid rgba(0, 102, 204, 0.1);
  border-radius: var(--radius-md);
  padding: 12px;
  transition: all 0.3s ease;
}

.match-card:hover {
  border-color: rgba(0, 102, 204, 0.3);
  transform: translateY(-2px);
}

.match-card.match-completed {
  border-color: var(--fifa-green);
  background: rgba(0, 170, 68, 0.05);
}

.match-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.group-label {
  font-weight: var(--font-weight-bold);
  color: var(--fifa-blue);
  background: rgba(0, 102, 204, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
}

.match-status {
  font-size: 0.7rem;
  color: var(--gray);
}

.match-venue {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(0, 102, 204, 0.1);
  color: var(--gray);
  font-size: 0.75rem;
}

.match-venue i {
  color: var(--fifa-blue);
  font-size: 0.7rem;
}

.match-teams {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0;
}

.team {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.team-info {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.team-position {
  position: absolute;
  top: -8px;
  right: -8px;
  color: var(--white);
  font-size: 0.6rem;
  font-weight: var(--font-weight-bold);
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--white);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  z-index: 2;
}

.team-position.advancing {
  background: #00AA44; /* Green for advancing positions */
}

.team-position.non-advancing {
  background: var(--fifa-blue); /* Blue for non-advancing positions */
}

.team-flag {
  font-size: 1.5rem;
}

.team-name {
  font-weight: var(--font-weight-semibold);
  color: var(--fifa-dark-blue);
  text-align: center;
  font-size: 0.75rem;
}

.clickable-team {
  text-decoration: none;
  color: var(--fifa-dark-blue);
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 4px 8px;
  border-radius: 4px;
  display: block;
}

.clickable-team:hover {
  color: var(--fifa-blue);
  text-decoration: underline;
  background-color: rgba(0, 102, 204, 0.1);
  transform: translateY(-1px);
}

.match-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin: 0 12px;
}

.match-actions {
  display: flex;
  gap: 4px;
  align-items: center;
}

.score-display {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 1.2rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
}

.score-separator {
  color: var(--gray);
}

.simulate-btn {
  background: var(--fifa-blue);
  color: var(--white);
  border: none;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.7rem;
  transition: all 0.3s ease;
}

.simulate-btn:hover:not(:disabled) {
  background: #0056b3;
}

.simulate-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.detail-btn {
  background: var(--fifa-green);
  color: var(--white);
  border: none;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.7rem;
  transition: all 0.3s ease;
}

.detail-btn:hover {
  background: #00aa44;
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
  .matches-header {
    flex-direction: column;
    gap: 16px;
  }

  .matches-actions {
    flex-direction: column;
  }

  .matches-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .match-card {
    padding: 10px;
  }

  .team-flag {
    font-size: 1.2rem;
  }

  .team-name {
    font-size: 0.7rem;
  }

  .score-display {
    font-size: 1rem;
  }

  .match-score {
    margin: 0 8px;
  }

  /* Remove venue/place from group matches on mobile */
  .match-venue {
    display: none;
  }

  /* Make flags bigger in group matches on mobile */
  .team .country-flag {
    font-size: 1.8rem !important;
  }

  /* Make buttons bigger in group matches on mobile */
  .btn-small {
    padding: 8px 12px !important;
    font-size: 0.9rem !important;
    min-width: 40px;
    height: 36px;
  }

  .btn-small i {
    font-size: 1rem;
  }
}
</style>