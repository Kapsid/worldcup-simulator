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
    enum: ['draft', 'active', 'completed', 'cancelled', 'qualification_complete'],
    default: 'draft'
  },
  type: {
    type: String,
    enum: ['manual', 'qualification'],
    required: true
  },
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