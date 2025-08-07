import mongoose from 'mongoose'

const tournamentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100
  },
  hostCountry: {
    type: String,
    required: true,
    trim: true
  },
  hostCountryCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    length: 3
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  worldId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'World',
    required: false
  },
  year: {
    type: Number,
    required: false,
    min: 1900,
    max: 2200
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'cancelled'],
    default: 'draft'
  },
  type: {
    type: String,
    enum: ['manual', 'qualification'],
    required: true
  },
  mascot: {
    name: {
      type: String,
      required: false
    },
    imageUrl: {
      type: String,
      required: false
    },
    description: {
      type: String,
      required: false
    },
    personality: {
      type: String,
      required: false
    },
    backstory: {
      type: String,
      required: false
    }
  },
  logo: {
    imageUrl: {
      type: String,
      required: false
    },
    description: {
      type: String,
      required: false
    },
    elements: [{
      type: String
    }]
  },
  anthem: {
    title: {
      type: String,
      required: false
    },
    lyrics: {
      type: String,
      required: false
    },
    style: {
      type: String,
      required: false
    },
    duration: {
      type: String,
      required: false
    }
  },
  ballDesign: {
    name: {
      type: String,
      required: false
    },
    imageUrl: {
      type: String,
      required: false
    },
    description: {
      type: String,
      required: false
    },
    designElements: {
      pattern: String,
      inspiration: String,
      panelCount: Number,
      technology: String
    },
    colorScheme: {
      primary: String,
      secondary: String,
      accent: String,
      description: String
    },
    specifications: {
      circumference: String,
      weight: String,
      pressure: String,
      technology: String
    }
  },
  hostCities: [{
    name: {
      type: String,
      required: true
    },
    isCapital: {
      type: Boolean,
      default: false
    }
  }],
  lastOpenedAt: {
    type: Date,
    default: Date.now
  },
  settings: {
    maxTeams: {
      type: Number,
      default: 32,
      min: 16,
      max: 48
    },
    groupStage: {
      type: Boolean,
      default: true
    },
    knockoutStage: {
      type: Boolean,
      default: true
    }
  },
  teamCount: {
    type: Number,
    default: 0,
    min: 0,
    max: 48
  },
  canActivate: {
    type: Boolean,
    default: false
  },
  qualifiedTeams: [{
    teamId: String,
    name: String,
    country: String,
    flag: String,
    confederation: String,
    qualificationMethod: String
  }],
  winner: {
    name: String,
    code: String,
    flag: String
  },
  runnerUp: {
    name: String,
    code: String,
    flag: String
  },
  finalScore: String,
  mvp: {
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    playerName: String,
    teamId: String,
    nationality: String,
    position: String,
    goals: Number,
    assists: Number,
    averageRating: Number,
    matchesPlayed: Number
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
})

// Index for efficient queries
tournamentSchema.index({ createdBy: 1, lastOpenedAt: -1 })
tournamentSchema.index({ createdBy: 1, status: 1 })

export default mongoose.model('Tournament', tournamentSchema)