import mongoose from 'mongoose'

const goalSchema = new mongoose.Schema({
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  team: {
    type: String,
    enum: ['home', 'away'],
    required: true
  },
  minute: {
    type: Number,
    required: true,
    min: 1,
    max: 120  // Including extra time
  },
  goalType: {
    type: String,
    enum: ['open_play', 'penalty', 'free_kick', 'corner', 'header', 'own_goal'],
    default: 'open_play'
  },
  isOwnGoal: {
    type: Boolean,
    default: false
  },
  assist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: false
  }
})

const cardSchema = new mongoose.Schema({
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  team: {
    type: String,
    enum: ['home', 'away'],
    required: true
  },
  minute: {
    type: Number,
    required: true,
    min: 1,
    max: 120
  },
  cardType: {
    type: String,
    enum: ['yellow', 'red', 'second_yellow'],
    required: true
  },
  reason: {
    type: String,
    enum: ['foul', 'unsporting_behavior', 'dissent', 'violent_conduct', 'serious_foul_play', 'offensive_language', 'second_yellow'],
    default: 'foul'
  }
})

const substitutionSchema = new mongoose.Schema({
  playerOut: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  playerIn: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  team: {
    type: String,
    enum: ['home', 'away'],
    required: true
  },
  minute: {
    type: Number,
    required: true,
    min: 1,
    max: 120
  },
  reason: {
    type: String,
    enum: ['tactical', 'injury', 'yellow_card', 'performance'],
    default: 'tactical'
  }
})

const lineupPlayerSchema = new mongoose.Schema({
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  position: {
    type: String,
    required: true
  },
  jerseyNumber: {
    type: Number,
    required: true
  },
  isStarter: {
    type: Boolean,
    default: false
  },
  isCaptain: {
    type: Boolean,
    default: false
  }
})

const matchDetailSchema = new mongoose.Schema({
  match: {
    type: mongoose.Schema.Types.Mixed, // Can be ObjectId for tournament matches or String for qualification matches
    required: true,
    unique: true
  },
  matchType: {
    type: String,
    enum: ['tournament', 'qualification'],
    default: 'tournament'
  },
  
  // Lineups
  homeLineup: [lineupPlayerSchema],
  awayLineup: [lineupPlayerSchema],
  
  // Match Events
  goals: [goalSchema],
  substitutions: [substitutionSchema],
  cards: [cardSchema],
  
  // Match Statistics
  possession: {
    home: { type: Number, min: 0, max: 100 },
    away: { type: Number, min: 0, max: 100 }
  },
  shots: {
    home: { type: Number, default: 0 },
    away: { type: Number, default: 0 }
  },
  shotsOnTarget: {
    home: { type: Number, default: 0 },
    away: { type: Number, default: 0 }
  },
  corners: {
    home: { type: Number, default: 0 },
    away: { type: Number, default: 0 }
  },
  fouls: {
    home: { type: Number, default: 0 },
    away: { type: Number, default: 0 }
  },
  yellowCards: {
    home: { type: Number, default: 0 },
    away: { type: Number, default: 0 }
  },
  redCards: {
    home: { type: Number, default: 0 },
    away: { type: Number, default: 0 }
  },
  
  // Match Report
  matchReport: {
    summary: String,
    keyMoments: [String],
    manOfTheMatch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    }
  },
  
  // Formation
  homeFormation: {
    type: String,
    default: '4-4-2'
  },
  awayFormation: {
    type: String,
    default: '4-4-2'
  },
  
  // Weather and Stadium
  weather: {
    type: String,
    enum: ['sunny', 'cloudy', 'rainy', 'snowy', 'windy'],
    default: 'sunny'
  },
  temperature: {
    type: Number  // in Celsius
  },
  attendance: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})

// Index for quick match lookups (already indexed via unique: true)

export default mongoose.model('MatchDetail', matchDetailSchema)