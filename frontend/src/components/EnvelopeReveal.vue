<template>
  <div class="envelope-container" v-if="show">
    <div class="backdrop" @click="skipAnimation"></div>
    
    <!-- FIFA Logo and Setup -->
    <div class="ceremony-setup">
      <div class="fifa-logo">
        <div class="fifa-text">FIFA</div>
        <div class="congress-text">World Cup Host Selection</div>
      </div>
      
      <div class="presenter">
        <div class="presenter-avatar">👤</div>
        <div class="presenter-name">FIFA President</div>
      </div>
    </div>

    <!-- Envelope Animation -->
    <div class="envelope-stage">
      <div class="envelope" :class="{ 'opening': isOpening, 'opened': isOpened }">
        <!-- Envelope Back -->
        <div class="envelope-back"></div>
        
        <!-- Envelope Flap -->
        <div class="envelope-flap" :class="{ 'opening': isOpening }">
          <div class="wax-seal" :class="{ 'breaking': isOpening }">
            <div class="seal-fifa">FIFA</div>
          </div>
        </div>
        
        <!-- Envelope Front -->
        <div class="envelope-front">
          <div class="envelope-text">
            <div class="year">{{ year }}</div>
            <div class="title">FIFA World Cup</div>
            <div class="subtitle">Host Selection Results</div>
          </div>
        </div>
        
        <!-- Result Card (slides out) -->
        <div class="result-card" :class="{ 'revealing': isRevealing, 'revealed': isRevealed }">
          <div class="card-content">
            <div class="host-announcement">
              <div class="winning-country">
                <CountryFlag :country-code="winner?.code" :size="64" />
                <div class="country-name">{{ winner?.name }}</div>
              </div>
              <div class="announcement-text">
                <div class="primary-text">{{ year }} FIFA World Cup</div>
                <div class="secondary-text">Host Country</div>
              </div>
              <div class="confetti-burst">
                <div v-for="i in 20" :key="i" class="confetti" :style="getConfettiStyle(i)"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Spotlight Effect -->
      <div class="spotlight" :class="{ 'active': isOpening }"></div>
    </div>

    <!-- Action Buttons -->
    <div class="ceremony-actions" v-if="isRevealed">
      <button @click="skipAnimation" class="btn-secondary">
        <i class="fas fa-forward"></i>
        Continue
      </button>
    </div>

    <!-- Progress Indicator -->
    <div class="progress-indicator" v-if="!isRevealed">
      <div class="progress-text">{{ progressText }}</div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      </div>
      <button @click="skipAnimation" class="skip-btn">
        <i class="fas fa-fast-forward"></i>
        Skip Animation
      </button>
    </div>
  </div>
</template>

<script>
import CountryFlag from './CountryFlag.vue'

export default {
  name: 'EnvelopeReveal',
  components: {
    CountryFlag
  },
  props: {
    show: {
      type: Boolean,
      default: false
    },
    winner: {
      type: Object,
      required: true
    },
    year: {
      type: [String, Number],
      required: true
    }
  },
  data() {
    return {
      isOpening: false,
      isOpened: false,
      isRevealing: false,
      isRevealed: false,
      progress: 0,
      progressText: 'Preparing ceremony...'
    }
  },
  watch: {
    show(newVal) {
      if (newVal) {
        this.startAnimation()
      } else {
        this.resetAnimation()
      }
    }
  },
  methods: {
    async startAnimation() {
      // Reset all states
      this.resetAnimation()
      
      // Step 1: Setup and anticipation
      this.progressText = 'Preparing ceremony...'
      await this.animateProgress(0, 20, 1500)
      
      // Step 2: Opening the envelope
      this.progressText = 'Opening the envelope...'
      this.isOpening = true
      await this.animateProgress(20, 60, 2500)
      
      // Step 3: Envelope opened, card sliding out
      this.progressText = 'Revealing the host...'
      this.isOpened = true
      this.isRevealing = true
      await this.animateProgress(60, 90, 2000)
      
      // Step 4: Full reveal
      this.progressText = 'Announcing the winner!'
      this.isRevealed = true
      await this.animateProgress(90, 100, 1000)
      
      // Auto-continue after a few seconds
      setTimeout(() => {
        if (this.isRevealed) {
          this.skipAnimation()
        }
      }, 4000)
    },
    
    async animateProgress(start, end, duration) {
      return new Promise((resolve) => {
        const startTime = Date.now()
        const animate = () => {
          const elapsed = Date.now() - startTime
          const progress = Math.min(elapsed / duration, 1)
          this.progress = start + (end - start) * this.easeInOutCubic(progress)
          
          if (progress < 1) {
            requestAnimationFrame(animate)
          } else {
            resolve()
          }
        }
        animate()
      })
    },
    
    easeInOutCubic(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    },
    
    resetAnimation() {
      this.isOpening = false
      this.isOpened = false
      this.isRevealing = false
      this.isRevealed = false
      this.progress = 0
      this.progressText = 'Preparing ceremony...'
    },
    
    skipAnimation() {
      this.$emit('complete')
    },
    
    getConfettiStyle(index) {
      const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8']
      const angle = (index / 20) * 360
      const distance = 100 + Math.random() * 50
      const delay = Math.random() * 2
      
      return {
        backgroundColor: colors[index % colors.length],
        transform: `rotate(${angle}deg) translateY(-${distance}px)`,
        animationDelay: `${delay}s`
      }
    }
  }
}
</script>

