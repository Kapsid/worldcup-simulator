<template>
  <div class="register-card glass-white animate-fade-in">
    <div class="brand-header">
      <div class="fifa-logo">
        <i class="fas fa-trophy"></i>
      </div>
      <h1>Join the Tournament</h1>
      <p class="subtitle">Create your World Cup legacy</p>
    </div>
    
    <form @submit.prevent="handleRegister" class="register-form">
      <div class="form-group">
        <label for="username">Username</label>
        <input 
          type="text" 
          id="username" 
          v-model="formData.username" 
          required
          minlength="3"
          placeholder="Choose a unique username"
          class="input"
          :class="{ 'error': errors.username }"
        />
        <span v-if="errors.username" class="field-error">{{ errors.username }}</span>
      </div>

      <div class="form-group">
        <label for="name">Full Name</label>
        <input 
          type="text" 
          id="name" 
          v-model="formData.name" 
          required
          minlength="2"
          placeholder="Enter your full name"
          class="input"
          :class="{ 'error': errors.name }"
        />
        <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <input 
          type="password" 
          id="password" 
          v-model="formData.password" 
          required
          minlength="6"
          placeholder="Create a secure password"
          class="input"
          :class="{ 'error': errors.password }"
        />
        <span v-if="errors.password" class="field-error">{{ errors.password }}</span>
      </div>

      <div class="form-group">
        <label for="confirmPassword">Confirm Password</label>
        <input 
          type="password" 
          id="confirmPassword" 
          v-model="formData.confirmPassword" 
          required
          placeholder="Confirm your password"
          class="input"
          :class="{ 'error': errors.confirmPassword }"
        />
        <span v-if="errors.confirmPassword" class="field-error">{{ errors.confirmPassword }}</span>
      </div>

      <div class="form-group captcha-group">
        <label>
          <i class="fas fa-shield-alt"></i>
          Security Verification
        </label>
        <div class="captcha-container">
          <div class="captcha-question">
            {{ captcha.question || 'Loading...' }}
          </div>
          <input 
            type="number" 
            v-model="formData.captchaAnswer" 
            required
            placeholder="Answer"
            class="input captcha-input"
            :class="{ 'error': errors.captcha }"
            :disabled="!captcha.captchaId"
          />
          <button 
            type="button" 
            @click="refreshCaptcha" 
            class="refresh-btn"
            :disabled="loading"
          >
            <i class="fas fa-sync-alt"></i>
          </button>
        </div>
        <span v-if="errors.captcha" class="field-error">{{ errors.captcha }}</span>
      </div>

      <button type="submit" :disabled="loading || !captcha.captchaId" class="btn-primary register-btn">
        <i v-if="loading" class="fas fa-spinner fa-spin"></i>
        <i v-else class="fas fa-user-plus"></i>
        {{ loading ? 'Creating Account...' : 'Create Account' }}
      </button>
      
      <p v-if="error" class="error-message">{{ error }}</p>
    </form>

    <div class="divider">
      <span>Already part of the tournament?</span>
    </div>

    <button @click="$emit('switch-to-login')" class="btn-secondary login-btn">
      <i class="fas fa-sign-in-alt"></i>
      Sign In
    </button>
  </div>
</template>

<script>
import api from '../services/api.js'

