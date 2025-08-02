<template>
  <img 
    :src="flagUrl" 
    :alt="`${countryCode} flag`"
    class="country-flag-img"
    :style="flagStyle"
    @error="handleError"
    @click="$emit('click', $event)"
  />
</template>

<script>
export default {
  name: 'CountryFlag',
  props: {
    countryCode: {
      type: String,
      required: true
    },
    size: {
      type: [String, Number],
      default: '20'
    }
  },
  emits: ['click'],
  data() {
    return {
      currentUrlIndex: 0,
      hasError: false
    }
  },
  computed: {
    flagUrl() {
      if (!this.countryCode || this.countryCode === 'undefined' || this.countryCode === '?') {
        return this.fallbackUrl
      }
      
      // First check if it's a country name, and map it to code
      const codeToUse = this.nameToCode[this.countryCode] || this.countryCode
      
      const isoCode = this.codeMap[codeToUse?.toUpperCase()] || codeToUse?.toLowerCase()
      if (!isoCode || isoCode === 'undefined') {
        return this.fallbackUrl
      }
      
      // List of flag API URLs to try
      const urls = [
        `https://flagcdn.com/w80/${isoCode}.png`,
        `https://flagcdn.com/${isoCode}.svg`,
        `https://hatscripts.github.io/circle-flags/flags/${isoCode}.svg`
      ]
      
      const url = urls[this.currentUrlIndex] || this.fallbackUrl
      return url
    },
    
    flagStyle() {
      const size = this.size
      return {
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        objectFit: 'cover',
        display: 'inline-block',
        verticalAlign: 'middle',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.6)'
      }
    },
    
    fallbackUrl() {
      const size = this.size
      let displayText = '?'
      if (this.countryCode && this.countryCode !== 'undefined') {
        // If it's a country name, use the code. Otherwise use the original value
        displayText = this.nameToCode[this.countryCode] || this.countryCode
      }
      const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 1}" fill="#f0f0f0" stroke="#ccc" stroke-width="1"/>
        <text x="${size/2}" y="${size/2 + 2}" text-anchor="middle" font-family="Arial" font-size="${Math.min(size/5, 8)}" fill="#666">${displayText}</text>
      </svg>`
      return `data:image/svg+xml;base64,${btoa(svg)}`
    },

    nameToCode() {
      return {
        'Argentina': 'ARG', 'Brazil': 'BRA', 'Spain': 'ESP', 'France': 'FRA', 'Germany': 'GER',
        'Italy': 'ITA', 'Portugal': 'POR', 'England': 'ENG', 'Netherlands': 'NED', 'Belgium': 'BEL',
        'Colombia': 'COL', 'Uruguay': 'URU', 'Mexico': 'MEX', 'USA': 'USA', 'Canada': 'CAN',
        'Chile': 'CHI', 'Peru': 'PER', 'Ecuador': 'ECU', 'Paraguay': 'PAR', 'Bolivia': 'BOL',
        'Venezuela': 'VEN', 'Costa Rica': 'CRC', 'Honduras': 'HON', 'Guatemala': 'GUA', 'El Salvador': 'SLV',
        'Nicaragua': 'NCA', 'Panama': 'PAN', 'Jamaica': 'JAM', 'Trinidad and Tobago': 'TRI', 'Cuba': 'CUB',
        'Croatia': 'CRO', 'Morocco': 'MAR', 'Switzerland': 'SUI', 'Denmark': 'DEN', 'Wales': 'WAL',
        'Australia': 'AUS', 'Japan': 'JPN', 'Senegal': 'SEN', 'Sweden': 'SWE', 'Iran': 'IRN',
        'South Korea': 'KOR', 'Nigeria': 'NGA', 'Tunisia': 'TUN', 'Poland': 'POL', 'Ukraine': 'UKR',
        'Austria': 'AUT', 'Serbia': 'SRB', 'Turkey': 'TUR', 'Qatar': 'QAT', 'Algeria': 'ALG',
        'Czech Republic': 'CZE', 'Hungary': 'HUN', 'Egypt': 'EGY', 'Ivory Coast': 'CIV', 'Romania': 'ROU',
        'Cameroon': 'CMR', 'Scotland': 'SCO', 'Greece': 'GRE', 'Norway': 'NOR', 'Slovakia': 'SVK',
        'Mali': 'MLI', 'Saudi Arabia': 'KSA', 'Iraq': 'IRQ', 'Slovenia': 'SVN', 'South Africa': 'RSA',
        'Finland': 'FIN', 'Ireland': 'IRL', 'Burkina Faso': 'BFA', 'Bosnia and Herzegovina': 'BIH', 'Ghana': 'GHA',
        'North Macedonia': 'MKD', 'Albania': 'ALB', 'DR Congo': 'COD', 'Congo DR': 'COD', 'Montenegro': 'MNE', 'Iceland': 'ISL',
        'Northern Ireland': 'NIR', 'Bulgaria': 'BUL', 'Cape Verde': 'CPV', 'Georgia': 'GEO', 'United Arab Emirates': 'UAE',
        'Guinea': 'GUI', 'Oman': 'OMA', 'China': 'CHN', 'Curaçao': 'CUW', 'Zambia': 'ZAM',
        'Israel': 'ISR', 'Uzbekistan': 'UZB', 'Haiti': 'HAI', 'Gabon': 'GAB', 'Bahrain': 'BHR',
        'Jordan': 'JOR', 'Equatorial Guinea': 'EQG', 'Uganda': 'UGA', 'Syria': 'SYR', 'Luxembourg': 'LUX',
        'Armenia': 'ARM', 'Cyprus': 'CYP', 'New Zealand': 'NZL', 'Palestine': 'PLE', 'Kyrgyzstan': 'KGZ',
        'Thailand': 'THA', 'Tajikistan': 'TJK', 'Mauritania': 'MTN', 'Madagascar': 'MAD', 'Kazakhstan': 'KAZ',
        'Lebanon': 'LBN', 'Guinea-Bissau': 'GNB', 'India': 'IND', 'Benin': 'BEN', 'Kenya': 'KEN',
        'Libya': 'LBY', 'North Korea': 'PRK', 'Mozambique': 'MOZ', 'Vietnam': 'VIE', 'Congo': 'CGO',
        'Faroe Islands': 'FRO', 'Sierra Leone': 'SLE', 'Azerbaijan': 'AZE', 'Estonia': 'EST', 'Tanzania': 'TAN',
        'Angola': 'ANG', 'Niger': 'NIG', 'Namibia': 'NAM', 'Togo': 'TOG', 'Central African Republic': 'CTA',
        'Zimbabwe': 'ZWE', 'Chad': 'CHA', 'Rwanda': 'RWA', 'Sudan': 'SDN', 'Gambia': 'GAM',
        'Malawi': 'MWI', 'Antigua and Barbuda': 'ATG', 'Malaysia': 'MAS', 'Comoros': 'COM', 'Philippines': 'PHI',
        'Indonesia': 'IDN', 'Kuwait': 'KUW', 'Turkmenistan': 'TKM', 'Ethiopia': 'ETH', 'Suriname': 'SUR',
        'Lithuania': 'LTU', 'Burundi': 'BDI', 'Tahiti': 'TAH', 'Liberia': 'LBR', 'Solomon Islands': 'SOL',
        'Hong Kong': 'HKG', 'Botswana': 'BOT', 'Eswatini': 'SWZ', 'Afghanistan': 'AFG', 'Yemen': 'YEM',
        'Andorra': 'AND', 'Latvia': 'LVA', 'Lesotho': 'LES', 'Maldives': 'MDV', 'Chinese Taipei': 'TPE',
        'Myanmar': 'MYA', 'Singapore': 'SIN', 'Dominican Republic': 'DOM', 'Fiji': 'FIJ', 'St. Kitts and Nevis': 'SKN', 'Saint Kitts and Nevis': 'SKN',
        'New Caledonia': 'NCL', 'St. Lucia': 'LCA', 'Saint Lucia': 'LCA', 'St. Vincent and the Grenadines': 'VIN', 'Saint Vincent and the Grenadines': 'VIN', 'Papua New Guinea': 'PNG', 'Vanuatu': 'VAN',
        'Grenada': 'GRN', 'Barbados': 'BRB', 'Belize': 'BLZ', 'South Sudan': 'SSD', 'Cambodia': 'CAM',
        'Nepal': 'NEP', 'Moldova': 'MDA', 'Guyana': 'GUY', 'Malta': 'MLT', 'Samoa': 'SAM',
        'Mauritius': 'MRI', 'Somalia': 'SOM', 'Djibouti': 'DJI', 'Macau': 'MAC', 'Macao': 'MAC', 'Bhutan': 'BTN',
        'Bangladesh': 'BAN', 'Dominica': 'DMA', 'São Tomé and Príncipe': 'STP', 'Laos': 'LAO', 'Seychelles': 'SEY',
        'Mongolia': 'MNG', 'Liechtenstein': 'LIE', 'Turks and Caicos Islands': 'TCA', 'Pakistan': 'PAK', 'Timor-Leste': 'TLS', 'East Timor': 'TLS',
        'Cook Islands': 'COK', 'Tonga': 'TGA', 'Eritrea': 'ERI', 'Gibraltar': 'GIB', 'Sri Lanka': 'SRI',
        'Montserrat': 'MSR', 'San Marino': 'SMR', 'Tuvalu': 'TUV'
      }
    },

    codeMap() {
      return {
        'ARG': 'ar', 'BRA': 'br', 'ESP': 'es', 'FRA': 'fr', 'GER': 'de',
        'ITA': 'it', 'POR': 'pt', 'ENG': 'gb-eng', 'NED': 'nl', 'BEL': 'be',
        'COL': 'co', 'URU': 'uy', 'MEX': 'mx', 'USA': 'us', 'CAN': 'ca',
        'CHI': 'cl', 'PER': 'pe', 'ECU': 'ec', 'PAR': 'py', 'BOL': 'bo',
        'VEN': 've', 'CRC': 'cr', 'HON': 'hn', 'GUA': 'gt', 'SLV': 'sv',
        'NCA': 'ni', 'PAN': 'pa', 'JAM': 'jm', 'TRI': 'tt', 'CUB': 'cu',
        'CRO': 'hr', 'MAR': 'ma', 'SUI': 'ch', 'DEN': 'dk', 'WAL': 'gb-wls',
        'AUS': 'au', 'JPN': 'jp', 'SEN': 'sn', 'SWE': 'se', 'IRN': 'ir',
        'KOR': 'kr', 'NGA': 'ng', 'TUN': 'tn', 'POL': 'pl', 'UKR': 'ua',
        'AUT': 'at', 'SRB': 'rs', 'TUR': 'tr', 'QAT': 'qa', 'ALG': 'dz',
        'CZE': 'cz', 'HUN': 'hu', 'EGY': 'eg', 'CIV': 'ci', 'ROU': 'ro',
        'CMR': 'cm', 'SCO': 'gb-sct', 'GRE': 'gr', 'NOR': 'no', 'SVK': 'sk',
        'MLI': 'ml', 'KSA': 'sa', 'IRQ': 'iq', 'SVN': 'si', 'RSA': 'za',
        'FIN': 'fi', 'IRL': 'ie', 'BFA': 'bf', 'BIH': 'ba', 'GHA': 'gh',
        'MKD': 'mk', 'ALB': 'al', 'COD': 'cd', 'MNE': 'me', 'ISL': 'is',
        'NIR': 'gb-nir', 'BUL': 'bg', 'CPV': 'cv', 'GEO': 'ge', 'UAE': 'ae',
        'GUI': 'gn', 'OMA': 'om', 'CHN': 'cn', 'CUW': 'cw', 'ZAM': 'zm',
        'ISR': 'il', 'UZB': 'uz', 'HAI': 'ht', 'GAB': 'ga', 'BHR': 'bh',
        'JOR': 'jo', 'EQG': 'gq', 'UGA': 'ug', 'SYR': 'sy', 'LUX': 'lu',
        'ARM': 'am', 'CYP': 'cy', 'NZL': 'nz', 'PLE': 'ps', 'KGZ': 'kg',
        'THA': 'th', 'TJK': 'tj', 'MTN': 'mr', 'MAD': 'mg', 'KAZ': 'kz',
        'LBN': 'lb', 'GNB': 'gw', 'IND': 'in', 'BEN': 'bj', 'KEN': 'ke',
        'LBY': 'ly', 'PRK': 'kp', 'MOZ': 'mz', 'VIE': 'vn', 'CGO': 'cg',
        'FRO': 'fo', 'SLE': 'sl', 'AZE': 'az', 'EST': 'ee', 'TAN': 'tz',
        'ANG': 'ao', 'NIG': 'ne', 'NAM': 'na', 'TOG': 'tg', 'CTA': 'cf',
        'ZWE': 'zw', 'CHA': 'td', 'RWA': 'rw', 'SDN': 'sd', 'GAM': 'gm',
        'MWI': 'mw', 'ATG': 'ag', 'MAS': 'my', 'COM': 'km', 'PHI': 'ph',
        'IDN': 'id', 'KUW': 'kw', 'TKM': 'tm', 'ETH': 'et', 'SUR': 'sr',
        'LTU': 'lt', 'BDI': 'bi', 'TAH': 'pf', 'LBR': 'lr', 'SOL': 'sb',
        'HKG': 'hk', 'BOT': 'bw', 'SWZ': 'sz', 'AFG': 'af', 'YEM': 'ye',
        'AND': 'ad', 'LVA': 'lv', 'LES': 'ls', 'MDV': 'mv', 'TPE': 'tw',
        'MYA': 'mm', 'SIN': 'sg', 'DOM': 'do', 'FIJ': 'fj', 'SKN': 'kn',
        'NCL': 'nc', 'LCA': 'lc', 'VIN': 'vc', 'PNG': 'pg', 'VAN': 'vu',
        'GRN': 'gd', 'BRB': 'bb', 'BLZ': 'bz', 'SSD': 'ss', 'CAM': 'kh',
        'NEP': 'np', 'MDA': 'md', 'GUY': 'gy', 'MLT': 'mt', 'SAM': 'ws',
        'MRI': 'mu', 'SOM': 'so', 'DJI': 'dj', 'MAC': 'mo', 'BTN': 'bt',
        'BAN': 'bd', 'DMA': 'dm', 'STP': 'st', 'LAO': 'la', 'SEY': 'sc',
        'MNG': 'mn', 'LIE': 'li', 'TCA': 'tc', 'PAK': 'pk', 'TLS': 'tl',
        'COK': 'ck', 'TGA': 'to', 'ERI': 'er', 'GIB': 'gi', 'SRI': 'lk',
        'MSR': 'ms', 'SMR': 'sm', 'TUV': 'tv'
      }
    }
  },
  methods: {
    handleError(event) {
      // Try the next URL in the list
      if (this.currentUrlIndex < 2) {
        this.currentUrlIndex++
        this.$nextTick(() => {
          // Force re-render of the image with new URL
          this.$forceUpdate()
        })
      } else {
        // All URLs failed, show fallback
        event.target.src = this.fallbackUrl
        this.hasError = true
      }
    }
  }
}
</script>

<style scoped>
.country-flag-img {
  transition: transform 0.2s ease;
}

.country-flag-img:hover {
  transform: scale(1.05);
}
</style>