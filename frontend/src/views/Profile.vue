<template>
  <div class="profile">
    <AppHeader 
      :username="username" 
      :subscription-tier="user.subscriptionTier || 'basic'"
      @logout="handleLogout" 
    />
    
    <main class="main-content">
      <div class="profile-container">
        <div v-if="loading" class="loading-state">
          <i class="fas fa-spinner fa-spin"></i>
          Loading profile...
        </div>
        
        <div v-else class="profile-content">
          <!-- Profile Header -->
          <div class="profile-header glass-white">
            <div class="back-navigation">
              <button @click="$router.push('/dashboard')" class="back-btn">
                <i class="fas fa-arrow-left"></i>
                Back to Dashboard
              </button>
            </div>
            
            <div class="profile-info">
              <div class="profile-avatar">
                <i class="fas fa-user-circle"></i>
              </div>
              <div class="profile-details">
                <h1>{{ user.name }}</h1>
                <p class="username">@{{ user.username }}</p>
                <div class="subscription-badge">
                  <span :class="`tier-badge tier-${user.subscriptionTier}`">
                    {{ formatSubscriptionTier(user.subscriptionTier) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Profile Content -->
          <div class="profile-sections">
            <div class="sections-grid">
              <!-- Profile Settings -->
              <div class="section-card glass-white">
                <div class="section-header">
                  <h3>Profile Settings</h3>
                  <i class="fas fa-user-edit"></i>
                </div>
                <div class="section-content">
                  <form @submit.prevent="updateProfile" class="profile-form">
                    <div class="form-group">
                      <label for="name">Full Name</label>
                      <input 
                        type="text" 
                        id="name"
                        v-model="profileForm.name" 
                        required
                        minlength="2"
                        class="input"
                        :class="{ 'error': profileErrors.name }"
                      />
                      <span v-if="profileErrors.name" class="field-error">{{ profileErrors.name }}</span>
                    </div>
                    
                    <div class="form-group">
                      <label for="username">Username</label>
                      <input 
                        type="text" 
                        id="username"
                        v-model="profileForm.username" 
                        required
                        minlength="3"
                        class="input"
                        :class="{ 'error': profileErrors.username }"
                      />
                      <span v-if="profileErrors.username" class="field-error">{{ profileErrors.username }}</span>
                    </div>
                    
                    <div class="form-group">
                      <label for="email">Email Address</label>
                      <input 
                        type="email" 
                        id="email"
                        v-model="profileForm.email" 
                        class="input"
                        :class="{ 'error': profileErrors.email }"
                        placeholder="Optional"
                      />
                      <span v-if="profileErrors.email" class="field-error">{{ profileErrors.email }}</span>
                    </div>
                    
                    <div class="form-actions">
                      <button type="submit" :disabled="updatingProfile" class="btn-primary">
                        <i v-if="updatingProfile" class="fas fa-spinner fa-spin"></i>
                        <i v-else class="fas fa-save"></i>
                        {{ updatingProfile ? 'Saving...' : 'Save Profile' }}
                      </button>
                    </div>
                    
                    <p v-if="profileError" class="error-message">{{ profileError }}</p>
                    <p v-if="profileSuccess" class="success-message">{{ profileSuccess }}</p>
                  </form>
                </div>
              </div>
              
              <!-- Password Settings -->
              <div class="section-card glass-white">
                <div class="section-header">
                  <h3>Change Password</h3>
                  <i class="fas fa-lock"></i>
                </div>
                <div class="section-content">
                  <form @submit.prevent="updatePassword" class="password-form">
                    <div class="form-group">
                      <label for="currentPassword">Current Password</label>
                      <input 
                        type="password" 
                        id="currentPassword"
                        v-model="passwordForm.currentPassword" 
                        required
                        class="input"
                        :class="{ 'error': passwordErrors.currentPassword }"
                      />
                      <span v-if="passwordErrors.currentPassword" class="field-error">{{ passwordErrors.currentPassword }}</span>
                    </div>
                    
                    <div class="form-group">
                      <label for="newPassword">New Password</label>
                      <input 
                        type="password" 
                        id="newPassword"
                        v-model="passwordForm.newPassword" 
                        required
                        minlength="6"
                        class="input"
                        :class="{ 'error': passwordErrors.newPassword }"
                      />
                      <span v-if="passwordErrors.newPassword" class="field-error">{{ passwordErrors.newPassword }}</span>
                    </div>
                    
                    <div class="form-group">
                      <label for="confirmPassword">Confirm New Password</label>
                      <input 
                        type="password" 
                        id="confirmPassword"
                        v-model="passwordForm.confirmPassword" 
                        required
                        class="input"
                        :class="{ 'error': passwordErrors.confirmPassword }"
                      />
                      <span v-if="passwordErrors.confirmPassword" class="field-error">{{ passwordErrors.confirmPassword }}</span>
                    </div>
                    
                    <div class="form-actions">
                      <button type="submit" :disabled="updatingPassword" class="btn-primary">
                        <i v-if="updatingPassword" class="fas fa-spinner fa-spin"></i>
                        <i v-else class="fas fa-key"></i>
                        {{ updatingPassword ? 'Updating...' : 'Update Password' }}
                      </button>
                    </div>
                    
                    <p v-if="passwordError" class="error-message">{{ passwordError }}</p>
                    <p v-if="passwordSuccess" class="success-message">{{ passwordSuccess }}</p>
                  </form>
                </div>
              </div>
              
              <!-- Subscription Settings -->
              <div class="section-card glass-white full-width">
                <div class="section-header">
                  <h3>Subscription Management</h3>
                  <i class="fas fa-credit-card"></i>
                </div>
                <div class="section-content">
                  <div class="current-subscription">
                    <div class="subscription-info">
                      <h4>Current Plan</h4>
                      <div class="plan-display">
                        <span :class="`tier-badge tier-${user.subscriptionTier}`">
                          {{ formatSubscriptionTier(user.subscriptionTier) }}
                        </span>
                        <span class="plan-price">
                          {{ getSubscriptionPrice(user.subscriptionTier) }}
                        </span>
                      </div>
                      <p v-if="user.subscriptionExpiresAt" class="expiration-info">
                        Expires on {{ formatDate(user.subscriptionExpiresAt) }}
                      </p>
                    </div>
                  </div>
                  
                  <div class="subscription-tiers">
                    <h4>Available Plans</h4>
                    <div class="tiers-grid">
                      <div 
                        v-for="tier in subscriptionTiers" 
                        :key="tier.id"
                        class="tier-card"
                        :class="{ 'current': tier.id === user.subscriptionTier }"
                      >
                        <div class="tier-header">
                          <h5>{{ tier.name }}</h5>
                          <div class="tier-price">
                            <span class="price">${{ tier.price }}</span>
                            <span class="interval">{{ tier.price > 0 ? '/month' : '' }}</span>
                          </div>
                        </div>
                        <div v-if="tier.features && tier.features.length > 0" class="tier-features">
                          <ul>
                            <li v-for="feature in tier.features" :key="feature">
                              {{ feature }}
                            </li>
                          </ul>
                        </div>
                        <div class="tier-actions">
                          <button 
                            v-if="tier.id !== user.subscriptionTier"
                            @click="updateSubscription(tier.id)"
                            :disabled="updatingSubscription"
                            class="btn-primary tier-btn"
                          >
                            <i v-if="updatingSubscription" class="fas fa-spinner fa-spin"></i>
                            <span v-else>
                              {{ tier.price > 0 ? 'Upgrade' : 'Downgrade' }}
                            </span>
                          </button>
                          <span v-else class="current-plan-label">Current Plan</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <p v-if="subscriptionError" class="error-message">{{ subscriptionError }}</p>
                  <p v-if="subscriptionSuccess" class="success-message">{{ subscriptionSuccess }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import AppHeader from '../components/AppHeader.vue'

export default {
  name: 'Profile',
  components: {
    AppHeader
  },
  data() {
    return {
      username: '',
      user: {},
      subscriptionTiers: [],
      loading: false,
      updatingProfile: false,
      updatingPassword: false,
      updatingSubscription: false,
      profileForm: {
        name: '',
        username: '',
        email: ''
      },
      passwordForm: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      profileErrors: {},
      passwordErrors: {},
      profileError: '',
      passwordError: '',
      subscriptionError: '',
      profileSuccess: '',
      passwordSuccess: '',
      subscriptionSuccess: ''
    }
  },
  mounted() {
    this.username = localStorage.getItem('username') || 'User'
    
    // Check if user is authenticated
    const token = localStorage.getItem('token')
    if (!token) {
      this.$router.push('/')
      return
    }
    
    this.loadProfileData()
  },
  methods: {
    async loadProfileData() {
      this.loading = true
      try {
        await Promise.all([
          this.loadUserProfile(),
          this.loadSubscriptionTiers()
        ])
      } catch (error) {
        console.error('Error loading profile data:', error)
      } finally {
        this.loading = false
      }
    },
    
    async loadUserProfile() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('http://localhost:3001/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          this.user = await response.json()
          this.profileForm = {
            name: this.user.name || '',
            username: this.user.username || '',
            email: this.user.email || ''
          }
        }
      } catch (error) {
        console.error('Error loading user profile:', error)
      }
    },
    
    async loadSubscriptionTiers() {
      try {
        const response = await fetch('http://localhost:3001/api/profile/subscription-tiers')
        if (response.ok) {
          this.subscriptionTiers = await response.json()
        }
      } catch (error) {
        console.error('Error loading subscription tiers:', error)
      }
    },
    
    validateProfileForm() {
      this.profileErrors = {}
      
      if (!this.profileForm.name || this.profileForm.name.length < 2) {
        this.profileErrors.name = 'Name must be at least 2 characters long'
      }
      
      if (!this.profileForm.username || this.profileForm.username.length < 3) {
        this.profileErrors.username = 'Username must be at least 3 characters long'
      }
      
      if (this.profileForm.email && this.profileForm.email.length > 0) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(this.profileForm.email)) {
          this.profileErrors.email = 'Invalid email format'
        }
      }
      
      return Object.keys(this.profileErrors).length === 0
    },
    
    validatePasswordForm() {
      this.passwordErrors = {}
      
      if (!this.passwordForm.currentPassword) {
        this.passwordErrors.currentPassword = 'Current password is required'
      }
      
      if (!this.passwordForm.newPassword || this.passwordForm.newPassword.length < 6) {
        this.passwordErrors.newPassword = 'New password must be at least 6 characters long'
      }
      
      if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
        this.passwordErrors.confirmPassword = 'Passwords do not match'
      }
      
      return Object.keys(this.passwordErrors).length === 0
    },
    
    async updateProfile() {
      if (!this.validateProfileForm()) {
        return
      }
      
      this.updatingProfile = true
      this.profileError = ''
      this.profileSuccess = ''
      
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('http://localhost:3001/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(this.profileForm)
        })
        
        const data = await response.json()
        
        if (response.ok) {
          this.user = data.user
          this.profileSuccess = data.message
          // Update stored username if it changed
          if (this.profileForm.username !== this.username) {
            localStorage.setItem('username', this.profileForm.username)
            this.username = this.profileForm.username
          }
        } else {
          this.profileError = data.error || 'Failed to update profile'
        }
      } catch (error) {
        this.profileError = 'Network error. Please try again.'
      } finally {
        this.updatingProfile = false
      }
    },
    
    async updatePassword() {
      if (!this.validatePasswordForm()) {
        return
      }
      
      this.updatingPassword = true
      this.passwordError = ''
      this.passwordSuccess = ''
      
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('http://localhost:3001/api/profile/password', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            currentPassword: this.passwordForm.currentPassword,
            newPassword: this.passwordForm.newPassword
          })
        })
        
        const data = await response.json()
        
        if (response.ok) {
          this.passwordSuccess = data.message
          this.passwordForm = {
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          }
        } else {
          this.passwordError = data.error || 'Failed to update password'
        }
      } catch (error) {
        this.passwordError = 'Network error. Please try again.'
      } finally {
        this.updatingPassword = false
      }
    },
    
    async updateSubscription(tier) {
      this.updatingSubscription = true
      this.subscriptionError = ''
      this.subscriptionSuccess = ''
      
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('http://localhost:3001/api/profile/subscription', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            subscriptionTier: tier
          })
        })
        
        const data = await response.json()
        
        if (response.ok) {
          this.user = data.user
          this.subscriptionSuccess = data.message
        } else {
          this.subscriptionError = data.error || 'Failed to update subscription'
        }
      } catch (error) {
        this.subscriptionError = 'Network error. Please try again.'
      } finally {
        this.updatingSubscription = false
      }
    },
    
    formatSubscriptionTier(tier) {
      const tierNames = {
        'basic': 'Basic',
        'pro': 'Pro',
        'football_maniac': 'Football Maniac'
      }
      return tierNames[tier] || tier
    },
    
    getSubscriptionPrice(tier) {
      const tierData = this.subscriptionTiers.find(t => t.id === tier)
      if (!tierData) return ''
      
      if (tierData.price === 0) return 'Free'
      return `$${tierData.price}/month`
    },
    
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString()
    },
    
    handleLogout() {
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      this.$router.push('/')
    }
  }
}
</script>

