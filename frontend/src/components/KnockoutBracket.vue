<template>
  <div class="knockout-bracket">
    <div class="bracket-header">
      <div class="header-title">
        <h3>Knockout Stage</h3>
        <div v-if="readOnly" class="read-only-badge">
          <i class="fas fa-eye"></i>
          View Only
        </div>
      </div>
      <div class="bracket-actions">
        <div v-if="!readOnly" class="simulation-actions">
          <button 
            @click="generateBracket" 
            :disabled="loading || bracket.matches"
            class="btn-primary"
          >
            <i v-if="loading" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-trophy"></i>
            {{ bracket.matches ? 'Bracket Generated' : 'Generate Knockout Bracket' }}
          </button>
          <button 
            v-if="bracket.matches"
            @click="simulateAllRounds" 
            :disabled="loading || tournamentCompleted"
            class="btn-secondary"
          >
            <i v-if="loading" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-fast-forward"></i>
            {{ tournamentCompleted ? 'Tournament Completed' : 'Simulate All Rounds' }}
          </button>
        </div>
        <button 
          v-if="bracket.matches && !showBracketView"
          @click="toggleBracketView" 
          class="btn-secondary"
        >
          <i class="fas fa-sitemap"></i>
          View Full Bracket
        </button>
      </div>
    </div>

    <div v-if="bracket.matches" class="bracket-container">
      <!-- Bracket Visualization -->
      <BracketVisualization 
        v-if="showBracketView"
        :bracket="bracket"
        :showBracketView="showBracketView"
        @toggle-view="toggleBracketView"
      />
      
      <!-- Round by Round View -->
      <div v-else class="rounds-view">
        
        <div class="rounds-navigation">
          <button 
            v-for="round in bracket.rounds" 
            :key="round._id"
            @click="activeRound = round.round"
            :class="{ active: activeRound === round.round }"
            class="round-tab"
          >
            {{ round.name }}
            <span class="round-status">
              {{ round.completedMatches }}/{{ round.matchCount }}
            </span>
          </button>
        </div>

        <div class="round-content">
          <div class="round-actions" v-if="!readOnly">
            <button 
              @click="simulateRound(activeRound)"
              :disabled="loading || isRoundCompleted(activeRound)"
              class="btn-primary simulate-round-btn"
            >
              <i v-if="loading" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-play"></i>
              {{ isRoundCompleted(activeRound) ? 'Round Completed' : `Simulate ${getRoundName(activeRound)}` }}
            </button>
          </div>

          <div class="matches-container">
            <div 
              v-for="match in getRoundMatches(activeRound)" 
              :key="match._id"
              class="knockout-match"
              :class="{ 'match-completed': match.status === 'completed' }"
            >
              <div class="match-header">
                <span class="match-label">{{ getMatchLabel(match) }}</span>
                <span class="match-city" v-if="match.city">
                  <i class="fas fa-map-marker-alt"></i>
                  {{ match.city }}
                </span>
              </div>
              
              <div class="match-teams">
                <div class="team" :class="{ winner: match.winner && match.winner._id === match.homeTeam?._id }">
                  <div class="team-info">
                    <CountryFlag :country-code="match.homeTeam?.countryCode || match.homeTeam?.code" :size="24" />
                    <router-link 
                      v-if="match.homeTeam"
                      :to="`/tournament/${tournament._id}/team/${match.homeTeam._id}`"
                      class="team-name clickable-team"
                    >
                      {{ match.homeTeam.countryName }}
                    </router-link>
                    <span v-else class="team-name">TBD</span>
                  </div>
                  <div class="team-score">
                    <span class="regular-score">{{ match.homeScore ?? '-' }}</span>
                    <span v-if="match.homeExtraTimeScore !== null" class="extra-score">
                      ({{ match.homeExtraTimeScore }})
                    </span>
                    <span v-if="match.homePenaltyScore !== null" class="penalty-score">
                      [{{ match.homePenaltyScore }}]
                    </span>
                  </div>
                </div>
                
                <div class="vs-divider">
                  <span class="vs-text">VS</span>
                  <div class="match-actions">
                    <button 
                      v-if="match.status === 'ready' && !readOnly"
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
                
                <div class="team" :class="{ winner: match.winner && match.winner._id === match.awayTeam?._id }">
                  <div class="team-info">
                    <CountryFlag :country-code="match.awayTeam?.countryCode || match.awayTeam?.code" :size="24" />
                    <router-link 
                      v-if="match.awayTeam"
                      :to="`/tournament/${tournament._id}/team/${match.awayTeam._id}`"
                      class="team-name clickable-team"
                    >
                      {{ match.awayTeam.countryName }}
                    </router-link>
                    <span v-else class="team-name">TBD</span>
                  </div>
                  <div class="team-score">
                    <span class="regular-score">{{ match.awayScore ?? '-' }}</span>
                    <span v-if="match.awayExtraTimeScore !== null" class="extra-score">
                      ({{ match.awayExtraTimeScore }})
                    </span>
                    <span v-if="match.awayPenaltyScore !== null" class="penalty-score">
                      [{{ match.awayPenaltyScore }}]
                    </span>
                  </div>
                </div>
              </div>
              
              <div v-if="match.status === 'completed'" class="match-result">
                <span class="result-text">
                  {{ getMatchResultText(match) }}
                </span>
                <span class="decided-by">
                  {{ getDecidedByText(match.decidedBy) }}
                </span>
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
    </div>

    <!-- Final Results -->
    <div v-if="tournamentCompleted" class="final-results">
      <div class="champions-podium">
        <h2>🏆 Tournament Results</h2>
        
        <div class="podium">
          <div class="podium-position second">
            <div class="position-number">2</div>
            <div class="team-card">
              <CountryFlag :country-code="finalResults.runnerUp?.countryCode || finalResults.runnerUp?.code" :size="32" />
              <router-link 
                v-if="finalResults.runnerUp"
                :to="`/tournament/${tournament._id}/team/${finalResults.runnerUp._id}`"
                class="team-name clickable-team"
              >
                {{ finalResults.runnerUp.countryName }}
              </router-link>
              <span v-else class="team-name">TBD</span>
              <div class="medal">🥈</div>
            </div>
          </div>
          
          <div class="podium-position first">
            <div class="position-number">1</div>
            <div class="team-card champion">
              <CountryFlag :country-code="finalResults.champion?.countryCode || finalResults.champion?.code" :size="32" />
              <router-link 
                v-if="finalResults.champion"
                :to="`/tournament/${tournament._id}/team/${finalResults.champion._id}`"
                class="team-name clickable-team"
              >
                {{ finalResults.champion.countryName }}
              </router-link>
              <span v-else class="team-name">TBD</span>
              <div class="trophy">🏆</div>
            </div>
          </div>
          
          <div class="podium-position third">
            <div class="position-number">3</div>
            <div class="team-card">
              <CountryFlag :country-code="finalResults.thirdPlace?.countryCode || finalResults.thirdPlace?.code" :size="32" />
              <router-link 
                v-if="finalResults.thirdPlace"
                :to="`/tournament/${tournament._id}/team/${finalResults.thirdPlace._id}`"
                class="team-name clickable-team"
              >
                {{ finalResults.thirdPlace.countryName }}
              </router-link>
              <span v-else class="team-name">TBD</span>
              <div class="medal">🥉</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Final match completed - waiting to show results -->
    <div v-if="waitingForFinalResults" class="final-match-celebration">
      <div class="celebration-content">
        <div class="celebration-icon">
          <i class="fas fa-trophy"></i>
        </div>
        <h3>🏆 Tournament Complete! 🏆</h3>
        <p>Preparing champion celebration...</p>
        <div class="countdown-dots">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      </div>
    </div>

    <p v-if="error" class="error-message">{{ error }}</p>
  </div>
