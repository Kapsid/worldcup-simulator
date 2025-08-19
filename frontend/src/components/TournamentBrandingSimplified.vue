<template>
  <div class="tournament-branding-section">
    <div class="branding-header" @click="toggleSection">
      <h3>
        <i class="fas fa-info-circle"></i>
        Tournament Information
      </h3>
      <button class="toggle-btn">
        <i :class="isOpen ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
      </button>
    </div>
    
    <transition name="slide-fade">
      <div v-if="isOpen" class="branding-content">
        <!-- Host Cities Section - Simplified -->
        <div class="branding-item cities-section" v-if="tournament.hostCities && tournament.hostCities.length > 0">
          <div class="item-header">
            <h4>Host Cities</h4>
            <span class="item-badge">{{ tournament.hostCities.length }} Venues</span>
          </div>
          <div class="cities-list">
            <div v-for="city in tournament.hostCities" :key="city.name" class="city-item-simple">
              <i class="fas fa-map-marker-alt"></i>
              <div class="city-info">
                <span class="city-name">{{ city.name }}</span>
                <span class="city-stadium" v-if="city.stadium">{{ city.stadium }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Color Scheme Section -->
        <div class="branding-item color-section" v-if="tournament.logo?.colorScheme">
          <div class="item-header">
            <h4>Official Colors</h4>
            <span class="item-badge">Tournament Theme</span>
          </div>
          <div class="color-display">
            <div class="color-palette">
              <div 
                class="color-swatch-large" 
                :style="{ backgroundColor: tournament.logo.colorScheme.primary }"
                :title="`Primary: ${tournament.logo.colorScheme.primary}`"
              >
                <span class="color-label">Primary</span>
              </div>
              <div 
                class="color-swatch-large" 
                :style="{ backgroundColor: tournament.logo.colorScheme.secondary }"
                :title="`Secondary: ${tournament.logo.colorScheme.secondary}`"
              >
                <span class="color-label">Secondary</span>
              </div>
              <div 
                class="color-swatch-large" 
                :style="{ backgroundColor: tournament.logo.colorScheme.accent }"
                :title="`Accent: ${tournament.logo.colorScheme.accent}`"
              >
                <span class="color-label">Accent</span>
              </div>
            </div>
            <p class="color-description" v-if="tournament.logo?.colorScheme?.description">
              Inspired by {{ tournament.logo.colorScheme.description }}
            </p>
          </div>
        </div>

        <!-- Simplified Mascot Section -->
        <div class="branding-item mascot-section" v-if="tournament.mascot">
          <div class="item-header">
            <h4>Official Mascot</h4>
            <span class="item-badge">{{ tournament.mascot?.category || 'Character' }}</span>
          </div>
          <div class="mascot-display-simple">
            <div class="mascot-icon">
              <i class="fas fa-star"></i>
            </div>
            <div class="mascot-info">
              <h3 class="mascot-name">{{ tournament.mascot?.name }}</h3>
              <p class="mascot-type" v-if="tournament.mascot?.type">{{ tournament.mascot.type }}</p>
              <p class="mascot-description">{{ tournament.mascot?.description }}</p>
            </div>
          </div>
        </div>

        <!-- Simplified Ball Section -->
        <div class="branding-item ball-section" v-if="tournament.ballDesign">
          <div class="item-header">
            <h4>Official Match Ball</h4>
            <span class="item-badge">{{ tournament.ballDesign?.name }}</span>
          </div>
          <div class="ball-display-simple">
            <div class="ball-visual">
              <img v-if="tournament.ballDesign?.imageUrl" 
                   :src="tournament.ballDesign.imageUrl" 
                   :alt="tournament.ballDesign.name"
                   class="ball-image" />
              <div v-else class="ball-icon">
                <i class="fas fa-futbol"></i>
              </div>
            </div>
            <div class="ball-info">
              <p class="ball-description">{{ tournament.ballDesign?.description }}</p>
              <div class="ball-specs" v-if="tournament.ballDesign?.designElements">
                <span class="spec-tag" v-if="tournament.ballDesign.designElements.pattern">
                  <i class="fas fa-palette"></i> {{ tournament.ballDesign.designElements.pattern }}
                </span>
                <span class="spec-tag" v-if="tournament.ballDesign.designElements.technology">
                  <i class="fas fa-cog"></i> {{ tournament.ballDesign.designElements.technology }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'TournamentBrandingSimplified',
  props: {
    tournament: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      isOpen: false
    }
  },
  methods: {
    toggleSection() {
      this.isOpen = !this.isOpen
    }
  }
}
</script>

