<template>
  <div class="confederation-tabs">
    <button 
      v-for="confederation in confederations" 
      :key="confederation.id"
      @click="$emit('confederation-change', confederation.id)"
      :class="['tab-button', { active: activeConfederation === confederation.id }]"
      :style="{ '--conf-color': confederation.color }"
    >
      <span class="tab-flag">{{ confederation.flag }}</span>
      <span class="tab-name">{{ confederation.name }}</span>
      <span class="tab-slots">{{ Math.floor(confederation.qualificationSlots) }} slots</span>
    </button>
  </div>
</template>

<script>
export default {
  name: 'ConfederationTabs',
  props: {
    confederations: {
      type: Array,
      required: true
    },
    activeConfederation: {
      type: String,
      required: true
    }
  },
  emits: ['confederation-change']
}
</script>

<style scoped>
.confederation-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  align-items: center;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.1);
  color: var(--white);
  font-size: 0.85rem;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  min-width: 0;
  backdrop-filter: blur(10px);
}

.tab-button:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

.tab-button.active {
  background: var(--conf-color, var(--fifa-blue));
  border-color: var(--conf-color, var(--fifa-blue));
  color: var(--white);
  font-weight: var(--font-weight-bold);
}

.tab-flag {
  font-size: 1.1rem;
  flex-shrink: 0;
}

.tab-name {
  font-weight: var(--font-weight-semibold);
  min-width: 0;
}

.tab-slots {
  font-size: 0.75rem;
  opacity: 0.9;
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 10px;
  flex-shrink: 0;
}

.tab-button.active .tab-slots {
  background: rgba(255, 255, 255, 0.3);
}

@media (max-width: 768px) {
  .confederation-tabs {
    justify-content: center;
  }
  
  .tab-button {
    flex-direction: column;
    text-align: center;
    padding: 8px 10px;
    gap: 4px;
  }
  
  .tab-name {
    font-size: 0.75rem;
  }
}
</style>