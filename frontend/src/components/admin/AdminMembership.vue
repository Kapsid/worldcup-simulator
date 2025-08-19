<template>
  <div class="admin-membership">
    <div class="section-header">
      <h2>Membership Analytics</h2>
      <button @click="loadAnalytics" :disabled="loading" class="btn-refresh">
        <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
        Refresh
      </button>
    </div>

    <div v-if="loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i> Loading analytics...
    </div>

    <div v-else-if="analytics" class="analytics-content">
      <!-- Plan Distribution -->
      <div class="analytics-grid">
        <div class="analytics-card">
          <h3>Plan Distribution</h3>
          <div class="plan-stats">
            <div v-for="plan in analytics.byPlan" :key="plan._id" class="plan-stat">
              <div class="plan-info">
                <span :class="`plan-badge ${plan._id}`">{{ formatPlan(plan._id) }}</span>
                <span class="plan-count">{{ plan.count }} users</span>
              </div>
              <div class="plan-usage">
                <small>{{ plan.totalTournaments }} tournaments, {{ plan.totalWorlds }} worlds</small>
              </div>
            </div>
          </div>
        </div>

        <div class="analytics-card">
          <h3>Membership Summary</h3>
          <div class="summary-stats">
            <div class="summary-item">
              <span class="summary-value">{{ analytics.totals.totalUsers }}</span>
              <span class="summary-label">Total Users</span>
            </div>
            <div class="summary-item">
              <span class="summary-value">{{ analytics.totals.activeUsers }}</span>
              <span class="summary-label">Active Members</span>
            </div>
            <div class="summary-item">
              <span class="summary-value">{{ analytics.totals.expiredUsers }}</span>
              <span class="summary-label">Expired</span>
            </div>
          </div>
        </div>

        <div class="analytics-card">
          <h3>Usage Statistics</h3>
          <div class="usage-stats" v-if="analytics.usageStats">
            <div class="usage-item">
              <span class="usage-label">Total Content Created</span>
              <div class="usage-numbers">
                <span class="usage-number">{{ analytics.usageStats.totalTournaments || 0 }} tournaments</span>
                <span class="usage-number">{{ analytics.usageStats.totalWorlds || 0 }} worlds</span>
              </div>
            </div>
            <div class="usage-item">
              <span class="usage-label">Average per User</span>
              <div class="usage-numbers">
                <span class="usage-number">{{ (analytics.usageStats.avgTournaments || 0).toFixed(1) }} tournaments</span>
                <span class="usage-number">{{ (analytics.usageStats.avgWorlds || 0).toFixed(1) }} worlds</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Upgrades -->
      <div class="section">
        <h3>Recent Upgrades</h3>
        <div class="table-container">
          <table class="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Upgraded</th>
                <th>Expires</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="upgrade in analytics.recentUpgrades" :key="upgrade._id">
                <td class="user-cell">
                  <strong>{{ upgrade.user?.name || 'Unknown' }}</strong>
                  <small>@{{ upgrade.user?.username || 'unknown' }}</small>
                </td>
                <td>
                  <span :class="`membership-badge ${upgrade.plan}`">
                    {{ formatPlan(upgrade.plan) }}
                  </span>
                </td>
                <td>
                  <span :class="`status-badge ${upgrade.status}`">
                    {{ upgrade.status }}
                  </span>
                </td>
                <td class="date-cell">{{ formatDate(upgrade.updatedAt) }}</td>
                <td class="date-cell">
                  {{ upgrade.endDate ? formatDate(upgrade.endDate) : 'Never' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Expiring Memberships -->
      <div class="section" v-if="analytics.expiringMemberships.length > 0">
        <h3>Expiring Soon</h3>
        <div class="table-container">
          <table class="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Plan</th>
                <th>Expires</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="membership in analytics.expiringMemberships" :key="membership._id">
                <td class="user-cell">
                  <strong>{{ membership.user?.name || 'Unknown' }}</strong>
                  <small>@{{ membership.user?.username || 'unknown' }}</small>
                </td>
                <td>
                  <span :class="`membership-badge ${membership.plan}`">
                    {{ formatPlan(membership.plan) }}
                  </span>
                </td>
                <td class="date-cell expiring">
                  {{ formatDate(membership.endDate) }}
                  <small class="expires-in">({{ getExpiresIn(membership.endDate) }})</small>
                </td>
                <td>
                  <button @click="extendMembership(membership)" class="btn-action extend">
                    <i class="fas fa-calendar-plus"></i>
                    Extend
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { API_URL } from '../../config/api.js'

export default {
  name: 'AdminMembership',
  data() {
    return {
      analytics: null,
      loading: false
    }
  },
  mounted() {
    this.loadAnalytics()
  },
  methods: {
    async loadAnalytics() {
      this.loading = true
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/admin/membership/analytics`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          this.analytics = data.data
        }
      } catch (error) {
        console.error('Error loading membership analytics:', error)
      } finally {
        this.loading = false
      }
    },

    async extendMembership(membership) {
      if (!confirm(`Extend membership for ${membership.user?.name}?`)) return

      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/admin/users/${membership.user}/membership`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            plan: membership.plan // This will reset the expiration date
          })
        })

        if (response.ok) {
          await this.loadAnalytics()
        }
      } catch (error) {
        console.error('Error extending membership:', error)
      }
    },

    formatPlan(plan) {
      const plans = {
        free: 'Free',
        pro: 'Pro',
        football_maniac: 'Football Maniac'
      }
      return plans[plan] || plan
    },

    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString()
    },

    getExpiresIn(dateString) {
      const expireDate = new Date(dateString)
      const now = new Date()
      const diffTime = expireDate - now
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays < 0) return 'Expired'
      if (diffDays === 0) return 'Today'
      if (diffDays === 1) return 'Tomorrow'
      return `${diffDays} days`
    }
  }
}
</script>