</template>

<script>
import BracketVisualization from './BracketVisualization.vue'
import CountryFlag from './CountryFlag.vue'
import { API_URL } from '../config/api.js'

export default {
  name: 'KnockoutBracket',
  components: {
    BracketVisualization,
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
      bracket: {
        rounds: [],
        matches: null
      },
      finalResults: {
        champion: null,
        runnerUp: null,
        thirdPlace: null,
        fourthPlace: null
      },
      activeRound: 'round16',
      loading: false,
      error: '',
      tournamentCompleted: false,
      showBracketView: false,
      waitingForFinalResults: false
    }
  },
  mounted() {
    this.loadBracket()
    this.checkGroupStageCompletion()
  },
  methods: {
    async loadBracket() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/knockout/${this.tournament._id}/bracket`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          this.bracket = await response.json()
          this.activeRound = this.getFirstIncompleteRound()
          
          console.log('Tournament status:', this.tournament.status)
          if (this.tournament.status === 'completed') {
            this.tournamentCompleted = true
            console.log('Tournament completed, loading final results...')
            await this.loadFinalResults()
            console.log('Final results loaded:', this.finalResults)
            console.log('tournamentCompleted flag:', this.tournamentCompleted)
          }
        }
      } catch (error) {
        console.error('Error loading bracket:', error)
      }
    },

    async loadFinalResults() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/knockout/${this.tournament._id}/results`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          this.finalResults = await response.json()
        }
      } catch (error) {
        console.error('Error loading final results:', error)
      }
    },

    async generateBracket() {
      this.loading = true
      this.error = ''

      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/knockout/${this.tournament._id}/generate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        const data = await response.json()

        if (response.ok) {
          await this.loadBracket()
          this.$emit('bracket-generated')
        } else {
          this.error = data.error || 'Failed to generate bracket'
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
        const response = await fetch(`${API_URL}/knockout/${this.tournament._id}/simulate/match/${matchId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        const data = await response.json()

        if (response.ok) {
          // Preserve current round when simulating individual matches
          const currentRound = this.activeRound
          await this.loadBracket()
          this.activeRound = currentRound
          
          if (this.tournament.status === 'completed') {
            // Tournament just completed! Give user time to see the final match result
            console.log('🏆 Tournament completed! Showing final match result before celebration...')
            this.waitingForFinalResults = true
            
            // Wait 4 seconds to let user appreciate the final match result
            setTimeout(async () => {
              this.waitingForFinalResults = false
              this.tournamentCompleted = true
              await this.loadFinalResults()
            }, 4000)
          }
        } else {
          this.error = data.error || 'Failed to simulate match'
        }
      } catch (error) {
        this.error = 'Network error. Please try again.'
      } finally {
        this.loading = false
      }
    },

    async simulateRound(round) {
      this.loading = true
      this.error = ''

      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/knockout/${this.tournament._id}/simulate/round/${round}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        const data = await response.json()

        if (response.ok) {
          await this.loadBracket()
          this.$emit('round-simulated')
          
          if (this.tournament.status === 'completed') {
            this.tournamentCompleted = true
            await this.loadFinalResults()
          }
        } else {
          this.error = data.error || 'Failed to simulate round'
        }
      } catch (error) {
        this.error = 'Network error. Please try again.'
      } finally {
        this.loading = false
      }
    },

    async simulateAllRounds() {
      const rounds = ['round16', 'quarterfinal', 'semifinal', 'third_place', 'final']
      
      for (const round of rounds) {
        if (!this.isRoundCompleted(round)) {
          await this.simulateRound(round)
        }
      }
    },

    getRoundMatches(round) {
      return this.bracket.matches?.[round] || []
    },

    getRoundName(round) {
      const roundObj = this.bracket.rounds.find(r => r.round === round)
      return roundObj ? roundObj.name : round
    },

    getFirstIncompleteRound() {
      const rounds = ['round16', 'quarterfinal', 'semifinal', 'third_place', 'final']
      
      for (const round of rounds) {
        if (!this.isRoundCompleted(round)) {
          return round
        }
      }
      
      return 'round16'
    },

    isRoundCompleted(round) {
      const roundObj = this.bracket.rounds.find(r => r.round === round)
      return roundObj ? roundObj.completedMatches === roundObj.matchCount : false
    },

    getMatchLabel(match) {
      const labels = {
        'round16': `Round of 16 - Match ${match.matchPosition}`,
        'quarterfinal': `Quarter-final ${match.matchPosition}`,
        'semifinal': `Semi-final ${match.matchPosition}`,
        'final': 'Final',
        'third_place': 'Third Place Play-off'
      }
      return labels[match.round] || match.round
    },

    getMatchResultText(match) {
      if (match.winner && match.homeTeam && match.awayTeam) {
        const winnerName = match.winner._id === match.homeTeam._id 
          ? match.homeTeam.countryName 
          : match.awayTeam.countryName
        return `${winnerName} wins`
      }
      return 'Match completed'
    },

    getDecidedByText(decidedBy) {
      const texts = {
        'regular': 'Regular Time',
        'extra_time': 'Extra Time',
        'penalties': 'Penalties'
      }
      return texts[decidedBy] || ''
    },

    async checkGroupStageCompletion() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/matches/${this.tournament._id}/matches`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const matches = await response.json()
          const completedMatches = matches.filter(match => match.status === 'completed')
          
          // If all group matches are completed but no knockout bracket exists, auto-generate it
          if (matches.length === 48 && completedMatches.length === 48 && (!this.bracket.matches || Object.keys(this.bracket.matches).length === 0)) {
            console.log('All group matches completed, auto-generating knockout bracket...')
            this.loading = true
            this.error = 'All group matches completed! Generating knockout bracket...'
            await this.generateBracket()
            this.error = ''
            this.loading = false
          }
        }
      } catch (error) {
        console.error('Error checking group stage completion:', error)
      }
    },


    toggleBracketView() {
      this.showBracketView = !this.showBracketView
    },

    showMatchDetail(match) {
      // Navigate to match detail page
      this.$router.push(`/tournament/${this.tournament._id}/match/${match._id}`)
    }
  }
}
</script>

