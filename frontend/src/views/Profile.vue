<template>
  <div class="profile">
    <AppHeader 
      :username="username" 
      :subscription-tier="user.subscriptionTier || 'basic'"
      :user-avatar="user.avatar"
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
              <div class="profile-avatar" @click="showAvatarModal">
                <img v-if="user.avatar && user.avatar.type === 'upload'" :src="user.avatar.url" alt="Profile" class="avatar-image" />
                <i v-else-if="user.avatar && user.avatar.type === 'predefined'" :class="user.avatar.icon" class="avatar-icon"></i>
                <i v-else class="fas fa-user-circle avatar-icon"></i>
                <div class="avatar-overlay">
                  <i class="fas fa-camera"></i>
                </div>
              </div>
              <div class="profile-details">
                <h1>{{ user.name }}</h1>
                <p class="username">@{{ user.username }}</p>
                <div class="subscription-badge">
                  <span :class="`tier-badge tier-${user.subscriptionTier || 'basic'}`">
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
                        <span :class="`tier-badge tier-${membershipStatus?.plan || 'free'}`">
                          {{ membershipStatus?.limits?.name || 'Free' }}
                        </span>
                        <span class="plan-price">
                          {{ membershipStatus?.limits?.price === 0 ? 'Free' : '$' + (membershipStatus?.limits?.price || 0) + '/month' }}
                        </span>
                      </div>
                      <p v-if="membershipStatus?.endDate" class="expiration-info">
                        Expires on {{ formatDate(membershipStatus.endDate) }}
                      </p>
                    </div>
                  </div>
                  
                  <!-- Membership Status -->
                  <div class="membership-status">
                    <h4>Membership Status</h4>
                    <div v-if="membershipStatus" class="membership-details">
                      <div class="usage-grid">
                        <div class="usage-item">
                          <h5>Tournaments</h5>
                          <div class="usage-bar">
                            <div class="usage-progress" :style="{ width: getTournamentUsagePercentage() + '%' }"></div>
                          </div>
                          <span class="usage-text">
                            {{ membershipStatus.usage.tournaments }} / {{ membershipStatus.limits.tournaments === -1 ? '∞' : membershipStatus.limits.tournaments }}
                          </span>
                        </div>
                        <div class="usage-item">
                          <h5>Worlds</h5>
                          <div class="usage-bar">
                            <div class="usage-progress" :style="{ width: getWorldUsagePercentage() + '%' }"></div>
                          </div>
                          <span class="usage-text">
                            {{ membershipStatus.usage.worlds }} / {{ membershipStatus.limits.worlds === -1 ? '∞' : membershipStatus.limits.worlds }}
                          </span>
                        </div>
                      </div>
                      <div v-if="membershipStatus.endDate" class="expiration-warning">
                        <i class="fas fa-clock"></i>
                        Your {{ membershipStatus.limits.name }} plan expires on {{ formatDate(membershipStatus.endDate) }}
                      </div>
                    </div>
                  </div>

                  <!-- Available Plans -->
                  <div class="subscription-tiers">
                    <h4>Available Plans</h4>
                    <div class="tiers-grid">
                      <div 
                        v-for="(plan, planKey) in availablePlans" 
                        :key="planKey"
                        class="tier-card"
                        :class="{ 
                          'current': planKey === (membershipStatus?.plan || 'free'),
                          'premium': planKey === 'football_maniac'
                        }"
                      >
                        <div class="tier-header">
                          <h5>{{ plan.name }}</h5>
                          <div class="tier-price">
                            <span class="price">${{ plan.price }}</span>
                            <span class="interval">{{ plan.price > 0 ? '/month' : '' }}</span>
                          </div>
                        </div>
                        <div class="tier-features">
                          <div v-if="plan.highlight" class="plan-highlight">
                            <i class="fas fa-star"></i>
                            {{ plan.highlight }}
                          </div>
                          <ul>
                            <li v-for="feature in plan.features" :key="feature">
                              <i class="fas fa-check"></i>
                              {{ feature }}
                            </li>
                          </ul>
                          <p class="plan-description">{{ plan.description }}</p>
                        </div>
                        <div class="tier-actions">
                          <button 
                            v-if="planKey !== (membershipStatus?.plan || 'free')"
                            @click="updateMembershipPlan(planKey)"
                            :disabled="updatingSubscription"
                            class="btn-primary tier-btn"
                          >
                            <i v-if="updatingSubscription" class="fas fa-spinner fa-spin"></i>
                            <span v-else>
                              {{ plan.price > getCurrentPlanPrice() ? 'Upgrade' : (plan.price < getCurrentPlanPrice() ? 'Downgrade' : 'Switch') }}
                            </span>
                          </button>
                          <span v-else class="current-plan-label">
                            <i class="fas fa-check"></i>
                            Current Plan
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Debug Controls (Admin Only) -->
                  <div v-if="isAdmin" class="debug-controls">
                    <h4>Debug Controls</h4>
                    <div class="debug-buttons">
                      <button @click="debugSetPlan('free')" class="btn-secondary debug-btn">
                        Set Free Plan
                      </button>
                      <button @click="debugSetPlan('pro')" class="btn-secondary debug-btn">
                        Set Pro Plan
                      </button>
                      <button @click="debugSetPlan('football_maniac')" class="btn-secondary debug-btn">
                        Set Football Maniac
                      </button>
                      <button @click="debugResetUsage()" class="btn-secondary debug-btn">
                        Reset Usage Counters
                      </button>
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
    
    <!-- Avatar Selection Modal -->
    <div v-if="showingAvatarModal" class="modal-overlay" @click.self="closeAvatarModal">
      <div class="modal glass-white avatar-modal">
        <div class="modal-header">
          <h2>Choose Your Avatar</h2>
          <button @click="closeAvatarModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-content">
          <!-- Avatar Type Tabs -->
          <div class="avatar-tabs">
            <button 
              @click="selectedAvatarType = 'predefined'" 
              class="tab-btn"
              :class="{ 'active': selectedAvatarType === 'predefined' }"
            >
              <i class="fas fa-icons"></i>
              Predefined Avatars
            </button>
            <button 
              @click="selectedAvatarType = 'upload'" 
              class="tab-btn"
              :class="{ 'active': selectedAvatarType === 'upload' }"
            >
              <i class="fas fa-upload"></i>
              Upload Photo
            </button>
          </div>
          
          <!-- Predefined Avatars -->
          <div v-if="selectedAvatarType === 'predefined'" class="predefined-avatars">
            <div class="avatars-grid">
              <div 
                v-for="avatar in predefinedAvatars" 
                :key="avatar.id"
                class="avatar-option"
                :class="{ 'selected': selectedAvatar?.id === avatar.id }"
                @click="selectPredefinedAvatar(avatar)"
              >
                <i :class="avatar.icon" :style="{ color: avatar.color }"></i>
              </div>
            </div>
          </div>
          
          <!-- Upload Photo -->
          <div v-else class="upload-section">
            <div class="upload-area">
              <input 
                type="file" 
                id="avatar-upload" 
                accept="image/*"
                @change="handleFileUpload"
                class="file-input"
              />
              <label for="avatar-upload" class="upload-label">
                <div v-if="uploadPreview" class="upload-preview">
                  <img :src="uploadPreview" alt="Preview" />
                </div>
                <div v-else class="upload-placeholder">
                  <i class="fas fa-cloud-upload-alt"></i>
                  <p>Click to upload image</p>
                  <span>Max size: 5MB</span>
                </div>
              </label>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="closeAvatarModal" class="btn-secondary modal-btn">
            Cancel
          </button>
          <button @click="updateAvatar" :disabled="updatingAvatar" class="btn-primary modal-btn">
            <i v-if="updatingAvatar" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-save"></i>
            {{ updatingAvatar ? 'Updating...' : 'Save Avatar' }}
          </button>
        </div>
        
        <p v-if="avatarError" class="error-message">{{ avatarError }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import AppHeader from '../components/AppHeader.vue'
import { API_URL } from '../config/api.js'

export default {
  name: 'Profile',
  components: {
    AppHeader
  },
  data() {
    return {
      username: '',
      user: {},
      membershipStatus: null,
      availablePlans: {},
      isAdmin: false,
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
      subscriptionSuccess: '',
      showingAvatarModal: false,
      selectedAvatarType: 'predefined',
      selectedAvatar: null,
      uploadedFile: null,
      uploadPreview: null,
      updatingAvatar: false,
      avatarError: '',
      predefinedAvatars: [
        { id: 1, icon: 'fas fa-user-astronaut', color: '#0066CC' },
        { id: 2, icon: 'fas fa-user-ninja', color: '#2E7D32' },
        { id: 3, icon: 'fas fa-user-secret', color: '#6A1B9A' },
        { id: 4, icon: 'fas fa-user-tie', color: '#424242' },
        { id: 5, icon: 'fas fa-user-graduate', color: '#1976D2' },
        { id: 6, icon: 'fas fa-user-md', color: '#D32F2F' },
        { id: 7, icon: 'fas fa-user-injured', color: '#F57C00' },
        { id: 8, icon: 'fas fa-football-ball', color: '#388E3C' },
        { id: 9, icon: 'fas fa-trophy', color: '#FBC02D' },
        { id: 10, icon: 'fas fa-medal', color: '#C0CA33' },
        { id: 11, icon: 'fas fa-flag-checkered', color: '#5D4037' },
        { id: 12, icon: 'fas fa-whistle', color: '#00ACC1' }
      ]
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
          this.loadMembershipStatus(),
          this.loadAvailablePlans()
        ])
        console.log('📊 Profile data loaded:', {
          user: this.user,
          membershipStatus: this.membershipStatus,
          availablePlans: this.availablePlans,
          isAdmin: this.isAdmin
        })
      } catch (error) {
        console.error('Error loading profile data:', error)
      } finally {
        this.loading = false
      }
    },
    
    async loadUserProfile() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          this.user = await response.json()
          this.isAdmin = this.user.username === 'admin'
          console.log('👤 User loaded:', this.user, 'isAdmin:', this.isAdmin)
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
    
    async loadMembershipStatus() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/membership/status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (response.ok) {
          const data = await response.json()
          this.membershipStatus = data.data
        }
      } catch (error) {
        console.error('Error loading membership status:', error)
      }
    },

    async loadAvailablePlans() {
      try {
        console.log('🔄 Loading available plans...')
        const response = await fetch('${API_URL}/membership/plans')
        console.log('📡 Plans API response:', response.status, response.ok)
        if (response.ok) {
          const data = await response.json()
          console.log('📋 Plans data received:', data)
          this.availablePlans = data.data
          console.log('✅ Plans loaded:', this.availablePlans)
        } else {
          console.error('❌ Plans API failed:', response.status, await response.text())
        }
      } catch (error) {
        console.error('Error loading available plans:', error)
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
        const response = await fetch(`${API_URL}/profile`, {
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
        const response = await fetch(`${API_URL}/profile/password`, {
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
    
    async updateMembershipPlan(plan) {
      this.updatingSubscription = true
      this.subscriptionError = ''
      this.subscriptionSuccess = ''
      
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/membership/upgrade`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            plan: plan
          })
        })
        
        const data = await response.json()
        
        if (response.ok) {
          this.subscriptionSuccess = data.message
          await this.loadMembershipStatus() // Reload membership status
        } else {
          this.subscriptionError = data.message || 'Failed to update membership'
        }
      } catch (error) {
        this.subscriptionError = 'Network error. Please try again.'
      } finally {
        this.updatingSubscription = false
      }
    },

    async debugSetPlan(plan) {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/membership/debug/set-plan`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            userId: this.user._id,
            plan: plan
          })
        })
        
        const data = await response.json()
        
        if (response.ok) {
          this.subscriptionSuccess = data.message
          await this.loadMembershipStatus()
        } else {
          this.subscriptionError = data.message || 'Failed to set debug plan'
        }
      } catch (error) {
        this.subscriptionError = 'Network error. Please try again.'
      }
    },

    async debugResetUsage() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/membership/debug/reset-usage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            userId: this.user._id
          })
        })
        
        const data = await response.json()
        
        if (response.ok) {
          this.subscriptionSuccess = data.message
          await this.loadMembershipStatus()
        } else {
          this.subscriptionError = data.message || 'Failed to reset usage'
        }
      } catch (error) {
        this.subscriptionError = 'Network error. Please try again.'
      }
    },

    getTournamentUsagePercentage() {
      if (!this.membershipStatus) return 0
      if (this.membershipStatus.limits.tournaments === -1) return 0 // Unlimited
      return Math.min(100, (this.membershipStatus.usage.tournaments / this.membershipStatus.limits.tournaments) * 100)
    },

    getWorldUsagePercentage() {
      if (!this.membershipStatus) return 0
      if (this.membershipStatus.limits.worlds === -1) return 0 // Unlimited
      return Math.min(100, (this.membershipStatus.usage.worlds / this.membershipStatus.limits.worlds) * 100)
    },

    getCurrentPlanPrice() {
      if (!this.membershipStatus || !this.availablePlans) return 0
      const currentPlan = this.availablePlans[this.membershipStatus.plan]
      return currentPlan ? currentPlan.price : 0
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
    },

    showAvatarModal() {
      this.showingAvatarModal = true
      this.avatarError = ''
      if (this.user.avatar) {
        this.selectedAvatarType = this.user.avatar.type
        if (this.user.avatar.type === 'predefined') {
          this.selectedAvatar = this.predefinedAvatars.find(a => a.icon === this.user.avatar.icon)
        }
      }
    },

    closeAvatarModal() {
      this.showingAvatarModal = false
      this.uploadedFile = null
      this.uploadPreview = null
      this.avatarError = ''
    },

    selectPredefinedAvatar(avatar) {
      this.selectedAvatar = avatar
    },

    handleFileUpload(event) {
      const file = event.target.files[0]
      if (!file) return

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.avatarError = 'File size must be less than 5MB'
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.avatarError = 'Please upload an image file'
        return
      }

      this.uploadedFile = file
      this.avatarError = ''

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        this.uploadPreview = e.target.result
      }
      reader.readAsDataURL(file)
    },

    async updateAvatar() {
      this.updatingAvatar = true
      this.avatarError = ''

      try {
        const token = localStorage.getItem('token')
        let response

        if (this.selectedAvatarType === 'predefined' && this.selectedAvatar) {
          // Update with predefined avatar
          response = await fetch(`${API_URL}/profile/avatar`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              type: 'predefined',
              avatarId: this.selectedAvatar.id,
              icon: this.selectedAvatar.icon,
              color: this.selectedAvatar.color
            })
          })
        } else if (this.selectedAvatarType === 'upload' && this.uploadedFile) {
          // Upload custom image
          const formData = new FormData()
          formData.append('avatar', this.uploadedFile)

          response = await fetch(`${API_URL}/profile/avatar/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          })
        } else {
          this.avatarError = 'Please select an avatar'
          return
        }

        const data = await response.json()

        if (response.ok) {
          this.user.avatar = data.avatar
          this.closeAvatarModal()
          this.profileSuccess = 'Avatar updated successfully'
        } else {
          this.avatarError = data.error || 'Failed to update avatar'
        }
      } catch (error) {
        this.avatarError = 'Network error. Please try again.'
      } finally {
        this.updatingAvatar = false
      }
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
  position: relative;
  width: 5rem;
  height: 5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.profile-avatar:hover {
  transform: scale(1.05);
}

.profile-avatar .avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.profile-avatar .avatar-icon {
  font-size: 5rem;
  color: var(--fifa-blue);
}

.avatar-overlay {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 28px;
  height: 28px;
  background: var(--fifa-blue);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  font-size: 0.8rem;
}

.profile-avatar:hover .avatar-overlay {
  opacity: 1;
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

.tier-badge.tier-free {
  background: rgba(108, 117, 125, 0.2);
  color: #6c757d;
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

/* Membership-specific styles */
.membership-status {
  margin-bottom: 32px;
}

.membership-details {
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.usage-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 20px;
}

.usage-item h5 {
  color: var(--fifa-dark-blue);
  margin-bottom: 8px;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.usage-bar {
  width: 100%;
  height: 8px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.usage-progress {
  height: 100%;
  background: linear-gradient(90deg, var(--fifa-blue), var(--fifa-green));
  transition: width 0.3s ease;
}

.usage-text {
  font-size: 0.8rem;
  color: var(--gray);
  font-weight: var(--font-weight-medium);
}

.expiration-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.2);
  border-radius: var(--radius-md);
  color: #ffc107;
  font-weight: var(--font-weight-medium);
  font-size: 0.9rem;
}

.tier-card.premium {
  border-color: #ffc107;
  background: rgba(255, 193, 7, 0.05);
}

.tier-features li {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: var(--fifa-dark-blue);
  font-size: 0.9rem;
}

.tier-features li i {
  width: 16px;
  font-size: 0.8rem;
}

.tier-features li i.fa-check {
  color: var(--fifa-green);
}

.tier-features li i.fa-times {
  color: var(--fifa-red);
}

.plan-description {
  margin-top: 12px;
  font-size: 0.85rem;
  color: var(--gray);
  font-style: italic;
}

.plan-highlight {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 193, 7, 0.1);
  color: #ffc107;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  font-size: 0.8rem;
  font-weight: var(--font-weight-bold);
  margin-bottom: 12px;
  text-align: center;
  justify-content: center;
}

.plan-highlight i {
  font-size: 0.7rem;
}

.debug-controls {
  margin-top: 32px;
  padding: 20px;
  background: rgba(255, 68, 68, 0.05);
  border: 1px solid rgba(255, 68, 68, 0.2);
  border-radius: var(--radius-lg);
}

.debug-controls h4 {
  color: var(--fifa-red);
  margin-bottom: 16px;
  font-size: 1rem;
}

.debug-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.debug-btn {
  padding: 8px 16px;
  font-size: 0.8rem;
  border-radius: var(--radius-md);
}

.btn-secondary {
  background: rgba(108, 117, 125, 0.1);
  color: #6c757d;
  border: 1px solid rgba(108, 117, 125, 0.3);
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: rgba(108, 117, 125, 0.2);
  border-color: rgba(108, 117, 125, 0.5);
}

/* Avatar Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal {
  width: 100%;
  max-width: 600px;
  border-radius: var(--radius-xl);
  position: relative;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 0 24px;
  margin-bottom: 24px;
}

.modal-header h2 {
  font-size: 1.5rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--gray);
  cursor: pointer;
  padding: 8px;
  border-radius: var(--radius-md);
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  color: var(--fifa-dark-blue);
}

.modal-content {
  padding: 0 24px 24px 24px;
}

.avatar-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.tab-btn {
  flex: 1;
  padding: 12px 20px;
  background: transparent;
  border: 2px solid rgba(0, 102, 204, 0.2);
  border-radius: var(--radius-md);
  color: var(--fifa-dark-blue);
  font-weight: var(--font-weight-semibold);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn.active {
  background: var(--fifa-blue);
  color: white;
  border-color: var(--fifa-blue);
}

.tab-btn:hover:not(.active) {
  background: rgba(0, 102, 204, 0.1);
  border-color: var(--fifa-blue);
}

.avatars-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 16px;
}

.avatar-option {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(0, 102, 204, 0.05);
  border: 3px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.avatar-option:hover {
  background: rgba(0, 102, 204, 0.1);
  transform: scale(1.1);
}

.avatar-option.selected {
  border-color: var(--fifa-blue);
  background: rgba(0, 102, 204, 0.2);
}

.avatar-option i {
  font-size: 2.5rem;
}

.upload-section {
  display: flex;
  justify-content: center;
}

.upload-area {
  width: 100%;
  max-width: 400px;
}

.file-input {
  display: none;
}

.upload-label {
  display: block;
  cursor: pointer;
}

.upload-preview {
  width: 200px;
  height: 200px;
  margin: 0 auto;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid var(--fifa-blue);
}

.upload-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-placeholder {
  width: 200px;
  height: 200px;
  margin: 0 auto;
  border: 3px dashed rgba(0, 102, 204, 0.3);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(0, 102, 204, 0.05);
  transition: all 0.3s ease;
}

.upload-placeholder:hover {
  background: rgba(0, 102, 204, 0.1);
  border-color: var(--fifa-blue);
}

.upload-placeholder i {
  font-size: 2.5rem;
  color: var(--fifa-blue);
}

.upload-placeholder p {
  color: var(--fifa-dark-blue);
  font-weight: var(--font-weight-semibold);
  margin: 0;
}

.upload-placeholder span {
  color: var(--gray);
  font-size: 0.8rem;
}

.modal-actions {
  display: flex;
  gap: 16px;
  margin-top: 0;
  padding: 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.modal-btn {
  flex: 1;
  height: 48px;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-semibold);
  transition: all 0.3s ease;
  cursor: pointer;
  border: none;
  padding: 12px 24px;
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
  
  .modal {
    max-width: 90%;
  }
  
  .avatars-grid {
    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  }
  
  .avatar-option {
    width: 60px;
    height: 60px;
  }
  
  .avatar-option i {
    font-size: 2rem;
  }
}
</style>