import mongoose from 'mongoose'

const knockoutRoundSchema = new mongoose.Schema({
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true
  },
  round: {
    type: String,
    enum: ['round16', 'quarterfinal', 'semifinal', 'final', 'third_place'],
    required: true
  },
  roundNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  name: {
    type: String,
    required: true
  },
  matchCount: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  status: {
    type: String,
    enum: ['pending', 'ready', 'in_progress', 'completed'],
    default: 'pending'
  },
  completedMatches: {
    type: Number,
    default: 0,
    min: 0
  },
  startedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
})

knockoutRoundSchema.index({ tournament: 1, roundNumber: 1 })
knockoutRoundSchema.index({ tournament: 1, status: 1 })

export default mongoose.model('KnockoutRound', knockoutRoundSchema)