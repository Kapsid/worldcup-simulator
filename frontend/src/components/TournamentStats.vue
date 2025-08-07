<template>
  <div class="tournament-stats">
    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Loading statistics...</span>
    </div>
    
    <div v-else-if="error" class="error-state">
      <i class="fas fa-exclamation-triangle"></i>
      <span>{{ error }}</span>
    </div>
    
    <div v-else class="stats-content">
      <!-- Stats Tabs -->
      <div class="stats-tabs">
        <button 
          @click="activeTab = 'scorers'"
          :class="['tab-button', { active: activeTab === 'scorers' }]"
        >
          <i class="fas fa-trophy"></i>
          Top Scorers
        </button>
        <button 
          @click="activeTab = 'cleansheets'"
          :class="['tab-button', { active: activeTab === 'cleansheets' }]"
        >
          <i class="fas fa-shield-alt"></i>
          Clean Sheets
        </button>
        <button 
          @click="activeTab = 'mvp'"
          :class="['tab-button', { active: activeTab === 'mvp' }]"
        >
          <i class="fas fa-trophy"></i>
          MVP
        </button>
        <button 
          @click="activeTab = 'allstars'"
          :class="['tab-button', { active: activeTab === 'allstars' }]"
        >
          <i class="fas fa-star"></i>
          All Stars XI
        </button>
      </div>
      
      <!-- Top Scorers Section -->
      <div v-if="activeTab === 'scorers'" class="tab-content">
        <div class="stats-section">
        <div class="section-header">
          <h4>
            <i class="fas fa-trophy"></i>
            Top Scorers
          </h4>
          <span class="section-meta">{{ topScorers.length }} players</span>
        </div>
        
        <div v-if="topScorers.length === 0" class="no-data">
          <i class="fas fa-chart-line"></i>
          <p>No goal scorers yet</p>
          <small>Statistics will appear once matches are played</small>
        </div>
        
        <div v-else class="scorers-list">
          <div 
            v-for="scorer in topScorers" 
            :key="scorer.player._id"
            class="scorer-item"
            :class="{ 
              'golden-boot': scorer.rank === 1, 
              'mvp-player': tournament.mvp && scorer.player._id === tournament.mvp.playerId 
            }"
          >
            <div class="scorer-rank">
              <span v-if="scorer.rank === 1" class="rank-badge golden">
                <i class="fas fa-crown"></i>
                {{ scorer.rank }}
              </span>
              <span v-else class="rank-badge">
                {{ scorer.rank }}
              </span>
            </div>
            
            <div class="scorer-info">
              <div class="player-name">
                {{ scorer.player.displayName }}
                <span v-if="tournament.mvp && scorer.player._id === tournament.mvp.playerId" class="mvp-badge">
                  <i class="fas fa-trophy"></i>
                  MVP
                </span>
                <span class="player-position">{{ scorer.player.detailedPosition }}</span>
              </div>
              <div class="player-country">
                <CountryFlag :country-code="scorer.player.teamId" :size="28" />
                {{ scorer.player.teamId }}
              </div>
            </div>
            
            <div class="scorer-stats">
              <div class="primary-stat">
                <span class="stat-value">{{ scorer.goals }}</span>
                <span class="stat-label">Goals</span>
              </div>
              <div class="secondary-stats">
                <div class="stat-item">
                  <span class="stat-value">{{ scorer.matchesStarted }}</span>
                  <span class="stat-label">Starts</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ scorer.goalsPerGame }}</span>
                  <span class="stat-label">Goals/Game</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
      
      <!-- Clean Sheets Section -->
      <div v-if="activeTab === 'cleansheets'" class="tab-content">
        <div class="stats-section">
        <div class="section-header">
          <h4>
            <i class="fas fa-shield-alt"></i>
            Clean Sheets
          </h4>
          <span class="section-meta">{{ cleanSheets.length }} goalkeepers</span>
        </div>
        
        <div v-if="cleanSheets.length === 0" class="no-data">
          <i class="fas fa-shield-alt"></i>
          <p>No clean sheets yet</p>
          <small>Statistics will appear once matches are played</small>
        </div>
        
        <div v-else class="scorers-list">
          <div 
            v-for="keeper in cleanSheets" 
            :key="keeper.player._id"
            class="scorer-item"
            :class="{ 'golden-boot': keeper.rank === 1 }"
          >
            <div class="scorer-rank">
              <span v-if="keeper.rank === 1" class="rank-badge golden">
                <i class="fas fa-crown"></i>
                {{ keeper.rank }}
              </span>
              <span v-else class="rank-badge">
                {{ keeper.rank }}
              </span>
            </div>
            
            <div class="scorer-info">
              <div class="player-name">
                {{ keeper.player.displayName }}
                <span class="player-position">{{ keeper.player.detailedPosition }}</span>
              </div>
              <div class="player-country">
                <CountryFlag :country-code="keeper.player.teamId" :size="28" />
                {{ keeper.player.teamId }}
              </div>
            </div>
            
            <div class="scorer-stats">
              <div class="primary-stat">
                <span class="stat-value">{{ keeper.cleanSheets }}</span>
                <span class="stat-label">Clean Sheets</span>
              </div>
              <div class="secondary-stats">
                <div class="stat-item">
                  <span class="stat-value">{{ keeper.matchesStarted }}</span>
                  <span class="stat-label">Starts</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ keeper.cleanSheetPercentage }}%</span>
                  <span class="stat-label">CS%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
      
      <!-- MVP Section -->
      <div v-if="activeTab === 'mvp'" class="tab-content">
        <div class="stats-section">
          <div class="section-header">
            <h4>
              <i class="fas fa-trophy"></i>
              Tournament MVP
            </h4>
            <span class="section-meta" v-if="tournament.status === 'completed'">Tournament Complete</span>
            <span class="section-meta" v-else>Determined at tournament end</span>
          </div>
          
          <div v-if="tournament.status !== 'completed'" class="no-data">
            <i class="fas fa-trophy"></i>
            <p>MVP will be announced</p>
            <small>The Most Valuable Player will be determined when the tournament is completed</small>
          </div>
          
          <div v-else-if="!tournament.mvp" class="no-data">
            <i class="fas fa-trophy"></i>
            <p>No MVP data available</p>
            <small>MVP data may still be processing</small>
          </div>
          
          <div v-else class="mvp-container">
            <div class="mvp-card">
              <div class="mvp-trophy">
                <i class="fas fa-trophy"></i>
              </div>
              <div class="mvp-info">
                <div class="mvp-title">Tournament MVP</div>
                <div class="player-name mvp-name">
                  {{ tournament.mvp.playerName || 'Unknown Player' }}
                  <span class="player-position">{{ tournament.mvp.position || 'N/A' }}</span>
                </div>
                <div class="player-country">
                  <CountryFlag v-if="tournament.mvp.teamId" :country-code="tournament.mvp.teamId" :size="32" />
                  <span v-else class="flag-fallback">🏆</span>
                  {{ tournament.mvp.teamId || tournament.mvp.nationality || 'Unknown Team' }}
                </div>
                <div class="mvp-description">
                  <p><strong>{{ tournament.mvp.playerName }}</strong> demonstrated exceptional performance throughout the tournament, combining individual brilliance with team success.</p>
                </div>
                <div class="mvp-stats">
                  <div class="stat-group">
                    <div class="stat-item highlight-stat">
                      <span class="stat-value">{{ tournament.mvp.averageRating ? tournament.mvp.averageRating.toFixed(1) : '0.0' }}</span>
                      <span class="stat-label">Avg Rating</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-value">{{ tournament.mvp.goals || 0 }}</span>
                      <span class="stat-label">Goals</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-value">{{ tournament.mvp.assists || 0 }}</span>
                      <span class="stat-label">Assists</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-value">{{ tournament.mvp.matchesPlayed || 0 }}</span>
                      <span class="stat-label">Matches</span>
                    </div>
                  </div>
                  <div class="mvp-achievement" v-if="tournament.winner || tournament.runnerUp">
                    <div class="achievement-badge" v-if="tournament.winner && tournament.winner.code === tournament.mvp.teamId">
                      <i class="fas fa-trophy"></i>
                      <span>Tournament Winner</span>
                    </div>
                    <div class="achievement-badge runner-up" v-else-if="tournament.runnerUp && tournament.runnerUp.code === tournament.mvp.teamId">
                      <i class="fas fa-medal"></i>
                      <span>Tournament Runner-up</span>
                    </div>
                    <div class="achievement-note">
                      MVP selection considers individual performance, team success, and contribution to team progression.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- All Stars XI Section -->
      <div v-if="activeTab === 'allstars'" class="tab-content">
        <AllStarsXI :tournament-id="tournament._id" />
      </div>
      
      <!-- Additional Stats Sections (Future Enhancement) -->
      <div class="upcoming-stats">
        <div class="upcoming-section">
          <h4>
            <i class="fas fa-chart-bar"></i>
            More Statistics Coming Soon
          </h4>
          <div class="upcoming-items">
            <div class="upcoming-item">
              <i class="fas fa-hands-helping"></i>
              <span>Top Assists</span>
            </div>
            <div class="upcoming-item">
              <i class="fas fa-star"></i>
              <span>Player Ratings</span>
            </div>
            <div class="upcoming-item">
              <i class="fas fa-exclamation-triangle"></i>
              <span>Disciplinary</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AllStarsXI from './AllStarsXI.vue'
