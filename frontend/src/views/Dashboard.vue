<template>
  <div class="dashboard">
    <AppHeader 
      :username="username" 
      :subscription-tier="subscriptionTier"
      @logout="handleLogout" 
    />
    
    <main class="main-content">
      <WelcomeSection :username="username" />
    </main>
  </div>
</template>

<script>
import AppHeader from '../components/AppHeader.vue'
import WelcomeSection from '../components/WelcomeSection.vue'
import api from '../services/api.js'

export default {
  name: 'Dashboard',
  components: {
    AppHeader,
    WelcomeSection
  },
  data() {
    return {
      username: '',
      subscriptionTier: 'basic'
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
    
    this.loadUserProfile()
  },
  methods: {
    async loadUserProfile() {
      try {
        const { data: user } = await api.profile.get()
        this.subscriptionTier = user.subscriptionTier || 'basic'
      } catch (error) {
        console.error('Error loading user profile:', error)
      }
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
.dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #0066CC 0%, #003366 100%);
}

.main-content {
  padding: 2rem;
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .main-content {
    padding: 1rem;
  }
}
</style>