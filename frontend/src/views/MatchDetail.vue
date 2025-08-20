<template>
  <div class="match-detail-page">
    <AppHeader 
      :username="username" 
      :subscription-tier="subscriptionTier"
      :user-avatar="userAvatar"
      @logout="handleLogout" 
    />
    
    <Breadcrumbs 
      :current-match="match"
      :current-tournament="{ _id: $route.params.tournamentId }"
    />
    
    <main class="main-content">
      <div class="match-detail-container">
        <div class="page-header">
          <button @click="goBack" class="back-btn">
            <i class="fas fa-arrow-left"></i>
            Back to Tournament
          </button>
          <h1>Match Details</h1>
        </div>

        <div v-if="loading" class="loading-state">
          <i class="fas fa-spinner fa-spin"></i>
          Loading match details...
        </div>

        <div v-else-if="match" class="match-content">
          <!-- Match Navigation -->
          <div v-if="hasPreviousMatch || hasNextMatch" class="match-navigation">
            <button v-if="hasPreviousMatch" @click="navigateToPreviousMatch" class="nav-btn prev">
              <i class="fas fa-chevron-left"></i>
              <span class="nav-text">Previous Match</span>
              <div class="nav-info">
                <span class="nav-label">Previous Match</span>
                <span class="nav-teams">{{ previousMatch.homeTeam.name }} vs {{ previousMatch.awayTeam.name }}</span>
                <span v-if="previousMatch.confederationName" class="nav-confederation">{{ previousMatch.confederationName }} | Matchday {{ previousMatch.matchday }}</span>
                <span v-else-if="previousMatch.groupName" class="nav-confederation">{{ previousMatch.groupName }} | Matchday {{ previousMatch.matchday }}</span>
              </div>
            </button>
            <div class="nav-divider" v-if="hasPreviousMatch && hasNextMatch"></div>
            <button v-if="hasNextMatch" @click="navigateToNextMatch" class="nav-btn next">
              <span class="nav-text">Next Match</span>
              <i class="fas fa-chevron-right"></i>
              <div class="nav-info">
                <span class="nav-label">Next Match</span>
                <span class="nav-teams">{{ nextMatch.homeTeam.name }} vs {{ nextMatch.awayTeam.name }}</span>
                <span v-if="nextMatch.confederationName" class="nav-confederation">{{ nextMatch.confederationName }} | Matchday {{ nextMatch.matchday }}</span>
                <span v-else-if="nextMatch.groupName" class="nav-confederation">{{ nextMatch.groupName }} | Matchday {{ nextMatch.matchday }}</span>
              </div>
            </button>
          </div>

          <!-- Match Score Section -->
          <div class="match-score-section">
            <!-- Top row with flags and score -->
            <div class="score-and-flags">
              <!-- Home Team Flag -->
              <div class="team-info home-team">
                <CountryFlag :country-code="match.homeTeam.countryCode" :size="48" />
                <div class="team-name clickable-team" @click="navigateToTeam('home')">{{ match.homeTeam.name }}</div>
              </div>
              
              <!-- Score Display -->
              <div class="score-display">
                <!-- Match Info -->
                <div class="match-info-compact">
                  <span v-if="match.isQualification && match.confederation">{{ match.confederation }} Qualification</span>
                  <span v-else-if="match.groupId">{{ getGroupName(match.groupId) }}</span>
                  <span v-else-if="match.round">{{ match.round }}</span>
                  <span v-else>Tournament Match</span>
                  <span v-if="match.matchday" class="matchday-info">Matchday {{ match.matchday }}</span>
                  <span v-if="match.city" class="venue-info">
                    <i class="fas fa-map-marker-alt"></i>
                    {{ match.city }}
                  </span>
                </div>
                <div class="score">
                  <span class="home-score">{{ liveSimulation.isRunning ? liveSimulation.homeScore : (match.homeScore !== null ? match.homeScore : '-') }}</span>
                  <span class="score-separator">:</span>
                  <span class="away-score">{{ liveSimulation.isRunning ? liveSimulation.awayScore : (match.awayScore !== null ? match.awayScore : '-') }}</span>
                </div>
                <div class="match-status">
                  <span v-if="!match.played" class="status-upcoming">Upcoming</span>
                  <span v-else-if="liveSimulation.isRunning" class="status-live">{{ liveSimulation.currentMinute }}'</span>
                  <span v-else class="status-finished">Final</span>
                </div>
                
                <!-- Knockout Match Result Info -->
                <div v-if="match.played && match.isKnockout" class="knockout-result-info">
                  <!-- Show if match ended in a draw in regular time but no ET/penalties yet -->
                  <div v-if="match.homeScore === match.awayScore && match.homeExtraTimeScore === null && match.homePenaltyScore === null" class="draw-notice">
                    <i class="fas fa-equals"></i>
                    <span class="result-label">Draw after 90 minutes</span>
                    <span class="result-info">Match requires extra time</span>
                  </div>
                  
                  <!-- Extra Time Result -->
                  <div v-if="match.homeExtraTimeScore !== null" class="extra-time-result">
                    <div class="result-phase-header">
                      <i class="fas fa-clock"></i>
                      <span>After Extra Time</span>
                    </div>
                    <div class="result-scores">
                      <span class="total-score">{{ match.homeScore + match.homeExtraTimeScore }}</span>
                      <span class="score-separator">-</span>
                      <span class="total-score">{{ match.awayScore + match.awayExtraTimeScore }}</span>
                    </div>
                    <div class="score-breakdown">
                      ({{ match.homeScore }}-{{ match.awayScore }} in regular time, {{ match.homeExtraTimeScore }}-{{ match.awayExtraTimeScore }} in extra time)
                    </div>
                  </div>
                  
                  <!-- Penalty Shootout Result -->
                  <div v-if="match.homePenaltyScore !== null" class="penalties-result">
                    <div class="result-phase-header">
                      <i class="fas fa-bullseye"></i>
                      <span>Penalty Shootout</span>
                    </div>
                    <div class="penalty-scores">
                      <span class="penalty-score-value">{{ match.homePenaltyScore }}</span>
                      <span class="score-separator">-</span>
                      <span class="penalty-score-value">{{ match.awayPenaltyScore }}</span>
                    </div>
                  </div>
                  
                  <!-- Match Winner (only show for draws that went to ET/penalties) -->
                  <div v-if="getWinnerName(match) && (match.homeExtraTimeScore !== null || match.homePenaltyScore !== null)" class="match-winner-section">
                    <div class="winner-divider"></div>
                    <div class="winner-content">
                      <i class="fas fa-trophy"></i>
                      <div class="winner-details">
                        <span class="winner-team-name">{{ getWinnerName(match) }}</span>
                        <span class="winner-method">{{ getWinMethod(match) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Live Simulation Button -->
                <div v-if="!match.played && !liveSimulation.isRunning" class="live-sim-button">
                  <button @click="startLiveSimulation" class="btn-live-sim">
                    <i class="fas fa-play"></i>
                    Simulate Live
                  </button>
                </div>
              </div>
              
              <!-- Away Team Flag -->
              <div class="team-info away-team">
                <CountryFlag :country-code="match.awayTeam.countryCode" :size="48" />
                <div class="team-name clickable-team" @click="navigateToTeam('away')">{{ match.awayTeam.name }}</div>
              </div>
            </div>
            
            <!-- Match Events Timeline (Goals and Cards) -->
            <div class="match-events-section" v-if="(liveSimulation.isRunning && (getLiveTeamEvents('home').length > 0 || getLiveTeamEvents('away').length > 0)) || (!liveSimulation.isRunning && matchDetails && (getTeamEvents('home').length > 0 || getTeamEvents('away').length > 0))">
              <!-- Home Team Events -->
              <div class="team-events home-events">
                <div v-for="event in liveSimulation.isRunning ? getLiveTeamEvents('home') : getTeamEvents('home')" :key="event._id || event.id || `${event.type}-${event.minute}-${event.player}`" class="event-item" :class="{ 'new-goal': event.isNew, 'penalty-goal': event.goalType === 'penalty', 'goal-event': event.type === 'goal', 'card-event': event.type === 'card', 'substitution-event': event.type === 'substitution', 'red-card': event.cardType === 'red' || event.cardType === 'second_yellow', 'yellow-card': event.cardType === 'yellow' }">
                  <span class="event-minute">{{ event.minute }}'</span>
                  <span v-if="event.type === 'substitution'" class="event-substitution">
                    <span class="player-out clickable-player" @click="navigateToPlayer(event.playerOut._id || event.playerOut)">
                      {{ event.playerOut?.displayName || 'Unknown Player' }}
                    </span>
                    <i class="fas fa-arrow-right substitution-arrow"></i>
                    <span class="player-in clickable-player" @click="navigateToPlayer(event.playerIn._id || event.playerIn)">
                      {{ event.playerIn?.displayName || 'Unknown Player' }}
                    </span>
                  </span>
                  <span v-else class="event-player clickable-player" @click="navigateToPlayer(event.player._id || event.player || event.playerId)">
                    {{ event.player?.displayName || event.scorer || 'Unknown Player' }}
                    <span v-if="event.goalType === 'penalty'" class="penalty-indicator">(P)</span>
                  </span>
                  <div v-if="event.type === 'card'" class="event-icon">
                    <div v-if="event.cardType === 'yellow'" class="card-icon yellow">
                      <i class="fas fa-square"></i>
                    </div>
                    <div v-else-if="event.cardType === 'second_yellow'" class="card-icon second-yellow">
                      <i class="fas fa-square"></i><i class="fas fa-square"></i>
                    </div>
                    <div v-else-if="event.cardType === 'red'" class="card-icon red">
                      <i class="fas fa-square"></i>
                    </div>
                  </div>
                  <div v-if="event.type === 'goal'" class="event-icon">
                    <div class="goal-icon">
                      <i class="fas fa-futbol"></i>
                    </div>
                  </div>
                  <div v-if="event.type === 'substitution'" class="event-icon">
                    <div class="substitution-icon">
                      <i class="fas fa-exchange-alt"></i>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Away Team Events -->
              <div class="team-events away-events">
                <div v-for="event in liveSimulation.isRunning ? getLiveTeamEvents('away') : getTeamEvents('away')" :key="event._id || event.id || `${event.type}-${event.minute}-${event.player}`" class="event-item" :class="{ 'new-goal': event.isNew, 'penalty-goal': event.goalType === 'penalty', 'goal-event': event.type === 'goal', 'card-event': event.type === 'card', 'substitution-event': event.type === 'substitution', 'red-card': event.cardType === 'red' || event.cardType === 'second_yellow', 'yellow-card': event.cardType === 'yellow' }">
                  <span class="event-minute">{{ event.minute }}'</span>
                  <span v-if="event.type === 'substitution'" class="event-substitution">
                    <span class="player-out clickable-player" @click="navigateToPlayer(event.playerOut._id || event.playerOut)">
                      {{ event.playerOut?.displayName || 'Unknown Player' }}
                    </span>
                    <i class="fas fa-arrow-right substitution-arrow"></i>
                    <span class="player-in clickable-player" @click="navigateToPlayer(event.playerIn._id || event.playerIn)">
                      {{ event.playerIn?.displayName || 'Unknown Player' }}
                    </span>
                  </span>
                  <span v-else class="event-player clickable-player" @click="navigateToPlayer(event.player._id || event.player || event.playerId)">
                    {{ event.player?.displayName || event.scorer || 'Unknown Player' }}
                    <span v-if="event.goalType === 'penalty'" class="penalty-indicator">(P)</span>
                  </span>
                  <div v-if="event.type === 'card'" class="event-icon">
                    <div v-if="event.cardType === 'yellow'" class="card-icon yellow">
                      <i class="fas fa-square"></i>
                    </div>
                    <div v-else-if="event.cardType === 'second_yellow'" class="card-icon second-yellow">
                      <i class="fas fa-square"></i><i class="fas fa-square"></i>
                    </div>
                    <div v-else-if="event.cardType === 'red'" class="card-icon red">
                      <i class="fas fa-square"></i>
                    </div>
                  </div>
                  <div v-if="event.type === 'goal'" class="event-icon">
                    <div class="goal-icon">
                      <i class="fas fa-futbol"></i>
                    </div>
                  </div>
                  <div v-if="event.type === 'substitution'" class="event-icon">
                    <div class="substitution-icon">
                      <i class="fas fa-exchange-alt"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Match Details Tabs -->
          <div v-if="matchDetails" class="match-details-tabs">
            <!-- Tab Navigation -->
            <div class="tab-navigation">
              <button 
                @click="activeTab = 'lineups'"
                :class="{ 'active': activeTab === 'lineups' }"
                class="tab-button"
              >
                Starting Lineups
              </button>
              <button 
                v-if="match.played"
                @click="activeTab = 'statistics'"
                :class="{ 'active': activeTab === 'statistics' }"
                class="tab-button"
              >
                Match Statistics
              </button>
              <button 
                v-if="match.played"
                @click="activeTab = 'mvp'"
                :class="{ 'active': activeTab === 'mvp' }"
                class="tab-button"
              >
                Team MVPs
              </button>
            </div>

            <!-- Tab Content -->
            <div class="tab-content">
              <!-- Lineups Tab -->
              <div v-if="activeTab === 'lineups'" class="lineups-section">
            <div class="lineups-container">
              <div class="home-lineup">
                <h4>{{ match.homeTeam.name }} ({{ matchDetails.homeFormation }})</h4>
                <div class="players-list">
                  <div v-for="player in getOrderedLineup(matchDetails.homeLineup, 'home')" :key="player._id" class="player-item">
                    <span class="jersey-number">{{ player.jerseyNumber }}</span>
                    <span class="player-name clickable-player" @click="navigateToPlayer(player.player?._id)" :class="{ 'substituted-out': getPlayerSubstitutionInfo(player.player?._id, 'home')?.type === 'out' }">
                      {{ player.player?.displayName || 'Unknown Player' }}
                      <span v-if="player.player?._id && getPlayerGoalCount(player.player._id, 'home') > 0" class="goal-indicator">
                        ⚽ {{ getPlayerGoalCount(player.player._id, 'home') }}
                      </span>
                      <span v-if="player.player?._id && getPlayerCardDisplay(player.player._id, 'home')" class="card-indicator" :class="getPlayerCardDisplay(player.player._id, 'home').type">
                        {{ getPlayerCardDisplay(player.player._id, 'home').display }}
                      </span>
                      <span v-if="player.player?._id && getPlayerSubstitutionInfo(player.player._id, 'home')" class="substitution-indicator" :class="getPlayerSubstitutionInfo(player.player._id, 'home').type">
                        <span v-if="getPlayerSubstitutionInfo(player.player._id, 'home').type === 'out'">
                          ↓{{ getPlayerSubstitutionInfo(player.player._id, 'home').minute }}'
                        </span>
                        <span v-else>
                          ↑{{ getPlayerSubstitutionInfo(player.player._id, 'home').minute }}'
                        </span>
                      </span>
                      <span v-if="match.played && player.player?._id" class="player-rating">
                        {{ getPlayerRating(player.player._id) }}/10
                      </span>
                    </span>
                    <span class="player-position">{{ player.position }}</span>
                    <span v-if="player.isCaptain" class="captain-badge">(C)</span>
                  </div>
                </div>
              </div>
              <div class="away-lineup">
                <h4>{{ match.awayTeam.name }} ({{ matchDetails.awayFormation }})</h4>
                <div class="players-list">
                  <div v-for="player in getOrderedLineup(matchDetails.awayLineup, 'away')" :key="player._id" class="player-item">
                    <span class="jersey-number">{{ player.jerseyNumber }}</span>
                    <span class="player-name clickable-player" @click="navigateToPlayer(player.player?._id)" :class="{ 'substituted-out': getPlayerSubstitutionInfo(player.player?._id, 'away')?.type === 'out' }">
                      {{ player.player?.displayName || 'Unknown Player' }}
                      <span v-if="player.player?._id && getPlayerGoalCount(player.player._id, 'away') > 0" class="goal-indicator">
                        ⚽ {{ getPlayerGoalCount(player.player._id, 'away') }}
                      </span>
                      <span v-if="player.player?._id && getPlayerCardDisplay(player.player._id, 'away')" class="card-indicator" :class="getPlayerCardDisplay(player.player._id, 'away').type">
                        {{ getPlayerCardDisplay(player.player._id, 'away').display }}
                      </span>
                      <span v-if="player.player?._id && getPlayerSubstitutionInfo(player.player._id, 'away')" class="substitution-indicator" :class="getPlayerSubstitutionInfo(player.player._id, 'away').type">
                        <span v-if="getPlayerSubstitutionInfo(player.player._id, 'away').type === 'out'">
                          ↓{{ getPlayerSubstitutionInfo(player.player._id, 'away').minute }}'
                        </span>
                        <span v-else>
                          ↑{{ getPlayerSubstitutionInfo(player.player._id, 'away').minute }}'
                        </span>
                      </span>
                      <span v-if="match.played && player.player?._id" class="player-rating">
                        {{ getPlayerRating(player.player._id) }}/10
                      </span>
                    </span>
                    <span class="player-position">{{ player.position }}</span>
                    <span v-if="player.isCaptain" class="captain-badge">(C)</span>
                  </div>
                </div>
              </div>
            </div>
              </div>

              <!-- Statistics Tab -->
              <div v-if="activeTab === 'statistics' && match.played" class="statistics-section">
            <div class="statistics-container">
              <div class="stat-row">
                <div class="stat-home">{{ matchDetails.possession?.home || 0 }}%</div>
                <div class="stat-label">Possession</div>
                <div class="stat-away">{{ matchDetails.possession?.away || 0 }}%</div>
              </div>
              <div class="stat-row">
                <div class="stat-home">{{ matchDetails.shots?.home || 0 }}</div>
                <div class="stat-label">Shots</div>
                <div class="stat-away">{{ matchDetails.shots?.away || 0 }}</div>
              </div>
              <div class="stat-row">
                <div class="stat-home">{{ matchDetails.shotsOnTarget?.home || 0 }}</div>
                <div class="stat-label">Shots on Target</div>
                <div class="stat-away">{{ matchDetails.shotsOnTarget?.away || 0 }}</div>
              </div>
              <div class="stat-row">
                <div class="stat-home">{{ matchDetails.xG?.home?.toFixed(1) || '0.0' }}</div>
                <div class="stat-label">Expected Goals (xG)</div>
                <div class="stat-away">{{ matchDetails.xG?.away?.toFixed(1) || '0.0' }}</div>
              </div>
              <div class="stat-row">
                <div class="stat-home">{{ matchDetails.corners?.home || 0 }}</div>
                <div class="stat-label">Corners</div>
                <div class="stat-away">{{ matchDetails.corners?.away || 0 }}</div>
              </div>
              <div class="stat-row">
                <div class="stat-home">{{ matchDetails.offsides?.home || 0 }}</div>
                <div class="stat-label">Offsides</div>
                <div class="stat-away">{{ matchDetails.offsides?.away || 0 }}</div>
              </div>
              <div class="stat-row">
                <div class="stat-home">{{ matchDetails.yellowCards?.home || 0 }}</div>
                <div class="stat-label">Yellow Cards</div>
                <div class="stat-away">{{ matchDetails.yellowCards?.away || 0 }}</div>
              </div>
              <div class="stat-row">
                <div class="stat-home">{{ matchDetails.redCards?.home || 0 }}</div>
                <div class="stat-label">Red Cards</div>
                <div class="stat-away">{{ matchDetails.redCards?.away || 0 }}</div>
              </div>
                </div>
              </div>

              <!-- MVP Tab -->
              <div v-if="activeTab === 'mvp' && match.played" class="mvp-section">
                <div class="mvp-container">
                  <div class="mvp-teams">
                    <div class="mvp-team">
                      <h4>{{ match.homeTeam.name }} MVP</h4>
                      <div v-if="getTeamMVP('home')" class="mvp-player">
                        <div class="mvp-info">
                          <span class="mvp-name">{{ getTeamMVP('home').player?.displayName || 'Unknown Player' }}</span>
                          <span class="mvp-position">{{ getTeamMVP('home').position }}</span>
                          <div class="mvp-rating">{{ getPlayerRating(getTeamMVP('home').player?._id) }}/10</div>
                        </div>
                        <div class="mvp-stats">
                          <span v-if="getPlayerGoalCount(getTeamMVP('home').player?._id, 'home') > 0" class="mvp-stat">
                            ⚽ {{ getPlayerGoalCount(getTeamMVP('home').player?._id, 'home') }} Goals
                          </span>
                          <span class="mvp-stat">Rating: {{ getPlayerRating(getTeamMVP('home').player?._id) }}/10</span>
                        </div>
                      </div>
                    </div>
                    <div class="mvp-team">
                      <h4>{{ match.awayTeam.name }} MVP</h4>
                      <div v-if="getTeamMVP('away')" class="mvp-player">
                        <div class="mvp-info">
                          <span class="mvp-name">{{ getTeamMVP('away').player?.displayName || 'Unknown Player' }}</span>
                          <span class="mvp-position">{{ getTeamMVP('away').position }}</span>
                          <div class="mvp-rating">{{ getPlayerRating(getTeamMVP('away').player?._id) }}/10</div>
                        </div>
                        <div class="mvp-stats">
                          <span v-if="getPlayerGoalCount(getTeamMVP('away').player?._id, 'away') > 0" class="mvp-stat">
                            ⚽ {{ getPlayerGoalCount(getTeamMVP('away').player?._id, 'away') }} Goals
                          </span>
                          <span class="mvp-stat">Rating: {{ getPlayerRating(getTeamMVP('away').player?._id) }}/10</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Match not found or could not be loaded</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import AppHeader from '../components/AppHeader.vue'
import Breadcrumbs from '../components/Breadcrumbs.vue'
import CountryFlag from '../components/CountryFlag.vue'
import { API_URL } from '../config/api.js'

export default {
  name: 'MatchDetailPage',
  components: {
    AppHeader,
    Breadcrumbs,
    CountryFlag
  },
  data() {
    return {
      username: '',
      subscriptionTier: 'basic',
      userAvatar: null,
      activeTab: 'lineups',
      match: null,
      matchDetails: null,
      loading: true,
      error: '',
      liveSimulation: {
        isRunning: false,
        currentMinute: 0,
        timer: null,
        goalNotification: null,
        simulatedGoals: [],
        simulatedCards: [],
        simulatedSubstitutions: [],
        homeScore: 0,
        awayScore: 0
      },
      allMatches: [],
      currentMatchIndex: -1
    }
  },
  computed: {
    hasPreviousMatch() {
      return this.currentMatchIndex > 0
    },
    hasNextMatch() {
      return this.currentMatchIndex >= 0 && this.currentMatchIndex < this.allMatches.length - 1
    },
    previousMatch() {
      return this.hasPreviousMatch ? this.allMatches[this.currentMatchIndex - 1] : null
    },
    nextMatch() {
      return this.hasNextMatch ? this.allMatches[this.currentMatchIndex + 1] : null
    }
  },
  async mounted() {
    this.username = localStorage.getItem('username') || 'User'
    await this.loadUserProfile()
    await this.loadMatchDetails()
  },
  methods: {
    getShotPercentage(team) {
      if (!this.matchDetails || !this.matchDetails.shots) return 0
      const homeShots = this.matchDetails.shots.home || 0
      const awayShots = this.matchDetails.shots.away || 0
      const totalShots = homeShots + awayShots
      if (totalShots === 0) return 0
      
      if (team === 'home') {
        return Math.round((homeShots / totalShots) * 100)
      } else {
        return Math.round((awayShots / totalShots) * 100)
      }
    },

    getPlayerRating(playerId) {
      if (!this.matchDetails || !playerId) return 6.5
      
      // Enhanced rating calculation based on multiple factors
      const goals = this.getPlayerGoals(playerId).length
      const cards = this.getPlayerCards(playerId, 'home').concat(this.getPlayerCards(playerId, 'away'))
      
      // Start with a more varied base rating (5.0-8.0)
      let rating = 5.0 + Math.random() * 3.0
      
      // Goals have significant impact
      rating += goals * 2.0 // Add 2.0 for each goal (was 1.5)
      
      // Card penalties
      rating -= cards.filter(c => c.cardType === 'yellow').length * 0.5 // Subtract 0.5 for yellow cards (was 0.3)
      rating -= cards.filter(c => c.cardType === 'red' || c.cardType === 'second_yellow').length * 2.5 // Subtract 2.5 for red cards (was 2.0)
      
      // Position-based adjustments (defenders and goalkeepers get slight boost if team didn't concede much)
      const isWinningTeam = this.match.homeScore !== this.match.awayScore
      if (isWinningTeam) {
        rating += 0.3 // Small bonus for winning team players
      }
      
      // Clean sheet bonus for defenders and goalkeepers
      const homePlayer = this.matchDetails.homeLineup.find(p => p.player?._id === playerId)
      const awayPlayer = this.matchDetails.awayLineup.find(p => p.player?._id === playerId)
      const player = homePlayer || awayPlayer
      const isHomePlayer = !!homePlayer
      
      if (player && (player.position === 'GK' || player.position === 'CB' || player.position === 'LB' || player.position === 'RB')) {
        const goalsAgainst = isHomePlayer ? this.match.awayScore : this.match.homeScore
        if (goalsAgainst === 0) {
          rating += 0.8 // Clean sheet bonus
        } else if (goalsAgainst === 1) {
          rating += 0.3 // Small bonus for only conceding one
        }
      }
      
      // Final random variance (smaller now since base is more varied)
      rating += (Math.random() - 0.5) * 1.0 // ±0.5 variance
      
      return Math.max(4.0, Math.min(10.0, Math.round(rating * 10) / 10))
    },

    getTeamMVP(team) {
      if (!this.matchDetails) return null
      
      const lineup = team === 'home' ? this.matchDetails.homeLineup : this.matchDetails.awayLineup
      if (!lineup || lineup.length === 0) return null
      
      // Find player with highest rating
      let mvp = null
      let highestRating = 0
      
      lineup.forEach(player => {
        if (player.player?._id) {
          const rating = this.getPlayerRating(player.player._id)
          if (rating > highestRating) {
            highestRating = rating
            mvp = player
          }
        }
      })
      
      return mvp
    },

    async loadMatchDetails() {
      try {
        const { tournamentId, matchId } = this.$route.params
        const token = localStorage.getItem('token')
        
        // Try to load from qualification matches first
        let response = await fetch(`${API_URL}/qualification/${tournamentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const qualificationData = await response.json()
          let qualMatch = null
          let confederation = null
          
          // Search through all confederations for the match
          if (qualificationData && qualificationData.confederations) {
            // First, find the current match and get all matches from all confederations
            for (const confed of qualificationData.confederations) {
              if (confed.matches) {
                qualMatch = confed.matches.find(m => m.matchId === matchId)
                if (qualMatch) {
                  confederation = confed
                  break
                }
              }
            }
            
            if (qualMatch) {
              // Collect ALL matches from ALL confederations
              this.allMatches = []
              qualificationData.confederations.forEach(confed => {
                if (confed.matches) {
                  confed.matches.forEach(match => {
                    this.allMatches.push({
                      ...match,
                      confederationName: confed.name,
                      confederationId: confed.confederationId
                    })
                  })
                }
              })
              
              // FIFA confederation hierarchy order
              const confederationOrder = {
                'uefa': 1,
                'conmebol': 2, 
                'concacaf': 3,
                'afc': 4,
                'caf': 5,
                'ofc': 6
              }
              
              // Sort all matches: first by matchday, then by confederation hierarchy, then by matchId
              this.allMatches.sort((a, b) => {
                // Primary sort: matchday
                if (a.matchday !== b.matchday) return a.matchday - b.matchday
                
                // Secondary sort: FIFA confederation hierarchy
                const orderA = confederationOrder[a.confederationId.toLowerCase()] || 999
                const orderB = confederationOrder[b.confederationId.toLowerCase()] || 999
                if (orderA !== orderB) return orderA - orderB
                
                // Tertiary sort: matchId for consistency within same confederation and matchday
                return a.matchId.localeCompare(b.matchId)
              })
              
              
              this.currentMatchIndex = this.allMatches.findIndex(m => m.matchId === matchId)
            }
          }
          
          if (qualMatch) {
            this.match = {
              _id: qualMatch.matchId,
              homeTeam: {
                name: qualMatch.homeTeam.name,
                flag: qualMatch.homeTeam.flag,
                countryCode: qualMatch.homeTeam.country
              },
              awayTeam: {
                name: qualMatch.awayTeam.name,
                flag: qualMatch.awayTeam.flag,
                countryCode: qualMatch.awayTeam.country
              },
              homeScore: qualMatch.homeScore,
              awayScore: qualMatch.awayScore,
              played: qualMatch.played,
              date: qualMatch.date,
              matchday: qualMatch.matchday,
              round: qualMatch.round,
              groupId: qualMatch.groupId,
              confederation: confederation.name,
              isQualification: true
            }
            
            // Try to load enhanced match details
            await this.loadEnhancedMatchDetails(`qualification_${tournamentId}_${matchId}`)
            this.loading = false
            return
          }
        }
        
        // Try to load from group stage matches
        response = await fetch(`${API_URL}/matches/${tournamentId}/matches`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const matches = await response.json()
          const groupMatch = matches.find(m => m._id === matchId)
          
          if (groupMatch) {
            this.match = {
              ...groupMatch,
              homeTeam: {
                name: groupMatch.homeTeam.countryName,
                flag: groupMatch.homeTeam.countryFlag,
                countryCode: groupMatch.homeTeam.countryCode
              },
              awayTeam: {
                name: groupMatch.awayTeam.countryName,
                flag: groupMatch.awayTeam.countryFlag,
                countryCode: groupMatch.awayTeam.countryCode
              },
              groupId: `group_${groupMatch.group.groupLetter}`,
              played: groupMatch.status === 'completed',
              city: groupMatch.city
            }
            
            // Store all group matches for navigation - navigate through all groups in matchday order
            this.allMatches = matches
              .sort((a, b) => {
                // Primary sort: matchday
                if (a.matchday !== b.matchday) return a.matchday - b.matchday
                // Secondary sort: group letter (A, B, C, etc.)
                if (a.group.groupLetter !== b.group.groupLetter) {
                  return a.group.groupLetter.localeCompare(b.group.groupLetter)
                }
                // Tertiary sort: match ID for consistency
                return a._id.localeCompare(b._id)
              })
              .map(m => ({
                ...m,
                homeTeam: {
                  name: m.homeTeam.countryName,
                  flag: m.homeTeam.countryFlag
                },
                awayTeam: {
                  name: m.awayTeam.countryName,
                  flag: m.awayTeam.countryFlag
                },
                groupName: `Group ${m.group.groupLetter}`,
                matchday: m.matchday,
                city: m.city
              }))
            this.currentMatchIndex = this.allMatches.findIndex(m => m._id === matchId)
            
            // Try to load enhanced match details for tournament matches
            await this.loadEnhancedMatchDetails(matchId)
            this.loading = false
            return
          }
        }
        
        // If not found in group stage, try knockout stage
        response = await fetch(`${API_URL}/knockout/${tournamentId}/bracket`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const bracket = await response.json()
          let knockoutMatch = null
          
          // Search through all rounds for the match
          if (bracket.matches) {
            for (const round in bracket.matches) {
              knockoutMatch = bracket.matches[round].find(m => m._id === matchId)
              if (knockoutMatch) break
            }
          }
          
          if (knockoutMatch) {
            this.match = {
              ...knockoutMatch,
              homeTeam: {
                name: knockoutMatch.homeTeam?.countryName || 'TBD',
                flag: knockoutMatch.homeTeam?.countryFlag || '?',
                countryCode: knockoutMatch.homeTeam?.countryCode
              },
              awayTeam: {
                name: knockoutMatch.awayTeam?.countryName || 'TBD',
                flag: knockoutMatch.awayTeam?.countryFlag || '?',
                countryCode: knockoutMatch.awayTeam?.countryCode
              },
              round: this.getMatchLabel(knockoutMatch),
              played: knockoutMatch.status === 'completed',
              date: knockoutMatch.date || knockoutMatch.scheduledDate,
              isKnockout: true
            }
            
            // Populate allMatches with all knockout matches for navigation
            this.allMatches = []
            if (bracket.matches) {
              // Define round order for proper navigation sequence
              const roundOrder = ['round16', 'quarterfinal', 'semifinal', 'third_place', 'final']
              
              // Collect all matches from all rounds
              roundOrder.forEach(roundName => {
                if (bracket.matches[roundName]) {
                  bracket.matches[roundName].forEach(match => {
                    this.allMatches.push({
                      ...match,
                      homeTeam: {
                        name: match.homeTeam?.countryName || 'TBD',
                        flag: match.homeTeam?.countryFlag || '?',
                        countryCode: match.homeTeam?.countryCode
                      },
                      awayTeam: {
                        name: match.awayTeam?.countryName || 'TBD',
                        flag: match.awayTeam?.countryFlag || '?',
                        countryCode: match.awayTeam?.countryCode
                      },
                      round: this.getMatchLabel(match),
                      played: match.status === 'completed',
                      date: match.date || match.scheduledDate,
                      isKnockout: true,
                      roundName: roundName,
                      matchPosition: match.matchPosition
                    })
                  })
                }
              })
              
              // Sort matches by round order and match position
              this.allMatches.sort((a, b) => {
                const roundOrderA = roundOrder.indexOf(a.roundName)
                const roundOrderB = roundOrder.indexOf(b.roundName)
                
                // Primary sort: by round order
                if (roundOrderA !== roundOrderB) {
                  return roundOrderA - roundOrderB
                }
                
                // Secondary sort: by match position within the same round
                return (a.matchPosition || 0) - (b.matchPosition || 0)
              })
            }
            
            // Find current match index in the sorted array
            this.currentMatchIndex = this.allMatches.findIndex(m => m._id === matchId)
            
            // Try to load enhanced match details for knockout matches
            await this.loadEnhancedMatchDetails(matchId)
            this.loading = false
            return
          }
        }
        
        // Match not found
        this.error = 'Match not found'
        this.loading = false
        
      } catch (error) {
        console.error('Error loading match details:', error)
        this.error = 'Failed to load match details'
        this.loading = false
      }
    },
    
    getMatchLabel(match) {
      const labels = {
        'round16': `Round of 16 - Match ${match.matchPosition}`,
        'quarterfinal': `Quarter-final ${match.matchPosition}`,
        'semifinal': `Semi-final ${match.matchPosition}`,
        'final': 'Final',
        'third_place': 'Third Place Play-off'
      }
      return labels[match.round] || match.round
    },
    
    getGroupName(groupId) {
      if (groupId.includes('_')) {
        const parts = groupId.split('_')
        const groupLetter = parts[parts.length - 1]
        return `Group ${groupLetter}`
      }
      return groupId
    },
    
    formatDate(date) {
      if (!date) return 'TBD'
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    
    getDecidedByText(decidedBy) {
      const texts = {
        'regular': 'Regular Time',
        'extra_time': 'Extra Time',
        'penalties': 'Penalties'
      }
      return texts[decidedBy] || ''
    },
    
    getWinnerName(match) {
      if (!match.winner) return ''
      
      // Check if winner is an ID and compare with team IDs
      if (typeof match.winner === 'string') {
        if (match.homeTeam._id === match.winner || match.homeTeam.id === match.winner) {
          return match.homeTeam.name
        } else if (match.awayTeam._id === match.winner || match.awayTeam.id === match.winner) {
          return match.awayTeam.name
        }
      }
      
      // If winner is an object with countryName or name
      if (match.winner.countryName) return match.winner.countryName
      if (match.winner.name) return match.winner.name
      
      // Fallback: determine winner based on scores
      const homeTotalScore = (match.homeScore || 0) + (match.homeExtraTimeScore || 0)
      const awayTotalScore = (match.awayScore || 0) + (match.awayExtraTimeScore || 0)
      
      if (match.homePenaltyScore !== null && match.awayPenaltyScore !== null) {
        // Decided by penalties
        return match.homePenaltyScore > match.awayPenaltyScore ? match.homeTeam.name : match.awayTeam.name
      } else if (homeTotalScore !== awayTotalScore) {
        // Decided by regular or extra time
        return homeTotalScore > awayTotalScore ? match.homeTeam.name : match.awayTeam.name
      }
      
      return ''
    },
    
    getWinMethod(match) {
      if (!match.played || !match.isKnockout) return ''
      
      // Check if decided by penalties
      if (match.homePenaltyScore !== null && match.awayPenaltyScore !== null) {
        return `Won ${match.homePenaltyScore}-${match.awayPenaltyScore} on penalties`
      }
      
      // Check if decided in extra time
      if (match.homeExtraTimeScore !== null) {
        const homeTotalScore = (match.homeScore || 0) + (match.homeExtraTimeScore || 0)
        const awayTotalScore = (match.awayScore || 0) + (match.awayExtraTimeScore || 0)
        if (homeTotalScore !== awayTotalScore) {
          return 'Won after extra time'
        }
      }
      
      // Check if decided in regular time
      if (match.homeScore !== match.awayScore) {
        return 'Won in regular time'
      }
      
      // Based on decidedBy field if available
      if (match.decidedBy) {
        const methods = {
          'regular': 'Won in regular time',
          'extra_time': 'Won after extra time',
          'penalties': 'Won on penalties'
        }
        return methods[match.decidedBy] || ''
      }
      
      return ''
    },
    
    async loadUserProfile() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const user = await response.json()
          this.subscriptionTier = user.subscriptionTier || 'basic'
          this.userAvatar = user.avatar || null
        }
      } catch (error) {
        console.error('Error loading user profile:', error)
      }
    },
    
    handleLogout() {
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      this.$router.push('/')
    },
    
    goBack() {
      this.$router.push(`/tournament/${this.$route.params.tournamentId}`)
    },

    async loadEnhancedMatchDetails(enhancedMatchId) {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/matches/detail/${enhancedMatchId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          this.matchDetails = await response.json()
          console.log('Enhanced match details loaded:', this.matchDetails)
        } else {
          console.log('No enhanced match details available for this match')
        }
      } catch (error) {
        console.error('Error loading enhanced match details:', error)
      }
    },

    getTeamGoals(team) {
      if (!this.matchDetails || !this.matchDetails.goals) return []
      return this.matchDetails.goals
        .filter(goal => goal.team === team)
        .sort((a, b) => a.minute - b.minute)
    },
    getTeamCards(team) {
      if (!this.matchDetails || !this.matchDetails.cards) return []
      return this.matchDetails.cards
        .filter(card => card.team === team)
        .sort((a, b) => a.minute - b.minute)
    },
    getTeamEvents(team) {
      if (!this.matchDetails) return []
      
      const events = []
      
      // Add goals
      if (this.matchDetails.goals) {
        this.matchDetails.goals
          .filter(goal => goal.team === team)
          .forEach(goal => {
            events.push({
              ...goal,
              type: 'goal'
            })
          })
      }
      
      // Add cards
      if (this.matchDetails.cards) {
        this.matchDetails.cards
          .filter(card => card.team === team)
          .forEach(card => {
            events.push({
              ...card,
              type: 'card'
            })
          })
      }
      
      // Add substitutions
      if (this.matchDetails.substitutions) {
        this.matchDetails.substitutions
          .filter(sub => sub.team === team)
          .forEach(sub => {
            events.push({
              ...sub,
              type: 'substitution'
            })
          })
      }
      
      // Sort by minute
      return events.sort((a, b) => a.minute - b.minute)
    },
    getLiveTeamEvents(team) {
      // For live simulation, merge live goals with live cards
      const events = []
      
      // Add live goals (already filtered by current minute)
      const liveGoals = this.getLiveTeamGoals(team)
      liveGoals.forEach(goal => {
        events.push({
          ...goal,
          type: 'goal'
        })
      })
      
      // Add live cards (filter by current minute like goals)
      if (this.liveSimulation.simulatedCards) {
        this.liveSimulation.simulatedCards
          .filter(card => card.team === team && card.minute <= this.liveSimulation.currentMinute)
          .forEach(card => {
            events.push({
              ...card,
              type: 'card'
            })
          })
      }
      
      // Add live substitutions (filter by current minute like goals)
      if (this.liveSimulation.simulatedSubstitutions) {
        this.liveSimulation.simulatedSubstitutions
          .filter(sub => sub.team === team && sub.minute <= this.liveSimulation.currentMinute)
          .forEach(sub => {
            events.push({
              ...sub,
              type: 'substitution'
            })
          })
      }
      
      return events.sort((a, b) => a.minute - b.minute)
    },

    getPlayerGoals(playerId) {
      if (!this.matchDetails || !this.matchDetails.goals) return []
      return this.matchDetails.goals.filter(goal => goal.player?._id === playerId)
    },

    getPlayerGoalCount(playerId, team) {
      // During live simulation, only count goals that have been shown
      if (this.liveSimulation.isRunning) {
        const liveGoals = this.getLiveTeamGoals(team)
        return liveGoals.filter(goal => (goal.player?._id === playerId || goal.player === playerId)).length
      }
      // Otherwise show all goals
      const goals = this.getTeamGoals(team)
      return goals.filter(goal => goal.player?._id === playerId).length
    },
    getPlayerCards(playerId, team) {
      if (!this.matchDetails || !this.matchDetails.cards) return []
      
      // During live simulation, only return cards that have been shown
      if (this.liveSimulation.isRunning && this.liveSimulation.simulatedCards) {
        return this.liveSimulation.simulatedCards.filter(card => 
          card.team === team && 
          card.player?._id === playerId && 
          card.minute <= this.liveSimulation.currentMinute
        )
      }
      
      // Otherwise return all cards
      return this.matchDetails.cards.filter(card => 
        card.team === team && card.player?._id === playerId
      )
    },
    getPlayerCardDisplay(playerId, team) {
      const cards = this.getPlayerCards(playerId, team)
      if (cards.length === 0) return null
      
      let yellowCount = 0
      let hasSecondYellow = false
      let hasDirectRed = false
      
      cards.forEach(card => {
        if (card.cardType === 'yellow') {
          yellowCount++
        } else if (card.cardType === 'second_yellow') {
          hasSecondYellow = true
        } else if (card.cardType === 'red') {
          hasDirectRed = true
        }
      })
      
      if (hasSecondYellow) {
        return { type: 'second-yellow', display: '🟨🟥' }
      } else if (hasDirectRed) {
        return { type: 'red', display: '🟥' }
      } else if (yellowCount > 0) {
        return { type: 'yellow', display: '🟨' }
      }
      
      return null
    },

    getPlayerSubstitutionInfo(playerId, team) {
      if (!this.matchDetails || !this.matchDetails.substitutions) return null
      
      // Check if player was substituted out
      const substitutedOut = this.matchDetails.substitutions.find(sub => 
        sub.team === team && sub.playerOut?._id === playerId
      )
      
      if (substitutedOut) {
        // During live simulation, only show if substitution has happened
        if (this.liveSimulation.isRunning) {
          if (substitutedOut.minute <= this.liveSimulation.currentMinute) {
            return { 
              type: 'out', 
              minute: substitutedOut.minute,
              replacedBy: substitutedOut.playerIn?.displayName
            }
          }
          return null
        }
        return { 
          type: 'out', 
          minute: substitutedOut.minute,
          replacedBy: substitutedOut.playerIn?.displayName
        }
      }
      
      // Check if player came on as substitute
      const substitutedIn = this.matchDetails.substitutions.find(sub => 
        sub.team === team && sub.playerIn?._id === playerId
      )
      
      if (substitutedIn) {
        // During live simulation, only show if substitution has happened
        if (this.liveSimulation.isRunning) {
          if (substitutedIn.minute <= this.liveSimulation.currentMinute) {
            return { 
              type: 'in', 
              minute: substitutedIn.minute,
              replaced: substitutedIn.playerOut?.displayName
            }
          }
          return null
        }
        return { 
          type: 'in', 
          minute: substitutedIn.minute,
          replaced: substitutedIn.playerOut?.displayName
        }
      }
      
      return null
    },

    getStatBarWidth(homeVal, awayVal, side) {
      const total = homeVal + awayVal
      if (total === 0) return 50
      const percentage = (homeVal / total) * 100
      return side === 'home' ? percentage : 100 - percentage
    },
    
    getOrderedLineup(lineup, team) {
      if (!lineup) return []
      
      // Position order: GK → DEF → MID → FWD
      const positionOrder = {
        'GK': 1,
        // Defenders
        'CB': 2, 'LB': 2, 'RB': 2, 'LWB': 2, 'RWB': 2,
        // Midfielders  
        'CM': 3, 'CAM': 3, 'CDM': 3, 'LM': 3, 'RM': 3,
        // Forwards
        'ST': 4, 'CF': 4, 'LW': 4, 'RW': 4
      }
      
      return lineup
        .filter(p => p.isStarter)
        .sort((a, b) => {
          const orderA = positionOrder[a.position] || 5
          const orderB = positionOrder[b.position] || 5
          if (orderA !== orderB) return orderA - orderB
          // If same position category, sort by jersey number
          return a.jerseyNumber - b.jerseyNumber
        })
    },

    async startLiveSimulation() {
      console.log('🎮 LIVE SIM: startLiveSimulation called')
      console.log('🎮 LIVE SIM: match.played =', this.match.played)
      console.log('🎮 LIVE SIM: liveSimulation.isRunning =', this.liveSimulation.isRunning)
      
      try {
        this.liveSimulation.isRunning = true
        this.liveSimulation.currentMinute = 0
        this.liveSimulation.homeScore = 0
        this.liveSimulation.awayScore = 0
        this.liveSimulation.simulatedGoals = []

        console.log('🎮 LIVE SIM: About to call simulateActualMatch()')
        // First, get the actual match result from the backend
        const matchResult = await this.simulateActualMatch()
        console.log('🎮 LIVE SIM: simulateActualMatch completed')
        
        // For group/knockout matches, we need to explicitly load enhanced details
        if (!this.match.isQualification) {
          console.log('🎮 LIVE SIM: Loading enhanced match details for group/knockout match')
          await this.loadEnhancedMatchDetails(this.match._id)
          console.log('🎮 LIVE SIM: Enhanced details loaded, goals:', this.matchDetails?.goals?.length || 0)
        }
        
        // Prepare goals for live display
        this.prepareGoalsForLiveDisplay(matchResult)
        
        // Start the live timer (90 minutes in ~10 seconds real time)
        this.startLiveTimer()

      } catch (error) {
        console.error('🎮 LIVE SIM: Error starting live simulation:', error)
        this.liveSimulation.isRunning = false
      }
    },

    async simulateActualMatch() {
      const token = localStorage.getItem('token')
      const { tournamentId, matchId } = this.$route.params
      
      // Determine if this is a qualification match or a group/knockout match
      let url
      let requestBody
      
      if (this.match.isQualification) {
        // For qualification matches, use the qualification endpoint
        const actualMatchId = this.extractMatchId()
        url = `${API_URL}/qualification/${tournamentId}/simulate-match?_=${Date.now()}`
        requestBody = { matchId: actualMatchId }
        console.log('🎯 FRONTEND: Using qualification endpoint')
      } else if (this.match.isKnockout) {
        // For knockout matches, use the knockout endpoint
        url = `${API_URL}/knockout/${tournamentId}/simulate/match/${matchId}?_=${Date.now()}`
        requestBody = {}
        console.log('🎯 FRONTEND: Using knockout match endpoint')
      } else {
        // For group stage matches, use the matches endpoint
        url = `${API_URL}/matches/${tournamentId}/simulate/match/${matchId}?_=${Date.now()}`
        requestBody = {}
        console.log('🎯 FRONTEND: Using group match endpoint')
      }
      
      console.log('🎯 FRONTEND: About to simulate match', {
        url,
        matchId,
        tournamentId,
        isQualification: this.match.isQualification,
        isKnockout: this.match.isKnockout
      })
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      })

      console.log('🎯 FRONTEND: Response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('🎯 FRONTEND: Simulation result:', result)
        // Reload match data to get the result
        await this.loadMatchDetails()
        return result
      } else {
        const errorText = await response.text()
        console.error('🎯 FRONTEND: Simulation failed:', response.status, errorText)
        throw new Error(`Failed to simulate match: ${response.status} ${errorText}`)
      }
    },

    extractMatchId() {
      // Extract match ID from route parameters or match data
      const routeMatchId = this.$route.params.matchId
      if (routeMatchId && routeMatchId.includes('qualification_')) {
        // Extract the actual match ID from the qualification ID
        const parts = routeMatchId.split('_')
        return parts.slice(2).join('_') // Remove 'qualification_' and tournament ID
      }
      return routeMatchId
    },

    prepareGoalsForLiveDisplay(matchResult) {
      // Get goals from the enhanced match details that were just created
      if (this.matchDetails && this.matchDetails.goals) {
        this.liveSimulation.simulatedGoals = [...this.matchDetails.goals].sort((a, b) => a.minute - b.minute)
      }
      
      // Get cards for live display
      if (this.matchDetails && this.matchDetails.cards) {
        this.liveSimulation.simulatedCards = [...this.matchDetails.cards].sort((a, b) => a.minute - b.minute)
      }
      
      // Get substitutions for live display
      if (this.matchDetails && this.matchDetails.substitutions) {
        this.liveSimulation.simulatedSubstitutions = [...this.matchDetails.substitutions].sort((a, b) => a.minute - b.minute)
      }
    },

    startLiveTimer() {
      const totalDuration = 10000 // 10 seconds for 90 minutes
      const interval = totalDuration / 90 // ~111ms per minute
      let goalIndex = 0
      let cardIndex = 0
      let substitutionIndex = 0

      this.liveSimulation.timer = setInterval(() => {
        this.liveSimulation.currentMinute++
        
        // Check if there's a goal at this minute
        while (goalIndex < this.liveSimulation.simulatedGoals.length) {
          const goal = this.liveSimulation.simulatedGoals[goalIndex]
          if (goal.minute <= this.liveSimulation.currentMinute) {
            this.showGoalNotification(goal)
            goalIndex++
          } else {
            break
          }
        }

        // Check if there's a card at this minute
        while (this.liveSimulation.simulatedCards && cardIndex < this.liveSimulation.simulatedCards.length) {
          const card = this.liveSimulation.simulatedCards[cardIndex]
          if (card.minute <= this.liveSimulation.currentMinute) {
            this.showCardNotification(card)
            cardIndex++
          } else {
            break
          }
        }

        // Check if there's a substitution at this minute
        while (this.liveSimulation.simulatedSubstitutions && substitutionIndex < this.liveSimulation.simulatedSubstitutions.length) {
          const substitution = this.liveSimulation.simulatedSubstitutions[substitutionIndex]
          if (substitution.minute <= this.liveSimulation.currentMinute) {
            this.showSubstitutionNotification(substitution)
            substitutionIndex++
          } else {
            break
          }
        }

        // Update live scores
        this.updateLiveScores()

        // End simulation at 90 minutes
        if (this.liveSimulation.currentMinute >= 90) {
          this.endLiveSimulation()
        }
      }, interval)
    },

    showGoalNotification(goal) {
      const team = goal.team === 'home' ? this.match.homeTeam.name : this.match.awayTeam.name
      
      this.liveSimulation.goalNotification = {
        scorer: goal.player?.displayName || 'Unknown Player',
        minute: goal.minute,
        team: goal.team
      }

      // Hide notification after 3 seconds
      setTimeout(() => {
        this.liveSimulation.goalNotification = null
      }, 3000)
    },
    showCardNotification(card) {
      // For now, cards don't show notifications like goals
      // They just appear in the timeline when their minute is reached
      // You could add a card notification system here if desired
      console.log(`🟨 Card at minute ${card.minute}: ${card.player?.displayName} (${card.cardType})`)
    },
    showSubstitutionNotification(substitution) {
      // For now, substitutions don't show notifications like goals
      // They just appear in the timeline when their minute is reached
      // You could add a substitution notification system here if desired
      console.log(`🔄 Substitution at minute ${substitution.minute}: ${substitution.playerIn?.displayName} on for ${substitution.playerOut?.displayName}`)
    },

    updateLiveScores() {
      const currentGoals = this.liveSimulation.simulatedGoals.filter(
        goal => goal.minute <= this.liveSimulation.currentMinute
      )
      
      this.liveSimulation.homeScore = currentGoals.filter(goal => goal.team === 'home').length
      this.liveSimulation.awayScore = currentGoals.filter(goal => goal.team === 'away').length
    },

    endLiveSimulation() {
      if (this.liveSimulation.timer) {
        clearInterval(this.liveSimulation.timer)
        this.liveSimulation.timer = null
      }
      
      this.liveSimulation.isRunning = false
      this.liveSimulation.currentMinute = 90
      
      // Final update - reload the page to show final result
      setTimeout(() => {
        this.$router.go(0) // Refresh the page to show final result
      }, 2000)
    },

    getLiveTeamGoals(team) {
      if (!this.liveSimulation.simulatedGoals) return []
      return this.liveSimulation.simulatedGoals
        .filter(goal => goal.team === team && goal.minute <= this.liveSimulation.currentMinute)
        .sort((a, b) => a.minute - b.minute)
    },

    navigateToTeam(teamSide) {
      const team = teamSide === 'home' ? this.match.homeTeam : this.match.awayTeam
      const tournamentId = this.$route.params.tournamentId
      
      if (this.match.isQualification) {
        // For qualification matches, navigate to qualifying team detail
        this.$router.push(`/tournament/${tournamentId}/qualifying-team/${team.code || team.countryCode || team.name}`)
      } else {
        // For tournament matches, navigate to regular team detail
        this.$router.push(`/tournament/${tournamentId}/team/${team.code || team.countryCode || team.name}`)
      }
    },

    navigateToPlayer(playerId) {
      // Navigate to player detail with context for back navigation
      const query = {
        tournamentId: this.$route.params.tournamentId,
        from: 'match-detail',
        matchId: this.$route.params.matchId
      }
      
      this.$router.push({
        path: `/player/${playerId}`,
        query: query
      })
    },

    navigateToPreviousMatch() {
      if (this.previousMatch) {
        const matchId = this.previousMatch.matchId || this.previousMatch._id
        const newPath = `/tournament/${this.$route.params.tournamentId}/match/${matchId}`
        // Navigate to the new match then reload
        this.$router.push(newPath).then(() => {
          // Reload after navigation completes
          window.location.reload()
        })
      }
    },

    navigateToNextMatch() {
      if (this.nextMatch) {
        const matchId = this.nextMatch.matchId || this.nextMatch._id
        const newPath = `/tournament/${this.$route.params.tournamentId}/match/${matchId}`
        // Navigate to the new match then reload
        this.$router.push(newPath).then(() => {
          // Reload after navigation completes
          window.location.reload()
        })
      }
    }
  },
  
  beforeUnmount() {
    // Clean up any running simulation
    if (this.liveSimulation.timer) {
      clearInterval(this.liveSimulation.timer)
      this.liveSimulation.timer = null
    }
  }
}
</script>

<style scoped>
.match-detail-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0066CC 0%, #003366 100%);
}

.main-content {
  padding: 2rem;
  display: flex;
  justify-content: center;
}

.match-detail-container {
  width: 100%;
  max-width: 1400px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 10px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.1);
  color: var(--white);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: var(--font-weight-semibold);
  transition: all 0.3s ease;
  text-decoration: none;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

.page-header h1 {
  color: var(--white);
  font-size: 2rem;
  font-weight: var(--font-weight-bold);
  margin: 0;
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: var(--white);
  text-align: center;
}

.loading-state i, .error-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}

.match-content {
  background: var(--white);
  border-radius: var(--radius-xl);
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* Desktop Layout */
@media (min-width: 1024px) {
  .main-content {
    padding: 3rem;
  }
  
  .match-content {
    padding: 2rem;
  }
  
  .match-score-section {
    grid-column: 1 / -1;
    margin-bottom: 1rem;
    padding: 2rem 1.5rem;
  }
  
  .lineups-section {
    grid-column: 1 / -1;
  }
  
  .lineups-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }
  
  .lineups-section h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    text-align: center;
  }
  
  .home-lineup h4,
  .away-lineup h4 {
    font-size: 1.2rem;
    margin-bottom: 0.75rem;
    text-align: center;
    padding: 0.75rem 1rem;
    background: var(--background);
    border-radius: var(--radius-md);
    border: 1px solid var(--border);
  }
}

/* Match Score Section */
.match-score-section {
  display: flex;
  flex-direction: column;
  background: var(--background);
  border-radius: var(--radius-lg);
  padding: 1rem;
  margin-bottom: 1.5rem;
  border: 1px solid var(--border);
  gap: 0.5rem;
}

@media (max-width: 1023px) {
  .match-score-section {
    padding: 0.25rem;
    gap: 0;
    margin-top: -1rem;
  }
}

/* Desktop layout for match score section */
@media (min-width: 1024px) {
  .match-score-section {
    padding: 1.5rem 1.25rem;
  }
  
  .score-and-flags {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
  }
  
  .team-info {
    flex: 1;
    max-width: 240px;
    margin-top: -0.75rem;
  }
  
  .score-display {
    flex: 0 0 auto;
    min-width: 180px;
    margin-top: 0;
  }
  
  .goals-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-top: 0.25rem;
  }
  
  .team-goals {
    flex-direction: column;
    gap: 0.375rem;
  }
  
  .home-goals {
    order: 1;
  }
  
  .away-goals {
    order: 2;
  }
  
  /* Match Navigation for Desktop */
  .match-navigation {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
    padding: 0;
    background: none;
    border: none;
  }
  
  .nav-btn {
    flex: 1;
    max-width: 350px;
    padding: 1rem 1.25rem;
    background: var(--white);
    border: 2px solid var(--border);
    border-radius: var(--radius-lg);
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    position: relative;
    overflow: hidden;
  }
  
  .nav-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--fifa-gold);
    transform: scaleX(0);
    transition: transform 0.2s ease;
  }
  
  .nav-btn:hover {
    background: var(--background);
    color: var(--fifa-blue);
    border-color: var(--fifa-blue);
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(0, 102, 204, 0.15);
  }
  
  .nav-btn:hover::before {
    transform: scaleX(1);
  }
  
  .nav-btn.prev {
    flex-direction: row;
  }
  
  .nav-btn.next {
    flex-direction: row-reverse;
  }
  
  .nav-text {
    display: none; /* Hidden on desktop, use icon instead */
  }
  
  .nav-btn i {
    font-size: 1.2rem;
    flex-shrink: 0;
  }
  
  .nav-info {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    min-width: 0;
    flex: 1;
  }
  
  .nav-label {
    font-size: 0.8rem;
    font-weight: var(--font-weight-semibold);
    opacity: 0.7;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .nav-teams {
    font-size: 0.95rem;
    font-weight: var(--font-weight-bold);
    color: inherit;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .nav-confederation {
    font-size: 0.8rem;
    opacity: 0.6;
    color: inherit;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  /* Team display improvements for desktop */
  .team-info .team-name {
    font-size: 1.4rem;
    font-weight: var(--font-weight-bold);
  }
  
  .team-info.home-team,
  .team-info.away-team {
    padding: 0.5rem 0.75rem;
    background: rgba(255, 255, 255, 0.7);
    border-radius: var(--radius-md);
    border: 1px solid rgba(0, 102, 204, 0.15);
  }
}

.team-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  flex: 1;
  max-width: 240px;
}

@media (max-width: 1023px) {
  .team-info {
    gap: 0;
  }
}

.team-flag {
  font-size: 3rem;
  line-height: 1;
}

.team-name {
  font-size: 1.2rem;
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  text-align: center;
  margin-bottom: 0.5rem;
}

.team-goals {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: center;
}

.team-goals .goal-item {
  background: rgba(76, 175, 80, 0.1);
  border: 1px solid rgba(76, 175, 80, 0.3);
  border-radius: 8px;
  padding: 0.6rem 0.8rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  width: 100%;
  max-width: 280px;
  min-height: 2.5rem;
}

@media (min-width: 1024px) {
  .team-goals .goal-item {
    max-width: 320px;
    padding: 0.75rem 1rem;
  }
}

.team-goals .goal-scorer {
  font-weight: var(--font-weight-bold);
  font-size: 0.935rem;
  color: var(--fifa-dark-blue);
  flex: 1;
  text-align: left;
  letter-spacing: 0.3px;
}

.team-goals .goal-minute {
  font-weight: var(--font-weight-bold);
  font-size: 0.765rem;
  color: white;
  background: linear-gradient(135deg, #4CAF50, #45B7AA);
  padding: 0.3rem 0.6rem;
  border-radius: 20px;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

.team-goals .goal-scorer {
  flex: 1;
  text-align: right;
}

.score-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  text-align: center;
  flex: 0 0 auto;
  min-width: 150px;
}

@media (max-width: 1023px) {
  .score-display {
    gap: 0;
  }
}

.match-info-compact {
  font-size: 0.85rem;
  color: var(--text-secondary);
  text-align: center;
  padding: 0.4rem 0.6rem;
  background: linear-gradient(135deg, rgba(0, 102, 204, 0.08), rgba(0, 102, 204, 0.12));
  border-radius: var(--radius-md);
  border: 1px solid rgba(0, 102, 204, 0.15);
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  box-shadow: 0 2px 8px rgba(0, 102, 204, 0.1);
  backdrop-filter: blur(2px);
}

@media (max-width: 1023px) {
  .match-info-compact {
    display: none;
  }
}

.matchday-info {
  font-weight: 600;
  color: var(--fifa-blue);
}

.venue-info {
  font-weight: 500;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.venue-info i {
  color: var(--fifa-gold);
  font-size: 0.8rem;
}

.score {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  font-size: 4.25rem;
  font-weight: var(--font-weight-bold);
  font-family: 'Arial Black', 'Impact', sans-serif;
  margin-top: -1rem;
}

@media (min-width: 1024px) {
  .score {
    font-size: 6.375rem;
    gap: 2rem;
    margin-top: 0;
  }
}

.home-score, .away-score {
  background: linear-gradient(135deg, var(--fifa-blue), var(--fifa-dark-blue));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  min-width: 5rem;
  text-align: center;
  font-family: 'Arial Black', 'Impact', sans-serif;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

@media (min-width: 1024px) {
  .home-score, .away-score {
    min-width: 6rem;
  }
  
  .home-score:hover, .away-score:hover {
    transform: scale(1.05);
    text-shadow: 3px 3px 8px rgba(0, 102, 204, 0.3);
  }
}

.score-separator {
  color: var(--text-secondary);
  font-weight: normal;
  font-size: 4.25rem;
  opacity: 0.6;
  font-family: 'Arial Black', 'Impact', sans-serif;
}

@media (min-width: 1024px) {
  .score-separator {
    font-size: 5.1rem;
  }
}

.extra-scores {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 1.2rem;
  text-align: center;
}

.extra-time-score {
  color: var(--fifa-blue);
  font-weight: var(--font-weight-semibold);
}

.penalty-score {
  color: var(--fifa-red);
  font-weight: var(--font-weight-semibold);
}

.penalty-indicator {
  font-size: 0.8em;
  color: var(--fifa-gold);
  font-weight: bold;
  margin-left: 0.25rem;
}

.penalty-goal {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 215, 0, 0.05));
  border-left: 3px solid var(--fifa-gold);
}

.match-status {
  padding: 0.4rem 0.8rem;
  border-radius: var(--radius-full);
  font-size: 0.9rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 0.1rem;
}

.knockout-result-info {
  margin-top: 0.75rem;
  background: var(--white);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.draw-notice {
  padding: 1rem;
  background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%);
  color: #2d3436;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.draw-notice i {
  font-size: 1.5rem;
  color: #636e72;
}

.result-label {
  font-weight: var(--font-weight-semibold);
  font-size: 1rem;
}

.result-info {
  font-size: 0.85rem;
  opacity: 0.8;
  font-style: italic;
}

.extra-time-result,
.penalties-result {
  padding: 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.result-phase-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #636e72;
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
  font-weight: var(--font-weight-medium);
}

.result-phase-header i {
  color: #0066cc;
}

.result-scores,
.penalty-scores {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  font-size: 2rem;
  font-weight: var(--font-weight-bold);
  color: #2d3436;
  margin-bottom: 0.5rem;
}

.total-score,
.penalty-score-value {
  font-size: 2rem;
  font-weight: var(--font-weight-bold);
}

.score-separator {
  color: #b2bec3;
  font-weight: normal;
}

.score-breakdown {
  text-align: center;
  color: #636e72;
  font-size: 0.85rem;
}

.match-winner-section {
  background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
  color: var(--white);
  padding: 1.25rem;
  position: relative;
}

.winner-divider {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.winner-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.winner-content i {
  font-size: 2rem;
  color: #ffeaa7;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.winner-details {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.winner-team-name {
  font-size: 1.25rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.winner-method {
  font-size: 0.9rem;
  opacity: 0.95;
  font-weight: var(--font-weight-medium);
}

.status-upcoming {
  background: var(--warning-background);
  color: var(--warning-text);
}

.status-finished {
  background: var(--success-background);
  color: var(--success-text);
}

.status-live {
  background: #ff4444;
  color: white;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.live-sim-button {
  margin-top: 0.5rem;
}

.btn-live-sim {
  background: linear-gradient(135deg, #ff4444, #cc0000);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: var(--radius-lg);
  font-weight: var(--font-weight-bold);
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.3s ease;
  box-shadow: 0 6px 24px rgba(255, 68, 68, 0.4);
  text-transform: uppercase;
  letter-spacing: 1px;
  position: relative;
  overflow: hidden;
}

.btn-live-sim::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.btn-live-sim:hover {
  background: linear-gradient(135deg, #ff6666, #dd0000);
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 8px 32px rgba(255, 68, 68, 0.5);
}

.btn-live-sim:hover::before {
  left: 100%;
}

.goal-notification {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  border: 4px solid #4CAF50;
  animation: goalPop 3s ease-out;
  min-width: 300px;
  text-align: center;
}

.goal-notification.home {
  border-color: #2196F3;
}

.goal-notification.away {
  border-color: #ff9800;
}

@keyframes goalPop {
  0% {
    transform: translate(-50%, -50%) scale(0.3);
    opacity: 0;
  }
  15% {
    transform: translate(-50%, -50%) scale(1.1);
    opacity: 1;
  }
  30% {
    transform: translate(-50%, -50%) scale(1);
  }
  90% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0;
  }
}

.goal-celebration {
  font-size: 2rem;
  font-weight: bold;
  color: #4CAF50;
  margin-bottom: 0.5rem;
}

.goal-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.goal-scorer {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--text-primary);
}

.goal-time {
  font-size: 1.2rem;
  color: var(--text-secondary);
  font-weight: 600;
}


/* Placeholder Sections */
.match-stats-section,
.match-commentary-section {
  margin-bottom: 2rem;
}

.match-stats-section h3,
.match-commentary-section h3 {
  color: var(--text-primary);
  margin-bottom: 1rem;
  font-size: 1.5rem;
  font-weight: var(--font-weight-bold);
}

.stats-placeholder,
.commentary-placeholder {
  background: var(--background);
  border: 2px dashed var(--border);
  border-radius: var(--radius-lg);
  padding: 4rem 2rem;
  text-align: center;
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.placeholder-content i {
  font-size: 4rem;
  color: var(--text-secondary);
  opacity: 0.5;
}

.placeholder-content p {
  color: var(--text-secondary);
  margin: 0;
  font-size: 1.2rem;
}

.placeholder-subtext {
  font-size: 1rem !important;
  opacity: 0.7;
}

/* Responsive Design */
@media (max-width: 768px) {
  .main-content {
    padding: 0.5rem;
  }
  
  .match-detail-container {
    padding: 0;
  }
  
  .match-content {
    padding: 0.75rem;
  }
  
  .page-header {
    flex-direction: column;
    gap: 4px;
    text-align: center;
    padding: 0.5rem 0.75rem 0.25rem 0.75rem;
  }
  
  .page-header h1 {
    font-size: 1.3rem;
  }
  
  /* Simplified match navigation for mobile */
  .match-navigation {
    padding: 0;
    background: none;
    border: none;
    margin-bottom: 0.1rem !important;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }
  
  .nav-btn {
    padding: 0;
    background: none;
    border: none;
    border-radius: 0;
    width: auto;
    height: auto;
    min-width: auto;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--fifa-blue);
    font-size: 0.9rem;
    font-weight: 600;
  }
  
  .nav-btn:hover {
    transform: none;
    box-shadow: none;
    background: none;
    opacity: 0.8;
  }
  
  .nav-btn i {
    font-size: 1rem;
  }
  
  .nav-btn.prev {
    flex-direction: row;
  }
  
  .nav-btn.next {
    flex-direction: row;
  }
  
  .nav-info {
    display: none !important;
  }
  
  .nav-text {
    display: inline !important;
  }
  
  .nav-divider {
    display: none;
  }
  
  /* Remove the ::after pseudo elements */
  .nav-btn::after {
    display: none;
  }
  
  /* Compact score section */
  .match-score-section {
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem 1rem;
    margin-bottom: 1rem;
  }
  
  /* Top row with flags and score */
  .score-and-flags {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    width: 100%;
  }
  
  .team-info {
    flex: 1;
    max-width: none;
    gap: 0.5rem;
    flex-direction: column;
    align-items: center;
    position: static;
    padding-bottom: 0;
  }
  
  .team-info .country-flag,
  .team-flag {
    font-size: 3rem !important;
    width: 3rem !important;
    height: 3rem !important;
    line-height: 1 !important;
    display: block !important;
  }
  
  .team-name {
    display: block !important;
    font-size: 0.8rem !important;
    font-weight: 600 !important;
    color: var(--fifa-dark-blue) !important;
    text-align: center !important;
    line-height: 1.2 !important;
    margin: 0 !important;
  }
  
  .score-display {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 120px;
  }
  
  .score {
    font-size: 2.25rem;
    gap: 0.5rem;
  }
  
  .home-score, .away-score {
    min-width: 2.5rem;
  }
  
  .match-status {
    font-size: 0.9rem;
    margin-top: 0.5rem;
  }
  
  .match-info-compact {
    font-size: 0.8rem;
    padding: 0.5rem;
    margin-top: 0.5rem;
  }
  
  .knockout-result-info {
    margin-left: -1rem;
    margin-right: -1rem;
    border-radius: 0;
  }
  
  .result-scores,
  .penalty-scores {
    font-size: 1.5rem;
  }
  
  .total-score,
  .penalty-score-value {
    font-size: 1.5rem;
  }
  
  .winner-team-name {
    font-size: 1.1rem;
  }
  
  .score-breakdown {
    font-size: 0.75rem;
    padding: 0 0.5rem;
  }
  
  /* Goals section below flags */
  .goals-section {
    width: 100%;
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 0.5rem;
  }
  
  .team-goals {
    position: static;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    align-items: flex-start;
    flex: 1;
    width: auto;
  }
  
  .team-info.home-team .team-goals {
    align-items: flex-start;
  }
  
  .team-info.away-team .team-goals {
    align-items: flex-end;
  }
  
  .goal-item {
    padding: 0.25rem 0.5rem !important;
    max-width: none !important;
    font-size: 0.75rem;
    flex-direction: row !important;
    gap: 0.25rem !important;
    background: rgba(76, 175, 80, 0.1);
    border: 1px solid rgba(76, 175, 80, 0.3);
    border-radius: 4px;
  }
  
  .goal-minute {
    font-size: 0.7rem !important;
    padding: 0.1rem 0.3rem !important;
  }
  
  .goal-scorer {
    font-size: 0.75rem !important;
  }
}

/* Match Events Section (Goals and Cards) */
.match-events-section {
  width: 100%;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 0.5rem;
}

.team-events {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: center;
  flex: 1;
}

.event-item {
  border-radius: 8px;
  padding: 0.6rem 0.8rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  width: 100%;
  max-width: 280px;
  min-height: 2.5rem;
}

/* Goal Events */
.event-item.goal-event {
  background: rgba(76, 175, 80, 0.1);
  border: 1px solid rgba(76, 175, 80, 0.3);
}

/* Penalty goals look the same as regular goals - only the (P) indicator shows difference */
.event-item.penalty-goal {
  background: rgba(76, 175, 80, 0.1);
  border: 1px solid rgba(76, 175, 80, 0.3);
}

/* Card Events */
.event-item.card-event {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

/* Substitution Events */
.event-item.substitution-event {
  background: rgba(33, 150, 243, 0.1);
  border: 1px solid rgba(33, 150, 243, 0.3);
}

.event-substitution {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.substitution-arrow {
  color: #2196F3;
  font-size: 0.8rem;
}

.player-out {
  opacity: 0.7;
}

.player-in {
  font-weight: 500;
}

.substitution-icon {
  color: #2196F3;
  font-size: 1rem;
}

.goal-icon {
  color: #4CAF50;
  font-size: 1rem;
}

.event-item.yellow-card {
  background: rgba(255, 235, 59, 0.1);
  border-color: rgba(255, 235, 59, 0.4);
}

.event-item.red-card {
  background: rgba(244, 67, 54, 0.1);
  border-color: rgba(244, 67, 54, 0.4);
}

.event-minute {
  font-size: 0.8rem;
  font-weight: bold;
  color: var(--fifa-dark-blue);
  background: rgba(255, 255, 255, 0.8);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  min-width: 35px;
  text-align: center;
}

.event-player {
  flex: 1;
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--fifa-dark-blue);
  cursor: pointer;
  transition: color 0.2s ease;
}

.event-player:hover {
  color: var(--fifa-blue);
}

.event-icon {
  display: flex;
  gap: 2px;
  align-items: center;
}

.card-icon {
  font-size: 0.8rem;
  width: 12px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-icon.yellow {
  color: #FFD700;
}

.card-icon.second-yellow {
  display: inline-flex;
  gap: 2px;
}

.card-icon.second-yellow i:first-child {
  color: #FFD700;
}

.card-icon.second-yellow i:last-child {
  color: #DC143C;
}

.card-icon.red {
  color: #DC143C;
}

.card-icon.double {
  display: flex;
  gap: 1px;
}

@media (max-width: 1023px) {
  .match-events-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-top: 0.25rem;
  }
  
  .team-events {
    flex-direction: column;
    gap: 0.375rem;
  }
  
  .event-item {
    padding: 0.25rem 0.5rem;
    max-width: none;
    font-size: 0.75rem;
    flex-direction: row;
    gap: 0.25rem;
  }
  
  .event-minute {
    font-size: 0.7rem;
    padding: 0.1rem 0.3rem;
  }
  
  .event-player {
    font-size: 0.75rem;
  }
  
  /* Live simulation button */
  .btn-live-sim {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
  }
  
  /* Lineups section */
  .lineups-section {
    margin-top: 2rem;
  }
  
  .lineups-section h3 {
    font-size: 1.1rem;
    margin-bottom: 1rem;
  }
  
  .lineups-container {
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .home-lineup h4,
  .away-lineup h4 {
    font-size: 1rem;
    margin-bottom: 0.75rem;
  }
  
  .player-item {
    padding: 0.5rem;
    font-size: 0.85rem;
  }
  
  .jersey-number {
    min-width: 24px;
    font-size: 0.8rem;
  }
  
  .player-name {
    font-size: 0.85rem;
  }
  
  .player-position {
    font-size: 0.75rem;
  }
  
  .goal-indicator {
    font-size: 0.7rem;
  }
  
  .card-indicator {
    font-size: 0.7rem;
    margin-left: 0.25rem;
    padding: 0.1rem 0.3rem;
  }
}

/* Hide nav-text by default (desktop) */
.nav-text {
  display: none;
}

/* Enhanced Match Details Styles */
.stats-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
}

.stat-label {
  font-weight: 600;
  width: 140px;
}

.stat-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.bar-container {
  display: flex;
  height: 20px;
  width: 200px;
  background: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
}

.home-bar {
  background: #4CAF50;
  height: 100%;
  transition: width 0.3s ease;
}

.away-bar {
  background: #2196F3;
  height: 100%;
  transition: width 0.3s ease;
}

.stat-numbers {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 100px;
  justify-content: center;
}

.goals-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.goal-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #4CAF50;
}

.goal-item:not(.team-goals .goal-item) .goal-minute {
  font-weight: bold;
  color: #4CAF50;
  min-width: 40px;
}

.goal-details {
  flex: 1;
}

.goal-scorer {
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 0.25rem;
}

.goal-team {
  color: #666;
  font-size: 0.9rem;
}

.goal-type {
  color: #888;
  font-size: 0.8rem;
  text-transform: capitalize;
}

/* Tabs */
.match-tabs {
  background: var(--white);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  overflow: hidden;
}

.tabs-nav {
  display: flex;
  background: var(--gray-50);
  border-bottom: 1px solid var(--border);
}

.tab-button {
  flex: 1;
  padding: 1rem 1.5rem;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 1rem;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 2px solid transparent;
}

.tab-button:hover {
  color: var(--text-primary);
  background: var(--gray-100);
}

.tab-button.active {
  color: var(--primary);
  background: var(--white);
  border-bottom-color: var(--primary);
}

.lineups-section,
.statistics-section,
.report-section {
  padding: 1.5rem;
}

.lineups-section {
  background: var(--white);
  border-radius: 0;
}

/* Statistics */
.statistics-section {
  background: var(--white);
}

.stats-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.stat-row {
  display: grid;
  grid-template-columns: 120px 1fr;
  align-items: center;
  gap: 1rem;
}

.stat-label {
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.stat-values {
  display: grid;
  grid-template-columns: 60px 1fr 60px;
  align-items: center;
  gap: 0.75rem;
}

.home-stat,
.away-stat {
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  text-align: center;
  font-size: 0.95rem;
}

.stat-bar {
  height: 8px;
  background: var(--gray-200);
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

.home-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--primary-dark));
  border-radius: 4px;
  transition: width 0.3s ease;
}

/* Report */
.report-section {
  background: var(--white);
}

.report-summary {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
}

.key-moments h4 {
  color: var(--text-primary);
  margin-bottom: 0.75rem;
  font-weight: var(--font-weight-semibold);
}

.key-moments ul {
  list-style: none;
  padding: 0;
}

.key-moments li {
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--gray-100);
  color: var(--text-secondary);
}

.key-moments li:last-child {
  border-bottom: none;
}

.lineups-section h3 {
  color: var(--text-primary);
  margin-bottom: 1rem;
  font-size: 1.25rem;
  font-weight: var(--font-weight-bold);
}

.lineups-container {
  display: flex;
  gap: 1.5rem;
  margin-top: 1rem;
}

.home-lineup,
.away-lineup {
  flex: 1;
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
}

.home-lineup h4,
.away-lineup h4 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.players-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.player-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.4rem;
  background: white;
  border-radius: 4px;
  font-size: 0.9rem;
}

.jersey-number {
  background: #333;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.player-name {
  font-weight: 600;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-position {
  background: #e3f2fd;
  color: #1976d2;
  padding: 0.2rem 0.4rem;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 500;
  flex-shrink: 0;
}

.captain-badge {
  padding: 0.3rem 0.75rem;
  background: linear-gradient(135deg, var(--fifa-gold), #FFD700);
  color: var(--dark);
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: var(--font-weight-bold);
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.goal-indicator {
  color: #4CAF50;
  font-weight: var(--font-weight-bold);
  font-size: 0.9rem;
  margin-left: 0.5rem;
  padding: 0.2rem 0.5rem;
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(46, 213, 115, 0.1));
  border-radius: 12px;
  border: 1px solid rgba(76, 175, 80, 0.3);
  display: inline-flex;
  align-items: center;
}

.card-indicator {
  font-weight: var(--font-weight-bold);
  font-size: 0.9rem;
  margin-left: 0.5rem;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
}

.card-indicator.yellow {
  color: #FFD700;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 235, 59, 0.1));
  border: 1px solid rgba(255, 215, 0, 0.3);
}

.card-indicator.second-yellow {
  color: #DC143C;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(220, 20, 60, 0.1));
  border: 1px solid rgba(220, 20, 60, 0.3);
}

.card-indicator.red {
  color: #DC143C;
  background: linear-gradient(135deg, rgba(220, 20, 60, 0.1), rgba(244, 67, 54, 0.1));
  border: 1px solid rgba(220, 20, 60, 0.3);
}

.substitution-indicator {
  font-weight: var(--font-weight-bold);
  font-size: 0.8rem;
  margin-left: 0.25rem;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
}

.substitution-indicator.out {
  color: #FF6B6B;
  background: rgba(255, 107, 107, 0.1);
}

.substitution-indicator.in {
  color: #4ECDC4;
  background: rgba(78, 205, 196, 0.1);
}

.player-name.substituted-out {
  opacity: 0.6;
  text-decoration: line-through;
}

/* Clickable styles */
.clickable-team {
  cursor: pointer;
  transition: color 0.2s ease;
}

.clickable-team:hover {
  color: var(--fifa-blue);
  text-decoration: underline;
}

.clickable-player {
  cursor: pointer;
  transition: color 0.2s ease;
}

.clickable-player:hover {
  color: var(--fifa-blue);
  text-decoration: underline;
}

/* New goal animation */
.new-goal {
  animation: newGoalFlash 0.8s ease-out;
}

@keyframes newGoalFlash {
  0% {
    background: #4CAF50;
    color: white;
    transform: scale(1.05);
  }
  100% {
    background: rgba(76, 175, 80, 0.1);
    color: inherit;
    transform: scale(1);
  }
}

/* Match Navigation */
.match-navigation {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: var(--background);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
}

.nav-btn {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.nav-btn:hover {
  background: rgba(0, 102, 204, 0.05);
  border-color: var(--fifa-blue);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 102, 204, 0.15);
}

.nav-btn.prev {
  justify-content: flex-start;
}

.nav-btn.next {
  justify-content: flex-end;
  text-align: right;
}

.nav-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nav-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.nav-teams {
  font-size: 1rem;
  color: var(--text-primary);
  font-weight: 600;
}

.nav-confederation {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: 400;
  margin-top: 0.25rem;
}

.nav-divider {
  width: 1px;
  height: 40px;
  background: var(--border);
}

.match-report-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.match-summary {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  border-left: 4px solid #2196F3;
}

.match-summary p {
  margin: 0;
  line-height: 1.6;
  color: #333;
}

.key-moments ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.key-moments li {
  padding: 0.75rem;
  background: #f8f9fa;
  margin-bottom: 0.5rem;
  border-radius: 6px;
  border-left: 3px solid #FF9800;
}

.motm-player {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #fff3e0;
  border-radius: 8px;
  border-left: 4px solid #FF9800;
}

.motm-name {
  font-weight: 600;
  font-size: 1.1rem;
}

.motm-position {
  background: #FF9800;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
}

.conditions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 0.5rem;
}

.condition-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.condition-label {
  font-weight: 600;
  color: #666;
}

.condition-value {
  color: #333;
  text-transform: capitalize;
}

/* Match Statistics Styles */
.statistics-section {
  width: 100%;
  padding: 1rem;
}

.statistics-container {
  background: linear-gradient(135deg, #ffffff, #f8f9fa);
  border-radius: 20px;
  padding: 2rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  width: 100%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.stat-row {
  display: grid;
  grid-template-columns: 33.33% 33.33% 33.33%;
  align-items: center;
  padding: 1.25rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  font-size: 1rem;
  transition: all 0.3s ease;
}

.stat-row:hover {
  background: rgba(0, 123, 255, 0.02);
  transform: translateX(5px);
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-home {
  color: #007bff;
  font-weight: var(--font-weight-bold);
  text-align: left;
  font-size: 1.1rem;
  justify-self: start;
}

.stat-label {
  color: #333;
  font-weight: var(--font-weight-semibold);
  font-size: 0.95rem;
  text-align: center;
  justify-self: center;
}

.stat-bar {
  height: 12px;
  background: linear-gradient(90deg, #e9ecef, #dee2e6);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  display: flex;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 200px;
  margin: 0 auto;
}

.stat-bar-home {
  background: linear-gradient(90deg, #007bff, #0056b3);
  height: 100%;
  transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 8px 0 0 8px;
  box-shadow: 0 2px 4px rgba(0, 123, 255, 0.3);
}

.stat-bar-away {
  background: linear-gradient(90deg, #dc3545, #c82333);
  height: 100%;
  transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 0 8px 8px 0;
  box-shadow: 0 2px 4px rgba(220, 53, 69, 0.3);
}

.stat-away {
  color: #dc3545;
  font-weight: var(--font-weight-bold);
  text-align: right;
  font-size: 1.1rem;
  justify-self: end;
  padding-right: 2rem;
}

/* Tab Styles */
.match-details-tabs {
  grid-column: 1 / -1;
  margin-top: 2rem;
}

.tab-navigation {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
  gap: 0.5rem;
}

.tab-button {
  background: linear-gradient(135deg, #ffffff, #f0f0f0);
  color: #333;
  border: 2px solid #ddd;
  border-radius: 12px;
  padding: 1rem 2rem;
  cursor: pointer;
  font-weight: var(--font-weight-bold);
  font-size: 1rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.tab-button:hover {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-color: #007bff;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 123, 255, 0.2);
}

.tab-button.active {
  background: linear-gradient(135deg, #007bff, #0056b3);
  color: white;
  border-color: #0056b3;
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(0, 123, 255, 0.4);
}

.tab-button.active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(255,255,255,0.2), transparent);
  pointer-events: none;
}

.tab-content {
  /* Content will inherit styles from lineups-section and statistics-section */
}

/* MVP Tab Styles */
.mvp-section {
  width: 100%;
  padding: 1rem;
}

.mvp-container {
  background: linear-gradient(135deg, #ffffff, #f8f9fa);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.mvp-teams {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.mvp-team h4 {
  color: #333;
  font-size: 1.2rem;
  font-weight: var(--font-weight-bold);
  margin-bottom: 1rem;
  text-align: center;
}

.mvp-player {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-radius: 15px;
  padding: 1.5rem;
  border: 2px solid #dee2e6;
  transition: all 0.3s ease;
}

.mvp-player:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 123, 255, 0.15);
  border-color: #007bff;
}

.mvp-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1rem;
}

.mvp-name {
  font-size: 1.1rem;
  font-weight: var(--font-weight-bold);
  color: #333;
  margin-bottom: 0.5rem;
}

.mvp-position {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.mvp-rating {
  background: linear-gradient(135deg, #007bff, #0056b3);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: var(--font-weight-bold);
  font-size: 1rem;
}

.mvp-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
}

.mvp-stat {
  background: rgba(0, 123, 255, 0.1);
  color: #007bff;
  padding: 0.3rem 0.8rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: var(--font-weight-medium);
}

/* Player Rating Styles */
.player-rating {
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: var(--font-weight-bold);
  margin-left: 0.5rem;
}

</style>