import CountryFlag from './CountryFlag.vue'
import { API_URL } from '../config/api.js'

export default {
  name: 'TournamentStats',
  components: {
    AllStarsXI,
    CountryFlag
  },
  props: {
    tournament: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      topScorers: [],
      cleanSheets: [],
      loading: false,
      error: null,
      activeTab: 'scorers'
    }
  },
  async mounted() {
    await this.loadTopScorers()
    await this.loadCleanSheets()
  },
  watch: {
    tournament: {
      handler() {
        this.loadTopScorers()
        this.loadCleanSheets()
      },
      deep: true
    }
  },
  methods: {
    async loadTopScorers() {
      if (!this.tournament?._id) return
      
      this.loading = true
      this.error = null
      
      try {
        const response = await fetch(`${API_URL}/tournaments/${this.tournament._id}/top-scorers`)
        
        if (response.ok) {
          const data = await response.json()
          this.topScorers = data.topScorers || []
        } else {
          const errorData = await response.json()
          this.error = errorData.error || 'Failed to load statistics'
        }
      } catch (error) {
        console.error('Error loading top scorers:', error)
        this.error = 'Network error. Please try again.'
      } finally {
        this.loading = false
      }
    },
    
    async loadCleanSheets() {
      if (!this.tournament?._id) return
      
      this.loading = true
      this.error = null
      
      try {
        const response = await fetch(`/api/tournaments/${this.tournament._id}/clean-sheets`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          this.cleanSheets = data.cleanSheets || []
        } else {
          const errorData = await response.json()
          this.error = errorData.error || 'Failed to load clean sheets'
        }
      } catch (error) {
        console.error('Error loading clean sheets:', error)
        this.error = 'Network error. Please try again.'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.tournament-stats {
  padding: 0;
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: var(--gray);
  text-align: center;
}

.loading-state i, .error-state i {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: var(--fifa-blue);
}

.error-state i {
  color: var(--fifa-red);
}

.stats-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Tabs */
.stats-tabs {
  display: flex;
  gap: 1rem;
  border-bottom: 2px solid #e9ecef;
  margin-bottom: 2rem;
}

.tab-button {
  background: none;
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  color: #6c757d;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 3px solid transparent;
  transition: all 0.2s;
  margin-bottom: -2px;
}

.tab-button:hover {
  color: #495057;
}

.tab-button.active {
  color: var(--fifa-blue);
  border-bottom-color: var(--fifa-blue);
}

.tab-button i {
  font-size: 1.1rem;
}

.tab-content {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stats-section {
  background: rgba(255, 255, 255, 0.5);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  border: 1px solid rgba(0, 102, 204, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid rgba(0, 102, 204, 0.1);
}

.section-header h4 {
  color: var(--fifa-dark-blue);
  font-size: 1.1rem;
  font-weight: var(--font-weight-bold);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-header i {
  color: var(--fifa-gold);
}

.section-meta {
  color: var(--gray);
  font-size: 0.9rem;
  font-weight: var(--font-weight-medium);
}

.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: var(--gray);
  text-align: center;
}

.no-data i {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: rgba(0, 102, 204, 0.3);
}

.no-data p {
  font-size: 1.1rem;
  margin: 0 0 0.5rem 0;
  color: var(--fifa-dark-blue);
}

.no-data small {
  font-size: 0.9rem;
  opacity: 0.7;
}

.scorers-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.scorer-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.7);
  border-radius: var(--radius-md);
  border: 1px solid rgba(0, 102, 204, 0.1);
  transition: all 0.3s ease;
}

.scorer-item:hover {
  background: rgba(255, 255, 255, 0.9);
  border-color: var(--fifa-blue);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 102, 204, 0.15);
}

.scorer-item.golden-boot {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 193, 7, 0.1));
  border-color: var(--fifa-gold);
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.2);
}

