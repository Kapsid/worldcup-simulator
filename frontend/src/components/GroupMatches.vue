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
                <div class="team-flag">{{ match.homeTeam.countryFlag }}</div>
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
                <button 
                  v-if="match.status === 'scheduled' && !readOnly"
                  @click="simulateMatch(match._id)"
                  :disabled="loading"
                  class="btn-small simulate-btn"
                >
                  <i class="fas fa-play"></i>
                </button>
              </div>
              
              <div class="team away-team">
                <div class="team-flag">{{ match.awayTeam.countryFlag }}</div>
                <router-link 
                  :to="`/tournament/${tournament._id}/team/${match.awayTeam._id}`"
                  class="team-name clickable-team"
                >
                  {{ match.awayTeam.countryName }}
                </router-link>
              </div>
            </div>
            
            <div v-if="match.status === 'completed'" class="match-result">
              <span class="result-text">
                {{ getMatchResult(match) }}
              </span>
              <span class="simulated-time">
                {{ formatTime(match.simulatedAt) }}
              </span>
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
  name: 'GroupMatches',
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
      error: ''
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
        const response = await fetch(`http://localhost:3001/api/matches/${this.tournament._id}/matches`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          this.matches = await response.json()
          // Set active matchday to first unfinished one
          this.activeMatchday = this.firstUnfinishedMatchday
        }
      } catch (error) {
        console.error('Error loading matches:', error)
      }
    },

    async generateMatches() {
      this.loading = true
      this.error = ''

      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/matches/${this.tournament._id}/generate`, {
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
        const response = await fetch(`http://localhost:3001/api/matches/${this.tournament._id}/simulate/match/${matchId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        const data = await response.json()

        if (response.ok) {
          await this.loadMatches()
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
        const response = await fetch(`http://localhost:3001/api/matches/${this.tournament._id}/simulate/matchday/${matchday}`, {
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
        .sort((a, b) => a.group.groupLetter.localeCompare(b.group.groupLetter))
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

    getMatchResult(match) {
      if (match.homeScore > match.awayScore) {
        return `${match.homeTeam.countryName} wins`
      } else if (match.homeScore < match.awayScore) {
        return `${match.awayTeam.countryName} wins`
      } else {
        return 'Draw'
      }
    },

    formatTime(dateString) {
      return new Date(dateString).toLocaleTimeString()
    }
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
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.match-card {
  background: var(--white);
  border: 1px solid rgba(0, 102, 204, 0.1);
  border-radius: var(--radius-lg);
  padding: 20px;
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
  margin-bottom: 16px;
}

.group-label {
  font-weight: var(--font-weight-bold);
  color: var(--fifa-blue);
  background: rgba(0, 102, 204, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
}

.match-status {
  font-size: 0.8rem;
  color: var(--gray);
}

.match-teams {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.team {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.team-flag {
  font-size: 2rem;
}

.team-name {
  font-weight: var(--font-weight-semibold);
  color: var(--fifa-dark-blue);
  text-align: center;
  font-size: 0.9rem;
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
  gap: 8px;
  margin: 0 20px;
}

.score-display {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.5rem;
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
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.3s ease;
}

.simulate-btn:hover:not(:disabled) {
  background: #0056b3;
}

.simulate-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.match-result {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.result-text {
  font-weight: var(--font-weight-semibold);
  color: var(--fifa-green);
}

.simulated-time {
  font-size: 0.8rem;
  color: var(--gray);
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
  }

  .match-teams {
    flex-direction: column;
    gap: 16px;
  }

  .match-score {
    margin: 0;
  }
}
</style>