<template>
  <div class="backup-manager">
    <div class="manager-header">
      <div class="header-left">
        <h3><i class="fas fa-download"></i> Backup & Restore</h3>
        <p>Create backups and restore data files</p>
      </div>
      <div class="header-actions">
        <button @click="createBackup" :disabled="creating" class="btn-backup">
          <i class="fas fa-download" :class="{ 'fa-spin': creating }"></i>
          {{ creating ? 'Creating...' : 'Create Backup' }}
        </button>
      </div>
    </div>

    <!-- Backup Actions -->
    <div class="backup-actions">
      <div class="action-card">
        <div class="action-icon backup">
          <i class="fas fa-shield-alt"></i>
        </div>
        <div class="action-content">
          <h4>Create Data Backup</h4>
          <p>Generate a complete backup of all data files including countries, cities, confederations, tactics, history, and player names.</p>
          <button @click="createBackup" :disabled="creating" class="btn-action-primary">
            <i class="fas fa-download"></i>
            Create New Backup
          </button>
        </div>
      </div>

      <div class="action-card">
        <div class="action-icon restore">
          <i class="fas fa-upload"></i>
        </div>
        <div class="action-content">
          <h4>Restore from Backup</h4>
          <p>Upload and restore data from a previously created backup file. This will overwrite all current data.</p>
          <div class="restore-section">
            <input 
              ref="fileInput"
              type="file" 
              accept=".json"
              @change="handleFileSelect"
              style="display: none"
            />
            <button @click="$refs.fileInput.click()" class="btn-action-secondary">
              <i class="fas fa-file-upload"></i>
              Select Backup File
            </button>
            <button 
              v-if="selectedFile" 
              @click="restoreBackup" 
              :disabled="restoring"
              class="btn-action-warning"
            >
              <i class="fas fa-exclamation-triangle"></i>
              {{ restoring ? 'Restoring...' : 'Restore Data' }}
            </button>
          </div>
          <div v-if="selectedFile" class="selected-file">
            <i class="fas fa-file-alt"></i>
            <span>{{ selectedFile.name }}</span>
            <button @click="clearSelectedFile" class="btn-clear-file">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Data Overview -->
    <div class="data-overview">
      <h4><i class="fas fa-info-circle"></i> Current Data Overview</h4>
      <div class="overview-grid" v-if="overview">
        <div class="overview-item">
          <div class="overview-icon countries">
            <i class="fas fa-flag"></i>
          </div>
          <div class="overview-details">
            <span class="overview-count">{{ overview.countries?.count || 0 }}</span>
            <span class="overview-label">Countries</span>
          </div>
        </div>
        
        <div class="overview-item">
          <div class="overview-icon confederations">
            <i class="fas fa-globe"></i>
          </div>
          <div class="overview-details">
            <span class="overview-count">{{ overview.confederations?.count || 0 }}</span>
            <span class="overview-label">Confederations</span>
          </div>
        </div>
        
        <div class="overview-item">
          <div class="overview-icon cities">
            <i class="fas fa-city"></i>
          </div>
          <div class="overview-details">
            <span class="overview-count">{{ overview.cities?.count || 0 }}</span>
            <span class="overview-label">Cities</span>
          </div>
        </div>
        
        <div class="overview-item">
          <div class="overview-icon tactics">
            <i class="fas fa-chess"></i>
          </div>
          <div class="overview-details">
            <span class="overview-count">{{ overview.tactics?.count || 0 }}</span>
            <span class="overview-label">Formations</span>
          </div>
        </div>
        
        <div class="overview-item">
          <div class="overview-icon history">
            <i class="fas fa-history"></i>
          </div>
          <div class="overview-details">
            <span class="overview-count">{{ overview.worldCupHistory?.count || 0 }}</span>
            <span class="overview-label">World Cups</span>
          </div>
        </div>
        
        <div class="overview-item">
          <div class="overview-icon players">
            <i class="fas fa-users"></i>
          </div>
          <div class="overview-details">
            <span class="overview-count">{{ overview.playerNames?.regions || 0 }}</span>
            <span class="overview-label">Name Regions</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Status Messages -->
    <div v-if="statusMessage" :class="['status-message', statusType]">
      <i :class="statusIcon"></i>
      {{ statusMessage }}
    </div>

    <!-- Restore Confirmation Modal -->
    <div v-if="showRestoreConfirm" class="modal-overlay" @click="cancelRestore">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h4><i class="fas fa-exclamation-triangle"></i> Confirm Data Restore</h4>
        </div>
        <div class="modal-body">
          <div class="warning-message">
            <i class="fas fa-exclamation-triangle"></i>
            <div>
              <h5>This action will permanently overwrite all current data!</h5>
              <p>All existing countries, cities, confederations, tactics, World Cup history, and player names will be replaced with data from the backup file.</p>
              <p><strong>This action cannot be undone.</strong> Consider creating a backup of your current data first.</p>
            </div>
          </div>
          
          <div class="backup-info">
            <h5>Backup File Information:</h5>
            <div class="backup-details">
              <div class="backup-detail">
                <span class="detail-label">File:</span>
                <span class="detail-value">{{ selectedFile?.name }}</span>
              </div>
              <div class="backup-detail" v-if="backupPreview">
                <span class="detail-label">Created:</span>
                <span class="detail-value">{{ formatDate(backupPreview.timestamp) }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="cancelRestore" class="btn-cancel">
            <i class="fas fa-times"></i>
            Cancel
          </button>
          <button @click="confirmRestore" :disabled="restoring" class="btn-confirm-danger">
            <i v-if="restoring" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-exclamation-triangle"></i>
            {{ restoring ? 'Restoring...' : 'Yes, Restore Data' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      Loading data overview...
    </div>
  </div>
</template>

<script>
export default {
  name: 'BackupManager',
  data() {
    return {
      loading: false,
      creating: false,
      restoring: false,
      overview: null,
      selectedFile: null,
      backupPreview: null,
      showRestoreConfirm: false,
      statusMessage: '',
      statusType: 'info', // 'success', 'error', 'warning', 'info'
    }
  },
  computed: {
    statusIcon() {
      const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
      }
      return icons[this.statusType] || icons.info
    }
  },
  mounted() {
    this.loadOverview()
  },
  methods: {
    async loadOverview() {
      this.loading = true
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('http://localhost:3001/api/admin/data/overview', {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          const data = await response.json()
          this.overview = data.data
        } else {
          console.error('Failed to load data overview')
        }
      } catch (error) {
        console.error('Error loading overview:', error)
      } finally {
        this.loading = false
      }
    },

    async createBackup() {
      this.creating = true
      this.setStatus('Creating backup...', 'info')
      
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('http://localhost:3001/api/admin/data/backup', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          const result = await response.json()
          this.setStatus('Backup created successfully!', 'success')
          
          // Download the backup file
          setTimeout(() => {
            this.downloadBackup()
          }, 1000)
        } else {
          const error = await response.json()
          this.setStatus(error.message || 'Failed to create backup', 'error')
        }
      } catch (error) {
        console.error('Error creating backup:', error)
        this.setStatus('Error creating backup', 'error')
      } finally {
        this.creating = false
      }
    },

    async downloadBackup() {
      try {
        const token = localStorage.getItem('token')
        
        // Get the latest backup data
        const response = await fetch('http://localhost:3001/api/admin/data/overview', {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          const overview = await response.json()
          
          // Create a complete backup object
          const backupData = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            ...overview.data
          }

          // Create and download the file
          const blob = new Blob([JSON.stringify(backupData, null, 2)], { 
            type: 'application/json' 
          })
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `worldcup-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
        }
      } catch (error) {
        console.error('Error downloading backup:', error)
        this.setStatus('Error downloading backup file', 'error')
      }
    },

    handleFileSelect(event) {
      const file = event.target.files[0]
      if (file && file.type === 'application/json') {
        this.selectedFile = file
        this.previewBackupFile(file)
      } else {
        this.setStatus('Please select a valid JSON backup file', 'error')
      }
    },

    async previewBackupFile(file) {
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        this.backupPreview = data
      } catch (error) {
        console.error('Error reading backup file:', error)
        this.setStatus('Invalid backup file format', 'error')
        this.selectedFile = null
      }
    },

    clearSelectedFile() {
      this.selectedFile = null
      this.backupPreview = null
      this.$refs.fileInput.value = ''
    },

    restoreBackup() {
      if (!this.selectedFile) return
      this.showRestoreConfirm = true
    },

    cancelRestore() {
      this.showRestoreConfirm = false
    },

    async confirmRestore() {
      if (!this.selectedFile || !this.backupPreview) return

      this.restoring = true
      this.setStatus('Restoring data from backup...', 'info')

      try {
        const token = localStorage.getItem('token')
        const response = await fetch('http://localhost:3001/api/admin/data/restore', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(this.backupPreview)
        })

        if (response.ok) {
          this.setStatus('Data restored successfully!', 'success')
          this.showRestoreConfirm = false
          this.clearSelectedFile()
          await this.loadOverview()
        } else {
          const error = await response.json()
          this.setStatus(error.message || 'Failed to restore data', 'error')
        }
      } catch (error) {
        console.error('Error restoring backup:', error)
        this.setStatus('Error restoring data', 'error')
      } finally {
        this.restoring = false
      }
    },

    setStatus(message, type = 'info') {
      this.statusMessage = message
      this.statusType = type
      
      // Clear status after 5 seconds for success/info messages
      if (type === 'success' || type === 'info') {
        setTimeout(() => {
          this.statusMessage = ''
        }, 5000)
      }
    },

    formatDate(dateString) {
      if (!dateString) return 'Unknown'
      return new Date(dateString).toLocaleString()
    }
  }
}
</script>

<style scoped>
.backup-manager {
  max-width: 100%;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 1rem;
}

.header-left h3 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1.25rem;
}

.header-left p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.btn-backup {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #007bff;
  color: white;
  transition: all 0.2s;
}

.btn-backup:hover:not(:disabled) {
  background: #0056b3;
}

.backup-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.action-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  padding: 2rem;
  display: flex;
  gap: 1.5rem;
  transition: all 0.3s;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.action-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
  flex-shrink: 0;
}

.action-icon.backup {
  background: linear-gradient(135deg, #007bff, #0056b3);
}

.action-icon.restore {
  background: linear-gradient(135deg, #ffc107, #e0a800);
}

.action-content {
  flex: 1;
}

.action-content h4 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1.2rem;
}

.action-content p {
  margin: 0 0 1.5rem 0;
  color: #6c757d;
  line-height: 1.5;
}

.btn-action-primary, .btn-action-secondary, .btn-action-warning {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  margin-right: 0.5rem;
}

.btn-action-primary {
  background: #007bff;
  color: white;
}

.btn-action-secondary {
  background: #6c757d;
  color: white;
}

.btn-action-warning {
  background: #dc3545;
  color: white;
}

.restore-section {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.selected-file {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8f9fa;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.btn-clear-file {
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  padding: 0.25rem;
}

.data-overview {
  background: white;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  padding: 2rem;
  margin-bottom: 2rem;
}

.data-overview h4 {
  margin: 0 0 1.5rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.overview-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
}

.overview-icon {
  width: 45px;
  height: 45px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
}

.overview-icon.countries { background: #e74c3c; }
.overview-icon.confederations { background: #3498db; }
.overview-icon.cities { background: #f39c12; }
.overview-icon.tactics { background: #9b59b6; }
.overview-icon.history { background: #2ecc71; }
.overview-icon.players { background: #34495e; }

.overview-details {
  display: flex;
  flex-direction: column;
}

.overview-count {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
}

.overview-label {
  font-size: 0.8rem;
  color: #6c757d;
  text-transform: uppercase;
}

.status-message {
  padding: 1rem 1.5rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.status-message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.status-message.warning {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.status-message.info {
  background: #cce7ff;
  color: #004085;
  border: 1px solid #bee5eb;
}

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

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 1.5rem 1.5rem 0 1.5rem;
}

.modal-header h4 {
  margin: 0;
  color: #dc3545;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-body {
  padding: 1.5rem;
}

.warning-message {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  gap: 1rem;
}

.warning-message i {
  color: #856404;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.warning-message h5 {
  margin: 0 0 0.5rem 0;
  color: #856404;
}

.warning-message p {
  margin: 0 0 0.5rem 0;
  color: #856404;
  line-height: 1.4;
}

.backup-info {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
}

.backup-info h5 {
  margin: 0 0 1rem 0;
  color: #495057;
}

.backup-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.backup-detail {
  display: flex;
  justify-content: space-between;
}

.detail-label {
  color: #6c757d;
  font-weight: 500;
}

.detail-value {
  color: #2c3e50;
  font-family: monospace;
}

.modal-actions {
  padding: 0 1.5rem 1.5rem 1.5rem;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn-cancel, .btn-confirm-danger {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-cancel {
  background: #6c757d;
  color: white;
}

.btn-confirm-danger {
  background: #dc3545;
  color: white;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #6c757d;
}

@media (max-width: 768px) {
  .backup-actions {
    grid-template-columns: 1fr;
  }
  
  .action-card {
    flex-direction: column;
    text-align: center;
  }
  
  .overview-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }
}
</style>