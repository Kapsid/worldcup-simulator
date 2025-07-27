<template>
  <div class="admin-analytics">
    <div class="section-header">
      <h2>Analytics & Insights</h2>
      <button @click="loadAnalytics" :disabled="loading" class="btn-refresh">
        <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
        Refresh
      </button>
    </div>

    <div v-if="loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i> Loading analytics...
    </div>

    <div v-else class="analytics-dashboard">
      <!-- Key Metrics Overview -->
      <div class="metrics-section">
        <h3>Platform Overview</h3>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-icon users">
              <i class="fas fa-users"></i>
            </div>
            <div class="metric-info">
              <span class="metric-value">{{ analytics?.userStats?.total || 0 }}</span>
              <span class="metric-label">Total Users</span>
              <span class="metric-change">{{ analytics?.userStats?.newThisWeek || 0 }} this week</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon content">
              <i class="fas fa-trophy"></i>
            </div>
            <div class="metric-info">
              <span class="metric-value">{{ analytics?.contentStats?.tournaments || 0 }}</span>
              <span class="metric-label">Tournaments</span>
              <span class="metric-change">{{ analytics?.contentStats?.activeTournaments || 0 }} active</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon worlds">
              <i class="fas fa-globe"></i>
            </div>
            <div class="metric-info">
              <span class="metric-value">{{ analytics?.contentStats?.worlds || 0 }}</span>
              <span class="metric-label">Worlds</span>
              <span class="metric-change">{{ analytics?.contentStats?.activeWorlds || 0 }} active</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon revenue">
              <i class="fas fa-dollar-sign"></i>
            </div>
            <div class="metric-info">
              <span class="metric-value">{{ analytics?.revenueStats?.monthly || 0 }}</span>
              <span class="metric-label">Monthly Revenue</span>
              <span class="metric-change">{{ analytics?.revenueStats?.activePaid || 0 }} paid users</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Usage Statistics -->
      <div class="usage-section">
        <h3>Usage Statistics</h3>
        <div class="usage-grid">
          <div class="usage-chart">
            <h4>Content Creation by Plan</h4>
            <div class="chart-placeholder">
              <div class="plan-usage-bars">
                <div v-for="plan in planUsageData" :key="plan.plan" class="usage-bar-item">
                  <div class="usage-bar-info">
                    <span class="plan-name">{{ formatPlan(plan.plan) }}</span>
                    <span class="usage-count">{{ plan.totalContent }} items</span>
                  </div>
                  <div class="usage-bar-container">
                    <div 
                      class="usage-bar" 
                      :style="{ width: `${(plan.totalContent / maxPlanContent) * 100}%` }"
                      :class="`plan-${plan.plan}`"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="activity-timeline">
            <h4>Recent Activity</h4>
            <div class="timeline">
              <div v-for="activity in recentActivity" :key="activity.id" class="timeline-item">
                <div class="timeline-icon" :class="activity.type">
                  <i :class="activity.icon"></i>
                </div>
                <div class="timeline-content">
                  <div class="timeline-title">{{ activity.title }}</div>
                  <div class="timeline-details">{{ activity.details }}</div>
                  <div class="timeline-time">{{ formatTimeAgo(activity.timestamp) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Performance Metrics -->
      <div class="performance-section">
        <h3>Performance Metrics</h3>
        <div class="performance-grid">
          <div class="performance-card">
            <h4>User Engagement</h4>
            <div class="engagement-stats">
              <div class="engagement-item">
                <span class="engagement-label">Daily Active Users</span>
                <span class="engagement-value">{{ analytics?.engagement?.daily || 0 }}</span>
              </div>
              <div class="engagement-item">
                <span class="engagement-label">Weekly Active Users</span>
                <span class="engagement-value">{{ analytics?.engagement?.weekly || 0 }}</span>
              </div>
              <div class="engagement-item">
                <span class="engagement-label">Avg. Session Duration</span>
                <span class="engagement-value">{{ analytics?.engagement?.avgSession || '0m' }}</span>
              </div>
              <div class="engagement-item">
                <span class="engagement-label">Bounce Rate</span>
                <span class="engagement-value">{{ analytics?.engagement?.bounceRate || '0%' }}</span>
              </div>
            </div>
          </div>

          <div class="performance-card">
            <h4>Content Performance</h4>
            <div class="content-performance">
              <div class="performance-item">
                <span class="performance-label">Avg. Tournaments per User</span>
                <span class="performance-value">{{ analytics?.performance?.avgTournaments || 0 }}</span>
              </div>
              <div class="performance-item">
                <span class="performance-label">Completion Rate</span>
                <span class="performance-value">{{ analytics?.performance?.completionRate || '0%' }}</span>
              </div>
              <div class="performance-item">
                <span class="performance-label">Most Popular Type</span>
                <span class="performance-value">{{ analytics?.performance?.popularType || 'Manual' }}</span>
              </div>
            </div>
          </div>

          <div class="performance-card">
            <h4>System Health</h4>
            <div class="system-health">
              <div class="health-item">
                <span class="health-label">Server Uptime</span>
                <span class="health-value good">99.9%</span>
              </div>
              <div class="health-item">
                <span class="health-label">Database Performance</span>
                <span class="health-value good">Excellent</span>
              </div>
              <div class="health-item">
                <span class="health-label">Error Rate</span>
                <span class="health-value good">0.1%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminAnalytics',
  data() {
    return {
      analytics: null,
      loading: false,
      recentActivity: [
        {
          id: 1,
          type: 'user',
          icon: 'fas fa-user-plus',
          title: 'New User Registration',
          details: 'john_doe joined the platform',
          timestamp: new Date(Date.now() - 1000 * 60 * 15) // 15 minutes ago
        },
        {
          id: 2,
          type: 'tournament',
          icon: 'fas fa-trophy',
          title: 'Tournament Created',
          details: 'World Cup 2026 by admin',
          timestamp: new Date(Date.now() - 1000 * 60 * 45) // 45 minutes ago
        },
        {
          id: 3,
          type: 'membership',
          icon: 'fas fa-credit-card',
          title: 'Plan Upgrade',
          details: 'user123 upgraded to Pro',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
        },
        {
          id: 4,
          type: 'world',
          icon: 'fas fa-globe',
          title: 'World Created',
          details: 'Football Universe 2024 by player1',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4) // 4 hours ago
        }
      ]
    }
  },
  computed: {
    planUsageData() {
      if (!this.analytics?.planUsage) {
        return [
          { plan: 'free', totalContent: 45 },
          { plan: 'pro', totalContent: 23 },
          { plan: 'football_maniac', totalContent: 12 }
        ]
      }
      return this.analytics.planUsage
    },
    
    maxPlanContent() {
      return Math.max(...this.planUsageData.map(p => p.totalContent))
    }
  },
  mounted() {
    this.loadAnalytics()
  },
  methods: {
    async loadAnalytics() {
      this.loading = true
      try {
        // Simulate loading analytics data
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        this.analytics = {
          userStats: {
            total: 1247,
            newThisWeek: 23,
            active: 892
          },
          contentStats: {
            tournaments: 3456,
            worlds: 1892,
            activeTournaments: 234,
            activeWorlds: 567
          },
          revenueStats: {
            monthly: 1850,
            activePaid: 89
          },
          engagement: {
            daily: 345,
            weekly: 892,
            avgSession: '23m',
            bounceRate: '24%'
          },
          performance: {
            avgTournaments: 2.8,
            completionRate: '73%',
            popularType: 'Manual'
          },
          planUsage: [
            { plan: 'free', totalContent: 2890 },
            { plan: 'pro', totalContent: 1234 },
            { plan: 'football_maniac', totalContent: 567 }
          ]
        }
      } catch (error) {
        console.error('Error loading analytics:', error)
      } finally {
        this.loading = false
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

    formatTimeAgo(timestamp) {
      const now = new Date()
      const diffMs = now - timestamp
      const diffMins = Math.floor(diffMs / (1000 * 60))
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

      if (diffMins < 60) {
        return `${diffMins}m ago`
      } else if (diffHours < 24) {
        return `${diffHours}h ago`
      } else {
        return `${diffDays}d ago`
      }
    }
  }
}
</script>

<style scoped>
.admin-analytics {
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

.loading {
  text-align: center;
  padding: 3rem;
  color: #6c757d;
}

.analytics-dashboard {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.metrics-section h3,
.usage-section h3,
.performance-section h3 {
  margin: 0 0 1.5rem 0;
  color: #2c3e50;
  font-size: 1.25rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.metric-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.metric-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
}

.metric-icon.users { background: #007bff; }
.metric-icon.content { background: #28a745; }
.metric-icon.worlds { background: #17a2b8; }
.metric-icon.revenue { background: #ffc107; color: #212529; }

.metric-info {
  display: flex;
  flex-direction: column;
}

.metric-value {
  font-size: 1.75rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.metric-label {
  font-size: 0.9rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.metric-change {
  font-size: 0.8rem;
  color: #28a745;
  font-weight: 500;
}

.usage-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.usage-chart,
.activity-timeline {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.usage-chart h4,
.activity-timeline h4 {
  margin: 0 0 1rem 0;
  color: #495057;
  font-size: 1.1rem;
}

.plan-usage-bars {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.usage-bar-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.usage-bar-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.plan-name {
  font-weight: 500;
  color: #2c3e50;
}

.usage-count {
  font-size: 0.9rem;
  color: #6c757d;
}

.usage-bar-container {
  height: 20px;
  background: #f8f9fa;
  border-radius: 10px;
  overflow: hidden;
}

.usage-bar {
  height: 100%;
  border-radius: 10px;
  transition: width 0.3s ease;
}

.usage-bar.plan-free { background: #6c757d; }
.usage-bar.plan-pro { background: #007bff; }
.usage-bar.plan-football_maniac { background: #ffc107; }

.timeline {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.timeline-item {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.timeline-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  color: white;
  flex-shrink: 0;
}

.timeline-icon.user { background: #007bff; }
.timeline-icon.tournament { background: #28a745; }
.timeline-icon.membership { background: #ffc107; color: #212529; }
.timeline-icon.world { background: #17a2b8; }

.timeline-content {
  flex: 1;
}

.timeline-title {
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.timeline-details {
  color: #6c757d;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.timeline-time {
  color: #adb5bd;
  font-size: 0.8rem;
}

.performance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.performance-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.performance-card h4 {
  margin: 0 0 1rem 0;
  color: #495057;
  font-size: 1.1rem;
}

.engagement-stats,
.content-performance,
.system-health {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.engagement-item,
.performance-item,
.health-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f8f9fa;
}

.engagement-item:last-child,
.performance-item:last-child,
.health-item:last-child {
  border-bottom: none;
}

.engagement-label,
.performance-label,
.health-label {
  color: #6c757d;
  font-size: 0.9rem;
}

.engagement-value,
.performance-value,
.health-value {
  font-weight: 600;
  color: #2c3e50;
}

.health-value.good {
  color: #28a745;
}

.health-value.warning {
  color: #ffc107;
}

.health-value.danger {
  color: #dc3545;
}

@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .usage-grid {
    grid-template-columns: 1fr;
  }
  
  .performance-grid {
    grid-template-columns: 1fr;
  }
  
  .metric-card {
    flex-direction: column;
    text-align: center;
  }
  
  .timeline-item {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
}
</style>