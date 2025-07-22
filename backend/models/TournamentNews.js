import mongoose from 'mongoose'

const tournamentNewsSchema = new mongoose.Schema({
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true
  },
  type: {
    type: String,
    enum: [
      'stage_change',     // Qualification ended, group stage started, etc.
      'round_completed',  // Matchday completed, knockout round completed
      'surprise_result',  // Major upset in match
      'high_scoring',     // Match with many goals
      'milestone',        // Tournament milestones (semifinals reached, etc.)
      'qualification',    // Team qualified/eliminated
      'record',          // Records broken (highest score, etc.)
      'tournament_info'  // General tournament updates
    ],
    required: true
  },
  category: {
    type: String,
    enum: ['important', 'results', 'milestones', 'statistics', 'general'],
    default: 'general'
  },
  title: {
    type: String,
    required: true,
    maxLength: 200
  },
  message: {
    type: String,
    required: true,
    maxLength: 500
  },
  data: {
    type: mongoose.Schema.Types.Mixed, // Additional data like match details, teams involved, etc.
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  }
}, {
  timestamps: true
})

// Index for efficient queries
tournamentNewsSchema.index({ tournament: 1, createdAt: -1 })
tournamentNewsSchema.index({ tournament: 1, isRead: 1 })
tournamentNewsSchema.index({ tournament: 1, type: 1 })
tournamentNewsSchema.index({ tournament: 1, category: 1 })

export default mongoose.model('TournamentNews', tournamentNewsSchema)