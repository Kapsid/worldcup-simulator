<template>
  <div class="welcome-section">
    <div class="hero-card glass-white animate-fade-in">
      <div class="hero-content">
        <div class="welcome-badge">
          <i class="fas fa-star"></i>
          Welcome Back
        </div>
        <h2>Ready for kickoff, {{ username }}?</h2>
        <p>Experience the ultimate World Cup simulation with authentic teams, real statistics, and legendary moments waiting to be created.</p>
        
      </div>
      
      <div class="hero-visual">
        <div class="trophy-icon">
          <i class="fas fa-trophy"></i>
        </div>
      </div>
    </div>
    
    <!-- Quick Access Tiles -->
    <div class="quick-access-section">
      <h3>Quick Access</h3>
      <div class="tiles-grid">
        <!-- Last World Tile -->
        <div class="access-tile glass-white" @click="continueLastWorld" :class="{ 'disabled': !lastWorld }">
          <div class="tile-icon world-icon">
            <i class="fas fa-globe"></i>
          </div>
          <div class="tile-content">
            <h4>Continue Last World</h4>
            <div v-if="lastWorld" class="tile-info">
              <p class="world-name">{{ lastWorld.name }}</p>
              <div class="world-stats">
                <span class="world-year">{{ lastWorld.beginningYear }}</span>
                <span class="separator">•</span>
                <span class="tournament-count">{{ lastWorld.tournaments?.length || 0 }} tournaments</span>
              </div>
            </div>
            <div v-else class="tile-info no-data">
              <p>No worlds created yet</p>
              <small>Create your first world to get started</small>
            </div>
          </div>
          <div class="tile-action">
            <i class="fas fa-arrow-right"></i>
          </div>
        </div>

        <!-- Last Tournament Tile -->
        <div class="access-tile glass-white" @click="continueLastTournament" :class="{ 'disabled': !lastTournament }">
          <div class="tile-icon tournament-icon">
            <i class="fas fa-trophy"></i>
          </div>
          <div class="tile-content">
            <h4>Continue Last Tournament</h4>
            <div v-if="lastTournament" class="tile-info">
              <p class="tournament-name">{{ lastTournament.name }}</p>
              <div class="tournament-stats">
                <span class="host-info">
                  <CountryFlag :country-code="lastTournament.hostCountryCode" :size="20" />
                  {{ lastTournament.hostCountry }}
                </span>
                <span class="separator">•</span>
                <span class="status">{{ formatStatus(lastTournament.status) }}</span>
              </div>
            </div>
            <div v-else class="tile-info no-data">
              <p>No tournaments created yet</p>
              <small>Create your first tournament to get started</small>
            </div>
          </div>
          <div class="tile-action">
            <i class="fas fa-arrow-right"></i>
          </div>
        </div>
      </div>
    </div>
    
  </div>
</template>

<script>
import CountryFlag from './CountryFlag.vue'
import { API_URL } from '../config/api.js'

export default {
  name: 'WelcomeSection',
  components: {
    CountryFlag
  },
  props: {
    username: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      lastTournament: null,
      lastWorld: null,
      countries: []
    }
  },
  mounted() {
    this.loadLastTournament()
    this.loadLastWorld()
    this.loadCountries()
  },
  methods: {
    async loadLastTournament() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/tournaments/last-opened`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          this.lastTournament = await response.json()
        }
      } catch (error) {
        console.error('Error loading last tournament:', error)
      }
    },
    
    async loadLastWorld() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/worlds`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          // Get the most recently created world
          if (data.data && data.data.length > 0) {
            this.lastWorld = data.data[0] // Already sorted by createdAt desc
          }
        }
      } catch (error) {
        console.error('Error loading last world:', error)
      }
    },

    async loadCountries() {
      try {
        const response = await fetch('${API_URL}/tournaments/countries')
        if (response.ok) {
          this.countries = await response.json()
        }
      } catch (error) {
        console.error('Error loading countries:', error)
      }
    },
    
    continueTournament() {
      if (this.lastTournament) {
        this.$router.push(`/tournament/${this.lastTournament._id}`)
      }
    },
    
    createTournament() {
      this.$router.push('/tournaments')
    },

    continueLastWorld() {
      if (this.lastWorld) {
        this.$router.push(`/worlds/${this.lastWorld._id}`)
      } else {
        this.$router.push('/worlds')
      }
    },

    continueLastTournament() {
      if (this.lastTournament) {
        this.$router.push(`/tournament/${this.lastTournament._id}`)
      } else {
        this.$router.push('/tournaments')
      }
    },
    
    
    formatStatus(status) {
      const statusMap = {
        'draft': 'Draft',
        'active': 'Active',
        'completed': 'Completed',
        'cancelled': 'Cancelled'
      }
      return statusMap[status] || status
    }
  }
}
</script>

