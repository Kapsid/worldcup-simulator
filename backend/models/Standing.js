import mongoose from 'mongoose'

const standingSchema = new mongoose.Schema({
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
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TournamentTeam',
    required: true
  },
  position: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  played: {
    type: Number,
    default: 0,
    min: 0,
    max: 3
  },
  won: {
    type: Number,
    default: 0,
    min: 0
  },
  drawn: {
    type: Number,
    default: 0,
    min: 0
  },
  lost: {
    type: Number,
    default: 0,
    min: 0
  },
  goalsFor: {
    type: Number,
    default: 0,
    min: 0
  },
  goalsAgainst: {
    type: Number,
    default: 0,
    min: 0
  },
  goalDifference: {
    type: Number,
    default: 0
  },
  points: {
    type: Number,
    default: 0,
    min: 0
  },
  qualifiedFor: {
    type: String,
    enum: ['none', 'round16'],
    default: 'none'
  }
}, {
  timestamps: true
})

standingSchema.index({ tournament: 1, group: 1, position: 1 })
standingSchema.index({ tournament: 1, group: 1, points: -1, goalDifference: -1, goalsFor: -1 })

export default mongoose.model('Standing', standingSchema)