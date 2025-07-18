<template>
  <div class="matchday-selector">
    <div class="matchday-header">
      <h4>{{ confederationName }} Matches</h4>
      <div class="matchday-controls">
        <button 
          @click="$emit('generate-matchday')"
          :disabled="!canGenerateMatchday || simulating"
          class="btn-secondary"
        >
          <i v-if="simulating" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-calendar-plus"></i>
          Generate Matchday
        </button>
        <button 
          @click="$emit('simulate-all-matches')"
          :disabled="!canSimulateAll || simulatingAll"
          class="btn-primary"
        >
          <i v-if="simulatingAll" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-play-circle"></i>
          Simulate All Matches
        </button>
      </div>
    </div>
    
    <div class="matchday-tabs">
      <button 
        v-for="matchday in availableMatchdays" 
        :key="matchday"
        @click="$emit('matchday-change', matchday)"
        :class="['matchday-tab', { 
          active: activeMatchday === matchday,
          completed: isMatchdayCompleted(matchday),
          highlighted: isMatchdayHighlighted(matchday)
        }]"
      >
        <span class="matchday-label">MD {{ matchday }}</span>
        <span v-if="isMatchdayCompleted(matchday)" class="completed-icon">
          <i class="fas fa-check"></i>
        </span>
        <span v-else-if="isMatchdayHighlighted(matchday)" class="highlight-icon">
          <i class="fas fa-star"></i>
        </span>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MatchdaySelector',
  props: {
    confederationName: {
      type: String,
      required: true
    },
    activeMatchday: {
      type: Number,
      required: true
    },
    availableMatchdays: {
      type: Array,
      required: true
    },
    completedMatchdays: {
      type: Array,
      default: () => []
    },
    canGenerateMatchday: {
      type: Boolean,
      default: false
    },
    canSimulateAll: {
      type: Boolean,
      default: false
    },
    simulating: {
      type: Boolean,
      default: false
    },
    simulatingAll: {
      type: Boolean,
      default: false
    }
  },
  emits: ['generate-matchday', 'simulate-all-matches', 'matchday-change'],
  methods: {
    isMatchdayCompleted(matchday) {
      return this.completedMatchdays.includes(matchday)
    },
    isMatchdayHighlighted(matchday) {
      // Highlight first unfinished matchday
      const firstUnfinished = this.availableMatchdays.find(md => !this.isMatchdayCompleted(md))
      return firstUnfinished === matchday
    }
  }
}
</script>

<style scoped>
.matchday-selector {
  margin-bottom: 1.5rem;
}

.matchday-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.matchday-header h4 {
  color: var(--white);
  font-size: 1.2rem;
  font-weight: var(--font-weight-bold);
  margin: 0;
}

.matchday-controls {
  display: flex;
  gap: 12px;
}

.matchday-controls button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 0.9rem;
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-medium);
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: var(--white);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
}

.btn-primary {
  background: var(--fifa-blue);
  color: var(--white);
}

.btn-primary:hover:not(:disabled) {
  background: var(--fifa-dark-blue);
}

.btn-secondary:disabled,
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.matchday-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.matchday-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.1);
  color: var(--white);
  font-size: 0.85rem;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.matchday-tab:hover {
  background: rgba(255, 255, 255, 0.2);
}

.matchday-tab.active {
  background: var(--fifa-blue);
  border-color: var(--fifa-blue);
  color: var(--white);
  font-weight: var(--font-weight-bold);
}

.matchday-tab.completed {
  background: rgba(34, 197, 94, 0.2);
  border-color: rgba(34, 197, 94, 0.4);
}

.matchday-tab.highlighted {
  background: rgba(255, 215, 0, 0.2);
  border-color: rgba(255, 215, 0, 0.4);
  animation: pulse 2s infinite;
}

.completed-icon {
  color: #4ade80;
}

.highlight-icon {
  color: var(--fifa-gold);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@media (max-width: 768px) {
  .matchday-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .matchday-controls {
    justify-content: center;
  }
  
  .matchday-controls button {
    flex: 1;
    justify-content: center;
  }
}
</style>