<style scoped>
.envelope-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  overflow: hidden;
}

.backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(ellipse at center, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.3) 100%);
}

.ceremony-setup {
  position: absolute;
  top: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  z-index: 10;
}

.fifa-logo {
  text-align: center;
  color: white;
}

.fifa-text {
  font-size: 48px;
  font-weight: bold;
  background: linear-gradient(45deg, #FFD700, #FFA500);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
  margin-bottom: 8px;
}

.congress-text {
  font-size: 18px;
  color: rgba(255,255,255,0.8);
  text-transform: uppercase;
  letter-spacing: 2px;
}

.presenter {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.presenter-avatar {
  font-size: 32px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}

.presenter-name {
  color: rgba(255,255,255,0.7);
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.envelope-stage {
  position: relative;
  width: 400px;
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.envelope {
  position: relative;
  width: 350px;
  height: 220px;
  transform-style: preserve-3d;
  transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.envelope.opening {
  transform: scale(1.1);
}

.envelope.opened {
  transform: scale(1.1) rotateY(5deg);
}

.envelope-back {
  position: absolute;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f5f5f5, #e0e0e0);
  border-radius: 8px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
  border: 2px solid #d0d0d0;
}

.envelope-front {
  position: absolute;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #ffffff, #f8f8f8);
  border-radius: 8px;
  border: 2px solid #d0d0d0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.envelope-text {
  text-align: center;
  color: #333;
}

.envelope-text .year {
  font-size: 32px;
  font-weight: bold;
  color: #2c5aa0;
  margin-bottom: 8px;
}

.envelope-text .title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 4px;
}

.envelope-text .subtitle {
  font-size: 14px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.envelope-flap {
  position: absolute;
  width: 100%;
  height: 120px;
  top: -60px;
  left: 0;
  background: linear-gradient(135deg, #e0e0e0, #c0c0c0);
  border-radius: 8px 8px 0 0;
  transform-origin: bottom center;
  transition: transform 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  z-index: 3;
  border: 2px solid #d0d0d0;
  border-bottom: none;
}

.envelope-flap.opening {
  transform: rotateX(-180deg);
}

.wax-seal {
  position: absolute;
  bottom: -15px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 40px;
  background: radial-gradient(circle, #dc2626, #991b1b);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 10px;
  font-weight: bold;
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  transition: all 1s ease;
}

.wax-seal.breaking {
  transform: translateX(-50%) scale(0);
  opacity: 0;
}

.result-card {
  position: absolute;
  width: 300px;
  height: 180px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  top: 20px;
  left: 25px;
  transform: translateY(100px);
  transition: transform 2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 0 15px 35px rgba(0,0,0,0.4);
  z-index: 1;
}

.result-card.revealing {
  transform: translateY(50px);
}

.result-card.revealed {
  transform: translateY(0);
}

.card-content {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  position: relative;
}

.winning-country {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.country-name {
  color: white;
  font-size: 24px;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.announcement-text .primary-text {
  color: #FFD700;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 4px;
}

.announcement-text .secondary-text {
  color: rgba(255,255,255,0.8);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.confetti-burst {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.confetti {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  animation: confettiFall 3s ease-out infinite;
}

@keyframes confettiFall {
  0% {
    opacity: 1;
    transform: rotate(0deg) translateY(0);
  }
  100% {
    opacity: 0;
    transform: rotate(720deg) translateY(-150px);
  }
}

.spotlight {
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0);
  transition: transform 1s ease-out;
  pointer-events: none;
}

.spotlight.active {
  transform: translate(-50%, -50%) scale(1);
}

.ceremony-actions {
  position: absolute;
  bottom: 100px;
  display: flex;
  gap: 16px;
}

.progress-indicator {
  position: absolute;
  bottom: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  min-width: 300px;
}

.progress-text {
  color: white;
  font-size: 16px;
  text-align: center;
  opacity: 0.9;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(255,255,255,0.2);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FFD700, #FFA500);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.skip-btn {
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  color: rgba(255,255,255,0.7);
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.skip-btn:hover {
  background: rgba(255,255,255,0.2);
  color: white;
}

.btn-secondary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

.btn-secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.3);
}

/* Responsive Design */
@media (max-width: 768px) {
  .envelope-stage {
    width: 300px;
    height: 200px;
  }
  
  .envelope {
    width: 280px;
    height: 180px;
  }
  
  .result-card {
    width: 240px;
    height: 140px;
    left: 20px;
    top: 20px;
  }
  
  .fifa-text {
    font-size: 36px;
  }
  
  .congress-text {
    font-size: 14px;
  }
  
  .country-name {
    font-size: 18px;
  }
}
</style>