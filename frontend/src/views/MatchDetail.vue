<template>
  <div class="match-detail-page">
    <AppHeader 
      :username="username" 
      :subscription-tier="subscriptionTier"
      @logout="handleLogout" 
    />
    
    <main class="main-content">
      <div class="match-detail-container">
        <div class="page-header">
          <button @click="goBack" class="back-btn">
            <i class="fas fa-arrow-left"></i>
            Back to Tournament
          </button>
          <h1>Match Details</h1>
        </div>

        <div v-if="loading" class="loading-state">
          <i class="fas fa-spinner fa-spin"></i>
          Loading match details...
        </div>

        <div v-else-if="match" class="match-content">
          <!-- Match Score Section -->
          <div class="match-score-section">
            <div class="team-info home-team">
              <div class="team-flag">{{ match.homeTeam.flag }}</div>
              <div class="team-name">{{ match.homeTeam.name }}</div>
            </div>
            
            <div class="score-display">
              <div class="score">
                <span class="home-score">{{ match.homeScore !== null ? match.homeScore : '-' }}</span>
                <span class="score-separator">:</span>
                <span class="away-score">{{ match.awayScore !== null ? match.awayScore : '-' }}</span>
              </div>
              <div class="extra-scores" v-if="match.homeExtraTimeScore !== null || match.homePenaltyScore !== null">
                <div v-if="match.homeExtraTimeScore !== null" class="extra-time-score">
                  Extra Time: {{ match.homeExtraTimeScore }} - {{ match.awayExtraTimeScore }}
                </div>
                <div v-if="match.homePenaltyScore !== null" class="penalty-score">
                  Penalties: {{ match.homePenaltyScore }} - {{ match.awayPenaltyScore }}
                </div>
              </div>
              <div class="match-status">
                <span v-if="!match.played" class="status-upcoming">Upcoming</span>
                <span v-else class="status-finished">Final</span>
              </div>
            </div>
            
            <div class="team-info away-team">
              <div class="team-flag">{{ match.awayTeam.flag }}</div>
              <div class="team-name">{{ match.awayTeam.name }}</div>
            </div>
          </div>

          <!-- Match Information -->
          <div class="match-info-section">
            <div class="info-item">
              <strong>Competition:</strong>
              <span v-if="match.isQualification && match.confederation">{{ match.confederation }} Qualification</span>
              <span v-else-if="match.groupId">{{ getGroupName(match.groupId) }}</span>
              <span v-else-if="match.round">{{ match.round }}</span>
              <span v-else>Tournament Match</span>
            </div>
            <div class="info-item" v-if="match.isQualification && match.groupId">
              <strong>Group:</strong>
              <span>{{ getGroupName(match.groupId) }}</span>
            </div>
            <div class="info-item" v-if="match.matchday">
              <strong>Matchday:</strong>
              <span>{{ match.matchday }}</span>
            </div>
            <div class="info-item" v-if="match.round && match.isQualification">
              <strong>Round:</strong>
              <span>{{ match.round }}</span>
            </div>
            <div class="info-item" v-if="match.date">
              <strong>Date:</strong>
              <span>{{ formatDate(match.date) }}</span>
            </div>
            <div class="info-item" v-if="match.decidedBy">
              <strong>Decided By:</strong>
              <span>{{ getDecidedByText(match.decidedBy) }}</span>
            </div>
            <div class="info-item" v-if="match.city">
              <strong>City:</strong>
              <span>{{ match.city }}</span>
            </div>
          </div>

          <!-- Match Statistics Placeholder -->
          <div class="match-stats-section">
            <h3>Match Statistics</h3>
            <div class="stats-placeholder">
              <div class="placeholder-content">
                <i class="fas fa-chart-bar"></i>
                <p>Match statistics will be displayed here</p>
                <p class="placeholder-subtext">Possession, shots, cards, etc.</p>
              </div>
            </div>
          </div>

          <!-- Match Commentary Placeholder -->
          <div class="match-commentary-section">
            <h3>Match Commentary</h3>
            <div class="commentary-placeholder">
              <div class="placeholder-content">
                <i class="fas fa-file-alt"></i>
                <p>Match commentary and highlights will be displayed here</p>
                <p class="placeholder-subtext">Key moments, goal descriptions, and match summary</p>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Match not found or could not be loaded</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import AppHeader from '../components/AppHeader.vue'

