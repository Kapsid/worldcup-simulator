<template>
  <div class="admin-dashboard">
    <div class="admin-header">
      <div class="admin-title">
        <h1><i class="fas fa-shield-alt"></i> Admin Dashboard</h1>
        <p>System administration and management</p>
      </div>
      <div class="admin-actions">
        <button @click="refreshData" :disabled="loading" class="btn-refresh">
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
          Refresh
        </button>
        <button @click="logout" class="btn-logout">
          <i class="fas fa-sign-out-alt"></i>
          Logout
        </button>
      </div>
    </div>

    <div v-if="loading && !dashboardData" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      Loading dashboard...
    </div>

    <div v-else class="admin-content">
      <!-- Overview Cards -->
      <div class="overview-grid">
        <div class="stat-card">
          <div class="stat-icon users">
            <i class="fas fa-users"></i>
          </div>
          <div class="stat-info">
            <h3>{{ dashboardData?.overview?.totalUsers || 0 }}</h3>
            <p>Total Users</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon tournaments">
            <i class="fas fa-trophy"></i>
          </div>
          <div class="stat-info">
            <h3>{{ dashboardData?.overview?.totalTournaments || 0 }}</h3>
            <p>Tournaments</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon worlds">
            <i class="fas fa-globe"></i>
          </div>
          <div class="stat-info">
            <h3>{{ dashboardData?.overview?.totalWorlds || 0 }}</h3>
            <p>Worlds</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon memberships">
            <i class="fas fa-credit-card"></i>
          </div>
          <div class="stat-info">
            <h3>{{ dashboardData?.overview?.activeMemberships || 0 }}</h3>
            <p>Active Plans</p>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="admin-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="['tab-btn', { active: activeTab === tab.id }]"
        >
          <i :class="tab.icon"></i>
          {{ tab.name }}
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Users Tab -->
        <div v-if="activeTab === 'users'" class="admin-section">
          <AdminUsers />
        </div>

        <!-- Membership Tab -->
        <div v-if="activeTab === 'membership'" class="admin-section">
          <AdminMembership />
        </div>

        <!-- Content Tab -->
        <div v-if="activeTab === 'content'" class="admin-section">
          <AdminContent />
        </div>

        <!-- Data Management Tab -->
        <div v-if="activeTab === 'data'" class="admin-section">
          <AdminDataManagement />
        </div>

        <!-- Analytics Tab -->
        <div v-if="activeTab === 'analytics'" class="admin-section">
          <AdminAnalytics />
        </div>

        <!-- System Tab -->
        <div v-if="activeTab === 'system'" class="admin-section">
          <AdminSystem />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AdminUsers from '../components/admin/AdminUsers.vue'
import AdminMembership from '../components/admin/AdminMembership.vue'
import AdminContent from '../components/admin/AdminContent.vue'
import AdminDataManagement from '../components/admin/AdminDataManagement.vue'
import AdminAnalytics from '../components/admin/AdminAnalytics.vue'
import AdminSystem from '../components/admin/AdminSystem.vue'
import { API_URL } from '../config/api.js'

export default {
  name: 'AdminDashboard',
  components: {
    AdminUsers,
    AdminMembership,
    AdminContent,
    AdminDataManagement,
    AdminAnalytics,
    AdminSystem
  },
  data() {
    return {
      loading: false,
      activeTab: 'users',
      dashboardData: null,
      tabs: [
        { id: 'users', name: 'Users', icon: 'fas fa-users' },
        { id: 'membership', name: 'Memberships', icon: 'fas fa-credit-card' },
        { id: 'content', name: 'Content', icon: 'fas fa-folder' },
        { id: 'data', name: 'Data Management', icon: 'fas fa-database' },
        { id: 'analytics', name: 'Analytics', icon: 'fas fa-chart-bar' },
        { id: 'system', name: 'System', icon: 'fas fa-cogs' }
      ]
    }
  },
  mounted() {
    this.checkAdminAccess()
    this.loadDashboard()
  },
  methods: {
    checkAdminAccess() {
      const token = localStorage.getItem('token')
      if (!token) {
        this.$router.push('/')
        return
      }
      
      // Additional admin check could be done here
    },

    async loadDashboard() {
      this.loading = true
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/admin/dashboard`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          this.dashboardData = data.data
        } else if (response.status === 403) {
          alert('Admin access required')
          this.$router.push('/')
        } else {
          console.error('Failed to load dashboard')
        }
      } catch (error) {
        console.error('Error loading dashboard:', error)
      } finally {
        this.loading = false
      }
    },

    async refreshData() {
      await this.loadDashboard()
    },

    logout() {
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      this.$router.push('/')
    }
  }
}
</script>

<style scoped>
.admin-dashboard {
  min-height: 100vh;
  background: #f8f9fa;
  padding: 0;
}

.admin-header {
  background: #2c3e50;
  color: white;
  padding: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.admin-title h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  font-weight: 600;
}

.admin-title p {
  margin: 0;
  opacity: 0.8;
  font-size: 1rem;
}

.admin-actions {
  display: flex;
  gap: 1rem;
}

.btn-refresh, .btn-logout {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-refresh {
  background: #3498db;
  color: white;
}

.btn-refresh:hover:not(:disabled) {
  background: #2980b9;
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-logout {
  background: #e74c3c;
  color: white;
}

.btn-logout:hover {
  background: #c0392b;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  color: #6c757d;
  font-size: 1.1rem;
}

.loading-state i {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.admin-content {
  padding: 2rem;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
}

.stat-icon.users { background: #3498db; }
.stat-icon.tournaments { background: #f39c12; }
.stat-icon.worlds { background: #27ae60; }
.stat-icon.memberships { background: #9b59b6; }

.stat-info h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.75rem;
  font-weight: 600;
  color: #2c3e50;
}

.stat-info p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.admin-tabs {
  display: flex;
  background: white;
  border-radius: 8px;
  padding: 0.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow-x: auto;
}

.tab-btn {
  flex: 1;
  padding: 1rem 1.5rem;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #6c757d;
  transition: all 0.2s;
  white-space: nowrap;
}

.tab-btn:hover {
  background: #f8f9fa;
  color: #495057;
}

.tab-btn.active {
  background: #007bff;
  color: white;
}

.tab-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.admin-section {
  padding: 2rem;
}

@media (max-width: 768px) {
  .admin-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .admin-content {
    padding: 1rem;
  }
  
  .overview-grid {
    grid-template-columns: 1fr;
  }
  
  .admin-tabs {
    flex-direction: column;
  }
  
  .tab-btn {
    justify-content: flex-start;
  }
}
</style>