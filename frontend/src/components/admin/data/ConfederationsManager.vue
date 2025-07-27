<template>
  <div class="confederations-manager">
    <div class="manager-header">
      <div class="header-left">
        <h3><i class="fas fa-globe"></i> Confederations Management</h3>
        <p>Manage continental confederations and qualification slots</p>
      </div>
      <div class="header-actions">
        <button @click="loadConfederations" :disabled="loading" class="btn-refresh">
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
          Refresh
        </button>
      </div>
    </div>

    <!-- Confederations Grid -->
    <div class="confederations-grid">
      <div 
        v-for="confederation in confederations" 
        :key="confederation.id"
        class="confederation-card"
        :style="{ borderColor: confederation.color }"
      >
        <div class="card-header" :style="{ backgroundColor: confederation.color }">
          <div class="confederation-info">
            <span class="confederation-flag">{{ confederation.flag }}</span>
            <div class="confederation-names">
              <h4>{{ confederation.name }}</h4>
              <p>{{ confederation.fullName }}</p>
            </div>
          </div>
          <button @click="editConfederation(confederation)" class="btn-edit-card">
            <i class="fas fa-edit"></i>
          </button>
        </div>
        
        <div class="card-body">
          <div class="qualification-info">
            <div class="stat-item">
              <span class="stat-label">Region</span>
              <span class="stat-value">{{ confederation.region }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Qualification Slots</span>
              <span class="stat-value qualification-slots">{{ confederation.qualificationSlots }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Format</span>
              <span class="stat-value">{{ formatName(confederation.format) }}</span>
            </div>
          </div>
          
          <div class="structure-info" v-if="confederation.structure">
            <h5>Qualification Structure</h5>
            <div class="structure-details">
              <div class="structure-stat">
                <i class="fas fa-layer-group"></i>
                <span>{{ confederation.structure.groups }} groups</span>
              </div>
              <div class="structure-stat">
                <i class="fas fa-users"></i>
                <span>{{ confederation.structure.teamsPerGroup }} teams/group</span>
              </div>
              <div class="structure-stat">
                <i class="fas fa-trophy"></i>
                <span>{{ confederation.structure.totalQualifiers }} total qualifiers</span>
              </div>
            </div>
          </div>
          
          <div class="description">
            <p>{{ confederation.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Total Qualification Summary -->
    <div class="qualification-summary">
      <h4><i class="fas fa-chart-pie"></i> Qualification Summary</h4>
      <div class="summary-stats">
        <div class="summary-item">
          <span class="summary-label">Total Qualification Slots</span>
          <span class="summary-value">{{ totalQualificationSlots }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Host Country Slot</span>
          <span class="summary-value">1</span>
        </div>
        <div class="summary-item total">
          <span class="summary-label">Total World Cup Teams</span>
          <span class="summary-value">{{ totalQualificationSlots + 1 }}</span>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditForm" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h4>Edit {{ editingConfederation?.name }}</h4>
          <button @click="closeModal" class="btn-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <form @submit.prevent="saveConfederation" class="confederation-form">
          <div class="form-group">
            <label>Qualification Slots *</label>
            <input 
              v-model.number="formData.qualificationSlots" 
              type="number" 
              min="1" 
              max="32" 
              required 
            />
            <small>Number of teams that qualify directly from this confederation</small>
          </div>
          
          <div class="form-group">
            <label>Groups</label>
            <input 
              v-model.number="formData.structure.groups" 
              type="number" 
              min="1" 
            />
          </div>
          
          <div class="form-group">
            <label>Teams per Group</label>
            <input 
              v-model.number="formData.structure.teamsPerGroup" 
              type="number" 
              min="1" 
            />
          </div>
          
          <div class="form-group">
            <label>Qualifiers per Group</label>
            <input 
              v-model.number="formData.structure.qualifiersPerGroup" 
              type="number" 
              min="0" 
            />
          </div>
          
          <div class="form-group">
            <label>Description</label>
            <textarea 
              v-model="formData.description" 
              rows="3"
              placeholder="Describe the qualification format..."
            ></textarea>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="closeModal" class="btn-cancel">Cancel</button>
            <button type="submit" :disabled="saving" class="btn-save">
              <i v-if="saving" class="fas fa-spinner fa-spin"></i>
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && confederations.length === 0" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      Loading confederations...
    </div>
  </div>
</template>

<script>
export default {
  name: 'ConfederationsManager',
  data() {
    return {
      loading: false,
      saving: false,
      confederations: [],
      showEditForm: false,
      editingConfederation: null,
      formData: {
        qualificationSlots: 0,
        description: '',
        structure: {
          groups: 0,
          teamsPerGroup: 0,
          qualifiersPerGroup: 0,
          totalQualifiers: 0
        }
      }
    }
  },
  computed: {
    totalQualificationSlots() {
      return this.confederations.reduce((total, conf) => total + (conf.qualificationSlots || 0), 0)
    }
  },
  mounted() {
    this.loadConfederations()
  },
  methods: {
    async loadConfederations() {
      this.loading = true
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('http://localhost:3001/api/admin/data/confederations', {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          const data = await response.json()
          this.confederations = data.data || []
        } else {
          console.error('Failed to load confederations')
        }
      } catch (error) {
        console.error('Error loading confederations:', error)
      } finally {
        this.loading = false
      }
    },

    editConfederation(confederation) {
      this.editingConfederation = confederation
      this.formData = {
        qualificationSlots: confederation.qualificationSlots,
        description: confederation.description,
        structure: { ...confederation.structure }
      }
      this.showEditForm = true
    },

    async saveConfederation() {
      this.saving = true
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/admin/data/confederations/${this.editingConfederation.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(this.formData)
        })

        if (response.ok) {
          await this.loadConfederations()
          this.closeModal()
        } else {
          const error = await response.json()
          alert(error.message || 'Failed to save confederation')
        }
      } catch (error) {
        console.error('Error saving confederation:', error)
        alert('Error saving confederation')
      } finally {
        this.saving = false
      }
    },

    closeModal() {
      this.showEditForm = false
      this.editingConfederation = null
      this.formData = {
        qualificationSlots: 0,
        description: '',
        structure: {
          groups: 0,
          teamsPerGroup: 0,
          qualifiersPerGroup: 0,
          totalQualifiers: 0
        }
      }
    },

    formatName(format) {
      const formats = {
        'groups_direct': 'Group Stage',
        'single_league': 'League Format'
      }
      return formats[format] || format
    }
  }
}
</script>

<style scoped>
.confederations-manager {
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

.btn-refresh {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #6c757d;
  color: white;
  transition: all 0.2s;
}

.btn-refresh:hover:not(:disabled) {
  background: #5a6268;
}

.confederations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.confederation-card {
  background: white;
  border-radius: 12px;
  border: 2px solid #e9ecef;
  overflow: hidden;
  transition: all 0.3s;
}

.confederation-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.card-header {
  padding: 1.5rem;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.confederation-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.confederation-flag {
  font-size: 2rem;
}

.confederation-names h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.confederation-names p {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.9;
}

.btn-edit-card {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-edit-card:hover {
  background: rgba(255, 255, 255, 0.3);
}

.card-body {
  padding: 1.5rem;
}

.qualification-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.8rem;
  color: #6c757d;
  text-transform: uppercase;
  font-weight: 500;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
}

.qualification-slots {
  color: #007bff;
  font-size: 1.25rem;
}

.structure-info {
  margin-bottom: 1.5rem;
}

.structure-info h5 {
  margin: 0 0 1rem 0;
  color: #495057;
  font-size: 1rem;
}

.structure-details {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.structure-stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8f9fa;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.9rem;
}

.structure-stat i {
  color: #6c757d;
}

.description p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
  line-height: 1.5;
}

.qualification-summary {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.qualification-summary h4 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.summary-item.total {
  background: #007bff;
  color: white;
}

.summary-label {
  font-weight: 500;
}

.summary-value {
  font-size: 1.25rem;
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

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
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

.btn-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #6c757d;
}

.confederation-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #495057;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  font-size: 0.9rem;
}

.form-group small {
  display: block;
  margin-top: 0.25rem;
  color: #6c757d;
  font-size: 0.8rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
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
  .confederations-grid {
    grid-template-columns: 1fr;
  }
  
  .manager-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .summary-stats {
    grid-template-columns: 1fr;
  }
}
</style>