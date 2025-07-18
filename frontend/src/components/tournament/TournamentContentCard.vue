<template>
  <div class="content-card glass-white full-width">
    <div class="card-header">
      <h3>{{ title }}</h3>
      <button @click="$emit('close')" class="close-section-btn">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="card-content">
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  name: 'TournamentContentCard',
  props: {
    title: {
      type: String,
      required: true
    }
  },
  emits: ['close']
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
  margin-bottom: 2rem;
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

.close-section-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(220, 53, 69, 0.1);
  color: #dc3545;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-section-btn:hover {
  background: rgba(220, 53, 69, 0.2);
  transform: scale(1.1);
}

.card-content {
  padding: 0;
}

@media (max-width: 768px) {
  .content-card {
    padding: 1.5rem;
  }
}
</style>