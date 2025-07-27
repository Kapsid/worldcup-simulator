<template>
  <div class="history-manager">
    <div class="manager-header">
      <div class="header-left">
        <h3><i class="fas fa-history"></i> World Cup History Management</h3>
        <p>Manage historical World Cup tournament data</p>
      </div>
      <div class="header-actions">
        <button @click="showAddForm = true" class="btn-add">
          <i class="fas fa-plus"></i>
          Add Tournament
        </button>
        <button @click="loadHistory" :disabled="loading" class="btn-refresh">
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
          Refresh
        </button>
      </div>
    </div>

    <!-- History Timeline -->
    <div class="history-timeline">
      <div 
        v-for="entry in sortedHistory" 
        :key="entry.year"
        class="timeline-entry"
      >
        <div class="timeline-year">{{ entry.year }}</div>
        <div class="timeline-content">
          <div class="tournament-header">
            <div class="tournament-info">
              <h4>{{ entry.name || `${entry.year} FIFA World Cup` }}</h4>
              <div class="host-info">
                <i class="fas fa-map-marker-alt"></i>
                <span>{{ getHostCountries(entry.hostCountries) }}</span>
              </div>
            </div>
            <div class="tournament-actions">
              <button @click="editEntry(entry)" class="btn-edit-timeline">
                <i class="fas fa-edit"></i>
              </button>
              <button @click="deleteEntry(entry)" class="btn-delete-timeline">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
          
          <div class="tournament-details">
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Winner</span>
                <span class="detail-value winner">
                  <span v-if="entry.winner?.flag">{{ entry.winner.flag }}</span>
                  {{ entry.winner?.name || 'TBD' }}
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Runner-up</span>
                <span class="detail-value">
                  <span v-if="entry.runnerUp?.flag">{{ entry.runnerUp.flag }}</span>
                  {{ entry.runnerUp?.name || 'TBD' }}
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Teams</span>
                <span class="detail-value">{{ entry.totalTeams || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Matches</span>
                <span class="detail-value">{{ entry.totalMatches || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Goals</span>
                <span class="detail-value">{{ entry.totalGoals || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Attendance</span>
                <span class="detail-value">{{ formatNumber(entry.totalAttendance) || '-' }}</span>
              </div>
            </div>
            
            <div v-if="entry.notableEvents && entry.notableEvents.length" class="notable-events">
              <h5>Notable Events</h5>
              <ul>
                <li v-for="(event, index) in entry.notableEvents" :key="index">
                  {{ event }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showAddForm || showEditForm" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h4>{{ showAddForm ? 'Add World Cup Entry' : 'Edit World Cup Entry' }}</h4>
          <button @click="closeModal" class="btn-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <form @submit.prevent="saveEntry" class="history-form">
          <div class="form-row">
            <div class="form-group">
              <label>Year *</label>
              <input v-model.number="formData.year" type="number" min="1930" max="2050" required />
            </div>
            <div class="form-group">
              <label>Tournament Name</label>
              <input v-model="formData.name" placeholder="e.g., 2022 FIFA World Cup" />
            </div>
          </div>
          
          <div class="form-group">
            <label>Host Countries *</label>
            <input v-model="formData.hostCountriesInput" required placeholder="e.g., Brazil or USA, Canada, Mexico" />
            <small>For multiple hosts, separate with commas</small>
          </div>
          
          <div class="form-section">
            <h5>Tournament Results</h5>
            <div class="form-row">
              <div class="form-group">
                <label>Winner</label>
                <input v-model="formData.winner.name" placeholder="Winning country" />
              </div>
              <div class="form-group">
                <label>Winner Flag</label>
                <input v-model="formData.winner.flag" placeholder="🏆" maxlength="2" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Runner-up</label>
                <input v-model="formData.runnerUp.name" placeholder="Second place" />
              </div>
              <div class="form-group">
                <label>Runner-up Flag</label>
                <input v-model="formData.runnerUp.flag" placeholder="🥈" maxlength="2" />
              </div>
            </div>
          </div>
          
          <div class="form-section">
            <h5>Tournament Statistics</h5>
            <div class="form-row">
              <div class="form-group">
                <label>Total Teams</label>
                <input v-model.number="formData.totalTeams" type="number" min="1" />
              </div>
              <div class="form-group">
                <label>Total Matches</label>
                <input v-model.number="formData.totalMatches" type="number" min="1" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Total Goals</label>
                <input v-model.number="formData.totalGoals" type="number" min="0" />
              </div>
              <div class="form-group">
                <label>Total Attendance</label>
                <input v-model.number="formData.totalAttendance" type="number" min="0" />
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label>Notable Events</label>
            <textarea 
              v-model="formData.notableEventsText" 
              rows="4" 
              placeholder="Enter notable events, one per line..."
            ></textarea>
            <small>Each line will be a separate notable event</small>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="closeModal" class="btn-cancel">Cancel</button>
            <button type="submit" :disabled="saving" class="btn-save">
              <i v-if="saving" class="fas fa-spinner fa-spin"></i>
              {{ saving ? 'Saving...' : 'Save Entry' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && history.length === 0" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      Loading World Cup history...
    </div>
  </div>
</template>

<script>
export default {
  name: 'HistoryManager',
  data() {
    return {
      loading: false,
      saving: false,
      history: [],
      showAddForm: false,
      showEditForm: false,
      editingEntry: null,
      formData: {
        year: null,
        name: '',
        hostCountriesInput: '',
        winner: { name: '', flag: '' },
        runnerUp: { name: '', flag: '' },
        totalTeams: null,
        totalMatches: null,
        totalGoals: null,
        totalAttendance: null,
        notableEventsText: ''
      }
    }
  },
  computed: {
    sortedHistory() {
      return [...this.history].sort((a, b) => b.year - a.year)
    }
  },
  mounted() {
    this.loadHistory()
  },
  methods: {
    async loadHistory() {
      this.loading = true
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('http://localhost:3001/api/admin/data/history', {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          const data = await response.json()
          this.history = data.data || []
        } else {
          console.error('Failed to load World Cup history')
        }
      } catch (error) {
        console.error('Error loading history:', error)
      } finally {
        this.loading = false
      }
    },

    getHostCountries(hostCountries) {
      if (Array.isArray(hostCountries)) {
        return hostCountries.join(', ')
      }
      return hostCountries || 'TBD'
    },

    editEntry(entry) {
      this.editingEntry = entry
      this.formData = {
        year: entry.year,
        name: entry.name || '',
        hostCountriesInput: this.getHostCountries(entry.hostCountries),
        winner: { ...entry.winner } || { name: '', flag: '' },
        runnerUp: { ...entry.runnerUp } || { name: '', flag: '' },
        totalTeams: entry.totalTeams || null,
        totalMatches: entry.totalMatches || null,
        totalGoals: entry.totalGoals || null,
        totalAttendance: entry.totalAttendance || null,
        notableEventsText: entry.notableEvents ? entry.notableEvents.join('\n') : ''
      }
      this.showEditForm = true
    },

    async deleteEntry(entry) {
      if (!confirm(`Are you sure you want to delete the ${entry.year} World Cup entry?`)) return

      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/admin/data/history/${entry.year}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          await this.loadHistory()
        } else {
          alert('Failed to delete World Cup entry')
        }
      } catch (error) {
        console.error('Error deleting entry:', error)
        alert('Error deleting entry')
      }
    },

    async saveEntry() {
      this.saving = true
      try {
        const token = localStorage.getItem('token')
        
        // Process form data
        const payload = {
          year: this.formData.year,
          name: this.formData.name || `${this.formData.year} FIFA World Cup`,
          hostCountries: this.formData.hostCountriesInput.split(',').map(h => h.trim()),
          totalTeams: this.formData.totalTeams,
          totalMatches: this.formData.totalMatches,
          totalGoals: this.formData.totalGoals,
          totalAttendance: this.formData.totalAttendance
        }

        // Add winner if provided
        if (this.formData.winner.name) {
          payload.winner = this.formData.winner
        }

        // Add runner-up if provided
        if (this.formData.runnerUp.name) {
          payload.runnerUp = this.formData.runnerUp
        }

        // Add notable events if provided
        if (this.formData.notableEventsText) {
          payload.notableEvents = this.formData.notableEventsText
            .split('\n')
            .map(event => event.trim())
            .filter(event => event.length > 0)
        }

        const url = this.showAddForm 
          ? 'http://localhost:3001/api/admin/data/history'
          : `http://localhost:3001/api/admin/data/history/${this.editingEntry.year}`
        
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
          await this.loadHistory()
          this.closeModal()
        } else {
          const error = await response.json()
          alert(error.message || 'Failed to save World Cup entry')
        }
      } catch (error) {
        console.error('Error saving entry:', error)
        alert('Error saving entry')
      } finally {
        this.saving = false
      }
    },

    closeModal() {
      this.showAddForm = false
      this.showEditForm = false
      this.editingEntry = null
      this.formData = {
        year: null,
        name: '',
        hostCountriesInput: '',
        winner: { name: '', flag: '' },
        runnerUp: { name: '', flag: '' },
        totalTeams: null,
        totalMatches: null,
        totalGoals: null,
        totalAttendance: null,
        notableEventsText: ''
      }
    },

    formatNumber(num) {
      return num ? new Intl.NumberFormat().format(num) : null
    }
  }
}
</script>

<style scoped>
.history-manager {
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

.history-timeline {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.timeline-entry {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}

.timeline-year {
  background: #007bff;
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  font-size: 1.25rem;
  font-weight: 700;
  min-width: 100px;
  text-align: center;
  position: sticky;
  top: 20px;
}

.timeline-content {
  flex: 1;
  background: white;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  overflow: hidden;
  transition: all 0.3s;
}

.timeline-content:hover {
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.tournament-header {
  background: #f8f9fa;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.tournament-info h4 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1.2rem;
}

.host-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6c757d;
  font-size: 0.9rem;
}

.tournament-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-edit-timeline, .btn-delete-timeline {
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

.btn-edit-timeline {
  background: #ffc107;
  color: #212529;
}

.btn-delete-timeline {
  background: #dc3545;
  color: white;
}

.tournament-details {
  padding: 1.5rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  font-size: 0.8rem;
  color: #6c757d;
  text-transform: uppercase;
  font-weight: 500;
}

.detail-value {
  font-weight: 600;
  color: #2c3e50;
}

.detail-value.winner {
  color: #ffd700;
  font-size: 1.1rem;
}

.notable-events {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e9ecef;
}

.notable-events h5 {
  margin: 0 0 1rem 0;
  color: #495057;
}

.notable-events ul {
  margin: 0;
  padding-left: 1.25rem;
}

.notable-events li {
  margin-bottom: 0.5rem;
  color: #6c757d;
  line-height: 1.4;
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
  max-width: 800px;
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

.history-form {
  padding: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
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
}

.form-group small {
  display: block;
  margin-top: 0.25rem;
  color: #6c757d;
  font-size: 0.8rem;
}

.form-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e9ecef;
}

.form-section h5 {
  margin: 0 0 1rem 0;
  color: #495057;
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

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #6c757d;
}

@media (max-width: 768px) {
  .timeline-entry {
    flex-direction: column;
    gap: 1rem;
  }
  
  .timeline-year {
    position: relative;
    align-self: flex-start;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>