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
        
        <div v-if="lastTournament" class="last-tournament-info">
          <div class="tournament-badge">
            <span class="country-flag">{{ getCountryFlag(lastTournament.hostCountryCode) }}</span>
            <div class="tournament-details">
              <h4>{{ lastTournament.name }}</h4>
              <p>{{ lastTournament.hostCountry }} • {{ formatStatus(lastTournament.status) }}</p>
              <div class="tournament-stats">
                <span class="team-count">{{ lastTournament.teamCount || 0 }}/{{ lastTournament.settings?.maxTeams || 32 }} Teams</span>
                <span v-if="lastTournament.canActivate" class="ready-badge">
                  <i class="fas fa-check-circle"></i>
                  Ready
                </span>
                <span v-else class="not-ready-badge">
                  <i class="fas fa-clock"></i>
                  {{ (lastTournament.settings?.maxTeams || 32) - (lastTournament.teamCount || 0) }} teams needed
                </span>
              </div>
            </div>
          </div>
          <div class="quick-actions">
            <button @click="continueTournament" class="btn-primary action-btn">
              <i class="fas fa-play"></i>
              Continue Tournament
            </button>
          </div>
        </div>
        <div v-else class="quick-actions">
          <button @click="createTournament" class="btn-primary action-btn">
            <i class="fas fa-plus"></i>
            Create Tournament
          </button>
        </div>
      </div>
      
      <div class="hero-visual">
        <div class="trophy-icon">
          <i class="fas fa-trophy"></i>
        </div>
      </div>
    </div>
    
  </div>
</template>

<script>
export default {
  name: 'WelcomeSection',
  props: {
    username: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      lastTournament: null,
      countries: []
    }
  },
  mounted() {
    this.loadLastTournament()
    this.loadCountries()
  },
  methods: {
    async loadLastTournament() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('http://localhost:3001/api/tournaments/last-opened', {
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
    
    async loadCountries() {
      try {
        const response = await fetch('http://localhost:3001/api/tournaments/countries')
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
    
    getCountryFlag(countryCode) {
      const country = this.countries.find(c => c.code === countryCode)
      return country ? country.flag : '🏴'
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