export default {
  name: 'RegisterForm',
  data() {
    return {
      formData: {
        username: '',
        name: '',
        password: '',
        confirmPassword: '',
        captchaAnswer: ''
      },
      captcha: {
        captchaId: null,
        question: ''
      },
      loading: false,
      error: '',
      errors: {}
    }
  },
  mounted() {
    this.refreshCaptcha()
  },
  methods: {
    async refreshCaptcha() {
      try {
        const { data } = await api.auth.getCaptcha()
        this.captcha = data
        this.formData.captchaAnswer = ''
        this.errors.captcha = ''
      } catch (error) {
        console.error('Error loading captcha:', error)
        this.error = 'Failed to load captcha. Please try again.'
      }
    },

    validateForm() {
      this.errors = {}

      if (this.formData.username.length < 3) {
        this.errors.username = 'Username must be at least 3 characters long'
      }

      if (this.formData.name.length < 2) {
        this.errors.name = 'Name must be at least 2 characters long'
      }

      if (this.formData.password.length < 6) {
        this.errors.password = 'Password must be at least 6 characters long'
      }

      if (this.formData.password !== this.formData.confirmPassword) {
        this.errors.confirmPassword = 'Passwords do not match'
      }

      if (!this.formData.captchaAnswer) {
        this.errors.captcha = 'Please solve the captcha'
      }

      return Object.keys(this.errors).length === 0
    },

    async handleRegister() {
      if (!this.validateForm()) {
        return
      }

      this.loading = true
      this.error = ''
      
      try {
        const { data } = await api.auth.register({
          username: this.formData.username,
          name: this.formData.name,
          password: this.formData.password,
          confirmPassword: this.formData.confirmPassword,
          captchaId: this.captcha.captchaId,
          captchaAnswer: this.formData.captchaAnswer
        })
        
        this.$emit('register-success', data)
      } catch (error) {
        this.error = error.data?.error || 'Registration failed'
        if (error.data?.error === 'Invalid captcha answer') {
          this.refreshCaptcha()
        }
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.register-card {
  width: 100%;
  max-width: 480px;
  padding: 40px;
  border-radius: var(--radius-xl);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
}

.brand-header {
  text-align: center;
  margin-bottom: 40px;
}

.fifa-logo {
  font-size: 3rem;
  margin-bottom: 16px;
  color: var(--fifa-gold);
}

.brand-header h1 {
  font-size: 2rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, var(--fifa-blue), var(--fifa-light-blue));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  color: var(--gray);
  font-size: 1rem;
  font-weight: var(--font-weight-medium);
  margin: 0;
}

.register-form {
  margin-bottom: 32px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: var(--fifa-dark-blue);
  font-weight: var(--font-weight-semibold);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.field-error {
  color: var(--fifa-red);
  font-size: 0.8rem;
  margin-top: 6px;
  display: block;
  font-weight: var(--font-weight-medium);
}

.captcha-group {
  margin-bottom: 32px;
}

.captcha-container {
  display: flex;
  gap: 12px;
  align-items: stretch;
}

.captcha-question {
  background: linear-gradient(135deg, var(--fifa-blue), var(--fifa-light-blue));
  color: var(--white);
  padding: 16px 20px;
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-bold);
  min-width: 140px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
  font-size: 1.1rem;
}

.captcha-input {
  flex: 1;
  max-width: 120px;
}

.refresh-btn {
  padding: 16px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  font-size: 1.2rem;
  color: var(--fifa-blue);
}

.refresh-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.4);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.register-btn {
  width: 100%;
  height: 56px;
  margin-top: 8px;
  font-size: 1.1rem;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.error-message {
  color: var(--fifa-red);
  text-align: center;
  margin-top: 16px;
  padding: 12px;
  background: rgba(255, 68, 68, 0.1);
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 68, 68, 0.2);
  font-weight: var(--font-weight-medium);
}

.divider {
  text-align: center;
  margin: 32px 0;
  position: relative;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--gray), transparent);
}

.divider span {
  background: rgba(255, 255, 255, 0.9);
  padding: 0 20px;
  color: var(--gray);
  font-size: 0.9rem;
  font-weight: var(--font-weight-medium);
}

.login-btn {
  width: 100%;
  height: 56px;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

@media (max-width: 768px) {
  .register-card {
    max-width: 100%;
    margin: 16px;
    padding: 32px 24px;
  }
  
  .brand-header h1 {
    font-size: 1.75rem;
  }
  
  .fifa-logo {
    font-size: 2.5rem;
  }
  
  .captcha-container {
    flex-direction: column;
    gap: 12px;
  }
  
  .captcha-input {
    max-width: 100%;
  }
  
  .captcha-question {
    min-width: auto;
  }
}
</style>