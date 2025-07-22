<template>
  <div class="tournament-detail">
    <AppHeader 
      :username="username" 
      :subscription-tier="subscriptionTier"
      @logout="handleLogout" 
    />
    
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
          <button @click="$router.push('/tournaments')" class="btn-primary">
            <i class="fas fa-arrow-left"></i>
            Back to Tournaments
          </button>
        </div>
        
        <div v-else class="tournament-detail-content">
          <!-- Tournament Header -->
          <TournamentHeader 
            :tournament="tournament"
            :countries="countries"
            @back="$router.push('/tournaments')"
            @tournament-updated="handleTournamentUpdated"
          />
          
          <!-- Tournament Content -->
          <div class="tournament-content">
            <div class="content-grid">
              <!-- Quick Actions -->
              <TournamentQuickActions 
                :tournament="tournament"
                :show-team-management="showTeamManagement"
                :show-qualifying="showQualifying"
                :show-draw="showDraw"
                :show-matches="showMatches"
                :show-standings="showStandings"
                :show-knockout="showKnockout"
                :any-group-match-played="anyGroupMatchPlayed"
                @toggle-team-management="toggleTeamManagement"
                @toggle-qualifying="toggleQualifying"
                @activate-tournament="activateTournament"
                @toggle-draw="toggleDraw"
                @toggle-matches="toggleMatches"
                @toggle-standings="toggleStandings"
                @toggle-knockout="toggleKnockout"
              />
              
              <!-- Team Management (only for manual tournaments) -->
              <TournamentContentCard 
                v-if="showTeamManagement && tournament.type === 'manual'" 
                id="team-management"
                title="Team Selection"
                @close="toggleTeamManagement"
              >
                <TeamManagement 
                  :tournament="tournament" 
                  :read-only="tournament.status === 'completed'"
                  @teams-updated="handleTeamsUpdated"
                />
              </TournamentContentCard>

              <!-- Qualifying (only for qualification tournaments) -->
              <TournamentContentCard 
                v-if="showQualifying && tournament.type === 'qualification'" 
                id="qualifying"
                title="Qualifying"
                @close="toggleQualifying"
              >
                <QualificationManager 
                  :tournament="tournament"
                  :read-only="tournament.status === 'completed'"
                  @qualification-started="handleQualificationStarted"
                  @matchday-simulated="handleMatchdaySimulated"
                  @qualification-completed="handleQualificationCompleted"
                />
              </TournamentContentCard>

              <!-- World Cup Draw -->
              <TournamentContentCard 
                v-if="showDraw" 
                id="draw"
                title="World Cup Draw"
                @close="toggleDraw"
              >
                <WorldCupDraw 
                  :tournament="tournament"
                  :read-only="tournament.status === 'completed' || anyGroupMatchPlayed"
                  @draw-completed="handleDrawCompleted"
                />
              </TournamentContentCard>

              <!-- Group Matches -->
              <TournamentContentCard 
                v-if="showMatches" 
                id="group-matches"
                title="Group Matches"
                @close="toggleMatches"
              >
                <GroupMatches 
                  :tournament="tournament"
                  :read-only="tournament.status === 'completed'"
                  @match-simulated="handleMatchSimulated"
                  @matchday-simulated="handleMatchdaySimulated"
                  @group-stage-completed="handleGroupStageCompleted"
                />
              </TournamentContentCard>

              <!-- Group Standings -->
              <TournamentContentCard 
                v-if="showStandings" 
                id="group-standings"
                title="Group Standings"
                @close="toggleStandings"
              >
                <GroupStandings 
                  :tournament="tournament"
                />
              </TournamentContentCard>

              <!-- Knockout Matches -->
              <TournamentContentCard 
                v-if="showKnockout" 
                id="knockout"
                title="Knockout Matches"
                @close="toggleKnockout"
              >
                <KnockoutBracket 
                  :tournament="tournament"
                  :read-only="tournament.status === 'completed'"
                  @match-simulated="handleMatchSimulated"
                  @tournament-completed="handleTournamentCompleted"
                />
              </TournamentContentCard>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import AppHeader from '../components/AppHeader.vue'
import TournamentHeader from '../components/tournament/TournamentHeader.vue'
import TournamentQuickActions from '../components/tournament/TournamentQuickActions.vue'
import TournamentContentCard from '../components/tournament/TournamentContentCard.vue'
import TeamManagement from '../components/TeamManagement.vue'
import QualificationManager from '../components/QualificationManager.vue'
import WorldCupDraw from '../components/WorldCupDraw.vue'
import GroupMatches from '../components/GroupMatches.vue'
import GroupStandings from '../components/GroupStandings.vue'
import KnockoutBracket from '../components/KnockoutBracket.vue'