<style scoped>
.knockout-bracket {
  width: 100%;
}

.bracket-header {
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

.bracket-header h3 {
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

.bracket-actions {
  display: flex;
  gap: 16px;
  align-items: center;
}

.simulation-actions {
  display: flex;
  gap: 16px;
}

.view-toggle {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.view-toggle button {
  background: var(--fifa-blue);
  color: var(--white);
  border: none;
  padding: 12px 20px;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: var(--font-weight-semibold);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.view-toggle button:hover {
  background: #0056b3;
}

.rounds-navigation {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 2px solid rgba(0, 102, 204, 0.1);
  overflow-x: auto;
}

.round-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 20px;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: var(--font-weight-semibold);
  color: var(--gray);
  transition: all 0.3s ease;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
}

.round-tab.active {
  color: var(--fifa-blue);
  border-bottom-color: var(--fifa-blue);
}

.round-tab:hover {
  color: var(--fifa-blue);
}

.round-status {
  font-size: 0.8rem;
  color: var(--gray);
}

.round-actions {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.simulate-round-btn {
  background: var(--fifa-green);
}

.simulate-round-btn:hover:not(:disabled) {
  background: #00aa44;
}

.btn-warning {
  background: #ff8800;
  color: var(--white);
  border: none;
  padding: 12px 20px;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: var(--font-weight-semibold);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-warning:hover:not(:disabled) {
  background: #e67600;
}

.btn-warning:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.matches-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 16px;
}

.knockout-match {
  background: var(--white);
  border: 1px solid rgba(0, 102, 204, 0.1);
  border-radius: var(--radius-md);
  padding: 16px;
  transition: all 0.3s ease;
}

.knockout-match:hover {
  border-color: rgba(0, 102, 204, 0.3);
  transform: translateY(-2px);
}

.knockout-match.match-completed {
  border-color: var(--fifa-green);
  background: rgba(0, 170, 68, 0.05);
}

.match-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.match-label {
  font-weight: var(--font-weight-bold);
  color: var(--fifa-blue);
  font-size: 0.9rem;
}

.match-city {
  font-size: 0.7rem;
  color: var(--fifa-blue);
  font-weight: var(--font-weight-semibold);
  display: flex;
  align-items: center;
  gap: 4px;
}

.match-city i {
  font-size: 0.6rem;
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
  gap: 4px;
  flex: 1;
  padding: 8px;
  border-radius: var(--radius-sm);
  transition: all 0.3s ease;
}

.team.winner {
  background: rgba(0, 170, 68, 0.1);
  border: 2px solid var(--fifa-green);
}

.team-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.team-flag {
  font-size: 1.5rem;
}

.team-name {
  font-weight: var(--font-weight-semibold);
  color: var(--fifa-dark-blue);
  text-align: center;
  font-size: 0.85rem;
}

.clickable-team {
  text-decoration: none;
  color: var(--fifa-dark-blue);
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
}

.clickable-team:hover {
  color: var(--fifa-blue);
  text-decoration: underline;
  background-color: rgba(0, 102, 204, 0.1);
  transform: translateY(-1px);
}

.team-score {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 1rem;
  font-weight: var(--font-weight-bold);
}

.regular-score {
  color: var(--fifa-dark-blue);
}

.extra-score {
  color: var(--fifa-blue);
  font-size: 1rem;
}

.penalty-score {
  color: var(--fifa-red);
  font-size: 1rem;
}

.vs-divider {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin: 0 8px;
}

.vs-text {
  font-weight: var(--font-weight-bold);
  color: var(--gray);
  font-size: 0.9rem;
}

.match-actions {
  display: flex;
  gap: 4px;
  align-items: center;
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

.match-result {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.result-text {
  font-weight: var(--font-weight-bold);
  color: var(--fifa-green);
}

.match-venue {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 102, 204, 0.1);
  color: var(--gray);
  font-size: 0.8rem;
}

.match-venue i {
  color: var(--fifa-blue);
  font-size: 0.75rem;
}

.decided-by {
  font-size: 0.8rem;
  color: var(--gray);
  font-style: italic;
}

.final-results {
  margin-top: 40px;
  padding: 40px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 215, 0, 0.05));
  border-radius: var(--radius-xl);
  text-align: center;
}

.champions-podium h2 {
  color: var(--fifa-dark-blue);
  margin-bottom: 40px;
  font-size: 2.5rem;
}

.podium {
  display: flex;
  justify-content: center;
  align-items: end;
  gap: 20px;
  margin-bottom: 40px;
}

.podium-position {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.podium-position.first {
  order: 2;
}

.podium-position.second {
  order: 1;
}

.podium-position.third {
  order: 3;
}

.position-number {
  font-size: 2rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-blue);
}

.team-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px;
  background: var(--white);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  min-width: 150px;
}

.team-card.champion {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1));
  border: 2px solid var(--fifa-gold);
  transform: scale(1.1);
}

