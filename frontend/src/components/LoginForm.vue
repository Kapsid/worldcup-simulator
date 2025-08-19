<template>
  <div class="login-card glass-white animate-fade-in">
    <div class="brand-header">
      <div class="fifa-logo">
        <i class="fas fa-futbol"></i>
      </div>
      <h1>Your Football World</h1>
      <p class="subtitle">Experience the beautiful game</p>
    </div>
    
    <form @submit.prevent="handleLogin" class="login-form">
      <div class="form-group">
        <label for="username">Username</label>
        <input 
          type="text" 
          id="username" 
          v-model="username" 
          required
          placeholder="Enter your username"
          class="input"
        />
      </div>
      
      <div class="form-group">
        <label for="password">Password</label>
        <input 
          type="password" 
          id="password" 
          v-model="password" 
          required
          placeholder="Enter your password"
          class="input"
        />
      </div>
      
      <button type="submit" :disabled="loading" class="btn-primary login-btn">
        <i v-if="loading" class="fas fa-spinner fa-spin"></i>
        <i v-else class="fas fa-sign-in-alt"></i>
        {{ loading ? 'Signing in...' : 'Sign In' }}
      </button>
      
      <p v-if="error" class="error-message">{{ error }}</p>
      
      <!-- Forgot Password Link -->
      <div class="forgot-password">
        <button type="button" @click="showResetPassword = true" class="forgot-password-link">
          <i class="fas fa-key"></i>
          Forgot your password?
        </button>
      </div>
    </form>
    
    <!-- Password Reset Modal -->
    <div v-if="showResetPassword" class="modal-overlay" @click.self="showResetPassword = false">
      <div class="reset-password-modal">
        <div class="modal-header">
          <h3>Reset Password</h3>
          <button @click="showResetPassword = false" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <form @submit.prevent="handlePasswordReset" class="reset-form">
          <div class="form-group">
            <label for="reset-username">Username</label>
            <input 
              type="text" 
              id="reset-username" 
              v-model="resetUsername" 
              required
              placeholder="Enter your username"
              class="input"
            />
          </div>
          <div class="form-group">
            <label for="new-password">New Password</label>
            <input 
              type="password" 
              id="new-password" 
              v-model="newPassword" 
              required
              placeholder="Enter new password"
              class="input"
            />
          </div>
          <div class="modal-actions">
            <button type="button" @click="showResetPassword = false" class="btn-secondary">
              Cancel
            </button>
            <button type="submit" :disabled="resetLoading" class="btn-primary">
              <i v-if="resetLoading" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-key"></i>
              {{ resetLoading ? 'Resetting...' : 'Reset Password' }}
            </button>
          </div>
        </form>
        <p v-if="resetError" class="error-message">{{ resetError }}</p>
        <p v-if="resetSuccess" class="success-message">{{ resetSuccess }}</p>
      </div>
    </div>
    
    <div class="divider">
      <span>Don't have an account?</span>
    </div>
    
    <button @click="$emit('switch-to-register')" class="btn-secondary register-btn">
      <i class="fas fa-user-plus"></i>
      Create Account
    </button>
    
  </div>
</template>

<script>
import apiClient from '../utils/apiClient.js'

export default {
  name: 'LoginForm',
  data() {
    return {
      username: '',
      password: '',
      loading: false,
      error: '',
      showResetPassword: false,
      resetUsername: '',
      newPassword: '',
      resetLoading: false,
      resetError: '',
      resetSuccess: ''
    }
  },
  methods: {
    async handleLogin() {
      this.loading = true
      this.error = ''
      
      try {
        const { data } = await apiClient.post('/login', {
          username: this.username,
          password: this.password
        })
        
        this.$emit('login-success', data)
      } catch (error) {
        this.error = error.data?.error || 'Login failed'
      } finally {
        this.loading = false
      }
    },
    
    async handlePasswordReset() {
      this.resetLoading = true
      this.resetError = ''
      this.resetSuccess = ''
      
      try {
        await apiClient.post('/reset-password', {
          username: this.resetUsername,
          newPassword: this.newPassword
        })
        
        this.resetSuccess = 'Password reset successfully! You can now login with your new password.'
        this.resetUsername = ''
        this.newPassword = ''
        
        // Auto close modal after success
        setTimeout(() => {
          this.showResetPassword = false
          this.resetSuccess = ''
        }, 3000)
      } catch (error) {
        this.resetError = error.data?.error || 'Password reset failed'
      } finally {
        this.resetLoading = false
      }
    }
  }
}
</script>

<style scoped>
.login-card {
  width: 100%;
  max-width: 420px;
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
  color: var(--fifa-blue);
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

.login-form {
  margin-bottom: 32px;
}

.form-group {
  margin-bottom: 24px;
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

.login-btn {
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

.register-btn {
  width: 100%;
  height: 56px;
  font-size: 1.1rem;
  margin-bottom: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* Forgot Password Styles */
.forgot-password {
  text-align: center;
  margin-top: 16px;
}

.forgot-password-link {
  background: none;
  border: none;
  color: var(--fifa-blue);
  cursor: pointer;
  font-size: 0.9rem;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
  padding: 8px;
  border-radius: var(--radius-md);
}

.forgot-password-link:hover {
  color: var(--fifa-dark-blue);
  background: rgba(0, 102, 204, 0.05);
  text-decoration: underline;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.reset-password-modal {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: var(--radius-xl);
  padding: 32px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.modal-header h3 {
  margin: 0;
  color: var(--fifa-dark-blue);
  font-size: 1.3rem;
  font-weight: var(--font-weight-bold);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: var(--gray);
  cursor: pointer;
  padding: 8px;
  border-radius: var(--radius-md);
  transition: all 0.3s ease;
}

.close-btn:hover {
  color: var(--fifa-red);
  background: rgba(255, 68, 68, 0.1);
}

.reset-form {
  margin-bottom: 16px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.modal-actions .btn-secondary,
.modal-actions .btn-primary {
  flex: 1;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.success-message {
  color: var(--success-color, #00b894);
  text-align: center;
  margin-top: 16px;
  padding: 12px;
  background: rgba(0, 184, 148, 0.1);
  border-radius: var(--radius-md);
  border: 1px solid rgba(0, 184, 148, 0.2);
  font-weight: var(--font-weight-medium);
}


@media (max-width: 768px) {
  .login-card {
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
}
</style>