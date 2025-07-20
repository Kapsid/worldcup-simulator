<template>
  <div 
    v-if="visible && standings.length > 0" 
    class="standings-tooltip"
    :style="{ top: position.y + 'px', left: position.x + 'px' }"
  >
    <table class="mini-standings">
      <thead>
        <tr>
          <th>#</th>
          <th>Team</th>
          <th>P</th>
          <th>Pts</th>
        </tr>
      </thead>
      <tbody>
        <tr 
          v-for="(team, index) in standings" 
          :key="team.teamId"
          :class="{ 'highlighted': team.teamId === highlightedTeamId }"
        >
          <td class="position">{{ index + 1 }}</td>
          <td class="team-name">
            <span class="team-flag">{{ team.flag }}</span>
            <span class="team-code">{{ getTeamCode(team.name) }}</span>
          </td>
          <td class="played">{{ team.played }}</td>
          <td class="points">{{ team.points }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: 'StandingsTooltip',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    standings: {
      type: Array,
      default: () => []
    },
    highlightedTeamId: {
      type: String,
      default: null
    },
    position: {
      type: Object,
      default: () => ({ x: 0, y: 0 })
    }
  },
  methods: {
    getTeamCode(teamName) {
      // Get 3-letter country code or first 3 letters of country name
      const codes = {
        'Brazil': 'BRA',
        'Argentina': 'ARG',
        'Germany': 'GER',
        'France': 'FRA',
        'Spain': 'ESP',
        'England': 'ENG',
        'Italy': 'ITA',
        'Netherlands': 'NED',
        'Portugal': 'POR',
        'Belgium': 'BEL',
        'Croatia': 'CRO',
        'Uruguay': 'URU',
        'Mexico': 'MEX',
        'United States': 'USA',
        'Japan': 'JPN',
        'South Korea': 'KOR',
        'Australia': 'AUS',
        'Saudi Arabia': 'KSA',
        'Morocco': 'MAR',
        'Tunisia': 'TUN',
        'Egypt': 'EGY',
        'Nigeria': 'NGA',
        'Ghana': 'GHA',
        'Cameroon': 'CMR',
        'Senegal': 'SEN',
        'Algeria': 'ALG',
        'South Africa': 'RSA',
        'Poland': 'POL',
        'Sweden': 'SWE',
        'Switzerland': 'SUI',
        'Denmark': 'DEN',
        'Norway': 'NOR',
        'Czech Republic': 'CZE',
        'Austria': 'AUT',
        'Scotland': 'SCO',
        'Wales': 'WAL',
        'Ireland': 'IRL',
        'Northern Ireland': 'NIR',
        'Serbia': 'SRB',
        'Turkey': 'TUR',
        'Greece': 'GRE',
        'Russia': 'RUS',
        'Ukraine': 'UKR',
        'Romania': 'ROU',
        'Colombia': 'COL',
        'Chile': 'CHI',
        'Peru': 'PER',
        'Ecuador': 'ECU',
        'Venezuela': 'VEN',
        'Paraguay': 'PAR',
        'Bolivia': 'BOL',
        'Canada': 'CAN',
        'Costa Rica': 'CRC',
        'Panama': 'PAN',
        'Honduras': 'HON',
        'Jamaica': 'JAM',
        'China': 'CHN',
        'Iran': 'IRN',
        'Iraq': 'IRQ',
        'Qatar': 'QAT',
        'United Arab Emirates': 'UAE',
        'New Zealand': 'NZL',
        'Ivory Coast': 'CIV'
      }
      return codes[teamName] || teamName.substring(0, 3).toUpperCase()
    }
  }
}
</script>

<style scoped>
.standings-tooltip {
  position: fixed;
  background: var(--white);
  border: 1px solid rgba(0, 102, 204, 0.2);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 12px;
  z-index: 9999;
  pointer-events: none;
  font-size: 0.85rem;
  min-width: 200px;
}

.mini-standings {
  width: 100%;
  border-collapse: collapse;
}

.mini-standings th {
  text-align: left;
  padding: 4px 8px;
  border-bottom: 2px solid rgba(0, 102, 204, 0.2);
  color: var(--fifa-dark-blue);
  font-weight: 600;
  font-size: 0.75rem;
}

.mini-standings td {
  padding: 4px 8px;
  border-bottom: 1px solid rgba(0, 102, 204, 0.1);
}

.mini-standings tr:last-child td {
  border-bottom: none;
}

.mini-standings tr.highlighted {
  background-color: rgba(0, 102, 204, 0.15);
  font-weight: 600;
}

.position {
  width: 30px;
  text-align: center;
  color: var(--fifa-dark-blue);
}

.team-name {
  display: flex;
  align-items: center;
  gap: 6px;
}

.team-flag {
  font-size: 1rem;
}

.team-code {
  color: var(--fifa-dark-blue);
}

.played, .points {
  text-align: center;
  width: 35px;
  font-weight: 500;
}

.points {
  color: var(--fifa-blue);
  font-weight: 600;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .standings-tooltip {
    display: none; /* Hide tooltip on mobile */
  }
}
</style>