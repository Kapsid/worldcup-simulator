<template>
  <div class="bracket-visualization">
    <div class="bracket-header">
      <h3>Tournament Bracket</h3>
      <div class="bracket-controls">
        <button @click="toggleView" class="btn-secondary">
          <i class="fas fa-exchange-alt"></i>
          {{ showBracketView ? 'Back to Matches' : 'View Bracket' }}
        </button>
      </div>
    </div>

    <div v-if="showBracketView" class="tournament-bracket">
      <div class="bracket-responsive-wrapper">
        <div class="bracket-container">
        <!-- Round of 16 -->
        <div class="bracket-round round-16">
          <div class="round-header">Round of 16</div>
          <div class="matches-column">
            <div 
              v-for="match in getRoundMatches('round16')" 
              :key="match._id"
              class="bracket-match"
              :class="{ 'completed': match.status === 'completed' }"
            >
              <div class="match-teams">
                <div class="team-slot" :class="{ 'winner': isWinner(match, match.homeTeam) }">
                  <span class="team-code">{{ getTeamCode(match.homeTeam) }}</span>
                  <span class="team-score">{{ formatScore(match, 'home') }}</span>
                </div>
                <div class="team-slot" :class="{ 'winner': isWinner(match, match.awayTeam) }">
                  <span class="team-code">{{ getTeamCode(match.awayTeam) }}</span>
                  <span class="team-score">{{ formatScore(match, 'away') }}</span>
                </div>
              </div>
              <div class="match-connector" v-if="match.status === 'completed'"></div>
            </div>
          </div>
        </div>

        <!-- Quarter-finals -->
        <div class="bracket-round quarter-finals">
          <div class="round-header">Quarter-finals</div>
          <div class="matches-column">
            <div 
              v-for="match in getRoundMatches('quarterfinal')" 
              :key="match._id"
              class="bracket-match"
              :class="{ 'completed': match.status === 'completed' }"
            >
              <div class="match-teams">
                <div class="team-slot" :class="{ 'winner': isWinner(match, match.homeTeam) }">
                  <span class="team-code">{{ getTeamCode(match.homeTeam) }}</span>
                  <span class="team-score">{{ formatScore(match, 'home') }}</span>
                </div>
                <div class="team-slot" :class="{ 'winner': isWinner(match, match.awayTeam) }">
                  <span class="team-code">{{ getTeamCode(match.awayTeam) }}</span>
                  <span class="team-score">{{ formatScore(match, 'away') }}</span>
                </div>
              </div>
              <div class="match-connector" v-if="match.status === 'completed'"></div>
            </div>
          </div>
        </div>

        <!-- Semi-finals -->
        <div class="bracket-round semi-finals">
          <div class="round-header">Semi-finals</div>
          <div class="matches-column">
            <div 
              v-for="match in getRoundMatches('semifinal')" 
              :key="match._id"
              class="bracket-match"
              :class="{ 'completed': match.status === 'completed' }"
            >
              <div class="match-teams">
                <div class="team-slot" :class="{ 'winner': isWinner(match, match.homeTeam) }">
                  <span class="team-code">{{ getTeamCode(match.homeTeam) }}</span>
                  <span class="team-score">{{ formatScore(match, 'home') }}</span>
                </div>
                <div class="team-slot" :class="{ 'winner': isWinner(match, match.awayTeam) }">
                  <span class="team-code">{{ getTeamCode(match.awayTeam) }}</span>
                  <span class="team-score">{{ formatScore(match, 'away') }}</span>
                </div>
              </div>
              <div class="match-connector" v-if="match.status === 'completed'"></div>
            </div>
          </div>
        </div>

        <!-- Third Place -->
        <div class="bracket-round third-place">
          <div class="round-header">3rd Place</div>
          <div class="matches-column">
            <div 
              v-for="match in getRoundMatches('third_place')" 
              :key="match._id"
              class="bracket-match third-place-match"
              :class="{ 'completed': match.status === 'completed' }"
            >
              <div class="match-teams">
                <div class="team-slot" :class="{ 'winner': isWinner(match, match.homeTeam) }">
                  <span class="team-code">{{ getTeamCode(match.homeTeam) }}</span>
                  <span class="team-score">{{ formatScore(match, 'home') }}</span>
                </div>
                <div class="team-slot" :class="{ 'winner': isWinner(match, match.awayTeam) }">
                  <span class="team-code">{{ getTeamCode(match.awayTeam) }}</span>
                  <span class="team-score">{{ formatScore(match, 'away') }}</span>
                </div>
              </div>
              <div class="bronze-icon" v-if="match.status === 'completed'">
                <i class="fas fa-medal"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Finals -->
        <div class="bracket-round finals">
          <div class="round-header">Final</div>
          <div class="matches-column">
            <div 
              v-for="match in getRoundMatches('final')" 
              :key="match._id"
              class="bracket-match final-match"
              :class="{ 'completed': match.status === 'completed' }"
            >
              <div class="match-teams">
                <div class="team-slot" :class="{ 'winner': isWinner(match, match.homeTeam) }">
                  <span class="team-code">{{ getTeamCode(match.homeTeam) }}</span>
                  <span class="team-score">{{ formatScore(match, 'home') }}</span>
                </div>
                <div class="team-slot" :class="{ 'winner': isWinner(match, match.awayTeam) }">
                  <span class="team-code">{{ getTeamCode(match.awayTeam) }}</span>
                  <span class="team-score">{{ formatScore(match, 'away') }}</span>
                </div>
              </div>
              <div class="trophy-icon" v-if="match.status === 'completed'">
                <i class="fas fa-trophy"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      <!-- Legend -->
      <div class="bracket-legend">
        <div class="legend-item">
          <div class="legend-color winner-color"></div>
          <span>Winner</span>
        </div>
        <div class="legend-item">
          <div class="legend-color completed-color"></div>
          <span>Completed Match</span>
        </div>
        <div class="legend-item">
          <div class="legend-color pending-color"></div>
          <span>Pending Match</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BracketVisualization',
  props: {
    bracket: {
      type: Object,
      required: true
    },
    showBracketView: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      countryCodes: {
        // UEFA Countries
        'Germany': 'GER',
        'Spain': 'ESP',
        'France': 'FRA',
        'Italy': 'ITA',
        'England': 'ENG',
        'Portugal': 'POR',
        'Netherlands': 'NED',
        'Belgium': 'BEL',
        'Switzerland': 'SUI',
        'Austria': 'AUT',
        'Croatia': 'CRO',
        'Denmark': 'DEN',
        'Sweden': 'SWE',
        'Norway': 'NOR',
        'Poland': 'POL',
        'Czech Republic': 'CZE',
        'Slovakia': 'SVK',
        'Slovenia': 'SVN',
        'Serbia': 'SRB',
        'Ukraine': 'UKR',
        'Hungary': 'HUN',
        'Romania': 'ROU',
        'Bulgaria': 'BUL',
        'Greece': 'GRE',
        'Turkey': 'TUR',
        'Russia': 'RUS',
        'Scotland': 'SCO',
        'Wales': 'WAL',
        'Ireland': 'IRL',
        'Northern Ireland': 'NIR',
        'Finland': 'FIN',
        'Iceland': 'ISL',
        'Bosnia and Herzegovina': 'BIH',
        'Montenegro': 'MNE',
        'North Macedonia': 'MKD',
        'Albania': 'ALB',
        'Kosovo': 'KOS',
        'Moldova': 'MDA',
        'Belarus': 'BLR',
        'Estonia': 'EST',
        'Latvia': 'LVA',
        'Lithuania': 'LTU',
        'Luxembourg': 'LUX',
        'Malta': 'MLT',
        'Cyprus': 'CYP',
        'Faroe Islands': 'FRO',
        'Gibraltar': 'GIB',
        'Liechtenstein': 'LIE',
        'Andorra': 'AND',
        'San Marino': 'SMR',
        'Monaco': 'MON',
        'Vatican City': 'VAT',
        
        // CONMEBOL Countries
        'Brazil': 'BRA',
        'Argentina': 'ARG',
        'Uruguay': 'URU',
        'Colombia': 'COL',
        'Chile': 'CHI',
        'Peru': 'PER',
        'Ecuador': 'ECU',
        'Paraguay': 'PAR',
        'Bolivia': 'BOL',
        'Venezuela': 'VEN',
        'Guyana': 'GUY',
        'Suriname': 'SUR',
        'French Guiana': 'GUF',
        
        // CONCACAF Countries
        'United States': 'USA',
        'Mexico': 'MEX',
        'Canada': 'CAN',
        'Costa Rica': 'CRC',
        'Panama': 'PAN',
        'Honduras': 'HON',
        'El Salvador': 'SLV',
        'Guatemala': 'GUA',
        'Nicaragua': 'NCA',
        'Belize': 'BLZ',
        'Jamaica': 'JAM',
        'Cuba': 'CUB',
        'Haiti': 'HAI',
        'Dominican Republic': 'DOM',
        'Trinidad and Tobago': 'TTO',
        'Barbados': 'BRB',
        'Grenada': 'GRN',
        'Saint Vincent and the Grenadines': 'VIN',
        'Saint Lucia': 'LCA',
        'Dominica': 'DMA',
        'Antigua and Barbuda': 'ATG',
        'Saint Kitts and Nevis': 'SKN',
        'Bahamas': 'BAH',
        'Bermuda': 'BER',
        'Cayman Islands': 'CAY',
        'Puerto Rico': 'PUR',
        'US Virgin Islands': 'VIR',
        'British Virgin Islands': 'VGB',
        'Anguilla': 'AIA',
        'Montserrat': 'MSR',
        'Turks and Caicos Islands': 'TCA',
        'Aruba': 'ARU',
        'Curaçao': 'CUW',
        'Sint Maarten': 'SXM',
        'Bonaire': 'BOE',
        'Saba': 'SAB',
        'Sint Eustatius': 'SEU',
        'Guadeloupe': 'GPE',
        'Martinique': 'MTQ',
        'French Guiana': 'GUF',
        
        // AFC Countries
        'Japan': 'JPN',
        'South Korea': 'KOR',
        'Iran': 'IRN',
        'Australia': 'AUS',
        'Saudi Arabia': 'KSA',
        'Qatar': 'QAT',
        'United Arab Emirates': 'UAE',
        'Iraq': 'IRQ',
        'Uzbekistan': 'UZB',
        'Syria': 'SYR',
        'Jordan': 'JOR',
        'Lebanon': 'LBN',
        'Oman': 'OMA',
        'Bahrain': 'BHR',
        'Kuwait': 'KUW',
        'Palestine': 'PLE',
        'Yemen': 'YEM',
        'China': 'CHN',
        'India': 'IND',
        'Thailand': 'THA',
        'Vietnam': 'VIE',
        'Indonesia': 'IDN',
        'Malaysia': 'MAS',
        'Singapore': 'SIN',
        'Philippines': 'PHI',
        'Myanmar': 'MYA',
        'Cambodia': 'CAM',
        'Laos': 'LAO',
        'Brunei': 'BRU',
        'East Timor': 'TLS',
        'North Korea': 'PRK',
        'Mongolia': 'MNG',
        'Hong Kong': 'HKG',
        'Macau': 'MAC',
        'Chinese Taipei': 'TPE',
        'Kyrgyzstan': 'KGZ',
        'Tajikistan': 'TJK',
        'Turkmenistan': 'TKM',
        'Kazakhstan': 'KAZ',
        'Afghanistan': 'AFG',
        'Pakistan': 'PAK',
        'Bangladesh': 'BAN',
        'Sri Lanka': 'SRI',
        'Nepal': 'NEP',
        'Bhutan': 'BTN',
        'Maldives': 'MDV',
        'Guam': 'GUM',
        'Northern Mariana Islands': 'NMI',
        'American Samoa': 'ASA',
        
        // CAF Countries
        'Morocco': 'MAR',
        'Tunisia': 'TUN',
        'Algeria': 'ALG',
        'Egypt': 'EGY',
        'Senegal': 'SEN',
        'Nigeria': 'NGA',
        'Ghana': 'GHA',
        'Cameroon': 'CMR',
        'Mali': 'MLI',
        'Burkina Faso': 'BFA',
        'Ivory Coast': 'CIV',
        'Guinea': 'GUI',
        'Cape Verde': 'CPV',
        'Gambia': 'GAM',
        'Guinea-Bissau': 'GNB',
        'Liberia': 'LBR',
        'Sierra Leone': 'SLE',
        'Mauritania': 'MTN',
        'Niger': 'NIG',
        'Chad': 'CHA',
        'Central African Republic': 'CTA',
        'Sudan': 'SDN',
        'South Sudan': 'SSD',
        'Ethiopia': 'ETH',
        'Eritrea': 'ERI',
        'Djibouti': 'DJI',
        'Somalia': 'SOM',
        'Kenya': 'KEN',
        'Uganda': 'UGA',
        'Tanzania': 'TAN',
        'Rwanda': 'RWA',
        'Burundi': 'BDI',
        'Democratic Republic of Congo': 'COD',
        'Republic of Congo': 'CGO',
        'Gabon': 'GAB',
        'Equatorial Guinea': 'EQG',
        'São Tomé and Príncipe': 'STP',
        'Angola': 'ANG',
        'Zambia': 'ZAM',
        'Malawi': 'MWI',
        'Mozambique': 'MOZ',
        'Zimbabwe': 'ZIM',
        'Botswana': 'BOT',
        'Namibia': 'NAM',
        'South Africa': 'RSA',
        'Lesotho': 'LES',
        'Swaziland': 'SWZ',
        'Madagascar': 'MAD',
        'Mauritius': 'MRI',
        'Seychelles': 'SEY',
        'Comoros': 'COM',
        'Libya': 'LBY',
        'Togo': 'TOG',
        'Benin': 'BEN',
        
        // OFC Countries
        'New Zealand': 'NZL',
        'Fiji': 'FIJ',
        'New Caledonia': 'NCL',
        'Papua New Guinea': 'PNG',
        'Tahiti': 'TAH',
        'Solomon Islands': 'SOL',
        'Vanuatu': 'VAN',
        'Samoa': 'SAM',
        'Tonga': 'TON',
        'Cook Islands': 'COK',
        'American Samoa': 'ASA',
        'Tuvalu': 'TUV'
      }
    }
  },
  methods: {
    getRoundMatches(round) {
      return this.bracket.matches?.[round] || []
    },

    getTeamCode(team) {
      if (!team || !team.countryName) return 'TBD'
      const teamCode = this.countryCodes[team.countryName] || team.countryName.substring(0, 3).toUpperCase()
      const groupPosition = this.getGroupPosition(team)
      return groupPosition ? `${teamCode} (${groupPosition})` : teamCode
    },

    getGroupPosition(team) {
      if (!team || !team.countryName) return null
      
      // Standard World Cup bracket arrangement:
      // Round of 16 matches follow specific group arrangement
      // Match 1: A1 vs B2, Match 2: C1 vs D2, Match 3: E1 vs F2, Match 4: G1 vs H2
      // Match 5: B1 vs A2, Match 6: D1 vs C2, Match 7: F1 vs E2, Match 8: H1 vs G2
      
      const r16Matches = this.getRoundMatches('round16')
      
      // Find the team in Round of 16 matches to determine their group position
      for (let i = 0; i < r16Matches.length; i++) {
        const match = r16Matches[i]
        const matchPosition = match.matchPosition || (i + 1)
        
        if (match.homeTeam && match.homeTeam.countryName === team.countryName) {
          return this.getGroupPositionFromMatchPosition(matchPosition, 'home')
        } else if (match.awayTeam && match.awayTeam.countryName === team.countryName) {
          return this.getGroupPositionFromMatchPosition(matchPosition, 'away')
        }
      }
      
      return null
    },

    getGroupPositionFromMatchPosition(matchPosition, homeAway) {
      // Standard World Cup bracket positioning
      const groupPositions = {
        1: { home: 'A1', away: 'B2' },
        2: { home: 'C1', away: 'D2' },
        3: { home: 'E1', away: 'F2' },
        4: { home: 'G1', away: 'H2' },
        5: { home: 'B1', away: 'A2' },
        6: { home: 'D1', away: 'C2' },
        7: { home: 'F1', away: 'E2' },
        8: { home: 'H1', away: 'G2' }
      }
      
      return groupPositions[matchPosition] ? groupPositions[matchPosition][homeAway] : null
    },

    isWinner(match, team) {
      if (!match || !team || !match.winner) return false
      return match.winner._id === team._id
    },

    formatScore(match, side) {
      if (!match || match.status !== 'completed') return ''
      
      const score = side === 'home' ? match.homeScore : match.awayScore
      const extraScore = side === 'home' ? match.homeExtraTimeScore : match.awayExtraTimeScore
      const penaltyScore = side === 'home' ? match.homePenaltyScore : match.awayPenaltyScore
      
      let display = score.toString()
      
      if (extraScore !== null) {
        display += ` (${extraScore})`
      }
      
      if (penaltyScore !== null) {
        display += ` [${penaltyScore}]`
      }
      
      return display
    },

    toggleView() {
      this.$emit('toggle-view')
    }
  }
}
</script>