export default {
  name: 'MatchDetailPage',
  components: {
    AppHeader
  },
  data() {
    return {
      username: '',
      subscriptionTier: 'basic',
      match: null,
      loading: true,
      error: ''
    }
  },
  async mounted() {
    this.username = localStorage.getItem('username') || 'User'
    await this.loadUserProfile()
    await this.loadMatchDetails()
  },
  methods: {
    async loadMatchDetails() {
      try {
        const { tournamentId, matchId } = this.$route.params
        const token = localStorage.getItem('token')
        
        // Try to load from qualification matches first
        let response = await fetch(`http://localhost:3001/api/qualification/${tournamentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const qualificationData = await response.json()
          let qualMatch = null
          let confederation = null
          
          // Search through all confederations for the match
          if (qualificationData && qualificationData.confederations) {
            for (const confed of qualificationData.confederations) {
              if (confed.matches) {
                qualMatch = confed.matches.find(m => m.matchId === matchId)
                if (qualMatch) {
                  confederation = confed
                  break
                }
              }
            }
          }
          
          if (qualMatch) {
            this.match = {
              _id: qualMatch.matchId,
              homeTeam: {
                name: qualMatch.homeTeam.name,
                flag: qualMatch.homeTeam.flag
              },
              awayTeam: {
                name: qualMatch.awayTeam.name,
                flag: qualMatch.awayTeam.flag
              },
              homeScore: qualMatch.homeScore,
              awayScore: qualMatch.awayScore,
              played: qualMatch.played,
              date: qualMatch.date,
              matchday: qualMatch.matchday,
              round: qualMatch.round,
              groupId: qualMatch.groupId,
              confederation: confederation.name,
              isQualification: true
            }
            this.loading = false
            return
          }
        }
        
        // Try to load from group stage matches
        response = await fetch(`http://localhost:3001/api/matches/${tournamentId}/matches`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const matches = await response.json()
          const groupMatch = matches.find(m => m._id === matchId)
          
          if (groupMatch) {
            this.match = {
              ...groupMatch,
              homeTeam: {
                name: groupMatch.homeTeam.countryName,
                flag: groupMatch.homeTeam.countryFlag
              },
              awayTeam: {
                name: groupMatch.awayTeam.countryName,
                flag: groupMatch.awayTeam.countryFlag
              },
              groupId: `group_${groupMatch.group.groupLetter}`,
              played: groupMatch.status === 'completed'
            }
            this.loading = false
            return
          }
        }
        
        // If not found in group stage, try knockout stage
        response = await fetch(`http://localhost:3001/api/knockout/${tournamentId}/bracket`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const bracket = await response.json()
          let knockoutMatch = null
          
          // Search through all rounds for the match
          if (bracket.matches) {
            for (const round in bracket.matches) {
              knockoutMatch = bracket.matches[round].find(m => m._id === matchId)
              if (knockoutMatch) break
            }
          }
          
          if (knockoutMatch) {
            this.match = {
              ...knockoutMatch,
              homeTeam: {
                name: knockoutMatch.homeTeam?.countryName || 'TBD',
                flag: knockoutMatch.homeTeam?.countryFlag || '?'
              },
              awayTeam: {
                name: knockoutMatch.awayTeam?.countryName || 'TBD',
                flag: knockoutMatch.awayTeam?.countryFlag || '?'
              },
              round: this.getMatchLabel(knockoutMatch),
              played: knockoutMatch.status === 'completed',
              date: knockoutMatch.date || knockoutMatch.scheduledDate
            }
            this.loading = false
            return
          }
        }
        
        // Match not found
        this.error = 'Match not found'
        this.loading = false
        
      } catch (error) {
        console.error('Error loading match details:', error)
        this.error = 'Failed to load match details'
        this.loading = false
      }
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
    
    getGroupName(groupId) {
      if (groupId.includes('_')) {
        const parts = groupId.split('_')
        const groupLetter = parts[parts.length - 1]
        return `Group ${groupLetter}`
      }
      return groupId
    },
    
    formatDate(date) {
      if (!date) return 'TBD'
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    
    getDecidedByText(decidedBy) {
      const texts = {
        'regular': 'Regular Time',
        'extra_time': 'Extra Time',
        'penalties': 'Penalties'
      }
      return texts[decidedBy] || ''
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
    },
    
    goBack() {
      this.$router.push(`/tournament/${this.$route.params.tournamentId}`)
    }
  }
}
</script>

<style scoped>
.match-detail-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0066CC 0%, #003366 100%);
}

.main-content {
  padding: 2rem;
  display: flex;
  justify-content: center;
}

.match-detail-container {
  width: 100%;
  max-width: 1000px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 32px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.1);
  color: var(--white);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: var(--font-weight-semibold);
  transition: all 0.3s ease;
  text-decoration: none;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

.page-header h1 {
  color: var(--white);
  font-size: 2rem;
  font-weight: var(--font-weight-bold);
  margin: 0;
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: var(--white);
  text-align: center;
}

.loading-state i, .error-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}