.team-card .team-flag {
  font-size: 3rem;
}

.team-card .team-name {
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
  text-align: center;
}

.team-card .clickable-team {
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
  text-decoration: none;
  transition: all 0.3s ease;
  padding: 4px 8px;
  border-radius: 4px;
}

.team-card .clickable-team:hover {
  color: var(--fifa-blue);
  text-decoration: underline;
  background-color: rgba(0, 102, 204, 0.1);
}

.trophy {
  font-size: 2rem;
  animation: bounce 2s infinite;
}

.medal {
  font-size: 1.5rem;
}


@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
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
  .bracket-header {
    flex-direction: column;
    gap: 16px;
  }

  .bracket-actions {
    flex-direction: column;
  }

  .matches-container {
    grid-template-columns: 1fr;
  }

  .match-teams {
    flex-direction: column;
    gap: 16px;
  }

  .vs-divider {
    margin: 0;
  }

  .podium {
    flex-direction: column;
    align-items: center;
  }

  .podium-position {
    order: unset !important;
  }
}

/* Final match celebration overlay */
.final-match-celebration {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: celebrationFadeIn 0.5s ease-out;
}

.celebration-content {
  background: linear-gradient(135deg, #4caf50, #45a049);
  color: white;
  padding: 3rem;
  border-radius: var(--radius-lg);
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: celebrationScale 0.6s ease-out;
}

.celebration-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  color: #ffd700;
  animation: trophyRotate 2s ease-in-out infinite;
}

.celebration-content h3 {
  margin: 0 0 1rem 0;
  font-size: 2rem;
  font-weight: var(--font-weight-bold);
}

.celebration-content p {
  margin: 0 0 1.5rem 0;
  font-size: 1.2rem;
  opacity: 0.9;
}

.countdown-dots {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.countdown-dots .dot {
  width: 12px;
  height: 12px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 50%;
  animation: dotPulse 1.5s ease-in-out infinite;
}

.countdown-dots .dot:nth-child(2) {
  animation-delay: 0.5s;
}

.countdown-dots .dot:nth-child(3) {
  animation-delay: 1s;
}

@keyframes celebrationFadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes celebrationScale {
  0% { 
    opacity: 0;
    transform: scale(0.8) translateY(50px);
  }
  100% { 
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes trophyRotate {
  0%, 100% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(-10deg) scale(1.1); }
}

@keyframes dotPulse {
  0%, 100% { 
    opacity: 0.7;
    transform: scale(1);
  }
  50% { 
    opacity: 1;
    transform: scale(1.3);
  }
}
</style>