<style scoped>
.bracket-visualization {
  width: 100%;
}

.bracket-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(0, 102, 204, 0.1);
}

.bracket-header h3 {
  font-size: 1.5rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
  margin: 0;
}

.tournament-bracket {
  background: var(--white);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.bracket-responsive-wrapper {
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  padding: 20px;
  max-width: 100vw;
  position: relative;
}

.bracket-container {
  display: flex;
  gap: 60px;
  min-width: 1400px;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.bracket-round {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 120px;
}

.round-header {
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
  margin-bottom: 20px;
  text-align: center;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.matches-column {
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
}

.round-16 .matches-column {
  gap: 12px;
}

.quarter-finals .matches-column {
  gap: 104px; /* (R16 match height 80px + gap 12px) = 92px per match pair */
}

.semi-finals .matches-column {
  gap: 276px; /* (QF match height 80px + gap 104px) * 1.5 = 276px */
}

.finals .matches-column {
  gap: 632px; /* (SF match height 80px + gap 276px) * 1.77 = 632px */
}

.third-place .matches-column {
  justify-content: center;
  padding-top: 50px;
}

.finals .matches-column {
  padding-top: 50px;
}

.bracket-match {
  position: relative;
  background: var(--white);
  border: 2px solid rgba(0, 102, 204, 0.2);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: all 0.3s ease;
  min-width: 100px;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.bracket-match:hover {
  border-color: rgba(0, 102, 204, 0.4);
  transform: translateY(-2px);
}

.bracket-match.completed {
  border-color: var(--fifa-green);
  background: rgba(0, 170, 68, 0.05);
}

.final-match {
  border-color: var(--fifa-gold);
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 215, 0, 0.05));
}

.third-place-match {
  border-color: #cd7f32;
  background: rgba(205, 127, 50, 0.05);
}

.match-teams {
  display: flex;
  flex-direction: column;
}

.team-slot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.team-slot:last-child {
  border-bottom: none;
}

.team-slot.winner {
  background: rgba(0, 170, 68, 0.15);
  font-weight: var(--font-weight-bold);
  color: var(--fifa-green);
}

.team-code {
  font-size: 0.8rem;
  font-weight: var(--font-weight-semibold);
  color: var(--fifa-dark-blue);
  min-width: 30px;
}

.team-slot.winner .team-code {
  color: var(--fifa-green);
}

.team-score {
  font-size: 0.8rem;
  font-weight: var(--font-weight-bold);
  color: var(--gray);
}

.team-slot.winner .team-score {
  color: var(--fifa-green);
}

.match-connector {
  position: absolute;
  right: -30px;
  top: 50%;
  transform: translateY(-50%);
  width: 30px;
  height: 2px;
  background: var(--fifa-green);
  z-index: 2;
}

.bracket-match {
  position: relative;
  z-index: 3;
}

/* Vertical connectors for proper bracket structure */
.bracket-round::after {
  content: '';
  position: absolute;
  right: -30px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: rgba(0, 102, 204, 0.2);
  z-index: 1;
}

.finals::after,
.third-place::after {
  display: none;
}

/* Horizontal connectors between match pairs */
.bracket-match:nth-child(odd):not(:last-child)::before {
  content: '';
  position: absolute;
  right: -32px;
  top: 100%;
  width: 2px;
  height: 58px; /* (R16 gap 12px + match height 80px) / 2 = 46px + 12px = 58px */
  background: rgba(0, 102, 204, 0.2);
  z-index: 1;
}

.quarter-finals .bracket-match:nth-child(odd):not(:last-child)::before {
  height: 118px; /* (QF gap 104px + match height 80px) / 2 = 92px + 26px = 118px */
}

.semi-finals .bracket-match:nth-child(odd):not(:last-child)::before {
  height: 318px; /* (SF gap 276px + match height 80px) / 2 = 178px + 140px = 318px */
}

.finals .bracket-match:nth-child(odd):not(:last-child)::before {
  height: 396px; /* (Final gap 632px + match height 80px) / 2 = 356px + 40px = 396px */
}

.bracket-match:nth-child(even)::before {
  content: '';
  position: absolute;
  right: -32px;
  bottom: 100%;
  width: 2px;
  height: 58px;
  background: rgba(0, 102, 204, 0.2);
  z-index: 1;
}

.quarter-finals .bracket-match:nth-child(even)::before {
  height: 118px;
}

.semi-finals .bracket-match:nth-child(even)::before {
  height: 318px;
}

.finals .bracket-match:nth-child(even)::before {
  height: 396px;
}

.third-place .bracket-match::before {
  display: none;
}

.trophy-icon {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 20px;
  height: 20px;
  background: var(--fifa-gold);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  color: var(--fifa-dark-blue);
  border: 2px solid var(--white);
}

.bronze-icon {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 20px;
  height: 20px;
  background: #cd7f32;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  color: var(--white);
  border: 2px solid var(--white);
}

.bracket-legend {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: var(--gray);
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.winner-color {
  background: rgba(0, 170, 68, 0.3);
  border: 2px solid var(--fifa-green);
}

.completed-color {
  background: rgba(0, 170, 68, 0.1);
  border: 2px solid var(--fifa-green);
}

.pending-color {
  background: var(--white);
  border: 2px solid rgba(0, 102, 204, 0.2);
}

@media (max-width: 768px) {
  .bracket-responsive-wrapper {
    margin-left: -16px;
    margin-right: -16px;
    padding: 10px;
    width: calc(100% + 32px);
  }
  
  .bracket-container {
    gap: 40px;
    min-width: 800px;
  }
  
  .bracket-round {
    min-width: 80px;
  }
  
  .team-code {
    font-size: 0.7rem;
  }
  
  .team-score {
    font-size: 0.7rem;
  }
  
  .match-connector {
    width: 20px;
    right: -20px;
  }
  
  .bracket-legend {
    flex-direction: column;
    align-items: center;
  }
  
  .bracket-responsive-wrapper {
    padding: 10px;
    margin: 0 -16px;
    width: calc(100% + 32px);
  }
  
  .bracket-container {
    gap: 30px;
    min-width: 800px;
    padding: 20px 10px;
  }
  
  .bracket-match {
    min-width: 80px;
    min-height: 60px;
  }
  
  .team-code {
    font-size: 0.7rem;
  }
  
  .team-score {
    font-size: 0.8rem;
  }
  
  .round-header {
    font-size: 0.75rem;
    margin-bottom: 10px;
  }
}
</style>