.match-content {
  background: var(--white);
  border-radius: var(--radius-xl);
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* Match Score Section */
.match-score-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--background);
  border-radius: var(--radius-lg);
  padding: 3rem 2rem;
  margin-bottom: 2rem;
  border: 1px solid var(--border);
}

.team-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.team-flag {
  font-size: 4rem;
  line-height: 1;
}

.team-name {
  font-size: 1.5rem;
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  text-align: center;
}

.score-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.score {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 4rem;
  font-weight: var(--font-weight-bold);
}

.home-score, .away-score {
  color: var(--fifa-blue);
  min-width: 4rem;
  text-align: center;
}

.score-separator {
  color: var(--text-secondary);
  font-weight: normal;
}

.extra-scores {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 1.2rem;
  text-align: center;
}

.extra-time-score {
  color: var(--fifa-blue);
  font-weight: var(--font-weight-semibold);
}

.penalty-score {
  color: var(--fifa-red);
  font-weight: var(--font-weight-semibold);
}

.match-status {
  padding: 0.5rem 1rem;
  border-radius: var(--radius-full);
  font-size: 1rem;
  font-weight: var(--font-weight-medium);
}

.status-upcoming {
  background: var(--warning-background);
  color: var(--warning-text);
}

.status-finished {
  background: var(--success-background);
  color: var(--success-text);
}

/* Match Information */
.match-info-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
  padding: 2rem;
  background: var(--background);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item strong {
  color: var(--text-secondary);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-item span {
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
  font-size: 1.1rem;
}

/* Placeholder Sections */
.match-stats-section,
.match-commentary-section {
  margin-bottom: 2rem;
}

.match-stats-section h3,
.match-commentary-section h3 {
  color: var(--text-primary);
  margin-bottom: 1rem;
  font-size: 1.5rem;
  font-weight: var(--font-weight-bold);
}

.stats-placeholder,
.commentary-placeholder {
  background: var(--background);
  border: 2px dashed var(--border);
  border-radius: var(--radius-lg);
  padding: 4rem 2rem;
  text-align: center;
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.placeholder-content i {
  font-size: 4rem;
  color: var(--text-secondary);
  opacity: 0.5;
}

.placeholder-content p {
  color: var(--text-secondary);
  margin: 0;
  font-size: 1.2rem;
}

.placeholder-subtext {
  font-size: 1rem !important;
  opacity: 0.7;
}

/* Responsive Design */
@media (max-width: 768px) {
  .main-content {
    padding: 1rem;
  }
  
  .match-content {
    padding: 1.5rem;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .page-header h1 {
    font-size: 1.5rem;
  }
  
  .match-score-section {
    flex-direction: column;
    gap: 2rem;
    padding: 2rem 1.5rem;
  }
  
  .team-info {
    flex-direction: row;
    gap: 1rem;
  }
  
  .team-flag {
    font-size: 2.5rem;
  }
  
  .team-name {
    font-size: 1.2rem;
  }
  
  .score {
    font-size: 2.5rem;
  }
  
  .match-info-section {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .stats-placeholder,
  .commentary-placeholder {
    padding: 3rem 1rem;
  }
}
</style>