.scorer-rank {
  flex-shrink: 0;
  width: 3rem;
}

.rank-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  font-weight: var(--font-weight-bold);
  font-size: 0.9rem;
  background: rgba(0, 102, 204, 0.1);
  color: var(--fifa-blue);
  border: 2px solid rgba(0, 102, 204, 0.2);
}

.rank-badge.golden {
  background: linear-gradient(135deg, var(--fifa-gold), #ffd700);
  color: var(--fifa-dark-blue);
  border-color: var(--fifa-gold);
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
}

.rank-badge.golden i {
  margin-right: 0.25rem;
  font-size: 0.8rem;
}

.scorer-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.player-name {
  font-size: 1rem;
  font-weight: var(--font-weight-semibold);
  color: var(--fifa-dark-blue);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.player-position {
  background: rgba(0, 102, 204, 0.1);
  color: var(--fifa-blue);
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.player-country {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--gray);
}

.country-flag {
  font-size: 1.1rem;
  margin-right: 0.5rem;
}

.scorer-stats {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.primary-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0.5rem;
  background: rgba(0, 102, 204, 0.1);
  border-radius: var(--radius-md);
  min-width: 4rem;
}

.primary-stat .stat-value {
  font-size: 1.5rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-blue);
  line-height: 1;
}

.primary-stat .stat-label {
  font-size: 0.75rem;
  color: var(--gray);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 0.25rem;
}

.secondary-stats {
  display: flex;
  gap: 0.75rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-item .stat-value {
  font-size: 0.9rem;
  font-weight: var(--font-weight-semibold);
  color: var(--fifa-dark-blue);
  line-height: 1;
}

.stat-item .stat-label {
  font-size: 0.7rem;
  color: var(--gray);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 0.125rem;
}

.upcoming-stats {
  background: rgba(0, 102, 204, 0.05);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  border: 1px solid rgba(0, 102, 204, 0.1);
}

.upcoming-section h4 {
  color: var(--fifa-dark-blue);
  font-size: 1rem;
  font-weight: var(--font-weight-bold);
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.upcoming-section i {
  color: var(--fifa-blue);
}

.upcoming-items {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
}

.upcoming-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.5);
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  color: var(--gray);
  font-weight: var(--font-weight-medium);
  opacity: 0.7;
}

.upcoming-item i {
  color: rgba(0, 102, 204, 0.5);
  width: 1rem;
}

@media (max-width: 768px) {
  /* Fix navigation tabs overflow */
  .stats-tabs {
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 0.5rem;
  }
  
  .tab-button {
    flex: 1;
    min-width: auto;
    padding: 0.6rem 0.8rem;
    font-size: 0.85rem;
    white-space: nowrap;
  }
  
  .tab-button i {
    font-size: 0.9rem;
    margin-right: 0.3rem;
  }
  
  /* Fix scorer box size and centering - make full width and compact */
  .scorer-item {
    flex-direction: row;
    gap: 0.75rem;
    text-align: left;
    padding: 0.75rem;
    max-width: none;
    margin: 0;
    width: 100%;
  }
  
  .scorer-rank {
    width: 2.5rem;
  }
  
  .rank-badge {
    width: 2rem;
    height: 2rem;
    font-size: 0.85rem;
  }
  
  .scorer-info {
    flex: 1;
    min-width: 0;
  }
  
  .player-name {
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  .player-position {
    font-size: 0.75rem;
  }
  
  .player-country {
    font-size: 0.8rem;
  }
  
  .scorer-stats {
    flex-direction: row;
    gap: 0.75rem;
    align-items: center;
    flex-shrink: 0;
  }
  
  .primary-stat {
    min-width: auto;
    padding: 0.25rem 0.5rem;
  }
  
  .primary-stat .stat-value {
    font-size: 1.2rem;
  }
  
  .primary-stat .stat-label {
    font-size: 0.65rem;
  }
  
  .secondary-stats {
    display: none;
  }
  
  .scorers-list {
    max-width: 100%;
    padding: 0;
    gap: 0.5rem;
  }
  
  .stats-section {
    padding: 0;
  }
  
  .section-header {
    padding: 0 0 1rem 0;
  }
  
  .upcoming-items {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .stats-section, .upcoming-stats {
    padding: 1rem;
  }
  
  .section-header {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
}

/* MVP Styles */
.mvp-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.mvp-card {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 193, 7, 0.05));
  border: 2px solid var(--fifa-gold);
  border-radius: var(--radius-lg);
  padding: 2rem;
  text-align: center;
  box-shadow: 0 8px 24px rgba(255, 215, 0, 0.3);
  max-width: 400px;
  width: 100%;
  position: relative;
}

.mvp-trophy {
  margin-bottom: 1rem;
}

.mvp-trophy i {
  font-size: 3rem;
  color: var(--fifa-gold);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.mvp-title {
  font-size: 1.2rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 1rem;
}

.mvp-name {
  font-size: 1.5rem !important;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-gold);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  margin-bottom: 0.5rem;
}

.mvp-stats {
  margin-top: 1.5rem;
}

.stat-group {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  max-width: 300px;
  margin: 0 auto;
}

.mvp-badge {
  background: linear-gradient(135deg, var(--fifa-gold), #ffd700);
  color: var(--fifa-dark-blue);
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  box-shadow: 0 2px 4px rgba(255, 215, 0, 0.3);
  animation: mvpGlow 2s ease-in-out infinite alternate;
}

.mvp-badge i {
  font-size: 0.6rem;
}

@keyframes mvpGlow {
  from {
    box-shadow: 0 2px 4px rgba(255, 215, 0, 0.3);
  }
  to {
    box-shadow: 0 4px 8px rgba(255, 215, 0, 0.5);
  }
}

.scorer-item.mvp-player {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.08), rgba(255, 193, 7, 0.05));
  border-color: var(--fifa-gold);
  box-shadow: 0 4px 16px rgba(255, 215, 0, 0.25);
}

.scorer-item.mvp-player:hover {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.12), rgba(255, 193, 7, 0.08));
  box-shadow: 0 6px 20px rgba(255, 215, 0, 0.35);
}

