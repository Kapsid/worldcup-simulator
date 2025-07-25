<template>
  <div class="qualification-statistics">
    <div class="statistics-header">
      <h2>Top Scorers</h2>
    </div>

    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Loading top scorers...</span>
    </div>

    <div v-else class="confederation-card">
      <div class="top-scorers-table">
        <div class="table-header">
          <div class="rank-col">Rank</div>
          <div class="player-col">Player</div>
          <div class="team-col">Team</div>
          <div class="goals-col">Goals</div>
          <div class="games-col">Games</div>
          <div class="avg-col">Avg</div>
        </div>

        <div v-if="topScorers && topScorers.length > 0" class="table-body">
          <div 
            v-for="(scorer, index) in topScorers" 
            :key="scorer.player._id"
            class="scorer-row"
            @click="navigateToPlayer(scorer.player)"
          >
            <div class="rank-col">
              <span class="rank">{{ index + 1 }}</span>
              <i v-if="index === 0" class="fas fa-crown gold"></i>
              <i v-else-if="index === 1" class="fas fa-medal silver"></i>
              <i v-else-if="index === 2" class="fas fa-medal bronze"></i>
            </div>
            <div class="player-col">
              <span class="player-name">{{ scorer.player.displayName }}</span>
              <span class="player-position">{{ scorer.player.position }}</span>
            </div>
            <div class="team-col">
              <span class="team-name">{{ getTeamName(scorer.player.nationality) }}</span>
            </div>
            <div class="goals-col">
              <span class="goals-count">{{ scorer.goals }}</span>
            </div>
            <div class="games-col">
              <span class="games-count">{{ scorer.matchesStarted }}</span>
            </div>
            <div class="avg-col">
              <span class="goals-avg">{{ scorer.goalsPerGame }}</span>
            </div>
          </div>
        </div>

        <div v-else class="no-data">
          <i class="fas fa-futbol"></i>
          <span>No goals scored yet</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'QualificationStatistics',
  props: {
    tournamentId: {
      type: String,
      required: true
    },
    confederationId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      loading: true,
      topScorers: []
    }
  },
  async mounted() {
    await this.loadTopScorers()
  },
  watch: {
    confederationId() {
      this.loadTopScorers()
    }
  },
  methods: {
    async loadTopScorers() {
      try {
        this.loading = true
        const token = localStorage.getItem('token')
        
        const response = await fetch(`http://localhost:3001/api/qualification/${this.tournamentId}/top-scorers/${this.confederationId.toLowerCase()}?limit=20`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          this.topScorers = await response.json()
        } else {
          console.error('Failed to load top scorers')
        }
      } catch (error) {
        console.error('Error loading top scorers:', error)
      } finally {
        this.loading = false
      }
    },

    getConfederationName(confederation) {
      const names = {
        'UEFA': 'Europe',
        'CONMEBOL': 'South America', 
        'CONCACAF': 'North & Central America',
        'AFC': 'Asia',
        'CAF': 'Africa',
        'OFC': 'Oceania'
      }
      return names[confederation] || confederation
    },

    getTeamName(countryCode) {
      const teamNames = {
        'USA': 'United States',
        'ENG': 'England',
        'GER': 'Germany',
        'FRA': 'France',
        'ESP': 'Spain',
        'ITA': 'Italy',
        'BRA': 'Brazil',
        'ARG': 'Argentina',
        'NED': 'Netherlands',
        'POR': 'Portugal',
        'JPN': 'Japan',
        'MEX': 'Mexico',
        'CAN': 'Canada',
        'CRC': 'Costa Rica',
        'JAM': 'Jamaica',
        'HON': 'Honduras'
      }
      return teamNames[countryCode] || countryCode
    },

    navigateToPlayer(player) {
      this.$router.push({
        path: `/player/${player._id}`,
        query: {
          tournamentId: this.tournamentId,
          from: 'statistics'
        }
      })
    }
  }
}
</script>

<style scoped>
.qualification-statistics {
  padding: 2rem;
}

.statistics-header {
  text-align: center;
  margin-bottom: 3rem;
}

.statistics-header h2 {
  color: var(--fifa-dark-blue);
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.statistics-header p {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: var(--white);
  font-size: 1.2rem;
  padding: 4rem;
}

.loading-state i {
  font-size: 2rem;
}


.confederation-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: var(--radius-xl);
  padding: 1.5rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.confederation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid rgba(0, 102, 204, 0.1);
}

.confederation-header h3 {
  color: var(--fifa-dark-blue);
  font-size: 1.4rem;
  font-weight: bold;
  margin: 0;
}

.confederation-badge {
  background: var(--fifa-blue);
  color: var(--white);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.top-scorers-table {
  width: 100%;
}

.table-header {
  display: grid;
  grid-template-columns: 60px 1fr 100px 60px 60px 60px;
  gap: 0.5rem;
  padding: 0.75rem 0;
  border-bottom: 2px solid rgba(0, 102, 204, 0.2);
  font-weight: 600;
  color: var(--fifa-dark-blue);
  font-size: 0.9rem;
}

.table-body {
  max-height: 600px;
  overflow-y: auto;
}

.scorer-row {
  display: grid;
  grid-template-columns: 60px 1fr 100px 60px 60px 60px;
  gap: 0.5rem;
  padding: 1rem 0;
  border-bottom: 1px solid rgba(0, 102, 204, 0.1);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.scorer-row:hover {
  background: rgba(0, 102, 204, 0.05);
  border-radius: 8px;
}

.rank-col {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: bold;
  color: var(--fifa-dark-blue);
}

.rank {
  min-width: 20px;
}

.gold { color: #FFD700; }
.silver { color: #C0C0C0; }
.bronze { color: #CD7F32; }

.player-col {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.player-name {
  font-weight: 600;
  color: var(--fifa-dark-blue);
  font-size: 0.95rem;
}

.player-position {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.team-col {
  display: flex;
  align-items: center;
}

.team-name {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.goals-col, .games-col, .avg-col {
  display: flex;
  align-items: center;
  justify-content: center;
}

.goals-count {
  font-size: 1.1rem;
  font-weight: bold;
  color: var(--fifa-blue);
}

.games-count, .goals-avg {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem;
  color: var(--text-secondary);
}

.no-data i {
  font-size: 2rem;
  opacity: 0.5;
}

@media (max-width: 768px) {
  .confederation-card {
    padding: 1rem;
  }
  
  .table-header, .scorer-row {
    grid-template-columns: 40px 1fr 80px 50px 50px 50px;
    gap: 0.25rem;
  }
  
  .player-name {
    font-size: 0.85rem;
  }
  
  .team-name {
    font-size: 0.75rem;
  }
}
</style>