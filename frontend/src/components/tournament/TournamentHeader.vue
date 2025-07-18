<template>
  <div class="tournament-header glass-white">
    <div class="back-navigation">
      <button @click="$emit('back')" class="back-btn">
        <i class="fas fa-arrow-left"></i>
        Back to Tournaments
      </button>
    </div>
    
    <div class="tournament-info">
      <div class="host-section">
        <div class="country-display">
          <span class="country-flag">{{ getCountryFlag(tournament.hostCountryCode) }}</span>
          <div class="country-info">
            <h1>{{ tournament.name }}</h1>
            <p class="host-label">Hosted by {{ tournament.hostCountry }}</p>
            <p class="tournament-type">{{ formatTournamentType(tournament.type) }}</p>
          </div>
        </div>
        
        <div class="status-section">
          <span :class="`status-badge status-${tournament.status}`">
            {{ formatStatus(tournament.status) }}
          </span>
          <button v-if="tournament.status !== 'completed'" @click="toggleEditMode" class="edit-btn">
            <i :class="editMode ? 'fas fa-times' : 'fas fa-edit'"></i>
            {{ editMode ? 'Cancel' : 'Edit' }}
          </button>
        </div>
      </div>
      
      <!-- Edit Form -->
      <div v-if="editMode" class="edit-form">
        <form @submit.prevent="handleUpdateTournament" class="tournament-form">
          <div class="form-row">
            <div class="form-group">
              <label for="editName">Tournament Name</label>
              <input 
                type="text" 
                id="editName"
                v-model="editForm.name" 
                required
                minlength="3"
                maxlength="100"
                class="input"
                :class="{ 'error': editErrors.name }"
              />
              <span v-if="editErrors.name" class="field-error">{{ editErrors.name }}</span>
            </div>
            
            <div class="form-group">
              <label for="editStatus">Status</label>
              <select 
                id="editStatus"
                v-model="editForm.status" 
                class="input select"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          
          <div class="form-info">
            <p class="info-label">Host Country</p>
            <p class="info-value">{{ getCountryFlag(tournament.hostCountryCode) }} {{ tournament.hostCountry }}</p>
          </div>
          
          <div class="form-info">
            <p class="info-label">Tournament Type</p>
            <p class="info-value">{{ formatTournamentType(tournament.type) }}</p>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="toggleEditMode" class="btn-secondary">
              <i class="fas fa-times"></i>
              Cancel
            </button>
            <button type="submit" :disabled="updating" class="btn-primary">
              <i v-if="updating" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-save"></i>
              {{ updating ? 'Updating...' : 'Update Tournament' }}
            </button>
          </div>
          
          <p v-if="updateError" class="error-message">{{ updateError }}</p>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TournamentHeader',
  props: {
    tournament: {
      type: Object,
      required: true
    },
    countries: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      editMode: false,
      updating: false,
      updateError: '',
      editErrors: {},
      editForm: {
        name: '',
        status: ''
      }
    }
  },
  emits: ['back', 'tournament-updated'],
  methods: {
    toggleEditMode() {
      this.editMode = !this.editMode
      if (this.editMode) {
        this.editForm = {
          name: this.tournament.name,
          status: this.tournament.status
        }
        this.editErrors = {}
        this.updateError = ''
      }
    },
    
    validateEditForm() {
      this.editErrors = {}
      
      if (!this.editForm.name || this.editForm.name.length < 3) {
        this.editErrors.name = 'Tournament name must be at least 3 characters long'
      }
      
      if (this.editForm.name && this.editForm.name.length > 100) {
        this.editErrors.name = 'Tournament name must not exceed 100 characters'
      }
      
      return Object.keys(this.editErrors).length === 0
    },
    
    async handleUpdateTournament() {
      if (!this.validateEditForm()) {
        return
      }
      
      this.updating = true
      this.updateError = ''
      
      try {
        const response = await fetch(`http://localhost:3001/api/tournaments/${this.tournament._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(this.editForm)
        })
        
        const data = await response.json()
        
        if (response.ok) {
          this.$emit('tournament-updated', data.tournament)
          this.editMode = false
        } else {
          this.updateError = data.error || 'Failed to update tournament'
        }
      } catch (error) {
        this.updateError = 'Network error. Please try again.'
      } finally {
        this.updating = false
      }
    },
    
    getCountryFlag(countryCode) {
      const country = this.countries.find(c => c.code === countryCode)
      return country ? country.flag : '🏴'
    },
    
    formatStatus(status) {
      const statusMap = {
        'draft': 'Draft',
        'active': 'Active',
        'completed': 'Completed',
        'cancelled': 'Cancelled'
      }
      return statusMap[status] || status
    },
    
    formatTournamentType(type) {
      const typeMap = {
        'manual': 'Manual Team Selection',
        'qualification': 'Qualification Process'
      }
      return typeMap[type] || type
    }
  }
}
</script>

<style scoped>
.tournament-header {
  padding: 2rem;
  border-radius: var(--radius-xl);
  margin-bottom: 2rem;
  position: relative;
  overflow: hidden;
}

.back-navigation {
  margin-bottom: 1.5rem;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.1);
  color: var(--fifa-dark-blue);
  font-size: 0.9rem;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.host-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.country-display {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.country-flag {
  font-size: 4rem;
  flex-shrink: 0;
}

.country-info h1 {
  font-size: 2.5rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}

.host-label, .tournament-type {
  font-size: 1.1rem;
  color: var(--gray);
  margin: 0;
}

.tournament-type {
  font-weight: var(--font-weight-medium);
  color: var(--fifa-blue);
}

.status-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.status-badge {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-draft {
  background: rgba(108, 117, 125, 0.2);
  color: #6c757d;
}

.status-active {
  background: rgba(40, 167, 69, 0.2);
  color: #28a745;
}

.status-completed {
  background: rgba(0, 123, 255, 0.2);
  color: #007bff;
}

.status-cancelled {
  background: rgba(220, 53, 69, 0.2);
  color: #dc3545;
}

.edit-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 2px solid var(--fifa-blue);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--fifa-blue);
  font-size: 0.9rem;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.3s ease;
}

.edit-btn:hover {
  background: var(--fifa-blue);
  color: var(--white);
}

.edit-form {
  margin-top: 2rem;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(10px);
}

.tournament-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 8px;
  color: var(--fifa-dark-blue);
  font-weight: var(--font-weight-semibold);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.input {
  padding: 12px 16px;
  border: 2px solid rgba(0, 102, 204, 0.2);
  border-radius: var(--radius-md);
  font-size: 1rem;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.9);
  color: var(--fifa-dark-blue);
}

.input:focus {
  outline: none;
  border-color: var(--fifa-blue);
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.input.error {
  border-color: var(--fifa-red);
}

.input.select {
  cursor: pointer;
}

.field-error {
  color: var(--fifa-red);
  font-size: 0.8rem;
  margin-top: 6px;
  font-weight: var(--font-weight-medium);
}

.form-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
}

.info-label {
  font-weight: var(--font-weight-semibold);
  color: var(--fifa-dark-blue);
  margin: 0;
}

.info-value {
  color: var(--gray);
  margin: 0;
  font-weight: var(--font-weight-medium);
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.btn-secondary,
.btn-primary {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: var(--fifa-dark-blue);
  border: 2px solid rgba(0, 102, 204, 0.2);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
}

.btn-primary {
  background: var(--fifa-blue);
  color: var(--white);
}

.btn-primary:hover:not(:disabled) {
  background: var(--fifa-dark-blue);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error-message {
  color: var(--fifa-red);
  text-align: center;
  margin-top: 1rem;
  padding: 12px;
  background: rgba(255, 68, 68, 0.1);
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 68, 68, 0.2);
  font-weight: var(--font-weight-medium);
}

@media (max-width: 1024px) {
  .host-section {
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .status-section {
    align-self: flex-start;
  }
  
  .country-display {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .country-info h1 {
    font-size: 2rem;
  }
}

@media (max-width: 768px) {
  .tournament-header {
    padding: 1.5rem;
  }
  
  .country-flag {
    font-size: 3rem;
  }
  
  .country-info h1 {
    font-size: 1.75rem;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style>