export default {
  name: 'TournamentDetailRefactored',
  components: {
    AppHeader,
    TournamentHeader,
    TournamentQuickActions,
    TournamentContentCard,
    TeamManagement,
    QualificationManager,
    WorldCupDraw,
    GroupMatches,
    GroupStandings,
    KnockoutBracket
  },
  data() {
    return {
      username: '',
      subscriptionTier: 'basic',
      tournament: null,
      countries: [],
      loading: true,
      error: '',
      showTeamManagement: false,
      showQualifying: false,
      showDraw: false,
      showMatches: false,
      showStandings: false,
      showKnockout: false,
      anyGroupMatchPlayed: false
    }
  },
  computed: {
    tournamentId() {
      return this.$route.params.id
    }
  },
  mounted() {
    this.username = localStorage.getItem('username') || 'User'
    
    // Check if user is authenticated
    const token = localStorage.getItem('token')
    if (!token) {
      this.$router.push('/')
      return
    }
    
    this.loadTournament()
    this.loadCountries()
    this.loadUserProfile()
  },
  methods: {
    async loadTournament() {
      this.loading = true
      this.error = ''
      
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/tournaments/${this.tournamentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          this.tournament = await response.json()
          await this.checkGroupMatchStatus()
        } else if (response.status === 404) {
          this.tournament = null
        } else {
          this.error = 'Failed to load tournament'
        }
      } catch (error) {
        this.error = 'Network error. Please try again.'
      } finally {
        this.loading = false
      }
    },
    
    async loadCountries() {
      try {
        const response = await fetch('http://localhost:3001/api/tournaments/countries')
        if (response.ok) {
          this.countries = await response.json()
        }
      } catch (error) {
        console.error('Error loading countries:', error)
      }
    },
    
    async loadUserProfile() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('http://localhost:3001/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const user = await response.json()
          this.subscriptionTier = user.subscriptionTier || 'basic'
        }
      } catch (error) {
        console.error('Error loading user profile:', error)
      }
    },
    
    async checkGroupMatchStatus() {
      if (!this.tournament) return
      
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/matches/${this.tournament._id}/group-status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          this.anyGroupMatchPlayed = data.anyGroupMatchPlayed || false
        }
      } catch (error) {
        console.error('Error checking group match status:', error)
      }
    },
    
    handleLogout() {
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      this.$router.push('/')
    },
    
    handleTournamentUpdated(updatedTournament) {
      this.tournament = updatedTournament
    },
    
    // Toggle methods
    toggleTeamManagement() {
      this.showTeamManagement = !this.showTeamManagement
      this.hideOtherSections('teamManagement')
      if (this.showTeamManagement) {
        this.scrollToSection('team-management')
      }
    },
    
    toggleQualifying() {
      this.showQualifying = !this.showQualifying
      this.hideOtherSections('qualifying')
      if (this.showQualifying) {
        this.scrollToSection('qualifying')
      }
    },
    
    toggleDraw() {
      this.showDraw = !this.showDraw
      this.hideOtherSections('draw')
      if (this.showDraw) {
        this.scrollToSection('draw')
      }
    },
    
    toggleMatches() {
      this.showMatches = !this.showMatches
      this.hideOtherSections('matches')
      if (this.showMatches) {
        this.scrollToSection('group-matches')
      }
    },
    
    toggleStandings() {
      this.showStandings = !this.showStandings
      this.hideOtherSections('standings')
      if (this.showStandings) {
        this.scrollToSection('group-standings')
      }
    },
    
    toggleKnockout() {
      this.showKnockout = !this.showKnockout
      this.hideOtherSections('knockout')
      if (this.showKnockout) {
        this.scrollToSection('knockout')
      }
    },
    
    hideOtherSections(except) {
      if (except !== 'teamManagement') this.showTeamManagement = false
      if (except !== 'qualifying') this.showQualifying = false
      if (except !== 'draw') this.showDraw = false
      if (except !== 'matches') this.showMatches = false
      if (except !== 'standings') this.showStandings = false
      if (except !== 'knockout') this.showKnockout = false
    },
    
    scrollToSection(sectionId) {
      this.$nextTick(() => {
        const element = document.getElementById(sectionId)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      })
    },
    
    // Event handlers
    async activateTournament() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/tournaments/${this.tournament._id}/activate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          await this.loadTournament()
        } else {
          const data = await response.json()
          this.error = data.error || 'Failed to activate tournament'
        }
      } catch (error) {
        this.error = 'Network error. Please try again.'
      }
    },
    
    handleTeamsUpdated() {
      this.loadTournament()
    },
    
    handleQualificationStarted() {
      this.loadTournament()
    },
    
    handleMatchdaySimulated() {
      this.loadTournament()
    },
    
    handleQualificationCompleted() {
      this.loadTournament()
    },
    
    handleDrawCompleted() {
      this.loadTournament()
      this.checkGroupMatchStatus()
    },
    
    handleMatchSimulated() {
      this.loadTournament()
      this.checkGroupMatchStatus()
    },
    
    handleGroupStageCompleted() {
      this.loadTournament()
      this.checkGroupMatchStatus()
    },
    
    handleTournamentCompleted() {
      this.loadTournament()
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
  max-width: 1400px;
}

.loading-state, .error-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--white);
}

.loading-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-state .error-icon {
  font-size: 4rem;
  margin-bottom: 2rem;
  color: var(--fifa-red);
}

.error-state h3 {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: var(--white);
}

.error-state p {
  font-size: 1.1rem;
  margin-bottom: 2rem;
  opacity: 0.8;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  background: var(--fifa-blue);
  color: var(--white);
  border: none;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: var(--fifa-dark-blue);
}

.tournament-detail-content {
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.tournament-content {
  margin-top: 2rem;
}

.content-grid {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

@media (max-width: 768px) {
  .main-content {
    padding: 1rem;
  }
  
  .error-state .error-icon {
    font-size: 3rem;
  }
  
  .error-state h3 {
    font-size: 1.5rem;
  }
}
</style>