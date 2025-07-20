// Dynamic tournament theming utilities

export const applyTournamentTheme = (tournament) => {
  if (!tournament?.logo?.colorScheme) {
    // Reset to default FIFA colors if no custom colors
    document.documentElement.style.removeProperty('--tournament-primary')
    document.documentElement.style.removeProperty('--tournament-secondary')
    document.documentElement.style.removeProperty('--tournament-accent')
    document.documentElement.style.removeProperty('--tournament-primary-light')
    document.documentElement.style.removeProperty('--tournament-primary-dark')
    document.documentElement.style.removeProperty('--tournament-gradient')
    return
  }

  const { primary, secondary, accent } = tournament.logo.colorScheme

  // Helper function to convert hex to rgba
  const hexToRgba = (hex, alpha = 1) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  // Helper function to lighten/darken hex color
  const adjustHexBrightness = (hex, percent) => {
    const num = parseInt(hex.slice(1), 16)
    const amt = Math.round(2.55 * percent)
    const R = (num >> 16) + amt
    const G = (num >> 8 & 0x00FF) + amt
    const B = (num & 0x0000FF) + amt
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)
  }

  // Set tournament-specific CSS custom properties
  document.documentElement.style.setProperty('--tournament-primary', primary)
  document.documentElement.style.setProperty('--tournament-secondary', secondary)
  document.documentElement.style.setProperty('--tournament-accent', accent)
  
  // Generate additional shades
  document.documentElement.style.setProperty('--tournament-primary-light', hexToRgba(primary, 0.1))
  document.documentElement.style.setProperty('--tournament-primary-medium', hexToRgba(primary, 0.3))
  document.documentElement.style.setProperty('--tournament-primary-dark', adjustHexBrightness(primary, -20))
  
  // Create gradients
  document.documentElement.style.setProperty('--tournament-gradient', `linear-gradient(135deg, ${primary}, ${accent})`)
  document.documentElement.style.setProperty('--tournament-gradient-light', `linear-gradient(135deg, ${hexToRgba(primary, 0.8)}, ${hexToRgba(accent, 0.8)})`)
}

export const removeTournamentTheme = () => {
  document.documentElement.style.removeProperty('--tournament-primary')
  document.documentElement.style.removeProperty('--tournament-secondary')
  document.documentElement.style.removeProperty('--tournament-accent')
  document.documentElement.style.removeProperty('--tournament-primary-light')
  document.documentElement.style.removeProperty('--tournament-primary-medium')
  document.documentElement.style.removeProperty('--tournament-primary-dark')
  document.documentElement.style.removeProperty('--tournament-gradient')
  document.documentElement.style.removeProperty('--tournament-gradient-light')
}