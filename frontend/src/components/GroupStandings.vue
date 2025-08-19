<template>
  <div class="group-standings">
    <div class="standings-header">
      <div class="header-title">
        <h3>Group Standings</h3>
        <div v-if="readOnly" class="read-only-badge">
          <i class="fas fa-eye"></i>
          View Only
        </div>
      </div>
      <div class="standings-legend">
        <span class="legend-item qualified">
          <i class="fas fa-arrow-up"></i>
          Qualified for Round of 16
        </span>
        <span class="legend-item eliminated">
          <i class="fas fa-arrow-down"></i>
          Eliminated
        </span>
      </div>
    </div>

    <div v-if="standingsByGroup.length > 0" class="standings-grid">
      <div 
        v-for="group in standingsByGroup" 
        :key="group.groupLetter"
        class="group-standings-card"
      >
        <div class="group-header">
          <h4>Group {{ group.groupLetter }}</h4>
          <span class="matches-played">
            {{ getTotalMatchesPlayed(group.standings) }}/6 matches played
          </span>
        </div>

        <div class="table-responsive">
          <div class="standings-table">
            <div class="table-header standings-table-header">
              <div class="pos-col">Pos</div>
              <div class="team-col">Team</div>
              <div class="stat-col">P</div>
              <div class="stat-col">W</div>
              <div class="stat-col">D</div>
              <div class="stat-col">L</div>
              <div class="stat-col">GF</div>
              <div class="stat-col">GA</div>
              <div class="stat-col">GD</div>
              <div class="stat-col">Pts</div>
            </div>

          <div class="table-body">
            <div 
              v-for="standing in group.standings" 
              :key="standing._id"
              class="table-row"
              :class="{ 
                'qualified': standing.qualifiedFor === 'round16',
                'eliminated': standing.played === 3 && standing.qualifiedFor === 'none',
                [`position-${standing.position}`]: true
              }"
            >
              <div class="pos-col">
                <span class="position">{{ standing.position }}</span>
                <i 
                  v-if="standing.qualifiedFor === 'round16'" 
                  class="fas fa-arrow-up qualification-icon qualified"
                ></i>
                <i 
                  v-else-if="standing.played === 3 && standing.qualifiedFor === 'none'" 
                  class="fas fa-arrow-down qualification-icon eliminated"
                ></i>
              </div>
              
              <div class="team-col">
                <CountryFlag :country-code="standing.team.countryCode" :size="20" />
                <router-link 
                  :to="`/tournament/${tournament._id}/team/${standing.team._id}`"
                  class="team-name clickable-team"
                >
                  {{ standing.team.countryName }}
                </router-link>
              </div>
              
              <div class="stat-col">{{ standing.played }}</div>
              <div class="stat-col">{{ standing.won }}</div>
              <div class="stat-col">{{ standing.drawn }}</div>
              <div class="stat-col">{{ standing.lost }}</div>
              <div class="stat-col">{{ standing.goalsFor }}</div>
              <div class="stat-col">{{ standing.goalsAgainst }}</div>
              <div class="stat-col" :class="{ 
                'positive': standing.goalDifference > 0,
                'negative': standing.goalDifference < 0
              }">
                {{ standing.goalDifference > 0 ? '+' : '' }}{{ standing.goalDifference }}
              </div>
              <div class="stat-col points">{{ standing.points }}</div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="no-standings">
      <i class="fas fa-table"></i>
      <p>No standings available. Generate matches first.</p>
    </div>

    <p v-if="error" class="error-message">{{ error }}</p>
  </div>
</template>

<script>
import CountryFlag from './CountryFlag.vue'
import { API_URL } from '../config/api.js'

