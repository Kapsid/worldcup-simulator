<template>
  <div class="feature-card glass-white" :class="`color-${color}`">
    <div class="card-header">
      <div class="feature-icon">
        <i :class="icon"></i>
      </div>
      <h3>{{ title }}</h3>
    </div>
    <p>{{ description }}</p>
    <div class="card-action">
      <button class="explore-btn">
        <span>Explore</span>
        <i class="fas fa-arrow-right"></i>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FeatureCard',
  props: {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      required: true
    },
    color: {
      type: String,
      default: 'blue'
    }
  }
}
</script>

<style scoped>
.feature-card {
  transition: transform 0.3s ease;
  position: relative;
  overflow: hidden;
}

.feature-card:hover {
  transform: translateY(-4px);
}

.accent-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  transition: height 0.3s ease;
}

.feature-card:hover .accent-line {
  height: 6px;
}
</style>