import mongoose from 'mongoose'

const tournamentGroupSchema = new mongoose.Schema({
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true
  },
  groupLetter: {
    type: String,
    required: true,
    enum: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    uppercase: true
  },
  teams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TournamentTeam'
  }],
  isComplete: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Compound index to ensure unique group letters per tournament
tournamentGroupSchema.index({ tournament: 1, groupLetter: 1 }, { unique: true })

export default mongoose.model('TournamentGroup', tournamentGroupSchema)