<template>
  <header class="header glass">
    <div class="header-top">
      <div class="brand-section">
        <div class="logo">
          <i class="fas fa-futbol"></i>
        </div>
      </div>
      
      <button class="mobile-menu-toggle" @click="mobileMenuOpen = !mobileMenuOpen">
        <i :class="mobileMenuOpen ? 'fas fa-times' : 'fas fa-bars'"></i>
      </button>
      
      <nav class="navigation desktop-nav">
        <router-link to="/dashboard" class="nav-link" :class="{ active: $route.path === '/dashboard' }">
          <i class="fas fa-home"></i>
          Dashboard
        </router-link>
        <router-link to="/worlds" class="nav-link" :class="{ active: $route.path.startsWith('/worlds') }">
          <i class="fas fa-globe"></i>
          Worlds
        </router-link>
        <router-link to="/tournaments" class="nav-link" :class="{ active: $route.path.startsWith('/tournament') }">
          <i class="fas fa-trophy"></i>
          Tournament
        </router-link>
      </nav>
      
      <div class="user-section desktop-user">
        <div class="user-info clickable" @click="goToProfile">
          <div class="user-avatar">
            <template v-if="userAvatar && userAvatar.type === 'predefined'">
              <i :class="userAvatar.icon" :style="{ color: userAvatar.color }"></i>
            </template>
            <template v-else-if="userAvatar && userAvatar.type === 'upload' && userAvatar.url">
              <img :src="getAvatarUrl(userAvatar)" alt="User Avatar" class="avatar-image" />
            </template>
            <template v-else>
              {{ username.charAt(0).toUpperCase() }}
            </template>
          </div>
          <div class="user-details">
            <span class="username">{{ username }}</span>
            <span class="user-role">{{ formatSubscriptionTier(subscriptionTier) }}</span>
          </div>
          <div class="membership-badge" :class="`badge-${subscriptionTier}`">
            <i v-if="subscriptionTier === 'pro'" class="fas fa-crown"></i>
            <i v-else class="fas fa-user"></i>
          </div>
        </div>
        
        <!-- Upgrade Button for Basic Users -->
        <button 
          v-if="subscriptionTier === 'basic'" 
          @click="goToUpgrade" 
          class="upgrade-btn"
          title="Upgrade to Pro"
        >
          <i class="fas fa-crown"></i>
          <span class="desktop-text">Upgrade to Pro</span>
          <span class="mobile-text">Pro</span>
        </button>
        
        <button @click="handleLogout" class="logout-btn">
          <i class="fas fa-sign-out-alt"></i>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
    
    <nav class="mobile-nav" :class="{ open: mobileMenuOpen }">
      <router-link to="/dashboard" class="nav-link" :class="{ active: $route.path === '/dashboard' }" @click="mobileMenuOpen = false">
        <i class="fas fa-home"></i>
        Dashboard
      </router-link>
      <router-link to="/worlds" class="nav-link" :class="{ active: $route.path.startsWith('/worlds') }" @click="mobileMenuOpen = false">
        <i class="fas fa-globe"></i>
        Worlds
      </router-link>
      <router-link to="/tournaments" class="nav-link" :class="{ active: $route.path.startsWith('/tournament') }" @click="mobileMenuOpen = false">
        <i class="fas fa-trophy"></i>
        Tournament
      </router-link>
      <router-link to="/profile" class="nav-link" :class="{ active: $route.path === '/profile' }" @click="mobileMenuOpen = false">
        <i class="fas fa-user"></i>
        Profile
      </router-link>
      <button @click="handleLogout" class="logout-btn mobile-logout">
        <i class="fas fa-sign-out-alt"></i>
        Sign Out
      </button>
    </nav>
  </header>
</template>

<script>
import { API_BASE_URL } from '../config/api.js'

export default {
  name: 'AppHeader',
  props: {
    username: {
      type: String,
      required: true
    },
    subscriptionTier: {
      type: String,
      default: 'basic'
    },
    userAvatar: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      mobileMenuOpen: false
    }
  },
  methods: {
    handleLogout() {
      this.mobileMenuOpen = false
      this.$emit('logout')
    },
    goToProfile() {
      this.$router.push('/profile')
    },
    goToUpgrade() {
      this.$emit('show-payment-modal')
    },
    formatSubscriptionTier(tier) {
      const tierNames = {
        'basic': 'Basic',
        'pro': 'Pro'
      }
      return tierNames[tier] || tier
    },
    getAvatarUrl(avatar) {
      if (!avatar || avatar.type !== 'upload' || !avatar.url) return ''
      // If the URL already starts with http, return as is
      if (avatar.url.startsWith('http')) return avatar.url
      // Otherwise, prepend the API base URL
      return `${API_BASE_URL}${avatar.url}`
    }
  },
  watch: {
    '$route'() {
      this.mobileMenuOpen = false
    }
  }
}
</script>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid var(--glass-border);
  background: rgba(0, 51, 102, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  transition: all 0.3s ease;
  color: white;
}

.header-top {
  padding: 16px 36px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--header-height, 66px);
  box-sizing: border-box;
}

.brand-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo {
  font-size: 2.5rem;
  color: var(--white);
}

