/**
 * Flag utility for displaying country flags as rounded images
 * Uses flagcdn.com API for high-quality flag images
 */

/**
 * Get a rounded flag image component for a country code
 * @param {string} countryCode - 3-letter country code (e.g., 'ARG', 'BRA')
 * @param {string} size - Size of the flag ('16', '20', '24', '32', '40', '48', '64')
 * @returns {Object} Vue component configuration for the flag image
 */
export function getFlagImage(countryCode, size = '24') {
  if (!countryCode) return null
  
  // Map 3-letter codes to 2-letter ISO codes for flagcdn.com
  const codeMap = {
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
  
  const isoCode = codeMap[countryCode?.toUpperCase()] || countryCode?.toLowerCase()
  if (!isoCode) return null
  
  const flagUrl = `https://flagcdn.com/${size}x${Math.round(size * 0.75)}/${isoCode}.png`
  
  return {
    render: () => {
      const img = document.createElement('img')
      img.src = flagUrl
      img.alt = `${countryCode} flag`
      img.className = 'country-flag-img'
      img.style.cssText = `
        width: ${size}px;
        height: ${Math.round(size * 0.75)}px;
        border-radius: 50%;
        object-fit: cover;
        display: inline-block;
        vertical-align: middle;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(0, 0, 0, 0.1);
      `
      
      // Handle loading errors with fallback
      img.onerror = () => {
        const fallback = getFallbackFlag(countryCode)
        img.src = `data:image/svg+xml;base64,${btoa(fallback)}`
      }
      
      return img
    }
  }
}

/**
 * Get a flag component as a Vue render function
 * @param {string} countryCode - 3-letter country code
 * @param {string} size - Size in pixels
 * @returns {Function} Vue render function
 */
export function getFlagComponent(countryCode, size = '24') {
  const flagImage = getFlagImage(countryCode, size)
  if (!flagImage) return () => null
  
  return flagImage.render
}

/**
 * Get a flag as an HTML string (for use in templates)
 * @param {string} countryCode - 3-letter country code
 * @param {string} size - Size in pixels
 * @returns {string} HTML string for the flag image
 */
export function getFlagHtml(countryCode, size = '24') {
  if (!countryCode) return ''
  
  const codeMap = {
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
  
  const isoCode = codeMap[countryCode?.toUpperCase()] || countryCode?.toLowerCase()
  if (!isoCode) return ''
  
  const flagUrl = `https://flagcdn.com/${size}x${Math.round(size * 0.75)}/${isoCode}.png`
  const height = Math.round(size * 0.75)
  
  return `<img src="${flagUrl}" alt="${countryCode} flag" class="country-flag-img" style="width: ${size}px; height: ${height}px; border-radius: 50%; object-fit: cover; display: inline-block; vertical-align: middle; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2); border: 1px solid rgba(0, 0, 0, 0.1);" />`
}

/**
 * Create a fallback SVG flag for when the image fails to load
 * @param {string} countryCode - 3-letter country code
 * @returns {string} SVG string
 */
function getFallbackFlag(countryCode) {
  return `<svg width="24" height="18" viewBox="0 0 24 18" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="18" fill="#f0f0f0" stroke="#ccc" stroke-width="1"/>
    <text x="12" y="12" text-anchor="middle" font-family="Arial" font-size="8" fill="#666">${countryCode}</text>
  </svg>`
}

/**
 * Legacy function name for backward compatibility
 * @param {string} countryCode - 3-letter country code
 * @returns {string} HTML string for the flag image
 */
export function getCountryFlag(countryCode) {
  return getFlagHtml(countryCode, '20')
}