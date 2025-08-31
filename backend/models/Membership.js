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
    enum: ['basic', 'pro', 'admin'],
    default: 'basic',
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
membershipSchema.methods.canCreateTournament = async function() {
  // Admin users have unlimited access (check populated user or via virtual)
  if ((this.user && this.user.username === 'admin') || this.plan === 'admin') {
    return true;
  }
  
  if (!this.isActive) return false;
  
  // Count only standalone tournaments (not world tournaments)
  const Tournament = mongoose.model('Tournament');
  const standaloneTournamentCount = await Tournament.countDocuments({
    createdBy: this.user._id || this.user,
    worldId: { $exists: false }
  });
  
  switch (this.plan) {
    case 'basic':
      return standaloneTournamentCount < 1;
    case 'pro':
    case 'admin':
      return true; // Unlimited
    default:
      return false;
  }
};

// Method to check if user can create worlds
membershipSchema.methods.canCreateWorld = function() {
  // Admin users have unlimited access (check populated user or via virtual)
  if ((this.user && this.user.username === 'admin') || this.plan === 'admin') {
    return true;
  }
  
  if (!this.isActive) return false;
  
  switch (this.plan) {
    case 'basic':
      return this.worldsCreated < 1;
    case 'pro':
    case 'admin':
      return true; // Unlimited
    default:
      return false;
  }
};

// Method to check if user can modify stats/players
membershipSchema.methods.canModifyStats = function() {
  // Admin users have unlimited access (check populated user or via virtual)
  if ((this.user && this.user.username === 'admin') || this.plan === 'admin') {
    return true;
  }
  
  return this.isActive && (this.plan === 'pro' || this.plan === 'admin');
};

// Method to get plan limits
membershipSchema.methods.getPlanLimits = function() {
  const plans = {
    basic: {
      tournaments: 1, // 1 standalone tournament
      worlds: 1, // 1 world with unlimited tournaments
      canModifyStats: false,
      price: 0,
      name: 'Basic'
    },
    pro: {
      tournaments: -1, // Unlimited
      worlds: -1, // Unlimited
      canModifyStats: true,
      price: 7.99,
      name: 'Pro'
    },
    admin: {
      tournaments: -1, // Unlimited
      worlds: -1, // Unlimited
      canModifyStats: true,
      price: 0,
      name: 'Admin'
    }
  };
  
  return plans[this.plan] || plans.basic;
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