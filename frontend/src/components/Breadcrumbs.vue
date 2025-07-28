<template>
  <div v-if="breadcrumbs.length > 0" class="breadcrumbs-container" :class="{ 'fixed': isFixed }">
    <div class="breadcrumbs-wrapper">
      <nav class="breadcrumbs">
        <ol class="breadcrumb-list">
          <li 
            v-for="(crumb, index) in breadcrumbs" 
            :key="index" 
            class="breadcrumb-item"
            :class="{ 'active': index === breadcrumbs.length - 1 }"
          >
            <router-link 
              v-if="crumb.route && index !== breadcrumbs.length - 1" 
              :to="crumb.route"
              class="breadcrumb-link"
            >
              <i v-if="crumb.icon" :class="crumb.icon" class="breadcrumb-icon"></i>
              {{ crumb.text }}
            </router-link>
            <span v-else class="breadcrumb-text">
              <i v-if="crumb.icon" :class="crumb.icon" class="breadcrumb-icon"></i>
              {{ crumb.text }}
            </span>
            <i 
              v-if="index < breadcrumbs.length - 1" 
              class="fas fa-chevron-right breadcrumb-separator"
            ></i>
          </li>
        </ol>
      </nav>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Breadcrumbs',
  props: {
    currentWorld: {
      type: Object,
      default: null
    },
    currentTournament: {
      type: Object,
      default: null
    },
    currentMatch: {
      type: Object,
      default: null
    },
    currentTeam: {
      type: Object,
      default: null
    },
    currentPlayer: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      isFixed: false,
      scrollThreshold: 100
    }
  },
  computed: {
    breadcrumbs() {
      return this.buildBreadcrumbs()
    }
  },
  mounted() {
    window.addEventListener('scroll', this.handleScroll)
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.handleScroll)
    document.body.classList.remove('breadcrumbs-fixed')
  },
  methods: {
    handleScroll() {
      // Disable fixed positioning on mobile
      if (window.innerWidth <= 768) {
        return
      }
      
      const shouldBeFixed = window.scrollY > this.scrollThreshold
      if (shouldBeFixed !== this.isFixed) {
        this.isFixed = shouldBeFixed
        if (shouldBeFixed) {
          document.body.classList.add('breadcrumbs-fixed')
        } else {
          document.body.classList.remove('breadcrumbs-fixed')
        }
      }
    },
    
    buildBreadcrumbs() {
      const route = this.$route
      
      if (!route) {
        return []
      }
      
      const breadcrumbs = []
      
      // Always start with home if not already there
      if (route.path !== '/dashboard') {
        breadcrumbs.push({
          text: 'Home',
          route: { path: '/dashboard' },
          icon: 'fas fa-home'
        })
      }
      
      // World context
      if ((route.query && route.query.worldId) || route.path.startsWith('/worlds/')) {
        const worldId = (route.query && route.query.worldId) || (route.params && route.params.id)
        if (worldId) {
          breadcrumbs.push({
            text: this.getWorldName(worldId),
            route: { path: `/worlds/${worldId}` },
            icon: 'fas fa-globe'
          })
        }
      }
      
      // Tournaments list context
      if (route.path.startsWith('/tournament') && !route.path.startsWith('/tournaments')) {
        breadcrumbs.push({
          text: 'Tournaments',
          route: { path: '/tournaments' },
          icon: 'fas fa-trophy'
        })
      }
      
      // Tournament context
      if (route.params && (route.params.tournamentId || (route.params.id && route.path.startsWith('/tournament/')))) {
        const tournamentId = route.params.tournamentId || route.params.id
        const tournamentName = this.getTournamentName(tournamentId)
        
        breadcrumbs.push({
          text: tournamentName,
          route: { 
            path: `/tournament/${tournamentId}`,
            query: (route.query && route.query.worldId) ? { worldId: route.query.worldId } : {}
          },
          icon: 'fas fa-trophy'
        })
      }
      
      // Match context: /tournament/:tournamentId/match/:matchId
      if (route.params && route.params.matchId && route.params.tournamentId) {
        const matchInfo = this.getMatchInfo(route.params.matchId)
        breadcrumbs.push({
          text: matchInfo.text,
          icon: 'fas fa-futbol'
        })
      }
      
      // Team context: /tournament/:tournamentId/team/:teamId or /tournament/:tournamentId/qualifying-team/:teamId
      if (route.params && route.params.teamId && route.params.tournamentId) {
        const teamName = this.getTeamName(route.params.teamId)
        const teamType = route.path.includes('/qualifying-team/') ? 'Qualifying Team' : 'Team'
        breadcrumbs.push({
          text: `${teamType}: ${teamName}`,
          icon: 'fas fa-users'
        })
      }
      
      // Player context: /player/:playerId
      if (route.params && route.params.playerId && route.path.startsWith('/player/')) {
        const playerName = this.getPlayerName(route.params.playerId)
        breadcrumbs.push({
          text: playerName,
          icon: 'fas fa-user'
        })
      }
      
      return breadcrumbs
    },
    
    getWorldName(worldId) {
      // Try to get world name from prop or fallback
      if (this.currentWorld && this.currentWorld._id === worldId) {
        return this.currentWorld.name
      }
      return 'World'
    },
    
    getTournamentName(tournamentId) {
      // Try to get tournament name from prop or fallback
      if (this.currentTournament && this.currentTournament._id === tournamentId) {
        return this.currentTournament.name
      }
      return 'Tournament'
    },
    
    getMatchInfo(matchId) {
      // Try to get match info from prop or fallback
      if (this.currentMatch && this.currentMatch._id === matchId) {
        const match = this.currentMatch
        if (match.homeTeam && match.awayTeam) {
          return {
            text: `${match.homeTeam.countryName || match.homeTeam.name} vs ${match.awayTeam.countryName || match.awayTeam.name}`,
          }
        }
      }
      return { text: 'Match' }
    },
    
    getTeamName(teamId) {
      // Try to get team name from prop or fallback
      if (this.currentTeam && this.currentTeam._id === teamId) {
        return this.currentTeam.countryName || this.currentTeam.name
      }
      return 'Team'
    },
    
    getPlayerName(playerId) {
      // Try to get player name from prop or fallback
      if (this.currentPlayer && this.currentPlayer._id === playerId) {
        return this.currentPlayer.displayName || this.currentPlayer.name
      }
      return 'Player'
    }
  }
}
</script>

