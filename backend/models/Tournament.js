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
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'cancelled'],
    default: 'draft'
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
  }
}, {
  timestamps: true
})

// Index for efficient queries
tournamentSchema.index({ createdBy: 1, lastOpenedAt: -1 })
tournamentSchema.index({ createdBy: 1, status: 1 })

export default mongoose.model('Tournament', tournamentSchema)