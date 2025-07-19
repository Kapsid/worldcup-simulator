// Continental Qualification Structure
// Based on real qualification slots and formats

export const confederations = [
  {
    id: 'uefa',
    name: 'UEFA',
    fullName: 'Union of European Football Associations',
    region: 'Europe',
    color: '#003366',
    flag: '🇪🇺',
    qualificationSlots: 14, // Direct qualification slots
    format: 'groups_direct',
    description: 'European qualification with group stage',
    structure: {
      groups: 10,
      teamsPerGroup: 5, // 52 teams / 10 groups (some groups have 6)
      qualifiersPerGroup: 1, // Only group winners qualify
      totalQualifiers: 14 // Some groups may have 2 qualifiers
    }
  },
  {
    id: 'conmebol',
    name: 'CONMEBOL',
    fullName: 'South American Football Confederation',
    region: 'South America',
    color: '#FFD700',
    flag: '🌎',
    qualificationSlots: 5, // Direct qualification slots
    format: 'single_league',
    description: 'Single round-robin league format',
    structure: {
      groups: 1,
      teamsPerGroup: 10, // All 10 CONMEBOL teams
      qualifiersPerGroup: 5, // Top 5 qualify directly
      totalQualifiers: 5
    }
  },
  {
    id: 'concacaf',
    name: 'CONCACAF',
    fullName: 'Confederation of North, Central America and Caribbean Association Football',
    region: 'North & Central America',
    color: '#FF6B35',
    flag: '🌎',
    qualificationSlots: 3, // Direct qualification slots
    format: 'groups_direct',
    description: 'Group stage qualification',
    structure: {
      groups: 6,
      teamsPerGroup: 6, // Approximately 35 teams / 6 groups
      qualifiersPerGroup: 0, // Variable - total 3 qualifiers
      totalQualifiers: 3
    }
  },
  {
    id: 'afc',
    name: 'AFC',
    fullName: 'Asian Football Confederation',
    region: 'Asia',
    color: '#FF4444',
    flag: '🌏',
    qualificationSlots: 4, // Direct qualification slots
    format: 'groups_direct',
    description: 'Group stage qualification',
    structure: {
      groups: 8,
      teamsPerGroup: 6, // Approximately 46 teams / 8 groups
      qualifiersPerGroup: 0, // Variable - total 4 qualifiers
      totalQualifiers: 4
    }
  },
  {
    id: 'caf',
    name: 'CAF',
    fullName: 'Confederation of African Football',
    region: 'Africa',
    color: '#4CAF50',
    flag: '🌍',
    qualificationSlots: 4, // Direct qualification slots
    format: 'groups_direct',
    description: 'Group stage qualification',
    structure: {
      groups: 10,
      teamsPerGroup: 5, // Approximately 54 teams / 10 groups
      qualifiersPerGroup: 0, // Variable - total 4 qualifiers
      totalQualifiers: 4
    }
  },
  {
    id: 'ofc',
    name: 'OFC',
    fullName: 'Oceania Football Confederation',
    region: 'Oceania',
    color: '#2196F3',
    flag: '🌊',
    qualificationSlots: 1, // Direct qualification slots
    format: 'groups_direct',
    description: 'Group stage qualification',
    structure: {
      groups: 2,
      teamsPerGroup: 6, // Approximately 11 teams / 2 groups
      qualifiersPerGroup: 0, // Variable - total 1 qualifier
      totalQualifiers: 1
    }
  }
]

// Host country gets automatic qualification
export const hostCountrySlots = 1

// Total World Cup slots: 32
// UEFA: 14, CONMEBOL: 5, CONCACAF: 3, AFC: 4, CAF: 4, OFC: 1, Host: 1
// Total qualified from qualification: 31 + Host: 1 = 32 teams

export function getConfederationById(id) {
  return confederations.find(conf => conf.id === id)
}

export function getTotalQualificationSlots() {
  return confederations.reduce((total, conf) => total + conf.qualificationSlots, 0) + hostCountrySlots
}