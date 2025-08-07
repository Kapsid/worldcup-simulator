import mongoose from 'mongoose'

const countryTournamentHistorySchema = new mongoose.Schema({
  // Link to world (required - only world tournaments have history)
  worldId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'World',
    required: true,
    index: true
  },
  
  // Link to tournament
  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true,
    index: true
  },
  
  // Country information
  countryCode: {
    type: String,
    required: true,
    index: true
  },
  
  countryName: {
    type: String,
    required: true
  },
  
  // Tournament details
  tournamentYear: {
    type: Number,
    required: true
  },
  
  hostCountry: {
    type: String,
    required: true
  },
  
  hostCountryCode: {
    type: String,
    required: true
  },
  
  // Achievement level - what the country achieved in this tournament
  achievement: {
    type: String,
    required: true,
    enum: [
      'Did not qualify',        // Failed in qualification
      'Qualification ended',    // Lost in qualification playoffs
      'Group stage ended',      // Eliminated in group stage
      '1/8 Final ended',       // Eliminated in Round of 16
      '1/4 Final ended',       // Eliminated in Quarter-finals
      '4th place',             // Lost 3rd place playoff
      '3rd place',             // Won 3rd place playoff
      '2nd place',             // Runner-up (lost final)
      '1st place'              // Winner
    ]
  },
  
  // Detailed results
  participatedInTournament: {
    type: Boolean,
    default: false
  },
  
  qualificationResult: {
    type: String,
    enum: ['qualified', 'eliminated', 'not_participated'],
    default: 'not_participated'
  },
  
  // Group stage info (if qualified)
  groupStageGroup: {
    type: String,
    default: null
  },
  
  groupStagePosition: {
    type: Number,
    default: null
  },
  
  // Knockout stage info
  eliminatedInStage: {
    type: String,
    enum: ['qualification', 'group_stage', 'round_16', 'quarter_final', 'semi_final', 'final', 'none'],
    default: 'qualification'
  },
  
  // Final position in tournament (1st, 2nd, 3rd, 4th, etc.)
  finalPosition: {
    type: Number,
    default: null
  },
  
  // Statistics
  matchesPlayed: {
    type: Number,
    default: 0
  },
  
  wins: {
    type: Number,
    default: 0
  },
  
  draws: {
    type: Number,
    default: 0
  },
  
  losses: {
    type: Number,
    default: 0
  },
  
  goalsFor: {
    type: Number,
    default: 0
  },
  
  goalsAgainst: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})

// Compound indexes for efficient queries
countryTournamentHistorySchema.index({ worldId: 1, countryCode: 1 })
countryTournamentHistorySchema.index({ countryCode: 1, tournamentYear: -1 })
countryTournamentHistorySchema.index({ worldId: 1, tournamentYear: -1 })

// Unique constraint - one record per country per tournament
countryTournamentHistorySchema.index(
  { worldId: 1, tournamentId: 1, countryCode: 1 }, 
  { unique: true }
)

export default mongoose.model('CountryTournamentHistory', countryTournamentHistorySchema)