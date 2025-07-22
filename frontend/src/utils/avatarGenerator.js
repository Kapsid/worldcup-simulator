import { createAvatar } from '@dicebear/core'
import { personas } from '@dicebear/collection'

// Generate simple hash from string for consistent colors
function hashCode(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

// Generate avatar URL for a player
export function generatePlayerAvatar(seed, playerName = '', nationality = '') {
  try {
    // Ensure we have a unique seed
    const uniqueSeed = seed || playerName || 'default'
    
    const avatar = createAvatar(personas, {
      seed: uniqueSeed,
      // Personas should provide diverse realistic faces
      backgroundColor: ['transparent'],
      size: 128
    })
    
    const svgString = avatar.toString()
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`
  } catch (error) {
    console.error('Error generating avatar:', error)
    // Return a simple fallback with player initials
    const nameParts = playerName.split(' ').filter(part => part.length > 0)
    const initials = nameParts.length >= 2 
      ? nameParts[0][0] + nameParts[nameParts.length - 1][0] 
      : nameParts[0]?.substring(0, 2) || '?'
    
    const hash = hashCode(seed || playerName)
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD']
    const backgroundColor = colors[hash % colors.length]
    
    const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><circle cx="64" cy="64" r="64" fill="${backgroundColor}"/><text x="64" y="80" text-anchor="middle" font-size="48" font-weight="bold" fill="white" font-family="Arial">${initials}</text></svg>`
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(fallbackSvg)}`
  }
}

// Generate avatar with nationality-based colors
export function generateNationalityAvatar(seed, nationality, playerName = '') {
  // Color schemes based on nationality/region
  const nationalityColors = {
    // European countries
    'ENG': ['#C8102E', '#1C408E'], // England colors
    'GER': ['#000000', '#DD0000', '#FFCE00'], // Germany colors
    'FRA': ['#1F4E79', '#FFFFFF', '#E1000F'], // France colors
    'ESP': ['#C60B1E', '#FFD700'], // Spain colors
    'ITA': ['#009246', '#FFFFFF', '#CE2B37'], // Italy colors
    'NED': ['#FF7F00', '#000000'], // Netherlands colors
    'POR': ['#046A38', '#DA020E'], // Portugal colors
    
    // South American countries
    'BRA': ['#009739', '#FEDD00'], // Brazil colors
    'ARG': ['#6CACE4', '#FFFFFF'], // Argentina colors
    
    // North American countries
    'USA': ['#B22234', '#FFFFFF', '#3C3B6E'], // USA colors
    'MEX': ['#006847', '#CE1126'], // Mexico colors
    
    // Asian countries
    'JPN': ['#BC002D', '#FFFFFF'], // Japan colors
    
    // Default colors
    'DEFAULT': ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57']
  }

  const colors = nationalityColors[nationality] || nationalityColors.DEFAULT
  const hash = hashCode(seed || playerName)
  const backgroundColor = colors[hash % colors.length]

  return generatePlayerAvatar(seed, playerName, nationality)
}

// Avatar cache to ensure consistency
const avatarCache = new Map()

// Get avatar URL for display
export function getPlayerAvatarUrl(player) {
  if (!player) {
    return generatePlayerAvatar('default')
  }
  
  // Create a consistent seed from player data
  const seed = player.avatarSeed || player._id || player.displayName || 'default'
  const cacheKey = `${seed}_${player.nationality || 'DEFAULT'}`
  
  // Return cached avatar if exists
  if (avatarCache.has(cacheKey)) {
    return avatarCache.get(cacheKey)
  }
  
  // Generate new avatar and cache it
  const avatarUrl = generateNationalityAvatar(seed, player.nationality, player.displayName)
  avatarCache.set(cacheKey, avatarUrl)
  
  return avatarUrl
}

// Preload avatar (for better performance)
export function preloadPlayerAvatar(player) {
  const avatarUrl = getPlayerAvatarUrl(player)
  const img = new Image()
  img.src = avatarUrl
  return avatarUrl
}