<style scoped>
.profile {
  min-height: 100vh;
  background: linear-gradient(135deg, #0066CC 0%, #003366 100%);
}

.main-content {
  padding: 2rem;
  display: flex;
  justify-content: center;
}

.profile-container {
  width: 100%;
  max-width: 1200px;
}

.loading-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--white);
}

.loading-state i {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.profile-header {
  padding: 32px;
  border-radius: var(--radius-xl);
  margin-bottom: 24px;
}

.back-navigation {
  margin-bottom: 24px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  color: var(--fifa-blue);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  padding: 8px 0;
  transition: all 0.3s ease;
}

.back-btn:hover {
  color: var(--fifa-dark-blue);
}

.profile-info {
  display: flex;
  align-items: center;
  gap: 24px;
}

.profile-avatar {
  font-size: 5rem;
  color: var(--fifa-blue);
}

.profile-details h1 {
  font-size: 2.5rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
  margin: 0 0 8px 0;
}

.username {
  color: var(--gray);
  font-size: 1.1rem;
  margin: 0 0 16px 0;
}

.subscription-badge {
  display: inline-block;
}

.tier-badge {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tier-badge.tier-basic {
  background: rgba(108, 117, 125, 0.2);
  color: #6c757d;
}

.tier-badge.tier-pro {
  background: rgba(0, 123, 255, 0.2);
  color: #007bff;
}

.tier-badge.tier-football_maniac {
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
}

.profile-sections {
  margin-top: 24px;
}

.sections-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.section-card {
  padding: 24px;
  border-radius: var(--radius-xl);
}

.section-card.full-width {
  grid-column: 1 / -1;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  font-size: 1.25rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
  margin: 0;
}

.section-header i {
  color: var(--fifa-blue);
  font-size: 1.25rem;
}

.profile-form, .password-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
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
  font-weight: var(--font-weight-medium);
}

.form-actions {
  margin-top: 8px;
}

.form-actions button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
}

