import mongoose from 'mongoose'

const knockoutMatchSchema = new mongoose.Schema({
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
  matchPosition: {
    type: Number,
    required: true,
    min: 1
  },
  homeTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TournamentTeam',
    default: null
  },
  awayTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TournamentTeam',
    default: null
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
  homeExtraTimeScore: {
    type: Number,
    default: null,
    min: 0
  },
  awayExtraTimeScore: {
    type: Number,
    default: null,
    min: 0
  },
  homePenaltyScore: {
    type: Number,
    default: null,
    min: 0,
    max: 5
  },
  awayPenaltyScore: {
    type: Number,
    default: null,
    min: 0,
    max: 5
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TournamentTeam',
    default: null
  },
  loser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TournamentTeam',
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'ready', 'completed'],
    default: 'pending'
  },
  decidedBy: {
    type: String,
    enum: ['regular', 'extra_time', 'penalties'],
    default: null
  },
  simulatedAt: {
    type: Date,
    default: null
  },
  nextMatchPosition: {
    type: Number,
    default: null
  }
}, {
  timestamps: true
})

knockoutMatchSchema.index({ tournament: 1, round: 1, matchPosition: 1 })
knockoutMatchSchema.index({ tournament: 1, status: 1 })

export default mongoose.model('KnockoutMatch', knockoutMatchSchema)