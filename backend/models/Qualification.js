import mongoose from 'mongoose'

const QualificationSchema = new mongoose.Schema({
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true
  },
  started: {
    type: Boolean,
    default: false
  },
  completed: {
    type: Boolean,
    default: false
  },
  currentMatchday: {
    type: Number,
    default: 0
  },
  confederations: [{
    confederationId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    started: {
      type: Boolean,
      default: false
    },
    completed: {
      type: Boolean,
      default: false
    },
    currentRound: {
      type: Number,
      default: 1
    },
    groups: [{
      groupId: String,
      name: String,
      teams: [{
        teamId: String,
        name: String,
        country: String,
        flag: String,
        played: { type: Number, default: 0 },
        won: { type: Number, default: 0 },
        drawn: { type: Number, default: 0 },
        lost: { type: Number, default: 0 },
        goalsFor: { type: Number, default: 0 },
        goalsAgainst: { type: Number, default: 0 },
        goalDifference: { type: Number, default: 0 },
        points: { type: Number, default: 0 }
      }]
    }],
    matches: [{
      matchId: String,
      groupId: String,
      round: Number,
      matchday: Number,
      homeTeam: {
        teamId: String,
        name: String,
        country: String,
        flag: String
      },
      awayTeam: {
        teamId: String,
        name: String,
        country: String,
        flag: String
      },
      homeScore: { type: Number, default: null },
      awayScore: { type: Number, default: null },
      played: { type: Boolean, default: false },
      date: Date
    }],
    qualifiedTeams: [{
      teamId: String,
      name: String,
      country: String,
      flag: String,
      qualificationMethod: String // 'group_winner', 'playoff_winner', etc.
    }],
    playoffs: {
      available: { type: Boolean, default: false },
      completed: { type: Boolean, default: false },
      matches: [{
        matchId: String,
        homeTeam: {
          teamId: String,
          name: String,
          country: String,
          flag: String
        },
        awayTeam: {
          teamId: String,
          name: String,
          country: String,
          flag: String
        },
        homeScore: { type: Number, default: null },
        awayScore: { type: Number, default: null },
        played: { type: Boolean, default: false },
        date: Date
      }],
      winner: {
        teamId: String,
        name: String,
        country: String,
        flag: String
      }
    }
  }],
  qualifiedTeams: [{
    teamId: String,
    name: String,
    country: String,
    flag: String,
    confederation: String,
    qualificationMethod: String
  }]
}, {
  timestamps: true
})

export default mongoose.model('Qualification', QualificationSchema)