<style scoped>
.welcome-section {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.hero-card {
  padding: 48px;
  border-radius: var(--radius-xl);
  margin-bottom: 40px;
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 48px;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.welcome-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, var(--fifa-gold), #FFE55C);
  color: var(--fifa-dark-blue);
  padding: 8px 20px;
  border-radius: 50px;
  font-size: 0.8rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 24px;
}

.hero-content h2 {
  font-size: 2.5rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
  margin: 0 0 16px 0;
  line-height: 1.2;
}

.hero-content p {
  color: var(--gray);
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 32px;
}

.last-tournament-info {
  margin-bottom: 24px;
}

.tournament-badge {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 16px;
  backdrop-filter: blur(10px);
}

.country-flag {
  font-size: 2rem;
}

.tournament-details h4 {
  font-size: 1.1rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
  margin: 0 0 4px 0;
}

.tournament-details p {
  font-size: 0.9rem;
  color: var(--gray);
  margin: 0 0 8px 0;
}

.tournament-stats {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.team-count {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: var(--font-weight-semibold);
}

.ready-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: rgba(0, 170, 68, 0.2);
  color: #00aa44;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
}

.not-ready-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: rgba(255, 136, 0, 0.2);
  color: #ff8800;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
}

.quick-actions {
  display: flex;
  gap: 16px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  font-size: 1rem;
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-semibold);
  transition: all 0.3s ease;
}

.hero-visual {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.trophy-icon {
  font-size: 8rem;
  color: var(--fifa-gold);
  filter: drop-shadow(0 10px 30px rgba(255, 215, 0, 0.3));
}

/* Quick Access Tiles */
.quick-access-section {
  margin-top: 40px;
}

.quick-access-section h3 {
  color: var(--white);
  font-size: 1.5rem;
  font-weight: var(--font-weight-bold);
  margin: 0 0 24px 0;
  text-align: center;
}

.tiles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
}

.access-tile {
  padding: 24px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  gap: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.access-tile:not(.disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.access-tile.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.access-tile.disabled:hover {
  transform: none;
}

.tile-icon {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.world-icon {
  background: linear-gradient(135deg, #4CAF50, #66BB6A);
  color: white;
}

.tournament-icon {
  background: linear-gradient(135deg, var(--fifa-gold), #FFE55C);
  color: var(--fifa-dark-blue);
}

.tile-content {
  flex: 1;
  min-width: 0;
}

.tile-content h4 {
  color: var(--fifa-dark-blue);
  font-size: 1.1rem;
  font-weight: var(--font-weight-bold);
  margin: 0 0 8px 0;
}

.tile-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.world-name,
.tournament-name {
  color: var(--fifa-blue);
  font-size: 0.95rem;
  font-weight: var(--font-weight-semibold);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.world-stats,
.tournament-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: var(--gray);
  flex-wrap: wrap;
}

.separator {
  opacity: 0.5;
}

.host-info {
  display: flex;
  align-items: center;
  gap: 4px;
}

.no-data {
  opacity: 0.7;
}

.no-data p {
  color: var(--gray);
  font-size: 0.9rem;
  margin: 0 0 4px 0;
}

.no-data small {
  color: rgba(108, 117, 125, 0.8);
  font-size: 0.75rem;
}

.tile-action {
  color: var(--fifa-blue);
  font-size: 1.2rem;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.access-tile:not(.disabled):hover .tile-action {
  transform: translateX(4px);
  color: var(--fifa-dark-blue);
}

@media (max-width: 1024px) {
  .hero-card {
    grid-template-columns: 1fr;
    gap: 32px;
    text-align: center;
    padding: 40px;
  }
  
  .hero-content h2 {
    font-size: 2rem;
  }
  
  .trophy-icon {
    font-size: 6rem;
  }
}

@media (max-width: 768px) {
  .hero-card {
    padding: 32px 24px;
    margin-bottom: 32px;
  }
  
  .hero-content h2 {
    font-size: 1.75rem;
  }
  
  .quick-actions {
    flex-direction: column;
  }
  
  .action-btn {
    justify-content: center;
  }
  
  
  .trophy-icon {
    font-size: 4rem;
  }
}
</style>