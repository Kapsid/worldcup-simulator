import mongoose from 'mongoose';

const membershipSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  plan: {
    type: String,
    enum: ['free', 'pro', 'football_maniac'],
    default: 'free',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired', 'pending'],
    default: 'active',
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  endDate: {
    type: Date,
    default: null // null means no expiration (for free plan or lifetime)
  },
  // Usage tracking
  tournamentsCreated: {
    type: Number,
    default: 0
  },
  worldsCreated: {
    type: Number,
    default: 0
  },
  // Payment information (for future use)
  stripeCustomerId: {
    type: String,
    default: null
  },
  stripeSubscriptionId: {
    type: String,
    default: null
  },
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
membershipSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for checking if membership is expired
membershipSchema.virtual('isExpired').get(function() {
  if (!this.endDate) return false; // No expiration date means never expires
  return new Date() > this.endDate;
});

// Virtual for checking if membership is active
membershipSchema.virtual('isActive').get(function() {
  return this.status === 'active' && !this.isExpired;
});

// Method to check if user can create tournaments
membershipSchema.methods.canCreateTournament = function() {
  if (!this.isActive) return false;
  
  switch (this.plan) {
    case 'free':
      return this.tournamentsCreated < 1;
    case 'pro':
      return this.tournamentsCreated < 5;
    case 'football_maniac':
      return true; // Unlimited
    default:
      return false;
  }
};

// Method to check if user can create worlds
membershipSchema.methods.canCreateWorld = function() {
  if (!this.isActive) return false;
  
  switch (this.plan) {
    case 'free':
      return this.worldsCreated < 1;
    case 'pro':
      return this.worldsCreated < 3;
    case 'football_maniac':
      return true; // Unlimited
    default:
      return false;
  }
};

// Method to check if user can modify stats/players
membershipSchema.methods.canModifyStats = function() {
  return this.isActive && this.plan === 'football_maniac';
};

// Method to get plan limits
membershipSchema.methods.getPlanLimits = function() {
  const plans = {
    free: {
      tournaments: 1,
      worlds: 1,
      canModifyStats: false,
      price: 0,
      name: 'Free'
    },
    pro: {
      tournaments: 5,
      worlds: 3,
      canModifyStats: false,
      price: 9.99,
      name: 'Pro'
    },
    football_maniac: {
      tournaments: -1, // Unlimited
      worlds: -1, // Unlimited
      canModifyStats: true,
      price: 19.99,
      name: 'Football Maniac'
    }
  };
  
  return plans[this.plan] || plans.free;
};

// Method to increment usage counters
membershipSchema.methods.incrementTournamentUsage = function() {
  this.tournamentsCreated += 1;
  return this.save();
};

membershipSchema.methods.incrementWorldUsage = function() {
  this.worldsCreated += 1;
  return this.save();
};

// Ensure virtual fields are serialized
membershipSchema.set('toJSON', { virtuals: true });
membershipSchema.set('toObject', { virtuals: true });

const Membership = mongoose.model('Membership', membershipSchema);

export default Membership;