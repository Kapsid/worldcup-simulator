<template>
  <div class="content-card glass-white full-width">
    <div class="card-header">
      <h3>Quick Actions</h3>
      <i class="fas fa-bolt"></i>
    </div>
    <div class="card-content">
      <div class="action-grid-full">
        <!-- Team Selection (Manual) or Qualification Process -->
        <button 
          v-if="tournament.type === 'manual'" 
          @click="$emit('toggle-team-management')" 
          class="action-card" 
          :class="{ 'action-selected': showTeamManagement }" 
          :disabled="tournament.status === 'cancelled'"
        >
          <i class="fas fa-users"></i>
          <span>Team Selection</span>
        </button>
        <button 
          v-else 
          @click="$emit('toggle-qualifying')" 
          class="action-card" 
          :class="{ 'action-selected': showQualifying }" 
          :disabled="tournament.status === 'cancelled'"
        >
          <i class="fas fa-flag-checkered"></i>
          <span>Qualifying</span>
        </button>
        
        <!-- Start Tournament -->
        <button 
          class="action-card" 
          :disabled="!tournament.canActivate || tournament.status !== 'draft'" 
          @click="$emit('activate-tournament')"
        >
          <i class="fas fa-play"></i>
          <span>Start Tournament</span>
        </button>
        
        <!-- World Cup Draw -->
        <button 
          @click="$emit('toggle-draw')" 
          class="action-card" 
          :class="{ 'action-selected': showDraw }" 
          :disabled="tournament.status === 'draft' || tournament.status === 'cancelled' || (anyGroupMatchPlayed && tournament.status !== 'completed')"
        >
          <i class="fas fa-random"></i>
          <span>World Cup Draw</span>
          <small v-if="tournament.status === 'completed'" class="action-note status-info">View Only</small>
          <small v-else-if="anyGroupMatchPlayed" class="action-note status-warning">Matches already played</small>
          <small v-else-if="tournament.status !== 'active'" class="action-note status-warning">Status: {{ tournament.status }}</small>
          <small v-else-if="tournament.teamCount !== 32" class="action-note status-warning">Teams: {{ tournament.teamCount }}/32</small>
        </button>
        
        <!-- Group Matches -->
        <button 
          @click="$emit('toggle-matches')" 
          class="action-card" 
          :class="{ 'action-selected': showMatches }" 
          :disabled="tournament.status === 'draft' || tournament.status === 'cancelled'"
        >
          <i class="fas fa-futbol"></i>
          <span>Group Matches</span>
          <small v-if="tournament.status === 'completed'" class="action-note status-info">View Only</small>
          <small v-else-if="tournament.status !== 'active'" class="action-note status-warning">Status: {{ tournament.status }}</small>
        </button>
        
        <!-- Group Standings -->
        <button 
          @click="$emit('toggle-standings')" 
          class="action-card" 
          :class="{ 'action-selected': showStandings }" 
          :disabled="tournament.status === 'draft' || tournament.status === 'cancelled'"
        >
          <i class="fas fa-trophy"></i>
          <span>Group Standings</span>
          <small v-if="tournament.status === 'completed'" class="action-note status-info">View Only</small>
          <small v-else-if="tournament.status !== 'active'" class="action-note status-warning">Status: {{ tournament.status }}</small>
        </button>
        
        <!-- Knockout Matches -->
        <button 
          @click="$emit('toggle-knockout')" 
          class="action-card" 
          :class="{ 'action-selected': showKnockout }" 
          :disabled="tournament.status === 'draft' || tournament.status === 'cancelled'"
        >
          <i class="fas fa-sitemap"></i>
          <span>Knockout Matches</span>
          <small v-if="tournament.status === 'completed'" class="action-note status-info">View Only</small>
          <small v-else-if="tournament.status !== 'active'" class="action-note status-warning">Status: {{ tournament.status }}</small>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TournamentQuickActions',
  props: {
    tournament: {
      type: Object,
      required: true
    },
    showTeamManagement: {
      type: Boolean,
      default: false
    },
    showQualifying: {
      type: Boolean,
      default: false
    },
    showDraw: {
      type: Boolean,
      default: false
    },
    showMatches: {
      type: Boolean,
      default: false
    },
    showStandings: {
      type: Boolean,
      default: false
    },
    showKnockout: {
      type: Boolean,
      default: false
    },
    anyGroupMatchPlayed: {
      type: Boolean,
      default: false
    }
  },
  emits: [
    'toggle-team-management',
    'toggle-qualifying', 
    'activate-tournament',
    'toggle-draw',
    'toggle-matches',
    'toggle-standings',
    'toggle-knockout'
  ]
}
</script>

<style scoped>
.content-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: var(--radius-xl);
  padding: 2rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.full-width {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid rgba(0, 102, 204, 0.1);
}

.card-header h3 {
  font-size: 1.3rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
  margin: 0;
}

.card-header i {
  font-size: 1.5rem;
  color: var(--fifa-gold);
}

.card-content {
  padding: 0;
}

.action-grid-full {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 1.5rem;
  border: 2px solid rgba(0, 102, 204, 0.2);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.5);
  color: var(--fifa-dark-blue);
  font-size: 0.9rem;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  min-height: 120px;
  backdrop-filter: blur(5px);
}

.action-card:hover:not(:disabled) {
  background: rgba(0, 102, 204, 0.1);
  border-color: var(--fifa-blue);
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 102, 204, 0.2);
}

.action-card:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: rgba(200, 200, 200, 0.3);
  border-color: rgba(200, 200, 200, 0.4);
}

.action-card.action-selected {
  background: var(--fifa-blue);
  border-color: var(--fifa-blue);
  color: var(--white);
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 102, 204, 0.3);
}

.action-card i {
  font-size: 2rem;
  margin-bottom: 4px;
}

.action-card span {
  font-size: 1rem;
  line-height: 1.2;
}

.action-note {
  display: block;
  font-size: 0.7rem;
  margin-top: 4px;
  line-height: 1.2;
  opacity: 0.9;
}

.status-info {
  color: #007bff;
}

.status-warning {
  color: #666;
}

.action-card.action-selected .action-note {
  color: rgba(255, 255, 255, 0.9);
}

@media (max-width: 1024px) {
  .action-grid-full {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }
  
  .action-card {
    padding: 1.2rem;
    min-height: 100px;
  }
  
  .action-card i {
    font-size: 1.5rem;
  }
}

@media (max-width: 768px) {
  .action-grid-full {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  }
  
  .action-card {
    padding: 1rem;
    min-height: 90px;
  }
  
  .action-card i {
    font-size: 1.3rem;
  }
  
  .action-card span {
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .action-grid-full {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .action-card {
    padding: 0.75rem;
    min-height: 80px;
  }
}
</style>