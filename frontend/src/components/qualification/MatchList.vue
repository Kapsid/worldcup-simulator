<template>
  <div class="match-list">
    <div v-if="matches.length === 0" class="no-matches">
      <i class="fas fa-calendar-times"></i>
      <p>No matches scheduled for this matchday</p>
    </div>
    
    <div v-else class="matches-grid">
      <div 
        v-for="match in matches" 
        :key="match._id"
        class="match-card"
        :class="{ 'completed': match.played, 'clickable': match.played }"
        @click="handleMatchClick(match)"
      >
        <div class="match-teams">
          <div class="team home-team">
            <div class="team-info">
              <CountryFlag 
                :country-code="match.homeTeam.country || match.homeTeam.countryCode" 
                :size="20" 
              />
              <!-- Test: Always show a position -->
              <div class="team-position" style="background: red;">
                T
              </div>
              <div 
                class="team-position" 
                v-if="getTeamPosition(match.homeTeam.teamId)"
              >
                {{ getTeamPosition(match.homeTeam.teamId) }}
              </div>
            </div>
            <router-link 
              :to="`/tournament/${tournamentId}/qualifying-team/${match.homeTeam.teamId}`" 
              class="team-name clickable-team"
              @click.stop
            >
              {{ match.homeTeam.name }}
            </router-link>
          </div>
          
          <div class="match-score">
            <span v-if="match.played" class="score">
              {{ match.homeScore }} - {{ match.awayScore }}
            </span>
            <span v-else class="vs">vs</span>
          </div>
          
          <div class="team away-team">
            <router-link 
              :to="`/tournament/${tournamentId}/qualifying-team/${match.awayTeam.teamId}`" 
              class="team-name clickable-team"
              @click.stop
            >
              {{ match.awayTeam.name }}
            </router-link>
            <div class="team-info">
              <CountryFlag 
                :country-code="match.awayTeam.country || match.awayTeam.countryCode" 
                :size="20" 
              />
              <div 
                class="team-position" 
                v-if="getTeamPosition(match.awayTeam.teamId)"
              >
                {{ getTeamPosition(match.awayTeam.teamId) }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="match-actions">
          <button 
            v-if="!match.played && !readOnly"
            @click="$emit('simulate-match', match._id)"
            :disabled="simulatingMatch === match._id"
            class="btn-simulate"
          >
            <i v-if="simulatingMatch === match._id" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-play"></i>
            {{ simulatingMatch === match._id ? 'Simulating...' : 'Simulate' }}
          </button>
          
          <button 
            @click="$emit('view-match', match._id)"
            class="btn-view"
          >
            <i class="fas fa-eye"></i>
            View Details
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import CountryFlag from '../CountryFlag.vue'

export default {
  name: 'MatchList',
  components: {
    CountryFlag
  },
  props: {
    matches: {
      type: Array,
      required: true
    },
    simulatingMatch: {
      type: String,
      default: null
    },
    readOnly: {
      type: Boolean,
      default: false
    },
    tournamentId: {
      type: String,
      required: true
    }
  },
  emits: ['simulate-match', 'view-match'],
  data() {
    return {
      qualifyingStandings: {}
    }
  },
  mounted() {
    console.log('MatchList component mounted!')
    this.loadQualifyingStandings()
  },
  watch: {
    matches() {
      this.loadQualifyingStandings()
    }
  },
  methods: {
    async loadQualifyingStandings() {
      console.log('Loading qualifying standings, matches:', this.matches)
      // For now, we'll create a simple position system based on available data
      // This can be enhanced later with proper qualifying standings API
      if (!this.matches || this.matches.length === 0) {
        console.log('No matches available')
        return
      }
      
      // Group teams by qualification group if available, or create a simple ranking
      const standings = {}
      
      // If matches have group information, use it
      this.matches.forEach(match => {
        if (match.homeTeam && match.homeTeam.teamId) {
          if (!standings[match.homeTeam.teamId]) {
            standings[match.homeTeam.teamId] = {
              teamId: match.homeTeam.teamId,
              name: match.homeTeam.name,
              points: 0,
              played: 0,
              position: 1 // Default position
            }
          }
        }
        if (match.awayTeam && match.awayTeam.teamId) {
          if (!standings[match.awayTeam.teamId]) {
            standings[match.awayTeam.teamId] = {
              teamId: match.awayTeam.teamId,
              name: match.awayTeam.name,
              points: 0,
              played: 0,
              position: 1 // Default position
            }
          }
        }
        
        // Calculate points from played matches
        if (match.played) {
          const homePoints = match.homeScore > match.awayScore ? 3 : (match.homeScore === match.awayScore ? 1 : 0)
          const awayPoints = match.awayScore > match.homeScore ? 3 : (match.awayScore === match.homeScore ? 1 : 0)
          
          if (standings[match.homeTeam.teamId]) {
            standings[match.homeTeam.teamId].points += homePoints
            standings[match.homeTeam.teamId].played += 1
          }
          if (standings[match.awayTeam.teamId]) {
            standings[match.awayTeam.teamId].points += awayPoints
            standings[match.awayTeam.teamId].played += 1
          }
        }
      })
      
      // Sort by points and assign positions
      const sortedTeams = Object.values(standings).sort((a, b) => b.points - a.points)
      sortedTeams.forEach((team, index) => {
        standings[team.teamId].position = index + 1
      })
      
      console.log('Final standings:', standings)
      this.qualifyingStandings = standings
    },
    
    getTeamPosition(teamId) {
      console.log('Getting position for teamId:', teamId, 'standings:', this.qualifyingStandings)
      if (!this.qualifyingStandings[teamId]) {
        console.log('No position found for team:', teamId)
        return null
      }
      const position = this.qualifyingStandings[teamId].position
      console.log('Position for team', teamId, ':', position)
      return position
    },
    
    handleMatchClick(match) {
      if (match.played) {
        this.$router.push(`/tournament/${this.tournamentId}/match/${match.matchId}`)
      }
    },
  }
}
</script>

<style scoped>
.match-list {
  width: 100%;
}

.no-matches {
  text-align: center;
  padding: 2rem;
  color: var(--white);
  opacity: 0.7;
}

.no-matches i {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.matches-grid {
  display: grid;
  gap: 12px;
}

.match-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  padding: 1rem;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.match-card:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.2);
}

