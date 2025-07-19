import mongoose from 'mongoose'

const worldSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100
  },
  labels: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  beginningYear: {
    type: Number,
    required: true,
    min: 1900,
    max: 2100
  },
  useRealHistoricData: {
    type: Boolean,
    default: false,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tournaments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament'
  }],
  simulatedHistory: [{
    year: Number,
    host: {
      name: String,
      code: String,
      flag: String
    },
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
    final: {
      score: String,
      venue: String
    },
    teams: Number
  }],
  countryRankings: [{
    code: String,
    name: String,
    flag: String,
    points: { type: Number, default: 1500 },
    previousPoints: { type: Number, default: 1500 },
    rank: Number,
    previousRank: Number,
    rankChange: { type: Number, default: 0 },
    confederation: String,
    tournamentHistory: [{
      year: Number,
      performance: String, // 'group', 'round16', 'quarter', 'semi', 'final', 'winner'
      pointsEarned: Number
    }]
  }],
  settings: {
    allowQualification: {
      type: Boolean,
      default: true
    },
    allowManualTournaments: {
      type: Boolean,
      default: true
    },
    maxTournaments: {
      type: Number,
      default: 50,
      min: 1,
      max: 200
    }
  }
}, {
  timestamps: true
})

// Index for efficient queries
worldSchema.index({ createdBy: 1, createdAt: -1 })
worldSchema.index({ createdBy: 1, isActive: 1 })
worldSchema.index({ name: 'text', description: 'text' })

export default mongoose.model('World', worldSchema)