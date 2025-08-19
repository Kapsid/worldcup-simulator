import mongoose from 'mongoose'

const PlayerSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    required: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  nationality: {
    type: String,
    required: true
  },
  
  // Position and Role
  position: {
    type: String,
    enum: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'],
    required: true
  },
  detailedPosition: {
    type: String,
    enum: [
      // Goalkeepers
      'GK',
      // Defenders
      'CB', 'LB', 'RB', 'LWB', 'RWB',
      // Midfielders
      'CDM', 'CM', 'CAM', 'LM', 'RM',
      // Forwards
      'LW', 'RW', 'CF', 'ST'
    ],
    required: true
  },
  jerseyNumber: {
    type: Number,
    min: 1,
    max: 99,
    required: true
  },
  
  // Career Statistics
  internationalCaps: {
    type: Number,
    default: 0
  },
  internationalGoals: {
    type: Number,
    default: 0
  },
  internationalAssists: {
    type: Number,
    default: 0
  },
  internationalCleanSheets: {
    type: Number,
    default: 0  // For goalkeepers
  },
  overallMatches: {
    type: Number,
    default: 0  // Total matches played across all competitions
  },
  debutYear: {
    type: Number
  },
  
  // Tournament/World Association
  teamId: {
    type: String,
    required: true  // Country code
  },
  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    sparse: true  // Can be null for world players
  },
  worldId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'World',
    sparse: true  // Can be null for tournament-only players
  },
  
  // Physical Attributes
  height: {
    type: Number,  // in cm
    required: true
  },
  preferredFoot: {
    type: String,
    enum: ['Left', 'Right', 'Both'],
    default: 'Right'
  },
  
  // Avatar/Appearance
  avatarSeed: {
    type: String,
    required: true  // Used to generate consistent avatar
  },
  avatarStyle: {
    type: String,
    default: 'avataaars'  // Using avataaars library style
  },
  
  // Form and Status
  currentForm: {
    type: String,
    enum: ['Excellent', 'Good', 'Average', 'Poor', 'Injured'],
    default: 'Good'
  },
  fitness: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  morale: {
    type: Number,
    min: 0,
    max: 100,
    default: 75
  },
  
  // Skills/Attributes (simplified for now)
  overallRating: {
    type: Number,
    min: 40,
    max: 99,
    default: 70
  },
  potential: {
    type: Number,
    min: 40,
    max: 99,
    default: 75
  },
  
  // Captain/Vice-Captain
  isCaptain: {
    type: Boolean,
    default: false
  },
  isViceCaptain: {
    type: Boolean,
    default: false
  },
  
  // Career History (for world mode)
  careerHistory: [{
    year: Number,
    tournament: String,
    matches: Number,
    goals: Number,
    assists: Number,
    cleanSheets: Number,
    rating: Number
  }],
  
  // Status
  isRetired: {
    type: Boolean,
    default: false
  },
  retirementYear: {
    type: Number
  }
}, {
  timestamps: true
})

// Virtual for full name
PlayerSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`
})

// Method to calculate age based on a specific year (for world mode)
PlayerSchema.methods.getAgeAtYear = function(year) {
  const birthYear = this.dateOfBirth.getFullYear()
  return year - birthYear
}

// Method to check if player should retire
PlayerSchema.methods.shouldRetire = function(currentYear) {
  const age = this.getAgeAtYear(currentYear)
  
  // Different retirement ages by position
  if (this.position === 'Goalkeeper') {
    return age >= 38 + Math.floor(Math.random() * 4)  // 38-41
  } else if (this.position === 'Defender') {
    return age >= 35 + Math.floor(Math.random() * 3)  // 35-37
  } else {
    return age >= 34 + Math.floor(Math.random() * 3)  // 34-36
  }
}

// Add text index for searching
PlayerSchema.index({ firstName: 'text', lastName: 'text', displayName: 'text' })
PlayerSchema.index({ teamId: 1, tournamentId: 1 })
PlayerSchema.index({ teamId: 1, worldId: 1 })

const Player = mongoose.model('Player', PlayerSchema)

export default Player