.brand-text h1 {
  color: var(--white);
  margin: 0;
  font-size: 1.5rem;
  font-weight: var(--font-weight-bold);
  background: linear-gradient(135deg, var(--white), var(--fifa-gold));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.tagline {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.8rem;
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.desktop-nav {
  display: flex;
  gap: 32px;
}

.mobile-menu-toggle {
  display: none;
  background: transparent;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 8px;
}

.mobile-nav {
  display: none;
  flex-direction: column;
  padding: 0;
  background: transparent;
  backdrop-filter: none;
  border-top: none;
  max-height: 0;
  overflow: hidden;
  transition: all 0.3s ease;
}

.mobile-nav.open {
  max-height: 400px;
  padding: 16px;
  background: rgba(0, 51, 102, 0.95);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.mobile-nav .nav-link {
  width: 100%;
  justify-content: flex-start;
  padding: 12px 16px;
  margin: 4px 0;
}

.mobile-logout {
  width: 100%;
  margin-top: 16px;
}

.desktop-user {
  display: flex;
  align-items: center;
  gap: 20px;
}

.nav-link {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-weight: var(--font-weight-medium);
  padding: 8px 16px;
  border-radius: var(--radius-md);
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-link:hover {
  color: var(--white);
  background: rgba(255, 255, 255, 0.1);
}

.nav-link.active {
  color: var(--fifa-gold);
  background: rgba(255, 215, 0, 0.1);
}

.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  background: var(--fifa-gold);
  border-radius: 50%;
}

.user-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
}

.user-info.clickable {
  cursor: pointer;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  transition: all 0.3s ease;
}

.user-info.clickable:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-1px);
}

.membership-badge {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: bold;
  margin-left: 8px;
}

.badge-basic {
  background: linear-gradient(135deg, #6c757d, #495057);
  color: white;
}

.badge-pro {
  background: linear-gradient(135deg, #ffd700, #ffed4a);
  color: #333;
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
}

.membership-badge i {
  font-size: 0.8rem;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--fifa-blue), var(--fifa-light-blue));
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--white);
  font-weight: var(--font-weight-bold);
  font-size: 1.1rem;
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.user-avatar .avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.user-avatar i {
  font-size: 1.5rem;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.username {
  color: var(--white);
  font-weight: var(--font-weight-semibold);
  font-size: 0.9rem;
}

.user-role {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
  font-weight: var(--font-weight-medium);
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.1);
  color: var(--white);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: var(--font-weight-medium);
  backdrop-filter: blur(10px);
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

/* Upgrade Button Styles */
.upgrade-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: linear-gradient(135deg, #FF6B35, #F7931E, #FFD700);
  background-size: 200% 200%;
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.4s ease;
  font-weight: var(--font-weight-bold);
  font-size: 0.95rem;
  text-decoration: none;
  margin-right: 12px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  box-shadow: 0 4px 15px rgba(255, 107, 53, 0.4);
  animation: header-pulse 3s ease-in-out infinite alternate;
  position: relative;
  z-index: 1;
}

@keyframes header-pulse {
  0% {
    box-shadow: 0 4px 15px rgba(255, 107, 53, 0.4);
    background-position: 0% 50%;
  }
  100% {
    box-shadow: 0 6px 20px rgba(255, 107, 53, 0.5);
    background-position: 100% 50%;
  }
}

.upgrade-btn:hover {
  background: linear-gradient(135deg, #FF8A65, #FFB74D, #FFF176);
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 8px 25px rgba(255, 107, 53, 0.5);
  animation: none;
}

.upgrade-btn:active {
  transform: translateY(-1px) scale(1.02);
}

.upgrade-btn i {
  font-size: 1rem;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

.upgrade-btn::before {
  content: '';
  position: absolute;
  top: -1px;
  left: -1px;
  right: -1px;
  bottom: -1px;
  background: linear-gradient(45deg, #FF6B35, #F7931E, #FFD700, #FF6B35);
  background-size: 300% 300%;
  border-radius: var(--radius-lg);
  z-index: -1;
  animation: header-gradient-border 2.5s ease infinite;
  opacity: 0.6;
}

@keyframes header-gradient-border {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.upgrade-btn .desktop-text {
  display: inline;
}

.upgrade-btn .mobile-text {
  display: none;
}

@media (max-width: 1024px) {
  .desktop-nav {
    display: none;
  }
  
  .desktop-user {
    display: none;
  }
  
  .mobile-menu-toggle {
    display: block;
  }
  
  .mobile-nav {
    display: flex;
  }
  
  .header-top {
    padding: 12px 24px;
  }
}

@media (max-width: 768px) {
  .header-top {
    padding: 12px 16px;
    height: 60px;
  }
  
  .logo {
    font-size: 1.75rem;
  }
  
  /* Border is now handled by the .open state */
  
  .logout-btn span {
    display: inline;
  }
  
  /* Mobile upgrade button styles */
  .upgrade-btn .desktop-text {
    display: none;
  }
  
  .upgrade-btn .mobile-text {
    display: inline;
  }
  
  .upgrade-btn {
    padding: 8px 14px;
    font-size: 0.85rem;
    gap: 6px;
  }
  
  .upgrade-btn i {
    font-size: 0.9rem;
  }
}
</style>