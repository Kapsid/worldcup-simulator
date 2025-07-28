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
          <div class="user-avatar">{{ username.charAt(0).toUpperCase() }}</div>
          <div class="user-details">
            <span class="username">{{ username }}</span>
            <span class="user-role">{{ formatSubscriptionTier(subscriptionTier) }}</span>
          </div>
        </div>
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
    formatSubscriptionTier(tier) {
      const tierNames = {
        'basic': 'Basic',
        'pro': 'Pro',
        'football_maniac': 'Football Maniac'
      }
      return tierNames[tier] || tier
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
  padding: 16px;
  background: rgba(0, 51, 102, 0.95);
  backdrop-filter: blur(20px);
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.mobile-nav.open {
  max-height: 400px;
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
  
  .mobile-nav {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .logout-btn span {
    display: inline;
  }
}
</style>