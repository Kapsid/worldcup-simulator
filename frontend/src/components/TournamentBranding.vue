<template>
  <div class="tournament-branding-section" :class="{ 'tournament-themed': tournament?.logo?.colorScheme }">
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
        <!-- Host Cities Section -->
        <div class="branding-item cities-section" v-if="tournament.hostCities && tournament.hostCities.length > 0">
          <div class="item-header">
            <h4>Host Cities</h4>
            <span class="item-badge">Tournament Venues</span>
          </div>
          <div class="cities-display">
            <!-- Interactive Map -->
            <TournamentCitiesMap 
              :cities="tournament.hostCities" 
              :host-country="tournament.hostCountry?.name || tournament.hostCountry"
            />
            
          </div>
        </div>

        <!-- Logo Section -->
        <div class="branding-item logo-section">
          <div class="item-header">
            <h4>Official Logo</h4>
            <span class="item-badge">Visual Identity</span>
          </div>
          <div class="logo-display">
            <div class="logo-image">
              <img :src="tournament.logo?.imageUrl" :alt="`${tournament.name} Logo`" />
            </div>
            <div class="logo-details">
              <p class="logo-description">{{ tournament.logo?.description }}</p>
              <div v-if="tournament.logo?.colorScheme" class="color-scheme">
                <h5>Official Colors:</h5>
                <div class="color-palette">
                  <div 
                    class="color-swatch" 
                    :style="{ backgroundColor: tournament.logo.colorScheme.primary }"
                    :title="`Primary: ${tournament.logo.colorScheme.primary}`"
                  ></div>
                  <div 
                    class="color-swatch" 
                    :style="{ backgroundColor: tournament.logo.colorScheme.secondary }"
                    :title="`Secondary: ${tournament.logo.colorScheme.secondary}`"
                  ></div>
                  <div 
                    class="color-swatch" 
                    :style="{ backgroundColor: tournament.logo.colorScheme.accent }"
                    :title="`Accent: ${tournament.logo.colorScheme.accent}`"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Enhanced Mascot Section -->
        <div class="branding-item mascot-section">
          <div class="item-header">
            <h4>Official Mascot</h4>
            <span class="item-badge">Tournament Ambassador</span>
          </div>
          <div class="mascot-display">
            <div class="mascot-visual">
              <div class="mascot-image">
                <img :src="tournament.mascot?.imageUrl" :alt="tournament.mascot?.name" />
              </div>
              <h3 class="mascot-name">{{ tournament.mascot?.name }}</h3>
              <div class="mascot-meta" v-if="tournament.mascot?.type || tournament.mascot?.category">
                <span v-if="tournament.mascot?.category" class="mascot-category">{{ tournament.mascot.category }}</span>
                <span v-if="tournament.mascot?.type" class="mascot-type">{{ tournament.mascot.type }}</span>
              </div>
              <p v-if="tournament.mascot?.imageDescription" class="mascot-image-desc">{{ tournament.mascot.imageDescription }}</p>
            </div>
            <div class="mascot-details">
              <div class="mascot-info-block">
                <div class="mascot-info-section">
                  <h5><i class="fas fa-info-circle"></i> About</h5>
                  <p>{{ tournament.mascot?.description }}</p>
                </div>
                <div class="mascot-info-section">
                  <h5><i class="fas fa-heart"></i> Personality</h5>
                  <p>{{ tournament.mascot?.personality }}</p>
                </div>
                <div class="mascot-info-section">
                  <h5><i class="fas fa-book-open"></i> Backstory</h5>
                  <p>{{ tournament.mascot?.backstory }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Official Ball Section -->
        <div class="branding-item ball-section" v-if="tournament.ballDesign">
          <div class="item-header">
            <h4>Official Tournament Ball</h4>
            <span class="item-badge">Match Ball</span>
          </div>
          <div class="ball-display">
            <div class="ball-visual">
              <div class="ball-image">
                <img :src="tournament.ballDesign?.imageUrl" :alt="tournament.ballDesign?.name" />
              </div>
              <h3 class="ball-name">{{ tournament.ballDesign?.name }}</h3>
              <div class="ball-tech" v-if="tournament.ballDesign?.designElements?.technology">
                <span class="tech-badge">{{ tournament.ballDesign.designElements.technology }}</span>
              </div>
            </div>
            <div class="ball-details">
              <div class="ball-info-block">
                <h5><i class="fas fa-futbol"></i> Design Description</h5>
                <p>{{ tournament.ballDesign?.description }}</p>
              </div>
              <div class="ball-info-block" v-if="tournament.ballDesign?.designElements">
                <h5><i class="fas fa-palette"></i> Design Elements</h5>
                <div class="design-details">
                  <div class="detail-item">
                    <strong>Pattern:</strong> {{ tournament.ballDesign.designElements.pattern }}
                  </div>
                  <div class="detail-item">
                    <strong>Inspiration:</strong> {{ tournament.ballDesign.designElements.inspiration }}
                  </div>
                  <div class="detail-item">
                    <strong>Panel Count:</strong> {{ tournament.ballDesign.designElements.panelCount }}
                  </div>
                </div>
              </div>
              <div class="ball-info-block" v-if="tournament.ballDesign?.specifications">
                <h5><i class="fas fa-cogs"></i> Technical Specifications</h5>
                <div class="specs-grid">
                  <div class="spec-item">
                    <span class="spec-label">Circumference:</span>
                    <span class="spec-value">{{ tournament.ballDesign.specifications.circumference }}</span>
                  </div>
                  <div class="spec-item">
                    <span class="spec-label">Weight:</span>
                    <span class="spec-value">{{ tournament.ballDesign.specifications.weight }}</span>
                  </div>
                  <div class="spec-item">
                    <span class="spec-label">Pressure:</span>
                    <span class="spec-value">{{ tournament.ballDesign.specifications.pressure }}</span>
                  </div>
                  <div class="spec-item">
                    <span class="spec-label">Technology:</span>
                    <span class="spec-value">{{ tournament.ballDesign.specifications.technology }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Anthem Section - Hidden for now -->
        <!-- <div class="branding-item anthem-section">
          <div class="item-header">
            <h4>Official Anthem</h4>
            <span class="item-badge">Tournament Song</span>
          </div>
          <div class="anthem-display">
            <div class="anthem-header">
              <div class="anthem-title">
                <i class="fas fa-music"></i>
                <h3>"{{ tournament.anthem?.title }}"</h3>
              </div>
              <div class="anthem-meta">
                <span class="style-tag">{{ tournament.anthem?.style }}</span>
                <span class="duration">
                  <i class="fas fa-clock"></i>
                  {{ tournament.anthem?.duration }}
                </span>
              </div>
            </div>
            <div class="anthem-lyrics">
              <pre>{{ tournament.anthem?.lyrics }}</pre>
            </div>
            <div class="anthem-player">
              <button class="play-btn" @click="toggleAnthem" :disabled="!canPlay" :title="canPlay ? 'Play anthem with text-to-speech' : 'Text-to-speech not supported in your browser'">
                <i :class="playing ? 'fas fa-pause' : 'fas fa-play'"></i>
                {{ playing ? 'Pause' : 'Play Anthem' }}
              </button>
              <div class="player-options">
                <label class="voice-option">
                  <input type="checkbox" v-model="useMusicalSpeech" />
                  Musical speech rhythm
                </label>
              </div>
              <span v-if="!canPlay" class="player-note">Text-to-speech not available in your browser</span>
            </div>
          </div>
        </div> -->
      </div>
    </transition>
  </div>
</template>

<script>
import TournamentCitiesMap from './TournamentCitiesMap.vue'

export default {
  name: 'TournamentBranding',
  components: {
    TournamentCitiesMap
  },
  props: {
    tournament: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      isOpen: false,
      playing: false,
      useMusicalSpeech: true,
      speechUtterance: null,
      canPlay: false,
      currentLineIndex: 0
    }
  },
  mounted() {
    // Check if text-to-speech is available
    this.canPlay = 'speechSynthesis' in window
  },
  methods: {
    toggleSection() {
      this.isOpen = !this.isOpen
    },
    
    getCountryDetails(countryCode) {
      // This should ideally come from a countries store or API
      // For now, return basic info or fetch from countries API
      return null // Will be populated by parent component or API call
    },
    
    getCountryFlag(countryCode) {
      // Basic flag mapping - should be expanded or fetched from API
      const flagMap = {
        'USA': '🇺🇸',
        'GER': '🇩🇪',
        'FRA': '🇫🇷',
        'BRA': '🇧🇷',
        'ESP': '🇪🇸',
        'ITA': '🇮🇹',
        'ENG': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
        'ARG': '🇦🇷',
        'RUS': '🇷🇺',
        'CHN': '🇨🇳',
        'JPN': '🇯🇵',
        'AUS': '🇦🇺',
        'CAN': '🇨🇦',
        'MEX': '🇲🇽'
      }
      return flagMap[countryCode] || '🏴'
    },
    
    getConfederationName(confederation) {
      const confederationNames = {
        'uefa': 'UEFA (Europe)',
        'conmebol': 'CONMEBOL (South America)',
        'concacaf': 'CONCACAF (North & Central America)',
        'afc': 'AFC (Asia)',
        'caf': 'CAF (Africa)',
        'ofc': 'OFC (Oceania)'
      }
      return confederationNames[confederation] || confederation?.toUpperCase()
    },
    toggleAnthem() {
      if (!this.canPlay) return
      
      if (this.playing) {
        this.stopAnthem()
      } else {
        this.playAnthem()
      }
    },
    
    playAnthem() {
      if (!this.tournament.anthem?.lyrics) return
      
      // Stop any existing speech
      window.speechSynthesis.cancel()
      
      if (this.useMusicalSpeech) {
        this.playMusicalAnthem()
      } else {
        this.playSimpleAnthem()
      }
    },

    playMusicalAnthem() {
      // Process lyrics for musical delivery
      const lyrics = this.tournament.anthem.lyrics
      const lines = lyrics.split('\n').filter(line => line.trim())
      
      this.playing = true
      this.currentLineIndex = 0
      
      this.playNextMusicalLine(lines)
    },

    playNextMusicalLine(lines) {
      if (this.currentLineIndex >= lines.length || !this.playing) {
        this.playing = false
        return
      }

      const line = lines[this.currentLineIndex].trim()
      
      // Skip empty lines and section headers
      if (!line || line.match(/^\[.*\]$/)) {
        this.currentLineIndex++
        setTimeout(() => this.playNextMusicalLine(lines), 500)
        return
      }

      // Add musical pauses and emphasis
      let musicalLine = this.makeLineMusical(line)
      
      const utterance = new SpeechSynthesisUtterance(musicalLine)
      
      // Musical settings
      utterance.rate = 0.5 // Much slower for singing feel
      utterance.pitch = 1.3 // Higher pitch
      utterance.volume = 0.9
      
      // Try to get a good voice
      const voices = window.speechSynthesis.getVoices()
      const preferredVoice = voices.find(voice => 
        (voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('samantha')) && 
        voice.lang.startsWith('en')
      ) || voices.find(voice => voice.lang.startsWith('en'))
      
      if (preferredVoice) {
        utterance.voice = preferredVoice
      }

      utterance.onend = () => {
        this.currentLineIndex++
        
        // Add pause between lines (longer for chorus/verse breaks)
        const nextLine = lines[this.currentLineIndex]
        const pauseDuration = this.determinePauseDuration(line, nextLine)
        
        setTimeout(() => this.playNextMusicalLine(lines), pauseDuration)
      }

      utterance.onerror = () => {
        this.playing = false
        console.error('Speech synthesis error')
      }

      window.speechSynthesis.speak(utterance)
    },

    makeLineMusical(line) {
      // Add musical emphasis and pauses
      let musical = line
        // Extend vowels for singing effect
        .replace(/dream/gi, 'dreeeeam')
        .replace(/goal/gi, 'goooal')
        .replace(/heart/gi, 'heaaart')
        .replace(/world/gi, 'woooorld')
        .replace(/cup/gi, 'cuuup')
        .replace(/champion/gi, 'champiooon')
        .replace(/together/gi, 'togetheeer')
        .replace(/unite/gi, 'uniiiite')
        .replace(/rise/gi, 'riiise')
        .replace(/glory/gi, 'gloooory')
        
        // Add dramatic pauses
        .replace(/!/g, '! ...')
        .replace(/\?/g, '? ...')
        .replace(/,/g, ', ...')
        
        // Emphasize repeated words (Oh-oh-oh)
        .replace(/oh-oh-oh/gi, 'Ohhh, Ohhh, Ohhhhh')
        .replace(/la-la-la/gi, 'Laaa, Laaa, Laaaa')
      
      return musical
    },

    determinePauseDuration(currentLine, nextLine) {
      // Longer pauses for section transitions
      if (nextLine && nextLine.match(/^\[.*\]$/)) return 1500
      if (currentLine.includes('!') || currentLine.includes('Chorus')) return 1200
      if (currentLine.includes('oh-oh-oh') || currentLine.includes('la-la-la')) return 1000
      return 800 // Standard pause between lines
    },

    playSimpleAnthem() {
      // Simple speech version
      let lyrics = this.tournament.anthem.lyrics
        .replace(/\[.*?\]/g, '') // Remove [Verse], [Chorus] etc
        .replace(/\n\n+/g, '\n') // Reduce multiple line breaks
        .trim()
      
      this.speechUtterance = new SpeechSynthesisUtterance(lyrics)
      
      this.speechUtterance.rate = 0.8
      this.speechUtterance.pitch = 1.1
      this.speechUtterance.volume = 0.8
      
      const voices = window.speechSynthesis.getVoices()
      const preferredVoice = voices.find(voice => 
        voice.lang.startsWith('en') && voice.name.toLowerCase().includes('female')
      ) || voices.find(voice => voice.lang.startsWith('en'))
      
      if (preferredVoice) {
        this.speechUtterance.voice = preferredVoice
      }
      
      this.speechUtterance.onstart = () => {
        this.playing = true
      }
      
      this.speechUtterance.onend = () => {
        this.playing = false
        this.speechUtterance = null
      }
      
      this.speechUtterance.onerror = () => {
        this.playing = false
        this.speechUtterance = null
        console.error('Speech synthesis error')
      }
      
      window.speechSynthesis.speak(this.speechUtterance)
    },
    
    stopAnthem() {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel()
      }
      this.playing = false
      this.speechUtterance = null
    }
  },
  
  beforeUnmount() {
    // Clean up speech synthesis
    this.stopAnthem()
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
  gap: 32px;
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
.cities-display {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.cities-header {
  padding: 20px;
  background: white;
  border-radius: var(--radius-lg);
  border-left: 4px solid var(--fifa-gold);
}

.host-country-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.country-flag-small {
  font-size: 2rem;
}

.host-country-name {
  color: var(--fifa-dark-blue);
  font-size: 1.3rem;
  margin: 0;
  font-weight: 700;
}

.cities-description {
  color: var(--gray);
  line-height: 1.6;
  margin: 0;
  font-size: 1rem;
}

.cities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.city-item {
  padding: 20px;
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid #e9ecef;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.city-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.city-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f8f9fa;
}

.city-header i {
  color: var(--fifa-blue);
  font-size: 1.1rem;
}

.city-name {
  color: var(--fifa-dark-blue);
  font-size: 1.1rem;
  margin: 0;
  font-weight: 600;
}

.city-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.city-stadium,
.city-capacity,
.city-population {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--gray);
  font-size: 0.9rem;
}

.city-stadium i,
.city-capacity i,
.city-population i {
  color: var(--fifa-blue);
  width: 16px;
  font-size: 0.9rem;
}

/* Logo Section */
.logo-display {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 24px;
  align-items: start;
}

.logo-image {
  width: 200px;
  height: 200px;
  background: white;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 2px solid #e9ecef;
}

.logo-image img {
  max-width: 160px;
  max-height: 160px;
  object-fit: contain;
}

.logo-description {
  color: var(--gray);
  line-height: 1.6;
  margin-bottom: 20px;
}

.logo-elements h5,
.color-scheme h5 {
  color: var(--fifa-dark-blue);
  font-size: 0.9rem;
  margin: 0 0 12px 0;
}

.element-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.element-tag {
  background: white;
  border: 1px solid #dee2e6;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.85rem;
  color: var(--gray);
}

.color-scheme {
  margin-top: 20px;
}

.color-palette {
  display: flex;
  gap: 12px;
}

.color-swatch {
  width: 50px;
  height: 50px;
  border-radius: var(--radius-md);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: transform 0.2s ease;
}

.color-swatch:hover {
  transform: scale(1.1);
}

/* Mascot Section */
.mascot-display {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 32px;
}

.mascot-visual {
  text-align: center;
}

.mascot-image {
  width: 200px;
  height: 200px;
  margin: 0 auto 16px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  border: 4px solid var(--fifa-gold);
}

.mascot-image img {
  width: 160px;
  height: 160px;
  object-fit: cover;
  border-radius: 50%;
}

.mascot-name {
  color: var(--fifa-dark-blue);
  font-size: 1.3rem;
  margin: 0 0 12px 0;
}

.mascot-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.mascot-category {
  background: var(--fifa-gold);
  color: white;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 600;
  text-align: center;
}

.mascot-type {
  background: var(--fifa-blue);
  color: white;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 500;
  text-align: center;
  text-transform: capitalize;
}

.mascot-image-desc {
  color: var(--gray);
  font-size: 0.85rem;
  line-height: 1.4;
  margin: 0;
  text-align: center;
  font-style: italic;
}

.mascot-info-block {
  padding: 20px;
  background: white;
  border-radius: var(--radius-md);
}

.mascot-info-section {
  margin-bottom: 20px;
}

.mascot-info-section:last-child {
  margin-bottom: 0;
}

.mascot-info-block h5 {
  color: var(--fifa-blue);
  font-size: 0.95rem;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.mascot-info-block p {
  color: var(--gray);
  line-height: 1.6;
  margin: 0;
}

/* Ball Section */
.ball-display {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 32px;
}

.ball-visual {
  text-align: center;
}

.ball-image {
  width: 200px;
  height: 200px;
  margin: 0 auto 16px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  border: 4px solid var(--fifa-blue);
  position: relative;
  overflow: hidden;
}

.ball-image::before {
  content: '';
  position: absolute;
  top: 20%;
  left: 20%;
  width: 60%;
  height: 60%;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3), transparent 50%);
  border-radius: 50%;
  pointer-events: none;
}

.ball-image img {
  width: 160px;
  height: 160px;
  object-fit: cover;
  border-radius: 50%;
}

.ball-name {
  color: var(--fifa-dark-blue);
  font-size: 1.3rem;
  margin: 0 0 12px 0;
  font-weight: 700;
}

.ball-tech {
  margin-bottom: 16px;
}

.tech-badge {
  background: linear-gradient(135deg, var(--fifa-blue), var(--fifa-gold));
  color: white;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.ball-info-block {
  margin-bottom: 24px;
  padding: 20px;
  background: white;
  border-radius: var(--radius-md);
  border-left: 4px solid var(--fifa-blue);
}

.ball-info-block h5 {
  color: var(--fifa-blue);
  font-size: 1rem;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.ball-info-block p {
  color: var(--gray);
  line-height: 1.6;
  margin: 0;
}

.design-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 0.9rem;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item strong {
  color: var(--fifa-dark-blue);
  font-weight: 600;
}

.specs-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.spec-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: var(--radius-sm);
}

.spec-label {
  font-size: 0.8rem;
  color: var(--fifa-blue);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.spec-value {
  font-size: 0.9rem;
  color: var(--fifa-dark-blue);
  font-weight: 500;
}

/* Anthem Section */
.anthem-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e9ecef;
}

.anthem-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.anthem-title i {
  color: var(--fifa-gold);
  font-size: 1.5rem;
}

.anthem-title h3 {
  margin: 0;
  color: var(--fifa-dark-blue);
  font-style: italic;
}

.anthem-meta {
  display: flex;
  align-items: center;
  gap: 16px;
}

.style-tag {
  background: var(--fifa-blue);
  color: white;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.duration {
  color: var(--gray);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

.anthem-lyrics {
  background: white;
  padding: 24px;
  border-radius: var(--radius-lg);
  margin-bottom: 20px;
  max-height: 400px;
  overflow-y: auto;
}

.anthem-lyrics pre {
  font-family: 'Georgia', serif;
  font-size: 0.95rem;
  line-height: 1.8;
  color: var(--fifa-dark-blue);
  white-space: pre-wrap;
  margin: 0;
}

.anthem-player {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.player-options {
  display: flex;
  align-items: center;
  gap: 16px;
}

.play-btn {
  background: var(--fifa-gold);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.play-btn:hover:not(:disabled) {
  background: #ffb700;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
}

.play-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.player-note {
  color: var(--gray);
  font-size: 0.85rem;
  font-style: italic;
}

.voice-option {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--gray);
  font-size: 0.9rem;
  cursor: pointer;
}

.voice-option input[type="checkbox"] {
  accent-color: var(--fifa-gold);
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
@media (max-width: 968px) {
  .cities-grid {
    grid-template-columns: 1fr;
  }
  
  .host-country-info {
    justify-content: center;
  }
  
  .logo-display,
  .mascot-display,
  .ball-display {
    grid-template-columns: 1fr;
    text-align: center;
  }
  
  .logo-image,
  .mascot-image,
  .ball-image {
    margin: 0 auto 20px;
  }
  
  .specs-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .anthem-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
}

@media (max-width: 640px) {
  .branding-content {
    padding: 16px;
  }
  
  .branding-item {
    padding: 16px;
  }
  
  .element-tags {
    justify-content: center;
  }
}
</style>