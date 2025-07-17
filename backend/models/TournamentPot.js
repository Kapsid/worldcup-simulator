import mongoose from 'mongoose'

const tournamentPotSchema = new mongoose.Schema({
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true
  },
  potNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  teams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TournamentTeam'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Compound index to ensure unique pot numbers per tournament
tournamentPotSchema.index({ tournament: 1, potNumber: 1 }, { unique: true })

export default mongoose.model('TournamentPot', tournamentPotSchema)