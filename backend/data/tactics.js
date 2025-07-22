export const formations = [
  {
    name: '4-4-2',
    description: 'Classic balanced formation',
    positions: {
      GK: 1,
      CB: 2,
      LB: 1,
      RB: 1,
      CM: 2,
      LM: 1,
      RM: 1,
      ST: 2
    }
  },
  {
    name: '4-3-3',
    description: 'Attacking formation with wingers',
    positions: {
      GK: 1,
      CB: 2,
      LB: 1,
      RB: 1,
      CDM: 1,
      CM: 2,
      LW: 1,
      RW: 1,
      ST: 1
    }
  },
  {
    name: '4-2-3-1',
    description: 'Modern formation with attacking midfield',
    positions: {
      GK: 1,
      CB: 2,
      LB: 1,
      RB: 1,
      CDM: 2,
      CAM: 1,
      LM: 1,
      RM: 1,
      ST: 1
    }
  },
  {
    name: '3-5-2',
    description: 'Wing-back formation',
    positions: {
      GK: 1,
      CB: 3,
      LWB: 1,
      RWB: 1,
      CM: 2,
      CAM: 1,
      ST: 2
    }
  },
  {
    name: '5-3-2',
    description: 'Defensive formation',
    positions: {
      GK: 1,
      CB: 3,
      LB: 1,
      RB: 1,
      CM: 3,
      ST: 2
    }
  },
  {
    name: '4-1-4-1',
    description: 'Possession-based formation',
    positions: {
      GK: 1,
      CB: 2,
      LB: 1,
      RB: 1,
      CDM: 1,
      CM: 2,
      LM: 1,
      RM: 1,
      ST: 1
    }
  },
  {
    name: '4-5-1',
    description: 'Compact midfield formation',
    positions: {
      GK: 1,
      CB: 2,
      LB: 1,
      RB: 1,
      CM: 3,
      LM: 1,
      RM: 1,
      ST: 1
    }
  },
  {
    name: '3-4-3',
    description: 'High pressing formation',
    positions: {
      GK: 1,
      CB: 3,
      CM: 2,
      LM: 1,
      RM: 1,
      LW: 1,
      RW: 1,
      ST: 1
    }
  }
]

export const playStyles = [
  {
    name: 'Tiki-Taka',
    description: 'Short passing and movement',
    characteristics: ['High possession', 'Short passes', 'High pressing', 'Technical players']
  },
  {
    name: 'Counter-Attack',
    description: 'Quick transitions from defense to attack',
    characteristics: ['Deep defense', 'Fast forwards', 'Direct passing', 'Discipline']
  },
  {
    name: 'High Press',
    description: 'Aggressive pressing in opponent half',
    characteristics: ['High defensive line', 'Intense pressing', 'Fitness', 'Teamwork']
  },
  {
    name: 'Route One',
    description: 'Direct long-ball football',
    characteristics: ['Long passes', 'Target man', 'Physical play', 'Set pieces']
  },
  {
    name: 'Wing Play',
    description: 'Attack through the flanks',
    characteristics: ['Wide formation', 'Pacey wingers', 'Crossing', 'Full-back overlap']
  },
  {
    name: 'Catenaccio',
    description: 'Defensive discipline',
    characteristics: ['Deep defense', 'Man marking', 'Counter attacks', 'Tactical discipline']
  },
  {
    name: 'Total Football',
    description: 'Fluid positional play',
    characteristics: ['Position switching', 'Versatile players', 'High technique', 'Team movement']
  },
  {
    name: 'Pragmatic',
    description: 'Adaptable to opponent',
    characteristics: ['Flexible tactics', 'Game management', 'Balanced approach', 'Smart substitutions']
  }
]

// Get a random formation
export function getRandomFormation() {
  return formations[Math.floor(Math.random() * formations.length)]
}

// Get a random play style
export function getRandomPlayStyle() {
  return playStyles[Math.floor(Math.random() * playStyles.length)]
}

// Generate team tactics
export function generateTeamTactics() {
  return {
    formation: getRandomFormation(),
    playStyle: getRandomPlayStyle(),
    captainStyle: Math.random() > 0.5 ? 'Vocal' : 'Lead by Example',
    setPlaySpecialist: Math.random() > 0.7, // 30% chance of having a specialist
    penaltyTaker: null // Will be assigned to a player later
  }
}