<template>
  <div class="admin-system">
    <div class="section-header">
      <h2>System Management</h2>
      <div class="system-status">
        <span class="status-indicator" :class="systemStatus.status">
          <i class="fas fa-circle"></i>
        </span>
        <span class="status-text">{{ systemStatus.text }}</span>
      </div>
    </div>

    <!-- System Operations -->
    <div class="operations-section">
      <h3>System Operations</h3>
      <div class="operations-grid">
        <div class="operation-card">
          <div class="operation-header">
            <i class="fas fa-broom"></i>
            <h4>Cleanup Operations</h4>
          </div>
          <p>Clean up expired memberships and inactive data</p>
          <button @click="cleanupExpired" :disabled="operations.cleanup" class="btn-operation">
            <i v-if="operations.cleanup" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-trash-alt"></i>
            {{ operations.cleanup ? 'Cleaning...' : 'Cleanup Expired' }}
          </button>
        </div>

        <div class="operation-card">
          <div class="operation-header">
            <i class="fas fa-database"></i>
            <h4>Database Maintenance</h4>
          </div>
          <p>Optimize database performance and rebuild indexes</p>
          <button @click="optimizeDatabase" :disabled="operations.optimize" class="btn-operation">
            <i v-if="operations.optimize" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-cogs"></i>
            {{ operations.optimize ? 'Optimizing...' : 'Optimize DB' }}
          </button>
        </div>

        <div class="operation-card">
          <div class="operation-header">
            <i class="fas fa-file-export"></i>
            <h4>Data Export</h4>
          </div>
          <p>Export system data for backup or analysis</p>
          <button @click="exportData" :disabled="operations.export" class="btn-operation">
            <i v-if="operations.export" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-download"></i>
            {{ operations.export ? 'Exporting...' : 'Export Data' }}
          </button>
        </div>

        <div class="operation-card">
          <div class="operation-header">
            <i class="fas fa-bell"></i>
            <h4>Send Notifications</h4>
          </div>
          <p>Send system-wide notifications to users</p>
          <button @click="openNotificationModal" class="btn-operation">
            <i class="fas fa-paper-plane"></i>
            Send Notification
          </button>
        </div>
      </div>
    </div>

    <!-- System Information -->
    <div class="info-section">
      <h3>System Information</h3>
      <div class="info-grid">
        <div class="info-card">
          <h4>Server Status</h4>
          <div class="info-items">
            <div class="info-item">
              <span class="info-label">Uptime:</span>
              <span class="info-value">{{ systemInfo.uptime }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Memory Usage:</span>
              <span class="info-value">{{ systemInfo.memory }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">CPU Usage:</span>
              <span class="info-value">{{ systemInfo.cpu }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Disk Space:</span>
              <span class="info-value">{{ systemInfo.disk }}</span>
            </div>
          </div>
        </div>

        <div class="info-card">
          <h4>Database Status</h4>
          <div class="info-items">
            <div class="info-item">
              <span class="info-label">Connection:</span>
              <span class="info-value status-good">Connected</span>
            </div>
            <div class="info-item">
              <span class="info-label">Size:</span>
              <span class="info-value">{{ systemInfo.dbSize }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Collections:</span>
              <span class="info-value">{{ systemInfo.collections }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Last Backup:</span>
              <span class="info-value">{{ systemInfo.lastBackup }}</span>
            </div>
          </div>
        </div>

        <div class="info-card">
          <h4>Application Info</h4>
          <div class="info-items">
            <div class="info-item">
              <span class="info-label">Version:</span>
              <span class="info-value">{{ systemInfo.version }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Environment:</span>
              <span class="info-value">{{ systemInfo.environment }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Node.js:</span>
              <span class="info-value">{{ systemInfo.nodeVersion }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Build:</span>
              <span class="info-value">{{ systemInfo.build }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- System Logs -->
    <div class="logs-section">
      <div class="logs-header">
        <h3>System Logs</h3>
        <div class="log-controls">
          <select v-model="logLevel" @change="filterLogs" class="log-filter">
            <option value="">All Levels</option>
            <option value="error">Errors</option>
            <option value="warning">Warnings</option>
            <option value="info">Info</option>
          </select>
          <button @click="refreshLogs" class="btn-refresh-logs">
            <i class="fas fa-sync-alt"></i>
            Refresh
          </button>
          <button @click="clearLogs" class="btn-clear-logs">
            <i class="fas fa-trash"></i>
            Clear
          </button>
        </div>
      </div>
      
      <div class="logs-container">
        <div v-for="log in filteredLogs" :key="log.id" :class="`log-entry level-${log.level}`">
          <div class="log-timestamp">{{ formatLogTime(log.timestamp) }}</div>
          <div class="log-level">{{ log.level.toUpperCase() }}</div>
          <div class="log-message">{{ log.message }}</div>
        </div>
      </div>
    </div>

    <!-- Notification Modal -->
    <div v-if="showNotificationModal" class="modal-overlay" @click.self="closeNotificationModal">
      <div class="modal notification-modal">
        <div class="modal-header">
          <h3>Send System Notification</h3>
          <button @click="closeNotificationModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-content">
          <form @submit.prevent="sendNotification">
            <div class="form-group">
              <label>Notification Type:</label>
              <select v-model="notificationForm.type" class="form-control">
                <option value="info">Information</option>
                <option value="warning">Warning</option>
                <option value="maintenance">Maintenance</option>
                <option value="update">Update</option>
              </select>
            </div>
            <div class="form-group">
              <label>Title:</label>
              <input v-model="notificationForm.title" type="text" class="form-control" required />
            </div>
            <div class="form-group">
              <label>Message:</label>
              <textarea v-model="notificationForm.message" class="form-control" rows="4" required></textarea>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input v-model="notificationForm.sendEmail" type="checkbox" />
                Also send via email
              </label>
            </div>
            <div class="form-actions">
              <button type="button" @click="closeNotificationModal" class="btn-secondary">Cancel</button>
              <button type="submit" :disabled="sendingNotification" class="btn-primary">
                <i v-if="sendingNotification" class="fas fa-spinner fa-spin"></i>
                {{ sendingNotification ? 'Sending...' : 'Send Notification' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { API_URL } from '../../config/api.js'

export default {
  name: 'AdminSystem',
  data() {
    return {
      systemStatus: {
        status: 'healthy',
        text: 'System Healthy'
      },
      systemInfo: {
        uptime: '15 days, 3 hours',
        memory: '2.4 GB / 8 GB',
        cpu: '23%',
        disk: '45.2 GB / 100 GB',
        dbSize: '856 MB',
        collections: '12',
        lastBackup: '2 hours ago',
        version: '1.2.3',
        environment: 'Production',
        nodeVersion: 'v18.17.0',
        build: '#2024.01.15'
      },
      operations: {
        cleanup: false,
        optimize: false,
        export: false
      },
      logs: [
        {
          id: 1,
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
          level: 'info',
          message: 'User admin logged in successfully'
        },
        {
          id: 2,
          timestamp: new Date(Date.now() - 1000 * 60 * 15),
          level: 'warning',
          message: 'High memory usage detected: 85%'
        },
        {
          id: 3,
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          level: 'error',
          message: 'Failed to connect to external API service'
        },
        {
          id: 4,
          timestamp: new Date(Date.now() - 1000 * 60 * 45),
          level: 'info',
          message: 'Database backup completed successfully'
        },
        {
          id: 5,
          timestamp: new Date(Date.now() - 1000 * 60 * 60),
          level: 'info',
          message: 'New user registered: john_doe'
        }
      ],
      logLevel: '',
      showNotificationModal: false,
      notificationForm: {
        type: 'info',
        title: '',
        message: '',
        sendEmail: false
      },
      sendingNotification: false
    }
  },
  computed: {
    filteredLogs() {
      if (!this.logLevel) return this.logs
      return this.logs.filter(log => log.level === this.logLevel)
    }
  },
  methods: {
    async cleanupExpired() {
      this.operations.cleanup = true
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/admin/system/cleanup-expired`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          alert(`Cleanup completed: ${data.data.expiredCount} expired memberships processed`)
        }
      } catch (error) {
        console.error('Error during cleanup:', error)
        alert('Cleanup operation failed')
      } finally {
        this.operations.cleanup = false
      }
    },

    async optimizeDatabase() {
      this.operations.optimize = true
      try {
        // Simulate database optimization
        await new Promise(resolve => setTimeout(resolve, 3000))
        alert('Database optimization completed successfully')
      } catch (error) {
        console.error('Error during optimization:', error)
        alert('Database optimization failed')
      } finally {
        this.operations.optimize = false
      }
    },

    async exportData() {
      this.operations.export = true
      try {
        // Simulate data export
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Create and download a dummy file
        const data = {
          exportDate: new Date().toISOString(),
          users: 'User data would be here',
          tournaments: 'Tournament data would be here',
          worlds: 'World data would be here'
        }
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `system-export-${new Date().toISOString().split('T')[0]}.json`
        link.click()
        window.URL.revokeObjectURL(url)
        
        alert('Data export completed successfully')
      } catch (error) {
        console.error('Error during export:', error)
        alert('Data export failed')
      } finally {
        this.operations.export = false
      }
    },

    openNotificationModal() {
      this.showNotificationModal = true
      this.notificationForm = {
        type: 'info',
        title: '',
        message: '',
        sendEmail: false
      }
    },

    closeNotificationModal() {
      this.showNotificationModal = false
    },

    async sendNotification() {
      this.sendingNotification = true
      try {
        // Simulate sending notification
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        alert(`Notification "${this.notificationForm.title}" sent successfully!`)
        this.closeNotificationModal()
      } catch (error) {
        console.error('Error sending notification:', error)
        alert('Failed to send notification')
      } finally {
        this.sendingNotification = false
      }
    },

    filterLogs() {
      // Logs are filtered via computed property
    },

    refreshLogs() {
      // Simulate refreshing logs
      const newLog = {
        id: this.logs.length + 1,
        timestamp: new Date(),
        level: 'info',
        message: 'Logs refreshed by admin'
      }
      this.logs.unshift(newLog)
    },

    clearLogs() {
      if (confirm('Are you sure you want to clear all logs?')) {
        this.logs = []
      }
    },

    formatLogTime(timestamp) {
      return timestamp.toLocaleTimeString()
    }
  }
}
</script>

<style scoped>
.admin-system {
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

.system-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-indicator {
  font-size: 0.8rem;
}

.status-indicator.healthy {
  color: #28a745;
}

.status-indicator.warning {
  color: #ffc107;
}

.status-indicator.error {
  color: #dc3545;
}

.status-text {
  font-weight: 500;
  color: #495057;
}

.operations-section,
.info-section {
  margin-bottom: 2rem;
}

.operations-section h3,
.info-section h3 {
  margin: 0 0 1.5rem 0;
  color: #2c3e50;
  font-size: 1.25rem;
}

.operations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.operation-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  text-align: center;
}

.operation-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.operation-header i {
  font-size: 2rem;
  color: #007bff;
}

.operation-header h4 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.operation-card p {
  color: #6c757d;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.btn-operation {
  width: 100%;
  padding: 0.75rem 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-operation:hover:not(:disabled) {
  background: #0056b3;
}

.btn-operation:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.info-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.info-card h4 {
  margin: 0 0 1rem 0;
  color: #495057;
  font-size: 1.1rem;
}

.info-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  color: #6c757d;
  font-size: 0.9rem;
}

.info-value {
  font-weight: 500;
  color: #2c3e50;
}

.info-value.status-good {
  color: #28a745;
}

.logs-section {
  margin-bottom: 2rem;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.logs-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.25rem;
}

.log-controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.log-filter {
  padding: 0.375rem 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.875rem;
}

.btn-refresh-logs,
.btn-clear-logs {
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.btn-refresh-logs {
  background: #17a2b8;
  color: white;
}

.btn-clear-logs {
  background: #dc3545;
  color: white;
}

.logs-container {
  background: #2c3e50;
  border-radius: 8px;
  padding: 1rem;
  max-height: 400px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
}

.log-entry {
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: 1rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.875rem;
}

.log-entry:last-child {
  border-bottom: none;
}

.log-timestamp {
  color: #adb5bd;
  font-size: 0.8rem;
}

.log-level {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.8rem;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
}

.level-info .log-level {
  background: #17a2b8;
  color: white;
}

.level-warning .log-level {
  background: #ffc107;
  color: #212529;
}

.level-error .log-level {
  background: #dc3545;
  color: white;
}

.log-message {
  color: #ffffff;
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
}

.modal {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #dee2e6;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #6c757d;
}

.modal-content {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #495057;
}

.form-control {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: 0.5rem;
  font-weight: normal !important;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.btn-primary, .btn-secondary {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .operations-grid {
    grid-template-columns: 1fr;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .logs-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .log-controls {
    flex-wrap: wrap;
  }
  
  .log-entry {
    grid-template-columns: 1fr;
    gap: 0.25rem;
  }
}
</style>