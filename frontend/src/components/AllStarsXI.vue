<template>
  <div class="all-stars-xi">
    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      Loading All Stars XI...
    </div>
    
    <div v-else-if="error" class="error-state">
      <i class="fas fa-exclamation-triangle"></i>
      {{ error }}
    </div>
    
    <div v-else-if="allStarsData && allStarsData.message" class="no-data-state">
      <i class="fas fa-users"></i>
      <p>{{ allStarsData.message }}</p>
    </div>
    
    <div v-else-if="allStarsData" class="all-stars-content">
      <div class="all-stars-header">
        <h3>All Stars XI</h3>
        <p class="subtitle">{{ allStarsData.formation }} Formation - Best performing players of the tournament</p>
      </div>
      
      <!-- Formation Display -->
      <div class="formation-display">
        <!-- Forwards -->
        <div class="formation-line forwards">
          <div class="formation-players">
            <div v-if="allStarsData.players.ST1" class="formation-player">
              <div class="player-card">
                <div class="player-rating">{{ allStarsData.players.ST1.stats?.averageRating || 'N/A' }}</div>
                <div class="player-name">{{ allStarsData.players.ST1.displayName }}</div>
                <div class="player-team">{{ allStarsData.players.ST1.teamId }}</div>
              </div>
            </div>
            <div v-if="allStarsData.players.ST2" class="formation-player">
              <div class="player-card">
                <div class="player-rating">{{ allStarsData.players.ST2.stats?.averageRating || 'N/A' }}</div>
                <div class="player-name">{{ allStarsData.players.ST2.displayName }}</div>
                <div class="player-team">{{ allStarsData.players.ST2.teamId }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Midfielders -->
        <div class="formation-line midfielders">
          <div class="formation-players">
            <div v-if="allStarsData.players.LM" class="formation-player">
              <div class="player-card">
                <div class="player-rating">{{ allStarsData.players.LM.stats?.averageRating || 'N/A' }}</div>
                <div class="player-name">{{ allStarsData.players.LM.displayName }}</div>
                <div class="player-team">{{ allStarsData.players.LM.teamId }}</div>
              </div>
            </div>
            <div v-if="allStarsData.players.CM1" class="formation-player">
              <div class="player-card">
                <div class="player-rating">{{ allStarsData.players.CM1.stats?.averageRating || 'N/A' }}</div>
                <div class="player-name">{{ allStarsData.players.CM1.displayName }}</div>
                <div class="player-team">{{ allStarsData.players.CM1.teamId }}</div>
              </div>
            </div>
            <div v-if="allStarsData.players.CM2" class="formation-player">
              <div class="player-card">
                <div class="player-rating">{{ allStarsData.players.CM2.stats?.averageRating || 'N/A' }}</div>
                <div class="player-name">{{ allStarsData.players.CM2.displayName }}</div>
                <div class="player-team">{{ allStarsData.players.CM2.teamId }}</div>
              </div>
            </div>
            <div v-if="allStarsData.players.RM" class="formation-player">
              <div class="player-card">
                <div class="player-rating">{{ allStarsData.players.RM.stats?.averageRating || 'N/A' }}</div>
                <div class="player-name">{{ allStarsData.players.RM.displayName }}</div>
                <div class="player-team">{{ allStarsData.players.RM.teamId }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Defenders -->
        <div class="formation-line defenders">
          <div class="formation-players">
            <div v-if="allStarsData.players.LB" class="formation-player">
              <div class="player-card">
                <div class="player-rating">{{ allStarsData.players.LB.stats?.averageRating || 'N/A' }}</div>
                <div class="player-name">{{ allStarsData.players.LB.displayName }}</div>
                <div class="player-team">{{ allStarsData.players.LB.teamId }}</div>
              </div>
            </div>
            <div v-if="allStarsData.players.CB1" class="formation-player">
              <div class="player-card">
                <div class="player-rating">{{ allStarsData.players.CB1.stats?.averageRating || 'N/A' }}</div>
                <div class="player-name">{{ allStarsData.players.CB1.displayName }}</div>
                <div class="player-team">{{ allStarsData.players.CB1.teamId }}</div>
              </div>
            </div>
            <div v-if="allStarsData.players.CB2" class="formation-player">
              <div class="player-card">
                <div class="player-rating">{{ allStarsData.players.CB2.stats?.averageRating || 'N/A' }}</div>
                <div class="player-name">{{ allStarsData.players.CB2.displayName }}</div>
                <div class="player-team">{{ allStarsData.players.CB2.teamId }}</div>
              </div>
            </div>
            <div v-if="allStarsData.players.RB" class="formation-player">
              <div class="player-card">
                <div class="player-rating">{{ allStarsData.players.RB.stats?.averageRating || 'N/A' }}</div>
                <div class="player-name">{{ allStarsData.players.RB.displayName }}</div>
                <div class="player-team">{{ allStarsData.players.RB.teamId }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Goalkeeper -->
        <div class="formation-line goalkeeper">
          <div class="formation-players">
            <div v-if="allStarsData.players.GK" class="formation-player">
              <div class="player-card goalkeeper-card">
                <div class="player-rating gk-rating">{{ allStarsData.players.GK.stats?.averageRating || 'N/A' }}</div>
                <div class="player-name">{{ allStarsData.players.GK.displayName }}</div>
                <div class="player-team">{{ allStarsData.players.GK.teamId }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  </div>
</template>

<script>
export default {
  name: 'AllStarsXI',
  props: {
    tournamentId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      loading: true,
      error: null,
      allStarsData: null
    }
  },
  computed: {
    hasAnyPlayers() {
      if (!this.allStarsData?.players) return false
      return Object.values(this.allStarsData.players).some(player => player !== null)
    }
  },
  mounted() {
    this.fetchAllStarsXI()
  },
  methods: {
    async fetchAllStarsXI() {
      try {
        this.loading = true
        this.error = null
        
        const response = await fetch(`/api/tournaments/${this.tournamentId}/all-stars-xi`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
        }
        
        this.allStarsData = await response.json()
        console.log('All Stars XI data:', this.allStarsData)
        console.log('Players object:', this.allStarsData.players)
        console.log('Sample player data:', this.allStarsData.players.GK)
      } catch (error) {
        console.error('Error fetching All Stars XI:', error)
        this.error = error.message || 'Failed to load All Stars XI'
      } finally {
        this.loading = false
      }
    },
    
    formatPosition(position) {
      const positionMap = {
        'GK': 'GK',
        'LB': 'LB',
        'CB1': 'CB',
        'CB2': 'CB',
        'RB': 'RB',
        'LM': 'LM',
        'CM1': 'CM',
        'CM2': 'CM',
        'RM': 'RM',
        'ST1': 'ST',
        'ST2': 'ST'
      }
      return positionMap[position] || position
    }
  }
}
</script>

<style scoped>
.all-stars-xi {
  padding: 20px;
}

.loading-state, .error-state, .no-data-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.error-state {
  color: #e74c3c;
}

.no-data-state {
  color: #95a5a6;
}

.no-data-state i {
  font-size: 48px;
  margin-bottom: 16px;
  display: block;
}

.no-players-message {
  text-align: center;
  padding: 30px;
  background: #f8f9fa;
  border-radius: 8px;
  color: #6c757d;
}

.no-players-message ul {
  text-align: left;
  display: inline-block;
  margin-top: 15px;
}

.all-stars-header {
  text-align: center;
  margin-bottom: 30px;
}

.all-stars-header h3 {
  font-size: 28px;
  margin-bottom: 5px;
  color: #2c3e50;
}

.subtitle {
  color: #7f8c8d;
  font-size: 16px;
  margin-bottom: 15px;
}

.team-rating {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.rating-label {
  color: #666;
  font-weight: 500;
}

.rating-value {
  font-size: 24px;
  font-weight: bold;
  color: #27ae60;
}

/* Formation Display */
.formation-display {
  max-width: 800px;
  margin: 0 auto 40px;
  padding: 30px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.formation-line {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
}

.formation-line:last-child {
  margin-bottom: 0;
}

.formation-players {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.formation-player {
  flex: 0 0 auto;
}

.player-card {
  background: white;
  border-radius: 12px;
  padding: 12px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  min-width: 120px;
  max-width: 140px;
}

.player-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.goalkeeper-card {
  background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%);
}

.player-rating {
  background: #27ae60;
  color: white;
  font-weight: bold;
  font-size: 16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 8px;
}

.gk-rating {
  background: #f39c12;
}

.player-name {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-team {
  font-size: 12px;
  color: #7f8c8d;
  font-weight: 500;
}


@media (max-width: 768px) {
  .formation-display {
    padding: 20px 15px;
  }
  
  .formation-players {
    gap: 15px;
  }
  
  .player-card {
    min-width: 100px;
    max-width: 120px;
    padding: 10px;
  }
  
  .player-name {
    font-size: 13px;
  }
}

@media (max-width: 768px) {
  .pitch {
    min-height: 400px;
  }
}
</style>