@media (max-width: 768px) {
  .mvp-card {
    padding: 1.5rem;
  }
  
  .mvp-trophy i {
    font-size: 2.5rem;
  }
  
  .mvp-name {
    font-size: 1.3rem !important;
  }
  
  .stat-group {
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
  }
  
  .mvp-badge {
    font-size: 0.65rem;
    padding: 0.2rem 0.4rem;
  }
}

/* Enhanced MVP Styles */
.mvp-description {
  margin: 1rem 0 1.5rem 0;
  text-align: center;
}

.mvp-description p {
  color: var(--fifa-dark-blue);
  font-size: 0.95rem;
  line-height: 1.4;
  margin: 0;
  font-style: italic;
  opacity: 0.9;
}

.stat-group .stat-item.highlight-stat {
  background: linear-gradient(135deg, var(--fifa-gold), #ffd700);
  color: var(--fifa-dark-blue);
  border-radius: var(--radius-md);
  position: relative;
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(255, 215, 0, 0.3);
}

.stat-group .stat-item.highlight-stat .stat-value {
  color: var(--fifa-dark-blue);
  font-weight: var(--font-weight-bold);
  font-size: 1.1em;
}

.stat-group .stat-item.highlight-stat .stat-label {
  color: var(--fifa-dark-blue);
  font-weight: var(--font-weight-semibold);
}

.mvp-achievement {
  margin-top: 1.5rem;
  text-align: center;
}

.achievement-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, var(--fifa-gold), #ffd700);
  color: var(--fifa-dark-blue);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: var(--font-weight-bold);
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
}

.achievement-badge.runner-up {
  background: linear-gradient(135deg, #C0C0C0, #E5E5E5);
  color: #333;
}

.achievement-badge i {
  font-size: 1rem;
}

.achievement-note {
  font-size: 0.8rem;
  color: var(--gray);
  line-height: 1.3;
  max-width: 300px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .mvp-description p {
    font-size: 0.85rem;
  }
  
  .achievement-badge {
    font-size: 0.8rem;
    padding: 0.4rem 0.8rem;
  }
  
  .achievement-note {
    font-size: 0.75rem;
  }
}
</style>