<template>
  <div class="match-list">
    <div v-if="matches.length === 0" class="no-matches">
      <i class="fas fa-calendar-times"></i>
      <p>No matches scheduled for this matchday</p>
    </div>
    
    <div v-else class="matches-grid">
      <div 
        v-for="match in matches" 
        :key="match._id"
        class="match-card"
        :class="{ 'completed': match.played }"
      >
        <div class="match-teams">
          <div class="team home-team">
            <span class="team-flag">{{ match.homeTeam.flag }}</span>
            <span class="team-name">{{ match.homeTeam.name }}</span>
          </div>
          
          <div class="match-score">
            <span v-if="match.played" class="score">
              {{ match.homeScore }} - {{ match.awayScore }}
            </span>
            <span v-else class="vs">vs</span>
          </div>
          
          <div class="team away-team">
            <span class="team-name">{{ match.awayTeam.name }}</span>
            <span class="team-flag">{{ match.awayTeam.flag }}</span>
          </div>
        </div>
        
        <div class="match-actions">
          <button 
            v-if="!match.played && !readOnly"
            @click="$emit('simulate-match', match._id)"
            :disabled="simulatingMatch === match._id"
            class="btn-simulate"
          >
            <i v-if="simulatingMatch === match._id" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-play"></i>
            {{ simulatingMatch === match._id ? 'Simulating...' : 'Simulate' }}
          </button>
          
          <button 
            @click="$emit('view-match', match._id)"
            class="btn-view"
          >
            <i class="fas fa-eye"></i>
            View Details
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MatchList',
  props: {
    matches: {
      type: Array,
      required: true
    },
    simulatingMatch: {
      type: String,
      default: null
    },
    readOnly: {
      type: Boolean,
      default: false
    }
  },
  emits: ['simulate-match', 'view-match']
}
</script>

<style scoped>
.match-list {
  width: 100%;
}

.no-matches {
  text-align: center;
  padding: 2rem;
  color: var(--white);
  opacity: 0.7;
}

.no-matches i {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.matches-grid {
  display: grid;
  gap: 12px;
}

.match-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  padding: 1rem;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.match-card:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.2);
}

.match-card.completed {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.2);
}

.match-teams {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.team {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.home-team {
  justify-content: flex-start;
}

.away-team {
  justify-content: flex-end;
  flex-direction: row-reverse;
}

.team-flag {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.team-name {
  font-weight: var(--font-weight-medium);
  color: var(--white);
  font-size: 0.9rem;
}

.match-score {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  margin: 0 16px;
}

.score {
  font-size: 1.2rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-gold);
}

.vs {
  font-size: 0.9rem;
  color: var(--white);
  opacity: 0.7;
}

.match-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.btn-simulate,
.btn-view {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.8rem;
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
  .match-card {
    padding: 0.75rem;
  }
  
  .match-teams {
    flex-direction: column;
    gap: 8px;
  }
  
  .team {
    width: 100%;
    justify-content: center;
  }
  
  .away-team {
    flex-direction: row;
  }
  
  .match-score {
    margin: 8px 0;
  }
  
  .match-actions {
    flex-direction: column;
  }
}
</style>