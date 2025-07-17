import Captcha from '../models/Captcha.js'

class CaptchaService {
  constructor() {
    // MongoDB TTL index will handle automatic cleanup, no need for cleanup interval
  }

  async generateCaptcha() {
    try {
      const operators = ['+', '-', '*']
      const operator = operators[Math.floor(Math.random() * operators.length)]
      
      let num1, num2, answer

      switch (operator) {
        case '+':
          num1 = Math.floor(Math.random() * 20) + 1
          num2 = Math.floor(Math.random() * 20) + 1
          answer = num1 + num2
          break
        case '-':
          num1 = Math.floor(Math.random() * 20) + 10
          num2 = Math.floor(Math.random() * 10) + 1
          answer = num1 - num2
          break
        case '*':
          num1 = Math.floor(Math.random() * 10) + 1
          num2 = Math.floor(Math.random() * 10) + 1
          answer = num1 * num2
          break
      }

      const captchaId = this.generateId()
      const question = `${num1} ${operator} ${num2} = ?`
      
      const captcha = new Captcha({
        captchaId,
        question,
        answer,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
      })

      await captcha.save()

      return {
        captchaId,
        question
      }
    } catch (error) {
      console.error('Error generating captcha:', error)
      throw error
    }
  }

  async verifyCaptcha(captchaId, userAnswer) {
    try {
      const captcha = await Captcha.findOne({ captchaId })
      
      if (!captcha) {
        return false
      }

      if (new Date() > captcha.expiresAt) {
        await Captcha.deleteOne({ captchaId })
        return false
      }

      const isValid = parseInt(userAnswer) === captcha.answer
      
      // Remove captcha after use (one-time use)
      await Captcha.deleteOne({ captchaId })
      
      return isValid
    } catch (error) {
      console.error('Error verifying captcha:', error)
      return false
    }
  }

  generateId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  // Manual cleanup method (optional, as MongoDB TTL will handle it automatically)
  async cleanup() {
    try {
      const now = new Date()
      await Captcha.deleteMany({ expiresAt: { $lt: now } })
    } catch (error) {
      console.error('Error during captcha cleanup:', error)
    }
  }
}

export default new CaptchaService()