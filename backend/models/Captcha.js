import mongoose from 'mongoose'

const captchaSchema = new mongoose.Schema({
  captchaId: {
    type: String,
    required: true,
    unique: true
  },
  question: {
    type: String,
    required: true
  },
  answer: {
    type: Number,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: Date.now,
    expires: 300 // Expires after 5 minutes (300 seconds)
  }
}, {
  timestamps: true
})

export default mongoose.model('Captcha', captchaSchema)