<style scoped>
.tournament-branding-section {
  background: var(--white);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-soft);
  overflow: hidden;
  margin-top: 32px;
  margin-bottom: 24px;
}

.branding-header {
  padding: 20px 24px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.3s ease;
}

.branding-header:hover {
  background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
}

.branding-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: var(--fifa-dark-blue);
  display: flex;
  align-items: center;
  gap: 12px;
}

.branding-header i {
  color: var(--fifa-gold);
}

.toggle-btn {
  background: none;
  border: none;
  color: var(--fifa-blue);
  font-size: 1.2rem;
  cursor: pointer;
  padding: 8px;
  transition: transform 0.3s ease;
}

.toggle-btn:hover {
  transform: scale(1.1);
}

.branding-content {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.branding-item {
  padding: 24px;
  background: #f8f9fa;
  border-radius: var(--radius-lg);
  border: 1px solid #e9ecef;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.item-header h4 {
  margin: 0;
  color: var(--fifa-dark-blue);
  font-size: 1.1rem;
}

.item-badge {
  background: var(--fifa-blue);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

/* Cities Section */
.cities-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
}

.city-item-simple {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  background: white;
  border-radius: var(--radius-md);
  border: 1px solid #e9ecef;
}

.city-item-simple i {
  color: var(--fifa-blue);
  margin-top: 2px;
}

.city-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.city-name {
  font-weight: 600;
  color: var(--fifa-dark-blue);
}

.city-stadium {
  font-size: 0.85rem;
  color: var(--gray);
}

/* Color Section */
.color-display {
  text-align: center;
}

.color-palette {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;
}

.color-swatch-large {
  width: 100px;
  height: 100px;
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: transform 0.2s ease;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 8px;
  position: relative;
  overflow: hidden;
}

.color-swatch-large:hover {
  transform: scale(1.05);
}

.color-label {
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  backdrop-filter: blur(4px);
}

.color-description {
  color: var(--gray);
  font-style: italic;
  margin: 0;
}

/* Mascot Section */
.mascot-display-simple {
  display: flex;
  align-items: flex-start;
  gap: 24px;
}

.mascot-icon {
  width: 80px;
  height: 80px;
  background: var(--fifa-gold);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
}

.mascot-icon i {
  font-size: 2.5rem;
  color: white;
}

.mascot-info {
  flex: 1;
}

.mascot-name {
  margin: 0 0 8px 0;
  color: var(--fifa-dark-blue);
  font-size: 1.3rem;
}

.mascot-type {
  margin: 0 0 12px 0;
  color: var(--fifa-blue);
  font-weight: 600;
  text-transform: capitalize;
}

.mascot-description {
  margin: 0;
  color: var(--gray);
  line-height: 1.6;
}

/* Ball Section */
.ball-display-simple {
  display: flex;
  align-items: flex-start;
  gap: 24px;
}

.ball-visual {
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ball-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));
}

.ball-icon {
  width: 80px;
  height: 80px;
  background: var(--fifa-blue);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(30, 136, 229, 0.3);
}

.ball-icon i {
  font-size: 2.5rem;
  color: white;
}

.ball-info {
  flex: 1;
}

.ball-description {
  margin: 0 0 16px 0;
  color: var(--gray);
  line-height: 1.6;
}

.ball-specs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.spec-tag {
  background: white;
  border: 1px solid #dee2e6;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  color: var(--gray);
  display: flex;
  align-items: center;
  gap: 6px;
}

.spec-tag i {
  color: var(--fifa-blue);
  font-size: 0.8rem;
}

/* Transitions */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .cities-list {
    grid-template-columns: 1fr;
  }
  
  .color-palette {
    gap: 12px;
  }
  
  .color-swatch-large {
    width: 80px;
    height: 80px;
  }
  
  .mascot-display-simple,
  .ball-display-simple {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .ball-visual {
    margin-bottom: 16px;
  }
}

@media (max-width: 640px) {
  .branding-content {
    padding: 16px;
    gap: 16px;
  }
  
  .branding-item {
    padding: 16px;
  }
}
</style>