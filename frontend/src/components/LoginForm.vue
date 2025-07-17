<template>
  <div class="login-card glass-white animate-fade-in">
    <div class="brand-header">
      <div class="fifa-logo">
        <i class="fas fa-futbol"></i>
      </div>
      <h1>World Cup Simulator</h1>
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
    </form>
    
    <div class="divider">
      <span>New to the tournament?</span>
    </div>
    
    <button @click="$emit('switch-to-register')" class="btn-secondary register-btn">
      <i class="fas fa-user-plus"></i>
      Create Account
    </button>
    
    <div class="demo-info">
      <div class="demo-badge">
        <i class="fas fa-info-circle"></i>
        Demo
      </div>
      <span>Username: <strong>admin</strong> • Password: <strong>admin</strong></span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LoginForm',
  data() {
    return {
      username: '',
      password: '',
      loading: false,
      error: ''
    }
  },
  methods: {
    async handleLogin() {
      this.loading = true
      this.error = ''
      
      try {
        const response = await fetch('http://localhost:3001/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: this.username,
            password: this.password
          })
        })
        
        const data = await response.json()
        
        if (response.ok) {
          this.$emit('login-success', data)
        } else {
          this.error = data.error || 'Login failed'
        }
      } catch (error) {
        this.error = 'Network error. Please try again.'
      } finally {
        this.loading = false
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

.demo-info {
  text-align: center;
  padding: 16px;
  background: linear-gradient(135deg, var(--fifa-gold), #FFE55C);
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  color: var(--fifa-dark-blue);
  position: relative;
  box-shadow: var(--shadow-sm);
}

.demo-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--fifa-dark-blue);
  color: var(--white);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
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