import mongoose from 'mongoose'

const playerStatsSchema = new mongoose.Schema({
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    sparse: true  // Can be null for qualification stats
  },
  worldId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'World',
    sparse: true  // Can be null for some stats
  },
  
  // Competition Type
  competitionType: {
    type: String,
    enum: ['qualification', 'tournament', 'world_cup', 'euro', 'copa_america', 'afcon', 'asian_cup'],
    required: true
  },
  
  // Match Statistics
  matchesPlayed: {
    type: Number,
    default: 0
  },
  matchesStarted: {
    type: Number,
    default: 0
  },
  minutesPlayed: {
    type: Number,
    default: 0
  },
  
  // Goal Statistics
  goals: {
    type: Number,
    default: 0
  },
  assists: {
    type: Number,
    default: 0
  },
  penaltyGoals: {
    type: Number,
    default: 0
  },
  freeKickGoals: {
    type: Number,
    default: 0
  },
  headerGoals: {
    type: Number,
    default: 0
  },
  ownGoals: {
    type: Number,
    default: 0
  },
  
  // Goalkeeper Statistics
  cleanSheets: {
    type: Number,
    default: 0
  },
  saves: {
    type: Number,
    default: 0
  },
  penaltiesSaved: {
    type: Number,
    default: 0
  },
  
  // Disciplinary
  yellowCards: {
    type: Number,
    default: 0
  },
  redCards: {
    type: Number,
    default: 0
  },
  
  // Performance Ratings
  averageRating: {
    type: Number,
    default: 0
  },
  manOfTheMatchAwards: {
    type: Number,
    default: 0
  },
  
  // Match Details Array - for detailed tracking
  matchDetails: [{
    match: {
      type: mongoose.Schema.Types.Mixed, // Support both ObjectId and string for qualification matches
      required: true
    },
    isStarter: Boolean,
    minutesPlayed: Number,
    goals: Number,
    assists: Number,
    yellowCard: Boolean,
    redCard: Boolean,
    rating: Number,
    date: Date
  }]
}, {
  timestamps: true
})

// Compound index for efficient queries
playerStatsSchema.index({ player: 1, tournamentId: 1, competitionType: 1 })
playerStatsSchema.index({ player: 1, worldId: 1, competitionType: 1 })
playerStatsSchema.index({ worldId: 1, competitionType: 1, goals: -1 })  // Top scorers
playerStatsSchema.index({ worldId: 1, competitionType: 1, assists: -1 })  // Top assists

// Virtual for goals per game
playerStatsSchema.virtual('goalsPerGame').get(function() {
  return this.matchesPlayed > 0 ? (this.goals / this.matchesPlayed).toFixed(2) : 0
})

// Method to add a match performance
playerStatsSchema.methods.addMatchPerformance = function(matchData) {
  this.matchDetails.push(matchData)
  this.matchesPlayed += 1
  
  if (matchData.isStarter) {
    this.matchesStarted += 1
  }
  
  this.minutesPlayed += matchData.minutesPlayed || 0
  this.goals += matchData.goals || 0
  this.assists += matchData.assists || 0
  
  if (matchData.yellowCard) this.yellowCards += 1
  if (matchData.redCard) this.redCards += 1
  
  // Recalculate average rating
  if (matchData.rating) {
    const totalRating = (this.averageRating * (this.matchesPlayed - 1)) + matchData.rating
    this.averageRating = totalRating / this.matchesPlayed
  }
  
  return this.save()
}

export default mongoose.model('PlayerStats', playerStatsSchema)