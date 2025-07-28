<template>
  <div class="player-names-manager">
    <div class="manager-header">
      <div class="header-left">
        <h3><i class="fas fa-users"></i> Player Names Management</h3>
        <p>Manage first and last names by region for player generation</p>
      </div>
      <div class="header-actions">
        <button @click="showAddForm = true" class="btn-add">
          <i class="fas fa-plus"></i>
          Add Region
        </button>
        <button @click="loadPlayerNames" :disabled="loading" class="btn-refresh">
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
          Refresh
        </button>
      </div>
    </div>

    <!-- Regions Overview -->
    <div class="regions-grid">
      <div 
        v-for="(names, region) in playerNames" 
        :key="region"
        class="region-card"
      >
        <div class="region-header">
          <div class="region-info">
            <h4>{{ formatRegionName(region) }}</h4>
            <p>{{ getRegionStats(names) }}</p>
          </div>
          <div class="region-actions">
            <button @click="editRegion(region, names)" class="btn-edit-region">
              <i class="fas fa-edit"></i>
            </button>
            <button @click="deleteRegion(region)" class="btn-delete-region">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        
        <div class="names-preview">
          <div class="names-section">
            <h5>First Names <span class="count">({{ names.firstNames?.length || 0 }})</span></h5>
            <div class="names-list">
              <span 
                v-for="(name, index) in (names.firstNames || []).slice(0, 8)" 
                :key="index"
                class="name-tag"
              >
                {{ name }}
              </span>
              <span v-if="(names.firstNames?.length || 0) > 8" class="more-count">
                +{{ (names.firstNames?.length || 0) - 8 }} more
              </span>
            </div>
          </div>
          
          <div class="names-section">
            <h5>Last Names <span class="count">({{ names.lastNames?.length || 0 }})</span></h5>
            <div class="names-list">
              <span 
                v-for="(name, index) in (names.lastNames || []).slice(0, 8)" 
                :key="index"
                class="name-tag"
              >
                {{ name }}
              </span>
              <span v-if="(names.lastNames?.length || 0) > 8" class="more-count">
                +{{ (names.lastNames?.length || 0) - 8 }} more
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showAddForm || showEditForm" class="modal-overlay" @click="closeModal">
      <div class="modal-content large" @click.stop>
        <div class="modal-header">
          <h4>{{ showAddForm ? 'Add New Region' : `Edit ${formatRegionName(editingRegion)}` }}</h4>
          <button @click="closeModal" class="btn-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <form @submit.prevent="saveRegion" class="region-form">
          <div v-if="showAddForm" class="form-group">
            <label>Region Name *</label>
            <input v-model="formData.regionName" required placeholder="e.g., european, african, south_american" />
            <small>Use lowercase with underscores (e.g., south_american)</small>
          </div>
          
          <div class="names-editor">
            <div class="names-column">
              <div class="column-header">
                <h5>First Names</h5>
                <div class="column-actions">
                  <button type="button" @click="addFirstName" class="btn-add-name">
                    <i class="fas fa-plus"></i>
                  </button>
                  <button type="button" @click="clearFirstNames" class="btn-clear">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
              <div class="names-input-area">
                <textarea 
                  v-model="firstNamesText"
                  @input="updateFirstNames"
                  rows="20"
                  placeholder="Enter first names, one per line..."
                ></textarea>
                <div class="names-count">{{ formData.firstNames.length }} names</div>
              </div>
            </div>
            
            <div class="names-column">
              <div class="column-header">
                <h5>Last Names</h5>
                <div class="column-actions">
                  <button type="button" @click="addLastName" class="btn-add-name">
                    <i class="fas fa-plus"></i>
                  </button>
                  <button type="button" @click="clearLastNames" class="btn-clear">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
              <div class="names-input-area">
                <textarea 
                  v-model="lastNamesText"
                  @input="updateLastNames"
                  rows="20"
                  placeholder="Enter last names, one per line..."
                ></textarea>
                <div class="names-count">{{ formData.lastNames.length }} names</div>
              </div>
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="closeModal" class="btn-cancel">Cancel</button>
            <button type="submit" :disabled="saving || !isFormValid" class="btn-save">
              <i v-if="saving" class="fas fa-spinner fa-spin"></i>
              {{ saving ? 'Saving...' : 'Save Region' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && Object.keys(playerNames).length === 0" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      Loading player names...
    </div>
  </div>
</template>

<script>
import { API_URL } from '../../../config/api.js'

export default {
  name: 'PlayerNamesManager',
  data() {
    return {
      loading: false,
      saving: false,
      playerNames: {},
      showAddForm: false,
      showEditForm: false,
      editingRegion: null,
      formData: {
        regionName: '',
        firstNames: [],
        lastNames: []
      },
      firstNamesText: '',
      lastNamesText: ''
    }
  },
  computed: {
    isFormValid() {
      return (this.showAddForm ? this.formData.regionName.trim() : true) &&
             this.formData.firstNames.length > 0 &&
             this.formData.lastNames.length > 0
    }
  },
  mounted() {
    this.loadPlayerNames()
  },
  methods: {
    async loadPlayerNames() {
      this.loading = true
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/admin/data/player-names`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          const data = await response.json()
          this.playerNames = data.data || {}
        } else {
          console.error('Failed to load player names')
        }
      } catch (error) {
        console.error('Error loading player names:', error)
      } finally {
        this.loading = false
      }
    },

    formatRegionName(region) {
      return region.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
    },

    getRegionStats(names) {
      const firstCount = names.firstNames?.length || 0
      const lastCount = names.lastNames?.length || 0
      return `${firstCount} first names, ${lastCount} last names`
    },

    editRegion(region, names) {
      this.editingRegion = region
      this.formData = {
        regionName: region,
        firstNames: [...(names.firstNames || [])],
        lastNames: [...(names.lastNames || [])]
      }
      this.firstNamesText = this.formData.firstNames.join('\n')
      this.lastNamesText = this.formData.lastNames.join('\n')
      this.showEditForm = true
    },

    async deleteRegion(region) {
      if (!confirm(`Are you sure you want to delete the ${this.formatRegionName(region)} region?`)) return

      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/admin/data/player-names/${region}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          await this.loadPlayerNames()
        } else {
          alert('Failed to delete region')
        }
      } catch (error) {
        console.error('Error deleting region:', error)
        alert('Error deleting region')
      }
    },

    async saveRegion() {
      this.saving = true
      try {
        const token = localStorage.getItem('token')
        
        const payload = {
          firstNames: this.formData.firstNames,
          lastNames: this.formData.lastNames
        }

        const region = this.showAddForm ? this.formData.regionName : this.editingRegion
        const url = this.showAddForm 
          ? `${API_URL}/admin/data/player-names/${region}`
          : `${API_URL}/admin/data/player-names/${region}`
        
        const method = this.showAddForm ? 'POST' : 'PUT'

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        })

        if (response.ok) {
          await this.loadPlayerNames()
          this.closeModal()
        } else {
          const error = await response.json()
          alert(error.message || 'Failed to save region')
        }
      } catch (error) {
        console.error('Error saving region:', error)
        alert('Error saving region')
      } finally {
        this.saving = false
      }
    },

    updateFirstNames() {
      this.formData.firstNames = this.firstNamesText
        .split('\n')
        .map(name => name.trim())
        .filter(name => name.length > 0)
    },

    updateLastNames() {
      this.formData.lastNames = this.lastNamesText
        .split('\n')
        .map(name => name.trim())
        .filter(name => name.length > 0)
    },

    addFirstName() {
      const name = prompt('Enter first name:')
      if (name && name.trim()) {
        this.formData.firstNames.push(name.trim())
        this.firstNamesText = this.formData.firstNames.join('\n')
      }
    },

    addLastName() {
      const name = prompt('Enter last name:')
      if (name && name.trim()) {
        this.formData.lastNames.push(name.trim())
        this.lastNamesText = this.formData.lastNames.join('\n')
      }
    },

    clearFirstNames() {
      if (confirm('Clear all first names?')) {
        this.formData.firstNames = []
        this.firstNamesText = ''
      }
    },

    clearLastNames() {
      if (confirm('Clear all last names?')) {
        this.formData.lastNames = []
        this.lastNamesText = ''
      }
    },

    closeModal() {
      this.showAddForm = false
      this.showEditForm = false
      this.editingRegion = null
      this.formData = {
        regionName: '',
        firstNames: [],
        lastNames: []
      }
      this.firstNamesText = ''
      this.lastNamesText = ''
    }
  }
}
</script>

<style scoped>
.player-names-manager {
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

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-add, .btn-refresh {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-add {
  background: #28a745;
  color: white;
}

.btn-refresh {
  background: #6c757d;
  color: white;
}

.regions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.region-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  overflow: hidden;
  transition: all 0.3s;
}

.region-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.region-header {
  background: #f8f9fa;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.region-info h4 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1.2rem;
}

.region-info p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.region-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-edit-region, .btn-delete-region {
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-edit-region {
  background: #ffc107;
  color: #212529;
}

.btn-delete-region {
  background: #dc3545;
  color: white;
}

.names-preview {
  padding: 1.5rem;
}

.names-section {
  margin-bottom: 1.5rem;
}

.names-section:last-child {
  margin-bottom: 0;
}

.names-section h5 {
  margin: 0 0 0.75rem 0;
  color: #495057;
  font-size: 1rem;
}

.count {
  color: #6c757d;
  font-weight: normal;
  font-size: 0.9rem;
}

.names-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.name-tag {
  background: #e9ecef;
  color: #495057;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.more-count {
  background: #007bff;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
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

.modal-content.large {
  background: white;
  border-radius: 8px;
  width: 95%;
  max-width: 1200px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 0 1.5rem;
}

.modal-header h4 {
  margin: 0;
  color: #2c3e50;
}

.region-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #495057;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
}

.form-group small {
  display: block;
  margin-top: 0.25rem;
  color: #6c757d;
  font-size: 0.8rem;
}

.names-editor {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.names-column {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
}

.column-header {
  background: #f8f9fa;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e9ecef;
}

.column-header h5 {
  margin: 0;
  color: #495057;
}

.column-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-add-name, .btn-clear {
  padding: 0.25rem 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.btn-add-name {
  background: #28a745;
  color: white;
}

.btn-clear {
  background: #dc3545;
  color: white;
}

.names-input-area {
  position: relative;
}

.names-input-area textarea {
  width: 100%;
  border: none;
  padding: 1rem;
  font-family: monospace;
  font-size: 0.9rem;
  resize: vertical;
  outline: none;
}

.names-count {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn-cancel, .btn-save {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-cancel {
  background: #6c757d;
  color: white;
}

.btn-save {
  background: #28a745;
  color: white;
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  .regions-grid {
    grid-template-columns: 1fr;
  }
  
  .names-editor {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .manager-header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>