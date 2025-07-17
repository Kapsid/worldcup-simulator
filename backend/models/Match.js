import mongoose from 'mongoose'

const matchSchema = new mongoose.Schema({
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TournamentGroup',
    required: true
  },
  matchday: {
    type: Number,
    required: true,
    min: 1,
    max: 3
  },
  homeTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TournamentTeam',
    required: true
  },
  awayTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TournamentTeam',
    required: true
  },
  homeScore: {
    type: Number,
    default: null,
    min: 0
  },
  awayScore: {
    type: Number,
    default: null,
    min: 0
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed'],
    default: 'scheduled'
  },
  simulatedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
})

matchSchema.index({ tournament: 1, group: 1, matchday: 1 })
matchSchema.index({ tournament: 1, status: 1 })

export default mongoose.model('Match', matchSchema)