import mongoose from 'mongoose'

const tournamentTeamSchema = new mongoose.Schema({
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true
  },
  countryCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    length: 3
  },
  countryName: {
    type: String,
    required: true,
    trim: true
  },
  countryFlag: {
    type: String,
    required: true
  },
  fifaRanking: {
    type: Number,
    required: true,
    min: 1
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  isHost: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

// Compound index to ensure unique country per tournament
tournamentTeamSchema.index({ tournament: 1, countryCode: 1 }, { unique: true })

// Index for efficient queries
tournamentTeamSchema.index({ tournament: 1, addedAt: 1 })
tournamentTeamSchema.index({ tournament: 1, fifaRanking: 1 })

export default mongoose.model('TournamentTeam', tournamentTeamSchema)