<template>
  <div class="tournament-detail">
    <AppHeader 
      :username="username" 
      :subscription-tier="subscriptionTier"
      :user-avatar="userAvatar"
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
                :show-roster="showRoster"
                :regenerating-players="regeneratingPlayers"
                :any-group-match-played="anyGroupMatchPlayed"
                @toggle-team-management="toggleTeamManagement"
                @toggle-qualifying="toggleQualifying"
                @activate-tournament="activateTournament"
                @toggle-draw="toggleDraw"
                @toggle-matches="toggleMatches"
                @toggle-standings="toggleStandings"
                @toggle-knockout="toggleKnockout"
                @toggle-roster="toggleRoster"
                @regenerate-players="regenerateAllPlayers"
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

              <!-- Team Roster -->
              <TournamentContentCard 
                v-if="showRoster" 
                id="roster"
                title="Team Rosters"
                @close="toggleRoster"
              >
                <div v-if="selectedTeam" class="roster-container">
                  <TeamRoster 
                    :team="selectedTeam"
                    :tournament-id="tournament._id"
                    :world-id="tournament.worldId"
                  />
                </div>
                <div v-else class="team-selection">
                  <h4>Select a team to view their roster</h4>
                  <div class="teams-grid">
                    <div 
                      v-for="team in tournamentTeams" 
                      :key="team.countryCode"
                      @click="selectTeam(team)"
                      class="team-card"
                    >
                      <span class="team-flag">{{ team.countryFlag }}</span>
                      <span class="team-name">{{ team.countryName }}</span>
                    </div>
                  </div>
                </div>
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
import TeamRoster from '../components/TeamRoster.vue'
import { API_URL } from '../config/api.js'

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
    KnockoutBracket,
    TeamRoster
  },
  data() {
    return {
      username: '',
      subscriptionTier: 'basic',
      userAvatar: null,
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
      showRoster: false,
      showDebug: process.env.NODE_ENV === 'development' || window.location.search.includes('debug=true'),
      regeneratingPlayers: false,
      anyGroupMatchPlayed: false,
      selectedTeam: null,
      tournamentTeams: []
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
        const response = await fetch(`${API_URL}/tournaments/${this.tournamentId}`, {
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
        const response = await fetch('${API_URL}/tournaments/countries')
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
    
    async checkGroupMatchStatus() {
      if (!this.tournament) return
      
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/matches/${this.tournament._id}/group-status`, {
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
    
    async toggleRoster() {
      this.showRoster = !this.showRoster
      this.hideOtherSections('roster')
      if (this.showRoster) {
        await this.loadTournamentTeams()
        this.scrollToSection('roster')
      }
    },
    
    hideOtherSections(except) {
      if (except !== 'teamManagement') this.showTeamManagement = false
      if (except !== 'qualifying') this.showQualifying = false
      if (except !== 'draw') this.showDraw = false
      if (except !== 'matches') this.showMatches = false
      if (except !== 'standings') this.showStandings = false
      if (except !== 'knockout') this.showKnockout = false
      if (except !== 'roster') this.showRoster = false
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
        const response = await fetch(`${API_URL}/tournaments/${this.tournament._id}/activate`, {
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

    async loadTournamentTeams() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/teams/${this.tournament._id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          this.tournamentTeams = await response.json()
        } else {
          console.error('Failed to load tournament teams')
        }
      } catch (error) {
        console.error('Error loading tournament teams:', error)
      }
    },

    selectTeam(team) {
      this.selectedTeam = {
        code: team.countryCode,
        name: team.countryName,
        flag: team.countryFlag
      }
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
    },

    async regenerateAllPlayers() {
      console.log('🔧 REGENERATE: Method called!')
      console.log('🔧 REGENERATE: Currently regenerating?', this.regeneratingPlayers)
      console.log('🔧 REGENERATE: Tournament:', this.tournament)
      
      if (this.regeneratingPlayers) {
        console.log('🔧 REGENERATE: Already regenerating, returning')
        return
      }

      const confirmRegenerate = confirm(
        `Are you sure you want to regenerate all players for this tournament?\n\n` +
        `This will:\n` +
        `• Delete all existing player data\n` +
        `• Create new players with different stats and faces\n` +
        `• This action cannot be undone\n\n` +
        `Continue?`
      )

      if (!confirmRegenerate) {
        console.log('🔧 REGENERATE: User cancelled')
        return
      }

      console.log('🔧 REGENERATE: Starting regeneration...')
      this.regeneratingPlayers = true

      try {
        const token = localStorage.getItem('token')
        console.log('🔧 REGENERATE: Token:', token ? 'Present' : 'Missing')
        
        const payload = {
          tournamentId: this.tournament._id
        }
        console.log('🔧 REGENERATE: Payload:', payload)
        
        const response = await fetch(`${API_URL}/players/regenerate-tournament`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        })

        console.log('🔧 REGENERATE: Response status:', response.status)

        if (response.ok) {
          const result = await response.json()
          console.log('🔧 REGENERATE: Success result:', result)
          alert(`✅ Success!\n\nRegenerated players for ${result.teamsRegenerated} teams.\n\nRefresh any open team rosters to see the new players.`)
          
          // Clear any cached roster data
          this.selectedTeam = null
          this.tournamentTeams = []
        } else {
          const error = await response.json()
          console.error('🔧 REGENERATE: API error:', error)
          alert(`❌ Error regenerating players:\n\n${error.error || 'Unknown error occurred'}`)
        }
      } catch (error) {
        console.error('🔧 REGENERATE: Network error:', error)
        alert(`❌ Network error:\n\n${error.message}`)
      } finally {
        console.log('🔧 REGENERATE: Finished, setting regeneratingPlayers to false')
        this.regeneratingPlayers = false
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

.team-selection {
  padding: 2rem;
  text-align: center;
}

.team-selection h4 {
  color: var(--white);
  margin-bottom: 2rem;
  font-size: 1.3rem;
}

.teams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  max-height: 400px;
  overflow-y: auto;
}

.team-card {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-lg);
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 12px;
}

.team-card:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: var(--fifa-gold);
  transform: translateY(-2px);
}

.team-flag {
  font-size: 1.5rem;
}

.team-name {
  color: var(--white);
  font-weight: 500;
}

.roster-container {
  min-height: 600px;
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