export default {
  name: 'GroupStandings',
  components: {
    CountryFlag
  },
  props: {
    tournament: {
      type: Object,
      required: true
    },
    readOnly: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      standings: [],
      loading: false,
      error: ''
    }
  },
  computed: {
    standingsByGroup() {
      const groups = {}
      
      this.standings.forEach(standing => {
        const groupLetter = standing.group.groupLetter
        if (!groups[groupLetter]) {
          groups[groupLetter] = {
            groupLetter,
            standings: []
          }
        }
        groups[groupLetter].standings.push(standing)
      })
      
      return Object.values(groups).sort((a, b) => a.groupLetter.localeCompare(b.groupLetter))
    }
  },
  mounted() {
    this.loadStandings()
  },
  methods: {
    async loadStandings() {
      this.loading = true
      this.error = ''

      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/matches/${this.tournament._id}/standings`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          this.standings = await response.json()
        } else {
          const data = await response.json()
          this.error = data.error || 'Failed to load standings'
        }
      } catch (error) {
        this.error = 'Network error. Please try again.'
      } finally {
        this.loading = false
      }
    },

    getTotalMatchesPlayed(standings) {
      return standings.reduce((total, standing) => total + standing.played, 0) / 2
    },

    refreshStandings() {
      this.loadStandings()
    }
  }
}
</script>

<style scoped>
.group-standings {
  width: 100%;
}

.standings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(0, 102, 204, 0.1);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 16px;
}

.standings-header h3 {
  font-size: 1.5rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
  margin: 0;
}

.read-only-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(156, 163, 175, 0.1);
  color: #6b7280;
  border-radius: var(--radius-md);
  font-size: 0.8rem;
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.standings-legend {
  display: flex;
  gap: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: var(--font-weight-medium);
}

.legend-item.qualified {
  color: var(--fifa-green);
}

.legend-item.eliminated {
  color: var(--fifa-red);
}

.standings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(480px, 1fr));
  gap: 24px;
}

.group-standings-card {
  background: var(--white);
  border: 1px solid rgba(0, 102, 204, 0.1);
  border-radius: var(--radius-lg);
  padding: 20px;
  transition: all 0.3s ease;
}

.group-standings-card:hover {
  border-color: rgba(0, 102, 204, 0.3);
  transform: translateY(-2px);
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.group-header h4 {
  font-size: 1.2rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
  margin: 0;
}

.matches-played {
  font-size: 0.9rem;
  color: var(--gray);
}

.standings-table {
  width: 100%;
}

.table-header {
  display: grid;
  grid-template-columns: 50px 1fr repeat(8, 30px);
  gap: 8px;
  padding: 8px 0;
  background: rgba(0, 102, 204, 0.05);
  border-radius: var(--radius-sm);
  font-weight: var(--font-weight-bold);
  font-size: 0.8rem;
  color: var(--fifa-dark-blue);
  text-align: center;
}

.table-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.table-row {
  display: grid;
  grid-template-columns: 50px 1fr repeat(8, 30px);
  gap: 8px;
  padding: 8px 0;
  border-radius: var(--radius-sm);
  transition: all 0.3s ease;
  font-size: 0.85rem;
  text-align: center;
}

.table-row:hover {
  background: rgba(0, 102, 204, 0.05);
}

.table-row.qualified {
  background: rgba(0, 170, 68, 0.1);
  border-left: 3px solid var(--fifa-green);
}

.table-row.eliminated {
  background: rgba(255, 68, 68, 0.1);
  border-left: 3px solid var(--fifa-red);
}

.pos-col {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.position {
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
}

.qualification-icon {
  font-size: 0.7rem;
}

.qualification-icon.qualified {
  color: var(--fifa-green);
}

.qualification-icon.eliminated {
  color: var(--fifa-red);
}

.team-col {
  display: flex;
  align-items: center;
  gap: 8px;
  text-align: left;
}

.team-flag {
  font-size: 1.2rem;
}

.team-name {
  font-weight: var(--font-weight-semibold);
  color: var(--fifa-dark-blue);
}

.clickable-team {
  text-decoration: none;
  color: var(--fifa-dark-blue);
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 2px 4px;
  border-radius: 4px;
}

.clickable-team:hover {
  color: var(--fifa-blue);
  text-decoration: underline;
  background-color: rgba(0, 102, 204, 0.1);
}

.stat-col {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gray);
}

.stat-col.positive {
  color: var(--fifa-green);
  font-weight: var(--font-weight-semibold);
}

.stat-col.negative {
  color: var(--fifa-red);
  font-weight: var(--font-weight-semibold);
}

.stat-col.points {
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
}

.no-standings {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px;
  color: var(--gray);
}

.no-standings i {
  font-size: 3rem;
  opacity: 0.5;
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

@media (max-width: 768px) {
  .standings-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .standings-legend {
    flex-wrap: wrap;
    gap: 12px;
  }

  .standings-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .table-responsive {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    margin: 0;
    padding: 0;
    width: 100%;
  }

  .standings-table {
    min-width: 100%;
    width: 100%;
  }

  .table-header,
  .table-row {
    grid-template-columns: 26px 110px repeat(8, 24px);
    gap: 3px;
  }

  /* Hide Goals For (F) and Goals Against (A) columns on mobile */
  .table-header .stat-col:nth-child(7),
  .table-header .stat-col:nth-child(8),
  .table-row .stat-col:nth-child(7),
  .table-row .stat-col:nth-child(8) {
    display: none;
  }

  /* Adjust grid after hiding F and A columns - only 6 stat columns now */
  .table-header,
  .table-row {
    grid-template-columns: 26px 110px 24px 24px 24px 24px 24px 24px;
  }

  .team-name {
    font-size: 0.75rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 105px;
  }

  .stat-col {
    font-size: 0.65rem;
    text-align: center;
    padding: 2px 1px;
  }

  /* Make position column text bigger */
  .pos-col {
    font-size: 0.75rem;
    font-weight: bold;
  }

  .table-responsive {
    overflow-x: visible;
  }

  /* Ensure backgrounds align with new column layout */
  .table-header,
  .table-row {
    width: 100% !important;
  }

  /* Force the qualified/eliminated backgrounds to span full width */
  .table-row.qualified,
  .table-row.eliminated,
  .table-row:hover {
    background-size: 100% 100% !important;
    width: 100% !important;
    gap: 3px !important;
    padding: 8px 0 !important;
  }

  /* Ensure all table rows use the correct mobile grid */
  .table-row {
    gap: 3px !important;
    padding: 8px 0 !important;
  }

  /* Change GD header to shorter version on mobile */
  .table-header .stat-col:nth-child(9)::after { content: "D"; }
  
  .table-header .stat-col:nth-child(9) {
    text-indent: -9999px;
    position: relative;
  }
  
  .table-header .stat-col:nth-child(9)::after {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    text-indent: 0;
  }

  .group-standings-card {
    padding: 12px;
    width: 100%;
    box-sizing: border-box;
  }

  /* Make flags smaller */
  .team-col .country-flag {
    font-size: 0.9rem !important;
  }

  /* Reduce spacing in group header */
  .group-header {
    margin-bottom: 8px;
  }

  .group-header h4 {
    font-size: 1rem;
  }
}
</style>