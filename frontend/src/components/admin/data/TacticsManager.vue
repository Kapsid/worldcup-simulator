<template>
  <div class="tactics-manager">
    <div class="manager-header">
      <div class="header-left">
        <h3><i class="fas fa-chess"></i> Tactics & Formations Management</h3>
        <p>Manage football formations and tactical setups</p>
      </div>
      <div class="header-actions">
        <button @click="showAddForm = true" class="btn-add">
          <i class="fas fa-plus"></i>
          Add Formation
        </button>
        <button @click="loadTactics" :disabled="loading" class="btn-refresh">
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
          Refresh
        </button>
      </div>
    </div>

    <!-- Formations Grid -->
    <div class="formations-grid">
      <div 
        v-for="formation in formations" 
        :key="formation.name"
        class="formation-card"
      >
        <div class="formation-header">
          <div class="formation-info">
            <h4>{{ formation.name }}</h4>
            <p>{{ formation.description }}</p>
          </div>
          <div class="formation-actions">
            <button @click="editFormation(formation)" class="btn-edit-card">
              <i class="fas fa-edit"></i>
            </button>
            <button @click="deleteFormation(formation)" class="btn-delete-card">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        
        <div class="formation-visual">
          <div class="pitch">
            <div v-for="(count, position) in formation.positions" :key="position" class="position-group">
              <div class="position-label">{{ position }}</div>
              <div class="position-count">{{ count }}</div>
            </div>
          </div>
        </div>
        
        <div class="formation-stats">
          <div class="total-players">
            <span class="stat-label">Total Players</span>
            <span class="stat-value">{{ getTotalPlayers(formation.positions) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showAddForm || showEditForm" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h4>{{ showAddForm ? 'Add New Formation' : 'Edit Formation' }}</h4>
          <button @click="closeModal" class="btn-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <form @submit.prevent="saveFormation" class="formation-form">
          <div class="form-group">
            <label>Formation Name *</label>
            <input v-model="formData.name" required placeholder="e.g., 4-4-2" />
          </div>
          
          <div class="form-group">
            <label>Description *</label>
            <input v-model="formData.description" required placeholder="Brief description of the formation" />
          </div>
          
          <div class="positions-section">
            <h5>Player Positions</h5>
            <div class="positions-grid">
              <div v-for="position in availablePositions" :key="position" class="position-input">
                <label>{{ position }}</label>
                <input 
                  v-model.number="formData.positions[position]" 
                  type="number" 
                  min="0" 
                  max="11"
                  :placeholder="getPositionDescription(position)"
                />
              </div>
            </div>
            <div class="total-check">
              <span :class="['total-players', { 'invalid': getTotalPlayers(formData.positions) !== 11 }]">
                Total: {{ getTotalPlayers(formData.positions) }} players
                <small v-if="getTotalPlayers(formData.positions) !== 11">(Must equal 11)</small>
              </span>
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="closeModal" class="btn-cancel">Cancel</button>
            <button 
              type="submit" 
              :disabled="saving || getTotalPlayers(formData.positions) !== 11" 
              class="btn-save"
            >
              <i v-if="saving" class="fas fa-spinner fa-spin"></i>
              {{ saving ? 'Saving...' : 'Save Formation' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && formations.length === 0" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      Loading formations...
    </div>
  </div>
</template>

<script>
import { API_URL } from '../../../config/api.js'

export default {
  name: 'TacticsManager',
  data() {
    return {
      loading: false,
      saving: false,
      formations: [],
      showAddForm: false,
      showEditForm: false,
      editingFormation: null,
      formData: {
        name: '',
        description: '',
        positions: {}
      },
      availablePositions: [
        'GK', 'CB', 'LB', 'RB', 'LWB', 'RWB', 
        'CDM', 'CM', 'CAM', 'LM', 'RM', 
        'LW', 'RW', 'ST', 'CF'
      ]
    }
  },
  mounted() {
    this.loadTactics()
    this.initializeFormData()
  },
  methods: {
    async loadTactics() {
      this.loading = true
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/admin/data/tactics`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          const data = await response.json()
          this.formations = data.data || []
        } else {
          console.error('Failed to load tactics')
        }
      } catch (error) {
        console.error('Error loading tactics:', error)
      } finally {
        this.loading = false
      }
    },

    initializeFormData() {
      const positions = {}
      this.availablePositions.forEach(pos => {
        positions[pos] = 0
      })
      this.formData.positions = positions
    },

    editFormation(formation) {
      this.editingFormation = formation
      this.formData = {
        name: formation.name,
        description: formation.description,
        positions: { ...formation.positions }
      }
      
      // Ensure all positions are represented
      this.availablePositions.forEach(pos => {
        if (!(pos in this.formData.positions)) {
          this.formData.positions[pos] = 0
        }
      })
      
      this.showEditForm = true
    },

    async deleteFormation(formation) {
      if (!confirm(`Are you sure you want to delete the ${formation.name} formation?`)) return

      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/admin/data/tactics/${formation.name}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          await this.loadTactics()
        } else {
          alert('Failed to delete formation')
        }
      } catch (error) {
        console.error('Error deleting formation:', error)
        alert('Error deleting formation')
      }
    },

    async saveFormation() {
      this.saving = true
      try {
        const token = localStorage.getItem('token')
        
        // Clean up positions - remove positions with 0 count
        const cleanedPositions = {}
        Object.keys(this.formData.positions).forEach(pos => {
          if (this.formData.positions[pos] > 0) {
            cleanedPositions[pos] = this.formData.positions[pos]
          }
        })

        const payload = {
          name: this.formData.name,
          description: this.formData.description,
          positions: cleanedPositions
        }

        const url = this.showAddForm 
          ? '${API_URL}/admin/data/tactics'
          : `${API_URL}/admin/data/tactics/${this.editingFormation.name}`
        
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
          await this.loadTactics()
          this.closeModal()
        } else {
          const error = await response.json()
          alert(error.message || 'Failed to save formation')
        }
      } catch (error) {
        console.error('Error saving formation:', error)
        alert('Error saving formation')
      } finally {
        this.saving = false
      }
    },

    closeModal() {
      this.showAddForm = false
      this.showEditForm = false
      this.editingFormation = null
      this.formData = {
        name: '',
        description: '',
        positions: {}
      }
      this.initializeFormData()
    },

    getTotalPlayers(positions) {
      return Object.values(positions).reduce((sum, count) => sum + (count || 0), 0)
    },

    getPositionDescription(position) {
      const descriptions = {
        'GK': 'Goalkeeper',
        'CB': 'Center Back',
        'LB': 'Left Back',
        'RB': 'Right Back',
        'LWB': 'Left Wing Back',
        'RWB': 'Right Wing Back',
        'CDM': 'Center Defensive Mid',
        'CM': 'Center Midfielder',
        'CAM': 'Center Attacking Mid',
        'LM': 'Left Midfielder',
        'RM': 'Right Midfielder',
        'LW': 'Left Wing',
        'RW': 'Right Wing',
        'ST': 'Striker',
        'CF': 'Center Forward'
      }
      return descriptions[position] || position
    }
  }
}
</script>

<style scoped>
.tactics-manager {
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

.formations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.formation-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  overflow: hidden;
  transition: all 0.3s;
}

.formation-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.formation-header {
  padding: 1.5rem;
  background: #f8f9fa;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.formation-info h4 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1.25rem;
  font-weight: 600;
}

.formation-info p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.formation-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-edit-card, .btn-delete-card {
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-edit-card {
  background: #ffc107;
  color: #212529;
}

.btn-delete-card {
  background: #dc3545;
  color: white;
}

.formation-visual {
  padding: 1.5rem;
}

.pitch {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  border-radius: 8px;
  padding: 1rem;
  position: relative;
  min-height: 120px;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  align-items: center;
}

.position-group {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 6px;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 50px;
  border: 2px solid #fff;
}

.position-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.position-count {
  font-size: 1.1rem;
  font-weight: 700;
  color: #007bff;
}

.formation-stats {
  padding: 1rem 1.5rem;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.total-players {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  color: #6c757d;
  font-size: 0.9rem;
}

.stat-value {
  font-weight: 600;
  color: #2c3e50;
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
  max-width: 700px;
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

.formation-form {
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

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
}

.positions-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e9ecef;
}

.positions-section h5 {
  margin: 0 0 1rem 0;
  color: #495057;
}

.positions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.position-input label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.position-input input {
  padding: 0.5rem;
  font-size: 0.9rem;
}

.total-check {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
  text-align: center;
}

.total-players {
  font-weight: 600;
  color: #28a745;
}

.total-players.invalid {
  color: #dc3545;
}

.total-players small {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.8rem;
  font-weight: normal;
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
  .formations-grid {
    grid-template-columns: 1fr;
  }
  
  .manager-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .positions-grid {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  }
}
</style>