.match-card.completed {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.2);
}

.match-card.clickable {
  cursor: pointer;
}

.match-card.clickable:hover {
  background: rgba(34, 197, 94, 0.15);
  border-color: rgba(34, 197, 94, 0.3);
  transform: translateY(-2px);
}

.match-teams {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.team {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.home-team {
  justify-content: flex-start;
}

.away-team {
  justify-content: flex-end;
  flex-direction: row-reverse;
}

.team-info {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.team-position {
  position: absolute;
  top: -8px;
  right: -8px;
  background: var(--fifa-blue);
  color: var(--white);
  font-size: 0.6rem;
  font-weight: var(--font-weight-bold);
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--white);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  z-index: 2;
}

.team-flag {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.team-name {
  font-weight: var(--font-weight-medium);
  color: var(--white);
  font-size: 0.9rem;
}

.clickable-team {
  color: var(--white) !important;
  text-decoration: none !important;
  cursor: pointer !important;
  transition: all 0.3s ease;
  padding: 2px 4px;
  border-radius: 4px;
  position: relative;
  z-index: 10;
  display: inline-block;
}

.clickable-team:hover {
  color: var(--fifa-gold) !important;
  text-decoration: underline !important;
  background-color: rgba(255, 255, 255, 0.3) !important;
  transform: scale(1.05);
}

.match-score {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  margin: 0 16px;
}

.score {
  font-size: 1.2rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-gold);
}

.vs {
  font-size: 0.9rem;
  color: var(--white);
  opacity: 0.7;
}

.match-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.btn-simulate,
.btn-view {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.8rem;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-simulate {
  background: var(--fifa-blue);
  color: var(--white);
}

.btn-simulate:hover:not(:disabled) {
  background: var(--fifa-dark-blue);
}

.btn-simulate:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-view {
  background: rgba(255, 255, 255, 0.1);
  color: var(--white);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-view:hover {
  background: rgba(255, 255, 255, 0.2);
}


@media (max-width: 768px) {
  .match-card {
    padding: 0.75rem;
  }
  
  .match-teams {
    flex-direction: column;
    gap: 8px;
  }
  
  .team {
    width: 100%;
    justify-content: center;
  }
  
  .away-team {
    flex-direction: row;
  }
  
  .match-score {
    margin: 8px 0;
  }
  
  .match-actions {
    flex-direction: column;
  }
}
</style>