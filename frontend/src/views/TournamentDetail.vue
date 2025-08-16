<template>
  <div class="tournament-detail" :class="{ 'tournament-themed': tournament?.logo?.colorScheme }">
    <AppHeader 
      :username="username" 
      :subscription-tier="subscriptionTier"
      :user-avatar="userAvatar"
      @logout="handleLogout" 
    />
    
    <Breadcrumbs :current-tournament="tournament" />
    
    <main class="main-content">
      <div class="tournament-container">
        <div v-if="loading" class="loading-state">
          <i class="fas fa-spinner fa-spin"></i>
          Loading tournament...
        </div>
        
        <div v-else-if="!tournament" class="error-state">
          <div class="error-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <h3>Tournament not found</h3>
          <p>The tournament you're looking for doesn't exist or you don't have access to it.</p>
          <button @click="goBack" class="btn-primary">
            <i class="fas fa-arrow-left"></i>
            {{ backButtonText }}
          </button>
        </div>
        
        <div v-else class="tournament-detail-content">
          <!-- Tournament Header -->
          <div class="tournament-header glass-white">
            <div class="back-navigation">
              <button @click="goBack" class="back-btn">
                <i class="fas fa-arrow-left"></i>
                {{ backButtonText }}
              </button>
            </div>
            
            <div class="tournament-info">
              <!-- Tournament Title Row -->
              <div class="tournament-title-row">
                <div class="title-and-host">
                  <h1>{{ tournament.name }}</h1>
                  <div class="host-info">
                    <CountryFlag :country-code="tournament.hostCountryCode" :size="32" />
                    <div class="host-details">
                      <p class="host-label">Hosted by {{ tournament.hostCountry }}</p>
                      <p class="tournament-type">{{ formatTournamentType(tournament.type) }}</p>
                    </div>
                  </div>
                </div>
                
                
                <div class="status-section">
                  <span :class="`status-badge status-${tournament.status}`">
                    {{ formatStatus(tournament.status) }}
                  </span>
                  <button v-if="tournament.status !== 'completed'" @click="toggleEditMode" class="edit-btn">
                    <i :class="editMode ? 'fas fa-times' : 'fas fa-edit'"></i>
                    {{ editMode ? 'Cancel' : 'Edit' }}
                  </button>
                </div>
              </div>
              
              
              <!-- Edit Form -->
              <div v-if="editMode" class="edit-form">
                <form @submit.prevent="updateTournament" class="tournament-form">
                  <div class="form-row">
                    <div class="form-group">
                      <label for="editName">Tournament Name</label>
                      <input 
                        type="text" 
                        id="editName"
                        v-model="editForm.name" 
                        required
                        minlength="3"
                        maxlength="100"
                        class="input"
                        :class="{ 'error': editErrors.name }"
                      />
                      <span v-if="editErrors.name" class="field-error">{{ editErrors.name }}</span>
                    </div>
                    
                    <div class="form-group">
                      <label for="editStatus">Status</label>
                      <select 
                        id="editStatus"
                        v-model="editForm.status" 
                        class="input select"
                      >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                  
                  <div class="form-info">
                    <p class="info-label">Host Country</p>
                    <p class="info-value">
                      <CountryFlag :country-code="tournament.hostCountryCode" :size="20" />
                      {{ tournament.hostCountry }}
                    </p>
                  </div>
                  
                  <div class="form-info">
                    <p class="info-label">Tournament Type</p>
                    <p class="info-value">{{ formatTournamentType(tournament.type) }}</p>
                  </div>
                  
                  <div class="form-actions">
                    <button type="button" @click="toggleEditMode" class="btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" :disabled="updating" class="btn-primary">
                      <i v-if="updating" class="fas fa-spinner fa-spin"></i>
                      <i v-else class="fas fa-save"></i>
                      {{ updating ? 'Saving...' : 'Save Changes' }}
                    </button>
                  </div>
                  
                  <p v-if="updateError" class="error-message">{{ updateError }}</p>
                </form>
              </div>
              
              <!-- Tournament Meta -->
            </div>
          </div>
          
          <!-- Floating Quick Actions Sidebar -->
          <div class="floating-sidebar" :class="{ 'collapsed': sidebarCollapsed }">
            <div class="sidebar-header">
              <button @click="toggleSidebar" class="sidebar-toggle">
                <i :class="sidebarCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left'"></i>
              </button>
              <h3 v-if="!sidebarCollapsed">Quick Actions</h3>
            </div>
            
            <div class="sidebar-actions">
              <!-- Team Selection (Manual) or Qualification Process -->
              <button 
                v-if="tournament.type === 'manual'" 
                @click="toggleTeamManagement" 
                class="sidebar-action" 
                :class="{ 'active': showTeamManagement }" 
                :disabled="tournament.status === 'cancelled'"
                :title="sidebarCollapsed ? 'Team Selection' : ''"
              >
                <i class="fas fa-users"></i>
                <span v-if="!sidebarCollapsed">Team Selection</span>
              </button>
              <button 
                v-else 
                @click="toggleQualifying" 
                class="sidebar-action" 
                :class="{ 'active': showQualifying }" 
                :disabled="tournament.status === 'cancelled'"
                :title="sidebarCollapsed ? 'Qualifying' : ''"
              >
                <i class="fas fa-flag-checkered"></i>
                <span v-if="!sidebarCollapsed">Qualifying</span>
              </button>
              
              <!-- Start Tournament -->
              <button 
                class="sidebar-action" 
                :disabled="!tournament.canActivate || tournament.status !== 'draft'" 
                @click="activateTournament"
                :title="sidebarCollapsed ? 'Start Tournament' : ''"
              >
                <i class="fas fa-play"></i>
                <span v-if="!sidebarCollapsed">Start Tournament</span>
              </button>
              
              <!-- World Cup Draw -->
              <button 
                @click="toggleDraw" 
                class="sidebar-action" 
                :class="{ 'active': showDraw }"
                :title="sidebarCollapsed ? 'World Cup Draw' : ''"
              >
                <i class="fas fa-random"></i>
                <span v-if="!sidebarCollapsed">World Cup Draw</span>
              </button>
              
              <!-- Group Stage -->
              <button 
                @click="toggleGroupStage" 
                class="sidebar-action" 
                :class="{ 'active': showGroupStage }" 
                :disabled="tournament.status === 'draft' || tournament.status === 'cancelled'"
                :title="sidebarCollapsed ? 'Group Stage' : ''"
              >
                <i class="fas fa-users"></i>
                <span v-if="!sidebarCollapsed">Group Stage</span>
              </button>
              
              <!-- Knockout Stage -->
              <button 
                @click="toggleKnockout" 
                class="sidebar-action" 
                :class="{ 'active': showKnockout }" 
                :disabled="tournament.status === 'draft' || tournament.status === 'cancelled'"
                :title="sidebarCollapsed ? 'Knockout Stage' : ''"
              >
                <i class="fas fa-trophy"></i>
                <span v-if="!sidebarCollapsed">Knockout Stage</span>
              </button>
              
              <!-- Tournament Stats -->
              <button 
                @click="toggleStats" 
                class="sidebar-action" 
                :class="{ 'active': showStats }" 
                :disabled="tournament.status === 'draft' || tournament.status === 'cancelled'"
                :title="sidebarCollapsed ? 'Stats' : ''"
              >
                <i class="fas fa-chart-line"></i>
                <span v-if="!sidebarCollapsed">Stats</span>
              </button>
              
              <!-- Tournament News -->
              <button 
                @click="toggleNews" 
                class="sidebar-action news-action" 
                :class="{ 'active': showNews }" 
                :disabled="tournament.status === 'cancelled'"
                :title="sidebarCollapsed ? 'Tournament News' : ''"
              >
                <div class="news-icon-container">
                  <i class="fas fa-newspaper"></i>
                  <div v-if="unreadNewsCount > 0" class="unread-news-badge">{{ unreadNewsCount }}</div>
                </div>
                <span v-if="!sidebarCollapsed">Tournament News</span>
              </button>
            </div>
          </div>

          <!-- Main Tournament Content -->
          <div class="tournament-content" :class="{ 'sidebar-open': !sidebarCollapsed }">
            <div class="content-grid">
              
              <!-- Team Management (only for manual tournaments) -->
              <div v-if="showTeamManagement && tournament.type === 'manual'" id="team-management" class="content-card glass-white full-width">
                <div class="card-header">
                  <h3>Team Selection</h3>
                  <button @click="toggleTeamManagement" class="close-section-btn">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
                <div class="card-content">
                  <TeamManagement 
                    :tournament="tournament" 
                    :read-only="tournament.status === 'completed'"
                    @teams-updated="handleTeamsUpdated"
                  />
                </div>
              </div>

              <!-- Qualifying (only for qualification tournaments) -->
              <div v-if="showQualifying && tournament.type === 'qualification'" id="qualifying" class="content-card glass-white full-width">
                <div class="card-header">
                  <h3>Qualifying</h3>
                  <button @click="toggleQualifying" class="close-section-btn">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
                <div class="card-content">
                  <QualificationManager 
                    :tournament="tournament"
                    :read-only="tournament.status === 'completed'"
                    @qualification-started="handleQualificationStarted"
                    @matchday-simulated="handleMatchdaySimulated"
                    @match-simulated="handleQualificationMatchSimulated"
                    @confederation-matchday-simulated="handleMatchdaySimulated"
                    @playoff-match-simulated="handleQualificationMatchSimulated"
                    @qualification-completed="handleQualificationCompleted"
                  />
                </div>
              </div>

              <!-- World Cup Draw -->
              <div v-if="showDraw" id="draw" class="content-card glass-white full-width">
                <div class="card-header">
                  <h3>World Cup Draw</h3>
                  <button @click="toggleDraw" class="close-section-btn">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
                <div class="card-content">
                  <WorldCupDraw 
                    :tournament="tournament" 
                    :read-only="tournament.status === 'completed'"
                    @proceed-to-matches="handleProceedToMatches"
                  />
                </div>
              </div>

              <!-- Group Stage (Combined Matches & Standings) -->
              <div v-if="showGroupStage" id="group-stage" class="content-card glass-white full-width">
                <div class="card-header">
                  <h3>Group Stage</h3>
                  <button @click="toggleGroupStage" class="close-section-btn">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
                
                <!-- Tab Navigation -->
                <div class="tab-navigation">
                  <button 
                    @click="groupStageActiveTab = 'matches'" 
                    class="tab-btn"
                    :class="{ 'active': groupStageActiveTab === 'matches' }"
                  >
                    <i class="fas fa-futbol"></i>
                    Matches
                  </button>
                  <button 
                    @click="groupStageActiveTab = 'standings'" 
                    class="tab-btn"
                    :class="{ 'active': groupStageActiveTab === 'standings' }"
                  >
                    <i class="fas fa-chart-bar"></i>
                    Standings
                  </button>
                </div>
                
                <div class="card-content tab-content">
                  <!-- Matches Tab -->
                  <div v-if="groupStageActiveTab === 'matches'">
                    <GroupMatches 
                      :tournament="tournament" 
                      :read-only="tournament.status === 'completed'"
                      @matches-generated="handleMatchesGenerated"
                      @match-simulated="handleMatchSimulated"
                      @matchday-simulated="handleMatchdaySimulated"
                    />
                  </div>
                  
                  <!-- Standings Tab -->
                  <div v-if="groupStageActiveTab === 'standings'">
                    <GroupStandings 
                      :tournament="tournament" 
                      :read-only="tournament.status === 'completed'"
                      ref="standings"
                    />
                  </div>
                </div>
              </div>

              <!-- Knockout Stage -->
              <div v-if="showKnockout" id="knockout" class="content-card glass-white full-width">
                <div class="card-header">
                  <button @click="toggleKnockout" class="close-section-btn">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
                <div class="card-content">
                  <KnockoutBracket 
                    :tournament="tournament" 
                    :read-only="tournament.status === 'completed'"
                    @bracket-generated="handleBracketGenerated"
                    @match-simulated="handleKnockoutMatchSimulated"
                    @round-simulated="handleKnockoutRoundSimulated"
                  />
                </div>
              </div>

              <!-- Tournament Stats -->
              <div v-if="showStats" id="stats" class="content-card glass-white full-width">
                <div class="card-header">
                  <h3>Tournament Statistics</h3>
                  <button @click="toggleStats" class="close-section-btn">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
                <div class="card-content">
                  <TournamentStats :tournament="tournament" />
                </div>
              </div>

              <!-- Tournament News -->
              <div v-if="showNews" id="news" class="content-card glass-white full-width">
                <div class="card-header">
                  <h3>Tournament News</h3>
                  <button @click="toggleNews" class="close-section-btn">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
                <div class="card-content">
                  <TournamentNews :tournament="tournament" />
                </div>
              </div>

            </div>
          </div>
          
          <!-- Tournament Information Section -->
          <TournamentBrandingSimplified 
            v-if="tournament.mascot || tournament.logo || tournament.anthem || tournament.hostCities"
            :tournament="tournament" 
          />
          
          <!-- Tournament Settings Section (moved to bottom) -->
          <div class="tournament-details-bottom glass-white">
            <div class="card-header">
              <h3>Tournament Settings</h3>
              <i class="fas fa-cog"></i>
            </div>
            <div class="tournament-details-grid">
              <div class="detail-item">
                <i class="fas fa-calendar"></i>
                <div>
                  <span class="detail-label">Status</span>
                  <span class="detail-value" :class="`status-${tournament.status}`">{{ formatStatus(tournament.status) }}</span>
                </div>
              </div>
              <div class="detail-item">
                <i class="fas fa-users"></i>
                <div>
                  <span class="detail-label">Teams</span>
                  <span class="detail-value">{{ tournament.teamCount || 0 }}/{{ tournament.settings?.maxTeams || 32 }}</span>
                </div>
              </div>
              <div class="detail-item">
                <i class="fas fa-globe"></i>
                <div>
                  <span class="detail-label">Type</span>
                  <span class="detail-value">{{ formatTournamentType(tournament.type) }}</span>
                </div>
              </div>
              <div class="detail-item">
                <i class="fas fa-map-marker-alt"></i>
                <div>
                  <span class="detail-label">Host Country</span>
                  <span class="detail-value">
                    <CountryFlag :country-code="tournament.hostCountryCode" :size="20" />
                    {{ tournament.hostCountry }}
                  </span>
                </div>
              </div>
              <div class="detail-item" v-if="tournament.createdAt">
                <i class="fas fa-clock"></i>
                <div>
                  <span class="detail-label">Created</span>
                  <span class="detail-value">{{ formatDate(tournament.createdAt) }}</span>
                </div>
              </div>
              <div class="detail-item" v-if="tournament.year">
                <i class="fas fa-calendar-alt"></i>
                <div>
                  <span class="detail-label">Year</span>
                  <span class="detail-value">{{ tournament.year }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import AppHeader from '../components/AppHeader.vue'
import Breadcrumbs from '../components/Breadcrumbs.vue'
import CountryFlag from '../components/CountryFlag.vue'
import TeamManagement from '../components/TeamManagement.vue'
import QualificationManager from '../components/QualificationManager.vue'
import WorldCupDraw from '../components/WorldCupDraw.vue'
import GroupMatches from '../components/GroupMatches.vue'
import GroupStandings from '../components/GroupStandings.vue'
import KnockoutBracket from '../components/KnockoutBracket.vue'
import TournamentNews from '../components/TournamentNews.vue'
import TournamentStats from '../components/TournamentStats.vue'
import TournamentBrandingSimplified from '../components/TournamentBrandingSimplified.vue'
import { applyTournamentTheme, removeTournamentTheme } from '../styles/tournament-theme.js'
import { API_URL } from '../config/api.js'

export default {
  name: 'TournamentDetail',
  components: {
    AppHeader,
    Breadcrumbs,
    CountryFlag,
    TeamManagement,
    QualificationManager,
    WorldCupDraw,
    GroupMatches,
    GroupStandings,
    KnockoutBracket,
    TournamentNews,
    TournamentStats,
    TournamentBrandingSimplified
  },
  data() {
    return {
      username: '',
      subscriptionTier: 'basic',
      userAvatar: null,
      tournament: null,
      countries: [],
      loading: false,
      editMode: false,
      updating: false,
      updateError: '',
      editErrors: {},
      editForm: {
        name: '',
        status: ''
      },
      showTeamManagement: false,
      showQualifying: false,
      worldId: null,
      showDraw: false,
      showGroupStage: false,
      groupStageActiveTab: 'matches', // 'matches' or 'standings'
      showKnockout: false,
      showNews: false,
      showStats: false,
      unreadNewsCount: 0,
      allGroupMatchesCompleted: false,
      anyGroupMatchPlayed: false,
      knockoutPhaseDetected: false,
      sidebarCollapsed: false
    }
  },
  computed: {
    isWorldTournament() {
      return !!(this.worldId || this.tournament?.worldId)
    },
    backButtonText() {
      return this.isWorldTournament ? 'Back to World' : 'Back to Tournaments'
    },
    currentTournamentPhase() {
      if (!this.tournament) return null
      
      // Draft phase - show team management/qualifying
      if (this.tournament.status === 'draft') {
        return this.tournament.type === 'manual' ? 'team-management' : 'qualifying'
      }
      
      // Completed tournament - show knockout (final results)
      if (this.tournament.status === 'completed') {
        return 'knockout'
      }
      
      // Active tournament - need to detect current phase dynamically
      if (this.tournament.status === 'active') {
        // We need to check for actual knockout matches existence
        // This will be determined by calling an API to check knockout status
        if (this.knockoutPhaseDetected || this.allGroupMatchesCompleted) {
          return 'knockout'
        }
        
        // Check if group stage has started (draw completed)
        if (this.tournament.drawCompleted || this.tournament.teamCount >= 16) {
          return 'group-stage'
        }
        
        // Otherwise, still in draw phase
        return 'draw'
      }
      
      return null
    }
  },
  async mounted() {
    this.username = localStorage.getItem('username') || 'User'
    
    // Check if user is authenticated
    const token = localStorage.getItem('token')
    if (!token) {
      this.$router.push('/')
      return
    }
    
    // Check if this is a world tournament
    this.worldId = this.$route.query.worldId
    
    await this.loadTournament()
    this.loadCountries()
    this.loadUserProfile()
    
    // Only check group matches if tournament was loaded successfully
    if (this.tournament) {
      await this.checkGroupMatchesCompletion()
      await this.checkKnockoutPhase()
      this.loadUnreadNewsCount()
      
      // Apply tournament theming
      this.applyTournamentTheming()
      
      // Auto-show current tournament phase (after checking knockout status)
      this.showCurrentPhase()
    }
  },
  beforeUnmount() {
    // Clean up theming when leaving the component
    removeTournamentTheme()
  },
  watch: {
    tournament: {
      handler(newTournament) {
        if (newTournament) {
          this.applyTournamentTheming()
        }
      },
      deep: true
    }
  },
  methods: {
    applyTournamentTheming() {
      if (this.tournament?.logo?.colorScheme) {
        applyTournamentTheme(this.tournament)
      } else if (this.tournament?.hostCountryCode) {
        // Generate color scheme based on country code for tournaments without color schemes
        const colorScheme = this.generateColorSchemeForCountry(this.tournament.hostCountryCode)
        if (colorScheme) {
          const mockTournament = {
            ...this.tournament,
            logo: {
              ...this.tournament.logo,
              colorScheme
            }
          }
          applyTournamentTheme(mockTournament)
        }
      }
    },
    
    generateColorSchemeForCountry(countryCode) {
      const schemes = {
        KSA: { primary: '#006C35', secondary: '#006C35', accent: '#FFFFFF', description: 'Saudi green' },
        NGA: { primary: '#008751', secondary: '#008751', accent: '#FFFFFF', description: 'Nigerian green' },
        BRA: { primary: '#009739', secondary: '#FEDD00', accent: '#002776', description: 'Brazilian flag colors' },
        ARG: { primary: '#74ACDF', secondary: '#F6B40E', accent: '#74ACDF', description: 'Argentine sky blue and sun' },
        GER: { primary: '#000000', secondary: '#DD0000', accent: '#FFCE00', description: 'German tricolor' },
        FRA: { primary: '#002395', secondary: '#ED2939', accent: '#002395', description: 'French blue and red' },
        ESP: { primary: '#AA151B', secondary: '#F1BF00', accent: '#AA151B', description: 'Spanish red and gold' },
        ITA: { primary: '#009246', secondary: '#CE2B37', accent: '#009246', description: 'Italian green and red' },
        ENG: { primary: '#CF142B', secondary: '#00247D', accent: '#CF142B', description: 'English red and blue' },
        POR: { primary: '#006600', secondary: '#FF0000', accent: '#FFCC00', description: 'Portuguese green and red' },
        NED: { primary: '#FF6600', secondary: '#0033CC', accent: '#FF6600', description: 'Dutch orange and blue' },
        USA: { primary: '#002868', secondary: '#BF0A30', accent: '#002868', description: 'American blue and red' },
        MEX: { primary: '#006847', secondary: '#CE1126', accent: '#006847', description: 'Mexican green and red' },
        JPN: { primary: '#BC002D', secondary: '#BC002D', accent: '#FFFFFF', description: 'Japanese red' },
        AUS: { primary: '#002868', secondary: '#FFCD00', accent: '#002868', description: 'Australian blue and gold' },
        MAR: { primary: '#C1272D', secondary: '#006233', accent: '#C1272D', description: 'Moroccan red and green' },
        EGY: { primary: '#CE1126', secondary: '#000000', accent: '#CE1126', description: 'Egyptian red and black' },
        RSA: { primary: '#007749', secondary: '#FFB612', accent: '#DE3831', description: 'South African flag colors' },
        DEFAULT: { primary: '#1E88E5', secondary: '#FFC107', accent: '#4CAF50', description: 'vibrant international colors' }
      }
      
      return schemes[countryCode] || schemes.DEFAULT
    },
    
    goBack() {
      if (this.isWorldTournament) {
        const worldId = this.worldId || this.tournament?.worldId
        this.$router.push(`/worlds/${worldId}`)
      } else {
        this.$router.push('/tournaments')
      }
    },
    
    async loadTournament() {
      this.loading = true
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/tournaments/${this.$route.params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          this.tournament = await response.json()
          // Set worldId from tournament data if not already set from query params
          if (!this.worldId && this.tournament.worldId) {
            this.worldId = this.tournament.worldId
          }
        } else if (response.status === 404) {
          this.tournament = null
        } else {
          console.error('Failed to load tournament')
        }
      } catch (error) {
        console.error('Error loading tournament:', error)
      } finally {
        this.loading = false
      }
    },
    
    async loadCountries() {
      try {
        const response = await fetch('${API_URL}/tournaments/countries')
        if (response.ok) {
          this.countries = await response.json()
        }
      } catch (error) {
        console.error('Error loading countries:', error)
      }
    },
    
    toggleEditMode() {
      this.editMode = !this.editMode
      
      if (this.editMode && this.tournament) {
        // Initialize edit form with current values
        this.editForm = {
          name: this.tournament.name,
          status: this.tournament.status
        }
        this.editErrors = {}
        this.updateError = ''
      }
    },
    
    validateEditForm() {
      this.editErrors = {}
      
      if (!this.editForm.name || this.editForm.name.length < 3) {
        this.editErrors.name = 'Tournament name must be at least 3 characters long'
      }
      
      if (this.editForm.name && this.editForm.name.length > 100) {
        this.editErrors.name = 'Tournament name must not exceed 100 characters'
      }
      
      return Object.keys(this.editErrors).length === 0
    },
    
    async updateTournament() {
      if (!this.validateEditForm()) {
        return
      }
      
      this.updating = true
      this.updateError = ''
      
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/tournaments/${this.tournament._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: this.editForm.name,
            status: this.editForm.status
          })
        })
        
        const data = await response.json()
        
        if (response.ok) {
          this.tournament = data.tournament
          this.editMode = false
        } else {
          this.updateError = data.error || 'Failed to update tournament'
        }
      } catch (error) {
        this.updateError = 'Network error. Please try again.'
      } finally {
        this.updating = false
      }
    },
    
    
    formatStatus(status) {
      const statusMap = {
        'draft': 'Draft',
        'active': 'Active',
        'completed': 'Completed',
        'cancelled': 'Cancelled'
      }
      return statusMap[status] || status
    },
    
    formatTournamentType(type) {
      const typeMap = {
        'manual': 'Manual Team Selection',
        'qualification': 'Qualification Process'
      }
      return typeMap[type] || type
    },
    
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString()
    },
    
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },
    
    toggleTeamManagement() {
      this.showTeamManagement = !this.showTeamManagement
      if (this.showTeamManagement) {
        this.showQualifying = false
        this.showDraw = false
        this.showGroupStage = false
        this.showKnockout = false
        this.showNews = false
        this.showStats = false
        this.scrollToSection('team-management')
      }
    },
    
    toggleQualifying() {
      this.showQualifying = !this.showQualifying
      if (this.showQualifying) {
        this.showTeamManagement = false
        this.showDraw = false
        this.showGroupStage = false
        this.showKnockout = false
        this.showNews = false
        this.showStats = false
        this.scrollToSection('qualifying')
      }
    },

    toggleDraw() {
      this.showDraw = !this.showDraw
      if (this.showDraw) {
        this.showTeamManagement = false
        this.showQualifying = false
        this.showMatches = false
        this.showStandings = false
        this.showKnockout = false
        this.showNews = false
        this.showStats = false
        this.scrollToSection('draw')
      }
    },

    async handleTeamsUpdated() {
      // Reload tournament data to get updated team count and activation status
      await this.loadTournament()
    },
    
    async handleQualificationStarted() {
      // Reload tournament data when qualification starts
      await this.loadTournament()
    },
    
    async handleMatchdaySimulated() {
      // Reload tournament data when matchday is simulated
      await this.loadTournament()
    },
    
    async handleQualificationCompleted() {
      // Reload tournament data when qualification is completed
      await this.loadTournament()
      // After qualification is completed, automatically show the draw phase
      this.showCurrentPhase()
    },

    handleProceedToMatches() {
      this.showDraw = false
      this.showGroupStage = true
      this.groupStageActiveTab = 'matches'
      // Re-check match status
      this.checkGroupMatchesCompletion()
    },

    toggleGroupStage() {
      this.showGroupStage = !this.showGroupStage
      if (this.showGroupStage) {
        this.showTeamManagement = false
        this.showQualifying = false
        this.showDraw = false
        this.showKnockout = false
        this.showNews = false
        this.showStats = false
        this.scrollToSection('group-stage')
      }
    },

    toggleKnockout() {
      this.showKnockout = !this.showKnockout
      if (this.showKnockout) {
        this.showTeamManagement = false
        this.showQualifying = false
        this.showDraw = false
        this.showGroupStage = false
        this.showNews = false
        this.showStats = false
        this.scrollToSection('knockout')
      }
    },

    toggleNews() {
      this.showNews = !this.showNews
      if (this.showNews) {
        this.showTeamManagement = false
        this.showQualifying = false
        this.showDraw = false
        this.showGroupStage = false
        this.showKnockout = false
        this.showStats = false
        this.scrollToSection('news')
      }
    },

    toggleStats() {
      this.showStats = !this.showStats
      if (this.showStats) {
        this.showTeamManagement = false
        this.showQualifying = false
        this.showDraw = false
        this.showGroupStage = false
        this.showKnockout = false
        this.showNews = false
        this.scrollToSection('stats')
      }
    },

    showCurrentPhase() {
      const currentPhase = this.currentTournamentPhase
      if (!currentPhase) return
      
      // Auto-show and highlight the current tournament phase
      switch (currentPhase) {
        case 'team-management':
          this.toggleTeamManagement()
          break
        case 'qualifying':
          this.toggleQualifying()
          break
        case 'draw':
          this.toggleDraw()
          break
        case 'group-stage':
          this.toggleGroupStage()
          break
        case 'knockout':
          this.toggleKnockout()
          break
      }
    },

    handleMatchesGenerated() {
      if (this.$refs.standings) {
        this.$refs.standings.refreshStandings()
      }
      // Re-check match status
      this.checkGroupMatchesCompletion()
    },

    handleMatchSimulated() {
      if (this.$refs.standings) {
        this.$refs.standings.refreshStandings()
      }
      // Re-check match status after simulation
      this.checkGroupMatchesCompletion()
      // Refresh news count after match simulation
      this.loadUnreadNewsCount()
    },

    handleMatchdaySimulated() {
      if (this.$refs.standings) {
        this.$refs.standings.refreshStandings()
      }
      // Re-check match status after matchday simulation
      this.checkGroupMatchesCompletion()
      // Refresh news count after matchday simulation
      this.loadUnreadNewsCount()
    },

    handleBracketGenerated() {
      // Knockout bracket has been generated
    },

    handleKnockoutMatchSimulated() {
      // Reload tournament data to check for completion
      this.loadTournament()
    },

    handleKnockoutRoundSimulated() {
      // Reload tournament data to check for completion
      this.loadTournament()
    },

    handleQualificationMatchSimulated() {
      // Refresh news count after qualification match simulation
      this.loadUnreadNewsCount()
    },

    async activateTournament() {
      if (!confirm('Are you sure you want to activate this tournament? Once activated, you cannot modify the teams.')) {
        return
      }

      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/tournaments/${this.tournament._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            status: 'active'
          })
        })

        const data = await response.json()

        if (response.ok) {
          this.tournament = data.tournament
          this.showTeamManagement = false
        } else {
          alert(data.error || 'Failed to activate tournament')
        }
      } catch (error) {
        alert('Network error. Please try again.')
      }
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
    
    scrollToSection(sectionId) {
      this.$nextTick(() => {
        const element = document.getElementById(sectionId)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      })
    },
    
    async checkGroupMatchesCompletion() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/matches/${this.tournament._id}/matches`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const matches = await response.json()
          const completedMatches = matches.filter(match => match.status === 'completed')
          // All group matches completed when all existing matches are completed
          this.allGroupMatchesCompleted = matches.length > 0 && completedMatches.length === matches.length
          
          // Check if any group match has been played
          this.anyGroupMatchPlayed = completedMatches.length > 0
        }
      } catch (error) {
        console.error('Error checking group matches completion:', error)
      }
    },

    async checkKnockoutPhase() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/knockout/${this.tournament._id}/bracket`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const bracket = await response.json()
          // If we get a successful response with matches, knockout phase exists
          this.knockoutPhaseDetected = !!(bracket && bracket.matches && Object.keys(bracket.matches).length > 0)
        } else {
          // 400 status likely means no bracket exists yet
          this.knockoutPhaseDetected = false
        }
      } catch (error) {
        console.error('Error checking knockout phase:', error)
        this.knockoutPhaseDetected = false
      }
    },

    async loadUnreadNewsCount() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/news/${this.tournament._id}/unread-count`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          this.unreadNewsCount = data.count
        }
      } catch (error) {
        console.error('Error loading unread news count:', error)
      }
    }
  }
}
</script>

<style scoped>
.tournament-detail {
  min-height: 100vh;
  background: linear-gradient(135deg, #0066CC 0%, #003366 100%);
}

.main-content {
  padding: 2rem;
  display: flex;
  justify-content: center;
}

.tournament-container {
  width: 100%;
  max-width: 1200px;
  overflow-x: hidden;
}

.loading-state, .error-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--white);
}

.loading-state i, .error-state .error-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.error-state h3 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.error-state p {
  opacity: 0.8;
  margin-bottom: 2rem;
}

.tournament-header {
  padding: 20px;
  border-radius: var(--radius-xl);
  margin-bottom: 16px;
}

.back-navigation {
  margin-bottom: 16px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  color: var(--fifa-blue);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  padding: 8px 0;
  transition: all 0.3s ease;
}

.back-btn:hover {
  color: var(--fifa-dark-blue);
}

.tournament-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tournament-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.title-and-host {
  flex: 1;
}

.title-and-host h1 {
  font-size: 2rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
  margin: 0 0 8px 0;
}

.host-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.country-flag {
  font-size: 2rem;
}

.host-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.host-label {
  color: var(--gray);
  font-size: 0.95rem;
  margin: 0;
}

.tournament-type {
  color: var(--fifa-blue);
  font-size: 0.85rem;
  font-weight: var(--font-weight-semibold);
  margin: 0;
}

.tournament-mascot {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(0, 102, 204, 0.1));
  border-radius: var(--radius-lg);
  border: 2px solid rgba(255, 215, 0, 0.3);
  box-shadow: 0 4px 16px rgba(255, 215, 0, 0.2);
}

.mascot-image-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 3px solid var(--fifa-gold);
}

.mascot-image-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mascot-info-header h3 {
  color: var(--fifa-dark-blue);
  font-size: 1.3rem;
  font-weight: var(--font-weight-bold);
  margin: 0 0 4px 0;
}

.mascot-title {
  color: var(--fifa-gold);
  font-size: 0.85rem;
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
}

.mascot-description-section {
  background: rgba(0, 102, 204, 0.05);
  padding: 16px 20px;
  border-radius: var(--radius-md);
  border-left: 4px solid var(--fifa-gold);
}

.mascot-description {
  color: var(--gray);
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0;
  font-style: italic;
}

.status-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-badge {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-draft {
  background: rgba(108, 117, 125, 0.2);
  color: #6c757d;
}

.status-active {
  background: rgba(40, 167, 69, 0.2);
  color: #28a745;
}

.status-completed {
  background: rgba(0, 123, 255, 0.2);
  color: #007bff;
}

.status-cancelled {
  background: rgba(220, 53, 69, 0.2);
  color: #dc3545;
}

.edit-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: transparent;
  border: 1px solid var(--fifa-blue);
  color: var(--fifa-blue);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: var(--font-weight-semibold);
  transition: all 0.3s ease;
}

.edit-btn:hover {
  background: var(--fifa-blue);
  color: var(--white);
}

.edit-form {
  padding: 24px;
  background: rgba(0, 102, 204, 0.05);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(0, 102, 204, 0.1);
}

.tournament-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 8px;
  color: var(--fifa-dark-blue);
  font-weight: var(--font-weight-semibold);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 16px;
}

.info-label {
  color: var(--fifa-dark-blue);
  font-weight: var(--font-weight-semibold);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
}

.info-value {
  color: var(--gray);
  font-size: 1rem;
  background: rgba(0, 102, 204, 0.05);
  padding: 8px 12px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(0, 102, 204, 0.1);
  margin: 0;
}

.field-error {
  color: var(--fifa-red);
  font-size: 0.8rem;
  margin-top: 6px;
  font-weight: var(--font-weight-medium);
}

.form-actions {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}

.form-actions button {
  flex: 1;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.tournament-meta {
  display: flex;
  gap: 32px;
  padding-top: 24px;
  border-top: 1px solid rgba(0, 102, 204, 0.1);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--gray);
  font-size: 0.9rem;
}

.meta-item i {
  width: 16px;
  color: var(--fifa-blue);
}

.tournament-content {
  margin-top: 24px;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.content-card {
  padding: 24px;
  border-radius: var(--radius-xl);
}

.content-card.full-width {
  grid-column: 1 / -1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-header h3 {
  font-size: 1.25rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
  margin: 0;
}

.card-header i {
  color: var(--fifa-blue);
  font-size: 1.25rem;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  color: var(--gray);
  font-weight: var(--font-weight-medium);
}

.setting-value {
  font-weight: var(--font-weight-semibold);
  color: var(--fifa-dark-blue);
  display: flex;
  align-items: center;
  gap: 8px;
}

.text-success {
  color: #28a745;
}

.text-danger {
  color: #dc3545;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.action-grid-full {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  background: rgba(0, 102, 204, 0.05);
  border: 1px solid rgba(0, 102, 204, 0.1);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--fifa-blue);
  font-weight: var(--font-weight-semibold);
  font-size: 0.85rem;
}

.action-card:not(:disabled):hover {
  background: var(--fifa-blue);
  color: var(--white);
  transform: translateY(-2px);
}

.action-card:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-card.action-selected {
  background: var(--fifa-blue);
  color: var(--white);
  border-color: var(--fifa-dark-blue);
}

.action-card.action-selected:not(:disabled) {
  background: var(--fifa-dark-blue);
}

.close-section-btn {
  background: none;
  border: none;
  color: var(--gray);
  cursor: pointer;
  padding: 8px;
  border-radius: var(--radius-md);
  transition: all 0.3s ease;
}

.close-section-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  color: var(--fifa-dark-blue);
}

.team-progress {
  display: flex;
  gap: 32px;
  margin-bottom: 24px;
  padding: 16px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.progress-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.progress-label {
  font-size: 0.9rem;
  color: var(--gray);
  font-weight: var(--font-weight-medium);
}

.progress-value {
  font-size: 1.1rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
}

.progress-value.ready {
  color: var(--fifa-green);
}

.progress-value.not-ready {
  color: #ff8800;
}

.action-card i {
  font-size: 1.2rem;
}

.news-icon-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.unread-news-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: var(--fifa-red);
  color: var(--white);
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: var(--font-weight-bold);
  line-height: 1;
}

.progress-info p {
  color: var(--gray);
  margin-bottom: 24px;
}

.progress-steps {
  display: flex;
  gap: 24px;
  align-items: center;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border-radius: var(--radius-lg);
  transition: all 0.3s ease;
  opacity: 0.5;
}

.step.active {
  opacity: 1;
  background: rgba(0, 102, 204, 0.1);
  color: var(--fifa-blue);
}

.step i {
  font-size: 1.5rem;
}

.step span {
  font-size: 0.9rem;
  font-weight: var(--font-weight-semibold);
}

.error-message {
  color: var(--fifa-red);
  text-align: center;
  margin-top: 16px;
  padding: 12px;
  background: rgba(255, 68, 68, 0.1);
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 68, 68, 0.2);
  font-weight: var(--font-weight-medium);
}


/* Floating Sidebar Styles */
.floating-sidebar {
  position: fixed;
  top: 50%;
  left: 24px;
  transform: translateY(-50%);
  width: 220px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-radius: var(--radius-xl);
  border: 1px solid rgba(0, 102, 204, 0.15);
  box-shadow: 0 12px 40px rgba(0, 102, 204, 0.15);
  z-index: 1000;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 80vh;
  overflow-y: auto;
}

.floating-sidebar.collapsed {
  width: 56px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid rgba(0, 102, 204, 0.1);
}

.sidebar-header h3 {
  color: var(--fifa-dark-blue);
  font-size: 1rem;
  font-weight: var(--font-weight-bold);
  margin: 0;
}

.sidebar-toggle {
  background: none;
  border: none;
  color: var(--fifa-blue);
  cursor: pointer;
  padding: 8px;
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
}

.sidebar-toggle:hover {
  background: rgba(0, 102, 204, 0.1);
  transform: scale(1.1);
}

.sidebar-actions {
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sidebar-action {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: transparent;
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--fifa-blue);
  font-weight: var(--font-weight-semibold);
  font-size: 0.85rem;
  text-align: left;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.sidebar-action:hover {
  background: rgba(0, 102, 204, 0.08);
  transform: translateX(4px);
}

.sidebar-action.active {
  background: linear-gradient(135deg, var(--fifa-blue), var(--fifa-dark-blue));
  color: var(--white);
  box-shadow: 0 4px 16px rgba(0, 102, 204, 0.3);
}

.sidebar-action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.sidebar-action:disabled:hover {
  background: transparent;
  transform: none;
}

.sidebar-action i {
  font-size: 1.2rem;
  min-width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.collapsed .sidebar-action {
  justify-content: center;
  padding: 12px 6px;
}

.collapsed .sidebar-action span {
  display: none;
}

.news-action .news-icon-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.news-action .unread-news-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: var(--fifa-red);
  color: var(--white);
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  font-weight: var(--font-weight-bold);
  line-height: 1;
}

.tournament-content.sidebar-open {
  margin-left: 0;
}

.tournament-content {
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Tournament Settings Bottom Section */
.tournament-details-bottom {
  margin-top: 32px;
  padding: 24px;
  border-radius: var(--radius-xl);
}

.tournament-details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(0, 102, 204, 0.05);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(0, 102, 204, 0.1);
  transition: all 0.3s ease;
}

.detail-item:hover {
  background: rgba(0, 102, 204, 0.08);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 102, 204, 0.15);
}

.detail-item i {
  color: var(--fifa-gold);
  font-size: 1.2rem;
  min-width: 20px;
}

.detail-item div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 0.8rem;
  font-weight: var(--font-weight-semibold);
  color: var(--gray);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  font-size: 1rem;
  font-weight: var(--font-weight-semibold);
  color: var(--fifa-dark-blue);
}

.detail-value.status-draft {
  color: #6c757d;
}

.detail-value.status-active {
  color: #28a745;
}

.detail-value.status-completed {
  color: #007bff;
}

.detail-value.status-cancelled {
  color: #dc3545;
}

/* Tab Navigation Styles */
.tab-navigation {
  display: flex;
  background: rgba(0, 102, 204, 0.05);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  border-bottom: 1px solid rgba(0, 102, 204, 0.1);
  margin: 0 -24px;
  padding: 0 24px;
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 20px;
  background: none;
  border: none;
  color: var(--gray);
  font-weight: var(--font-weight-semibold);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 3px solid transparent;
}

.tab-btn:hover {
  color: var(--fifa-blue);
  background: rgba(0, 102, 204, 0.05);
}

.tab-btn.active {
  color: var(--fifa-blue);
  background: rgba(0, 102, 204, 0.1);
  border-bottom-color: var(--fifa-blue);
}

.tab-btn i {
  font-size: 1rem;
}

.tab-content {
  padding-top: 1.5rem;
}

@media (max-width: 768px) {
  .main-content {
    padding: 1rem;
  }
  
  .tournament-header {
    padding: 16px;
  }
  
  /* Make tournament header compact and single column */
  .tournament-title-row {
    flex-direction: column !important;
    gap: 12px !important;
    align-items: stretch !important;
  }
  
  .title-and-host {
    flex: none !important;
  }
  
  .title-and-host h1 {
    font-size: 1.5rem !important;
    margin: 0 0 8px 0 !important;
  }
  
  .host-info {
    gap: 6px !important;
  }
  
  .host-details p {
    font-size: 0.85rem !important;
    margin: 0 !important;
  }
  
  .status-section {
    align-self: flex-start !important;
  }
  
  .host-section {
    flex-direction: column;
    gap: 16px;
  }
  
  .country-info h1 {
    font-size: 2rem;
  }
  
  .country-flag {
    font-size: 2.5rem;
  }
  
  .tournament-meta {
    flex-direction: column;
    gap: 16px;
  }
  
  .content-grid {
    grid-template-columns: 1fr;
  }
  
  .content-card {
    padding: 16px;
    overflow-x: hidden;
  }
  
  .content-card.full-width {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .action-grid, .action-grid-full {
    grid-template-columns: 1fr;
  }
  
  .progress-steps {
    flex-direction: column;
    gap: 16px;
  }
  
  .tab-navigation {
    margin: 0 -16px;
    padding: 0 16px;
  }
  
  .tab-btn {
    padding: 12px 16px;
    font-size: 0.85rem;
  }
  
  /* Mobile Quick Actions Bar - Override all desktop styles */
  .floating-sidebar {
    position: fixed !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    top: auto !important;
    width: 100% !important;
    height: 56px !important;
    max-height: 56px !important;
    background: white !important;
    border-top: 1px solid rgba(0, 0, 0, 0.1) !important;
    border-radius: 0 !important;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1) !important;
    z-index: 1000 !important;
    transform: none !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: visible !important;
  }
  
  .floating-sidebar.collapsed {
    transform: none !important;
    height: 56px !important;
  }
  
  .sidebar-header {
    display: none;
  }
  
  .sidebar-toggle {
    display: none;
  }
  
  .sidebar-actions {
    display: flex !important;
    flex-direction: row !important;
    justify-content: space-evenly !important;
    align-items: center !important;
    padding: 0 !important;
    gap: 0 !important;
    height: 56px !important;
    width: 100% !important;
    flex-wrap: nowrap !important;
  }
  
  .sidebar-action {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    flex: 1 !important;
    height: 56px !important;
    width: auto !important;
    min-width: 0 !important;
    max-width: none !important;
    padding: 0 !important;
    background: none !important;
    border: none !important;
    border-radius: 0 !important;
    color: #666 !important;
    transition: color 0.2s ease !important;
    position: relative !important;
    text-align: center !important;
    flex-direction: column !important;
    gap: 0 !important;
  }
  
  .sidebar-action:disabled {
    opacity: 0.3 !important;
    cursor: not-allowed !important;
  }
  
  .sidebar-action.active {
    color: var(--fifa-blue) !important;
    background: none !important;
  }
  
  .sidebar-action.active::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--fifa-blue);
  }
  
  .sidebar-action i {
    font-size: 1.3rem !important;
    line-height: 1 !important;
  }
  
  .sidebar-action span {
    display: none !important;
  }
  
  .news-action .news-icon-container {
    position: relative;
  }
  
  .news-action .unread-news-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    width: 16px;
    height: 16px;
    font-size: 0.6rem;
  }
  
  .tournament-content {
    padding-bottom: 60px;
  }
  
  .tournament-details-grid {
    grid-template-columns: 1fr;
  }
  
  .tournament-container {
    padding: 0 8px;
  }
  
  .tournament-content {
    margin-left: 0;
    overflow-x: hidden;
  }
}
</style>

<style>
/* Import tournament theme styles */
@import '../styles/tournament-theme.css';
</style>