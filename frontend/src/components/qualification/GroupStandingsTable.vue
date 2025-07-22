<template>
  <div class="group-table">
    <div class="group-header">
      <h5>{{ group.name }}</h5>
    </div>
    <div class="group-standings">
      <table class="standings-table">
        <thead>
          <tr>
            <th>Team</th>
            <th>P</th>
            <th>W</th>
            <th>D</th>
            <th>L</th>
            <th>GF</th>
            <th>GA</th>
            <th>GD</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(team, index) in sortedTeams" :key="team.teamId" :class="getPositionClass(index)">
            <td class="team-name">
              <span class="team-flag">{{ team.flag }}</span>
              <router-link 
                :to="`/tournament/${tournamentId}/qualifying-team/${team.teamId}`" 
                class="team-text clickable-team"
              >
                {{ team.name }}
              </router-link>
            </td>
            <td>{{ team.played }}</td>
            <td>{{ team.won }}</td>
            <td>{{ team.drawn }}</td>
            <td>{{ team.lost }}</td>
            <td>{{ team.goalsFor }}</td>
            <td>{{ team.goalsAgainst }}</td>
            <td :class="{ 'positive': team.goalDifference > 0, 'negative': team.goalDifference < 0 }">
              {{ team.goalDifference > 0 ? '+' : '' }}{{ team.goalDifference }}
            </td>
            <td class="points">{{ team.points }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GroupStandingsTable',
  props: {
    group: {
      type: Object,
      required: true
    },
    tournamentId: {
      type: String,
      required: true
    }
  },
  computed: {
    sortedTeams() {
      return [...this.group.teams].sort((a, b) => {
        // Sort by points first
        if (b.points !== a.points) return b.points - a.points
        
        // Then by goal difference
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
        
        // Then by goals scored
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
        
        // Finally by name
        return a.name.localeCompare(b.name)
      })
    }
  },
  methods: {
    getPositionClass(index) {
      // Different confederations have different qualification rules
      if (index === 0) return 'qualified'
      if (index === 1) return 'qualified'
      if (index === this.group.teams.length - 1) return 'eliminated'
      return ''
    },
    
  }
}
</script>

<style scoped>
.group-table {
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  padding: 1rem;
  backdrop-filter: blur(10px);
}

.group-header {
  margin-bottom: 1rem;
  text-align: center;
}

.group-header h5 {
  color: var(--white);
  font-size: 1.1rem;
  font-weight: var(--font-weight-bold);
  margin: 0;
}

.standings-table {
  width: 100%;
  border-collapse: collapse;
}

.standings-table th,
.standings-table td {
  padding: 8px 4px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.standings-table th {
  background: rgba(255, 255, 255, 0.1);
  color: var(--white);
  font-weight: var(--font-weight-bold);
  font-size: 0.8rem;
  text-transform: uppercase;
}

.standings-table td {
  color: var(--white);
  font-size: 0.85rem;
}

.team-name {
  text-align: left !important;
  display: flex;
  align-items: center;
  gap: 8px;
}

.team-flag {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.team-text {
  font-weight: var(--font-weight-medium);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

.points {
  font-weight: var(--font-weight-bold);
  color: var(--fifa-gold);
}

.positive {
  color: #4ade80;
}

.negative {
  color: #f87171;
}

.qualified {
  background: rgba(34, 197, 94, 0.2);
}

.eliminated {
  background: rgba(239, 68, 68, 0.2);
}

@media (max-width: 768px) {
  .group-table {
    padding: 0.75rem;
  }
  
  .standings-table th,
  .standings-table td {
    padding: 6px 2px;
    font-size: 0.75rem;
  }
  
  .team-text {
    font-size: 0.8rem;
  }
}
</style>