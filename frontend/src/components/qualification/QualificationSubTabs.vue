<template>
  <div class="sub-navigation">
    <button 
      @click="$emit('tab-change', 'groups')"
      :class="['sub-tab', { active: activeTab === 'groups' }]"
    >
      <i class="fas fa-layer-group"></i>
      Groups & Standings
    </button>
    <button 
      @click="$emit('tab-change', 'matches')"
      :class="['sub-tab', { active: activeTab === 'matches' }]"
    >
      <i class="fas fa-futbol"></i>
      Matches
    </button>
    <button 
      v-if="showPlayoffTab"
      @click="$emit('tab-change', 'playoff')"
      :class="['sub-tab', { active: activeTab === 'playoff' }]"
    >
      <i class="fas fa-medal"></i>
      Play off
    </button>
    <button 
      @click="$emit('tab-change', 'qualified')"
      :class="['sub-tab', { active: activeTab === 'qualified' }]"
    >
      <i class="fas fa-trophy"></i>
      Qualified ({{ qualifiedCount }})
    </button>
  </div>
</template>

<script>
export default {
  name: 'QualificationSubTabs',
  props: {
    activeTab: {
      type: String,
      required: true
    },
    showPlayoffTab: {
      type: Boolean,
      default: false
    },
    qualifiedCount: {
      type: Number,
      default: 0
    }
  },
  emits: ['tab-change']
}
</script>

<style scoped>
.sub-navigation {
  display: flex;
  gap: 8px;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 1rem;
}

.sub-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.1);
  color: var(--white);
  font-size: 0.9rem;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.sub-tab:hover {
  background: rgba(255, 255, 255, 0.2);
}

.sub-tab.active {
  background: var(--fifa-blue);
  color: var(--white);
  font-weight: var(--font-weight-bold);
}

.sub-tab i {
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .sub-navigation {
    flex-wrap: wrap;
    gap: 6px;
  }
  
  .sub-tab {
    padding: 8px 12px;
    font-size: 0.85rem;
  }
}
</style>