<style scoped>
.breadcrumbs-container {
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid rgba(0, 102, 204, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  z-index: 100;
}

.breadcrumbs-container.fixed {
  position: fixed;
  top: var(--header-height, 60px); /* Position below header */
  left: 0;
  right: 0;
  box-shadow: 0 2px 20px rgba(0, 102, 204, 0.1);
  border-bottom: 1px solid rgba(0, 102, 204, 0.2);
  z-index: 90; /* Lower than header but above content */
}

/* Add padding when breadcrumbs are fixed */
body.breadcrumbs-fixed .main-content {
  padding-top: var(--breadcrumb-height, 45px);
}

.breadcrumbs-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.breadcrumbs {
  padding: 0.75rem 0;
}

.breadcrumb-list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.breadcrumb-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--fifa-blue);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: var(--font-weight-medium);
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

.breadcrumb-link:hover {
  background: rgba(0, 102, 204, 0.1);
  color: var(--fifa-dark-blue);
}

.breadcrumb-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--gray);
  font-size: 0.9rem;
  font-weight: var(--font-weight-medium);
  padding: 0.25rem 0.5rem;
}

.breadcrumb-item.active .breadcrumb-text {
  color: var(--fifa-dark-blue);
  font-weight: var(--font-weight-semibold);
}

.breadcrumb-icon {
  font-size: 0.8rem;
  opacity: 0.8;
}

.breadcrumb-separator {
  color: var(--gray);
  font-size: 0.7rem;
  opacity: 0.6;
  margin: 0 0.25rem;
}

/* Responsive design */
@media (max-width: 768px) {
  .breadcrumbs-container {
    position: relative !important;
  }
  
  .breadcrumbs-container.fixed {
    position: relative !important;
    top: auto !important;
    left: auto !important;
    right: auto !important;
    box-shadow: none;
  }
  
  .breadcrumbs-wrapper {
    padding: 0 16px;
  }
  
  .breadcrumbs {
    padding: 8px 0;
  }
  
  .breadcrumb-list {
    gap: 4px;
    flex-wrap: wrap;
  }
  
  .breadcrumb-link,
  .breadcrumb-text {
    font-size: 0.75rem;
    padding: 4px 8px;
  }
  
  .breadcrumb-icon {
    font-size: 0.65rem;
  }
  
  .breadcrumb-separator {
    margin: 0 4px;
    font-size: 0.5rem;
  }
}

/* Animation for fixed state */
.breadcrumbs-container:not(.fixed) {
  position: relative;
}

.breadcrumbs-container.fixed {
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>