<style scoped>
.admin-membership {
  padding: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #dee2e6;
}

.section-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.5rem;
}

.btn-refresh {
  padding: 0.5rem 1rem;
  background: #17a2b8;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.btn-refresh:hover:not(:disabled) {
  background: #138496;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #6c757d;
}

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.analytics-card {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.analytics-card h3 {
  margin: 0 0 1rem 0;
  color: #495057;
  font-size: 1.1rem;
}

.plan-stats {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.plan-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.plan-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.plan-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.plan-badge.free {
  background: #e9ecef;
  color: #6c757d;
}

.plan-badge.pro {
  background: #cce5ff;
  color: #0056b3;
}

.plan-badge.football_maniac {
  background: #fff3cd;
  color: #856404;
}

.plan-count {
  font-weight: 600;
  color: #2c3e50;
}

.plan-usage {
  font-size: 0.8rem;
  color: #6c757d;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 1rem;
}

.summary-item {
  text-align: center;
  padding: 1rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.summary-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 600;
  color: #007bff;
  margin-bottom: 0.25rem;
}

.summary-label {
  font-size: 0.85rem;
  color: #6c757d;
}

.usage-stats {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.usage-item {
  padding: 1rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.usage-label {
  display: block;
  font-weight: 600;
  color: #495057;
  margin-bottom: 0.5rem;
}

.usage-numbers {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.usage-number {
  color: #007bff;
  font-weight: 500;
}

.section {
  margin-bottom: 2rem;
}

.section h3 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.25rem;
}

.table-container {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  font-size: 0.9rem;
}

.admin-table th {
  background: #f8f9fa;
  padding: 1rem 0.75rem;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
}

.admin-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #dee2e6;
  vertical-align: middle;
}

.admin-table tr:hover {
  background: #f8f9fa;
}

.user-cell strong {
  display: block;
  color: #2c3e50;
}

.user-cell small {
  color: #6c757d;
  font-size: 0.85rem;
}

.membership-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.active {
  background: #d4edda;
  color: #155724;
}

.status-badge.cancelled {
  background: #f8d7da;
  color: #721c24;
}

.status-badge.expired {
  background: #fff3cd;
  color: #856404;
}

.date-cell {
  color: #6c757d;
  font-size: 0.85rem;
}

.date-cell.expiring {
  color: #856404;
  font-weight: 500;
}

.expires-in {
  display: block;
  color: #dc3545;
  font-weight: 600;
}

.btn-action {
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.btn-action.extend {
  background: #28a745;
  color: white;
}

.btn-action:hover {
  opacity: 0.9;
}

@media (max-width: 768px) {
  .analytics-grid {
    grid-template-columns: 1fr;
  }
  
  .summary-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .plan-stat {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .admin-table {
    font-size: 0.8rem;
  }
  
  .admin-table th,
  .admin-table td {
    padding: 0.5rem;
  }
}
</style>