.current-subscription {
  margin-bottom: 32px;
}

.subscription-info h4 {
  color: var(--fifa-dark-blue);
  margin-bottom: 12px;
}

.plan-display {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 8px;
}

.plan-price {
  font-size: 1.25rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
}

.expiration-info {
  color: var(--gray);
  font-size: 0.9rem;
  margin: 0;
}

.subscription-tiers h4 {
  color: var(--fifa-dark-blue);
  margin-bottom: 20px;
}

.tiers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.tier-card {
  padding: 24px;
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid transparent;
  transition: all 0.3s ease;
  position: relative;
}

.tier-card.current {
  border-color: var(--fifa-blue);
  background: rgba(0, 102, 204, 0.1);
}


.tier-header {
  margin-bottom: 20px;
}

.tier-header h5 {
  font-size: 1.5rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
  margin: 0 0 8px 0;
}

.tier-price {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.price {
  font-size: 2rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-blue);
}

.interval {
  color: var(--gray);
  font-size: 0.9rem;
}

.tier-features ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tier-features li {
  margin-bottom: 8px;
  color: var(--fifa-dark-blue);
  font-size: 0.9rem;
  padding-left: 0;
}

.tier-actions {
  margin-top: 20px;
}

.tier-btn {
  width: 100%;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.current-plan-label {
  display: block;
  text-align: center;
  color: var(--fifa-blue);
  font-weight: var(--font-weight-bold);
  padding: 12px;
  background: rgba(0, 102, 204, 0.1);
  border-radius: var(--radius-md);
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

.success-message {
  color: var(--fifa-green);
  text-align: center;
  margin-top: 16px;
  padding: 12px;
  background: rgba(40, 167, 69, 0.1);
  border-radius: var(--radius-md);
  border: 1px solid rgba(40, 167, 69, 0.2);
  font-weight: var(--font-weight-medium);
}

@media (max-width: 768px) {
  .main-content {
    padding: 1rem;
  }
  
  .profile-header {
    padding: 24px;
  }
  
  .profile-info {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
  
  .profile-avatar {
    font-size: 4rem;
  }
  
  .profile-details h1 {
    font-size: 2rem;
  }
  
  .sections-grid {
    grid-template-columns: 1fr;
  }
  
  .tiers-grid {
    grid-template-columns: 1fr;
  }
}
</style>