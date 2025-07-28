<template>
  <div class="tournament">
    <AppHeader 
      :username="username" 
      :subscription-tier="subscriptionTier"
      @logout="handleLogout" 
    />
    
    <main class="main-content">
      <div class="tournament-container">
        <div class="tournament-header">
          <h1>My Tournaments</h1>
          <button 
            @click="openCreateModal" 
            class="btn-primary create-btn"
            :disabled="!canCreateTournament"
            :class="{ 'disabled': !canCreateTournament }"
          >
            <i class="fas fa-plus"></i>
            Create Tournament
          </button>
        </div>
        
        <!-- Membership Limit Warning -->
        <div v-if="membershipStatus && !canCreateTournament" class="limit-warning glass-white">
          <div class="warning-content">
            <i class="fas fa-exclamation-triangle"></i>
            <div class="warning-text">
              <h4>Tournament Creation Limit Reached</h4>
              <p>Your {{ membershipStatus.limits.name }} plan allows {{ membershipStatus.limits.tournaments === -1 ? 'unlimited' : membershipStatus.limits.tournaments }} tournament(s). You have created {{ membershipStatus.usage.tournaments }}.</p>
            </div>
            <button @click="goToUpgrade" class="btn-primary upgrade-btn">
              <i class="fas fa-arrow-up"></i>
              Upgrade Plan
            </button>
          </div>
        </div>
        
        <div v-if="loading" class="loading-state">
          <i class="fas fa-spinner fa-spin"></i>
          Loading tournaments...
        </div>
        
        <div v-else-if="tournaments.length === 0" class="empty-state">
          <div class="empty-icon">
            <i class="fas fa-trophy"></i>
          </div>
          <h3>No tournaments yet</h3>
          <p>Create your first World Cup tournament to get started!</p>
          <button 
            @click="openCreateModal" 
            class="btn-primary"
            :disabled="!canCreateTournament"
            :class="{ 'disabled': !canCreateTournament }"
          >
            <i class="fas fa-plus"></i>
            Create Your First Tournament
          </button>
        </div>
        
        <div v-else class="tournaments-grid">
          <div 
            v-for="tournament in tournaments" 
            :key="tournament._id"
            class="tournament-card glass-white"
            :class="{ 'tournament-themed': tournament?.logo?.colorScheme }"
            @click="openTournament(tournament._id)"
          >
            <div class="tournament-header-card">
              <div class="host-info">
                <CountryFlag :country-code="tournament.hostCountryCode" :size="28" />
                <span class="country-name">{{ tournament.hostCountry }}</span>
              </div>
              <div class="tournament-status">
                <span :class="`status-badge status-${tournament.status}`">
                  {{ formatStatus(tournament.status) }}
                </span>
              </div>
            </div>
            
            <div class="tournament-content">
              <h3>{{ tournament.name }}</h3>
              <div class="tournament-meta">
                <div class="meta-item">
                  <i class="fas fa-calendar"></i>
                  <span>Created {{ formatDate(tournament.createdAt) }}</span>
                </div>
                <div class="meta-item">
                  <i class="fas fa-clock"></i>
                  <span>Last opened {{ formatDate(tournament.lastOpenedAt) }}</span>
                </div>
              </div>
            </div>
            
            <div class="tournament-actions">
              <button class="action-btn primary">
                <i class="fas fa-play"></i>
                Open
              </button>
              <button @click.stop="editTournament(tournament)" class="action-btn secondary">
                <i class="fas fa-edit"></i>
                Edit
              </button>
              <button @click.stop="confirmDelete(tournament)" class="action-btn danger">
                <i class="fas fa-trash"></i>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
    
    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal glass-white delete-modal">
        <div class="modal-header">
          <h2>Delete Tournament</h2>
          <button @click="closeDeleteModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-content">
          <div class="warning-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <p class="delete-message">
            Are you sure you want to delete <strong>{{ tournamentToDelete?.name }}</strong>?
          </p>
          <p class="delete-submessage">
            This action cannot be undone. All tournament data including teams, matches, and results will be permanently deleted.
          </p>
        </div>
        
        <div class="modal-actions">
          <button @click="closeDeleteModal" class="btn-secondary modal-btn">
            <i class="fas fa-times"></i>
            Cancel
          </button>
          <button @click="deleteTournament" :disabled="deleting" class="btn-danger modal-btn">
            <i v-if="deleting" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-trash"></i>
            {{ deleting ? 'Deleting...' : 'Delete Tournament' }}
          </button>
        </div>
        
        <p v-if="deleteError" class="error-message">{{ deleteError }}</p>
      </div>
    </div>
    
    <!-- Create Tournament Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="closeCreateModal">
      <div class="modal glass-white">
        <div class="modal-header">
          <h2>Create New Tournament</h2>
          <button @click="closeCreateModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <form @submit.prevent="createTournament" class="modal-form">
          <div class="form-group">
            <label for="tournamentName">Tournament Name</label>
            <input 
              type="text" 
              id="tournamentName"
              v-model="createForm.name" 
              required
              minlength="3"
              maxlength="100"
              placeholder="e.g., World Cup 2026"
              class="input"
              :class="{ 'error': createErrors.name }"
            />
            <span v-if="createErrors.name" class="field-error">{{ createErrors.name }}</span>
          </div>
          
          <div class="form-group">
            <label for="hostCountry">Host Country</label>
            <select 
              id="hostCountry"
              v-model="createForm.selectedCountryCode" 
              required
              class="input select"
              :class="{ 'error': createErrors.hostCountry }"
              :disabled="countries.length === 0"
            >
              <option value="">{{ countries.length > 0 ? 'Select host country...' : 'Loading countries...' }}</option>
              <template v-if="countries.length > 0">
                <option 
                  v-for="country in countries" 
                  :key="country.code"
                  :value="country.code"
                >
                  {{ country.flag }} {{ country.name }}
                </option>
              </template>
            </select>
            <span v-if="createErrors.hostCountry" class="field-error">{{ createErrors.hostCountry }}</span>
          </div>
          
          <div class="form-group">
            <label for="tournamentType">Tournament Type</label>
            <select 
              id="tournamentType"
              v-model="createForm.type" 
              required
              class="input select"
              :class="{ 'error': createErrors.type }"
            >
              <option value="">Select tournament type...</option>
              <option value="manual">Manual Team Selection</option>
              <option value="qualification">Qualification Process</option>
            </select>
            <span v-if="createErrors.type" class="field-error">{{ createErrors.type }}</span>
            <div class="type-description">
              <p v-if="createForm.type === 'manual'" class="description-text">
                <i class="fas fa-info-circle"></i>
                You will manually select and add teams to the tournament
              </p>
              <p v-if="createForm.type === 'qualification'" class="description-text">
                <i class="fas fa-info-circle"></i>
                Teams will go through a qualification process to enter the tournament
              </p>
            </div>
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="closeCreateModal" class="btn-secondary modal-btn">
              <i class="fas fa-times"></i>
              Cancel
            </button>
            <button type="submit" :disabled="creating" class="btn-primary modal-btn">
              <i v-if="creating" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-plus"></i>
              {{ creating ? 'Creating...' : 'Create Tournament' }}
            </button>
          </div>
          
          <p v-if="createError" class="error-message">{{ createError }}</p>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import AppHeader from '../components/AppHeader.vue'
import CountryFlag from '../components/CountryFlag.vue'
import { API_URL } from '../config/api.js'

export default {
  name: 'Tournament',
  components: {
    AppHeader,
    CountryFlag
  },
  data() {
    return {
      username: '',
      subscriptionTier: 'basic',
      membershipStatus: null,
      tournaments: [],
      countries: [],
      loading: false,
      showCreateModal: false,
      creating: false,
      createError: '',
      createErrors: {},
      createForm: {
        name: '',
        selectedCountryCode: '',
        type: ''
      },
      showDeleteModal: false,
      tournamentToDelete: null,
      deleting: false,
      deleteError: ''
    }
  },
  computed: {
    canCreateTournament() {
      return this.membershipStatus?.permissions?.canCreateTournament ?? true
    }
  },
  mounted() {
    this.username = localStorage.getItem('username') || 'User'
    
    // Check if user is authenticated
    const token = localStorage.getItem('token')
    if (!token) {
      this.$router.push('/')
      return
    }
    
    this.loadTournaments()
    this.loadCountries()
    this.loadUserProfile()
    this.loadMembershipStatus()
  },
  methods: {
    async loadTournaments() {
      this.loading = true
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/tournaments`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          this.tournaments = await response.json()
        } else {
          console.error('Failed to load tournaments')
        }
      } catch (error) {
        console.error('Error loading tournaments:', error)
      } finally {
        this.loading = false
      }
    },
    
    async loadCountries() {
      try {
        const response = await fetch(`${API_URL}/tournaments/countries`)
        if (response.ok) {
          this.countries = await response.json()
        } else {
          console.error('Failed to load countries, status:', response.status)
        }
      } catch (error) {
        console.error('Error loading countries:', error)
      }
    },
    
    validateCreateForm() {
      this.createErrors = {}
      
      if (!this.createForm.name || this.createForm.name.length < 3) {
        this.createErrors.name = 'Tournament name must be at least 3 characters long'
      }
      
      if (this.createForm.name && this.createForm.name.length > 100) {
        this.createErrors.name = 'Tournament name must not exceed 100 characters'
      }
      
      if (!this.createForm.selectedCountryCode) {
        this.createErrors.hostCountry = 'Please select a host country'
      }
      
      if (!this.createForm.type) {
        this.createErrors.type = 'Please select a tournament type'
      }
      
      return Object.keys(this.createErrors).length === 0
    },
    
    async createTournament() {
      if (!this.validateCreateForm()) {
        return
      }
      
      this.creating = true
      this.createError = ''
      
      try {
        const selectedCountry = this.countries.find(c => c.code === this.createForm.selectedCountryCode)
        
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/tournaments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: this.createForm.name,
            hostCountry: selectedCountry.name,
            hostCountryCode: selectedCountry.code,
            type: this.createForm.type
          })
        })
        
        const data = await response.json()
        
        if (response.ok) {
          this.closeCreateModal()
          this.loadTournaments()
          // Navigate to the new tournament detail page
          this.$router.push(`/tournament/${data.tournament._id}`)
        } else {
          this.createError = data.error || 'Failed to create tournament'
        }
      } catch (error) {
        this.createError = 'Network error. Please try again.'
      } finally {
        this.creating = false
      }
    },
    
    openTournament(tournamentId) {
      // Update last opened timestamp
      this.updateLastOpened(tournamentId)
      // Navigate to tournament detail
      this.$router.push(`/tournament/${tournamentId}`)
    },
    
    async updateLastOpened(tournamentId) {
      try {
        const token = localStorage.getItem('token')
        await fetch(`${API_URL}/tournaments/${tournamentId}/open`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      } catch (error) {
        console.error('Error updating last opened:', error)
      }
    },
    
    editTournament(tournament) {
      // Navigate to tournament edit page
      this.$router.push(`/tournament/${tournament._id}/edit`)
    },
    
    async openCreateModal() {
      if (!this.canCreateTournament) {
        // Show upgrade prompt instead of modal
        this.goToUpgrade()
        return
      }
      // Ensure countries are loaded
      if (this.countries.length === 0) {
        await this.loadCountries()
      }
      this.showCreateModal = true
    },

    goToUpgrade() {
      this.$router.push('/profile')
    },

    async loadMembershipStatus() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/membership/status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (response.ok) {
          const data = await response.json()
          this.membershipStatus = data.data
        }
      } catch (error) {
        console.error('Error loading membership status:', error)
      }
    },
    
    closeCreateModal() {
      this.showCreateModal = false
      this.createForm = {
        name: '',
        selectedCountryCode: '',
        type: ''
      }
      this.createErrors = {}
      this.createError = ''
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
    
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString()
    },
    
    async loadUserProfile() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const user = await response.json()
          this.subscriptionTier = user.subscriptionTier || 'basic'
        }
      } catch (error) {
        console.error('Error loading user profile:', error)
      }
    },
    
    handleLogout() {
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      this.$router.push('/')
    },
    
    confirmDelete(tournament) {
      this.tournamentToDelete = tournament
      this.showDeleteModal = true
      this.deleteError = ''
    },
    
    closeDeleteModal() {
      this.showDeleteModal = false
      this.tournamentToDelete = null
      this.deleteError = ''
    },
    
    async deleteTournament() {
      if (!this.tournamentToDelete) return
      
      this.deleting = true
      this.deleteError = ''
      
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/tournaments/${this.tournamentToDelete._id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          this.closeDeleteModal()
          this.loadTournaments()
          this.loadMembershipStatus() // Refresh membership status after deletion
        } else {
          const data = await response.json()
          this.deleteError = data.error || 'Failed to delete tournament'
        }
      } catch (error) {
        this.deleteError = 'Network error. Please try again.'
      } finally {
        this.deleting = false
      }
    }
  }
}
</script>

<style scoped>
.tournament {
  min-height: 100vh;
  background: linear-gradient(135deg, #0066CC 0%, #003366 100%);
}

.main-content {
  padding: 2rem;
  display: flex;
  justify-content: center;
}

.tournament-container {
  width: 100%;
  max-width: 1200px;
}

.tournament-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.tournament-header h1 {
  color: var(--white);
  font-size: 2.5rem;
  font-weight: var(--font-weight-bold);
  margin: 0;
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  font-size: 1rem;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--white);
}

.loading-state i {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.empty-state .empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}

.empty-state h3 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.empty-state p {
  opacity: 0.8;
  margin-bottom: 2rem;
}

.tournaments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.tournament-card {
  padding: 24px;
  border-radius: var(--radius-xl);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.tournament-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
}

.tournament-header-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.host-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.country-flag {
  font-size: 1.5rem;
}

.country-name {
  font-weight: var(--font-weight-semibold);
  color: var(--fifa-dark-blue);
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
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

.tournament-content h3 {
  font-size: 1.25rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
  margin: 0 0 12px 0;
}

.tournament-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--gray);
  font-size: 0.9rem;
}

.meta-item i {
  width: 16px;
  color: var(--fifa-blue);
}

.tournament-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  padding: 10px 16px;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-weight: var(--font-weight-semibold);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.3s ease;
  cursor: pointer;
  border: none;
}

.action-btn.primary {
  background: var(--fifa-blue);
  color: var(--white);
}

.action-btn.primary:hover {
  background: var(--fifa-dark-blue);
}

.action-btn.secondary {
  background: transparent;
  color: var(--fifa-blue);
  border: 1px solid var(--fifa-blue);
}

.action-btn.secondary:hover {
  background: var(--fifa-blue);
  color: var(--white);
}

.action-btn.danger {
  background: transparent;
  color: #dc3545;
  border: 1px solid #dc3545;
}

.action-btn.danger:hover {
  background: #dc3545;
  color: var(--white);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal {
  width: 100%;
  max-width: 500px;
  border-radius: var(--radius-xl);
  position: relative;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 0 24px;
  margin-bottom: 24px;
}

.modal-header h2 {
  font-size: 1.5rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--gray);
  cursor: pointer;
  padding: 8px;
  border-radius: var(--radius-md);
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  color: var(--fifa-dark-blue);
}

.modal-form {
  padding: 0 24px 24px 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: var(--fifa-dark-blue);
  font-weight: var(--font-weight-semibold);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.input.select {
  cursor: pointer;
}

.field-error {
  color: var(--fifa-red);
  font-size: 0.8rem;
  margin-top: 6px;
  display: block;
  font-weight: var(--font-weight-medium);
}

.modal-actions {
  display: flex;
  gap: 16px;
  margin-top: 0;
  padding: 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.modal-btn {
  flex: 1;
  height: 48px;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-semibold);
  transition: all 0.3s ease;
  cursor: pointer;
  border: none;
  padding: 12px 24px;
}

.error-message {
  color: var(--fifa-red);
  text-align: center;
  margin-top: 16px;
  padding: 12px;
  background: rgba(255, 68, 68, 0.1);
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 68, 68, 0.2);
  font-weight: var(--font-weight-medium);
}

/* Delete Modal Styles */
.delete-modal {
  max-width: 450px;
}

.modal-content {
  padding: 0 24px 24px 24px;
  text-align: center;
}

.warning-icon {
  font-size: 3rem;
  color: #ff8800;
  margin-bottom: 1rem;
}

.delete-message {
  font-size: 1.1rem;
  color: var(--fifa-dark-blue);
  margin-bottom: 0.75rem;
}

.delete-message strong {
  color: var(--fifa-blue);
}

.delete-submessage {
  color: var(--gray);
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.btn-danger {
  background: #dc3545;
  color: var(--white);
  border: none;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn-danger:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.type-description {
  margin-top: 8px;
}

.description-text {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--fifa-blue);
  font-size: 0.85rem;
  background: rgba(0, 102, 204, 0.1);
  padding: 8px 12px;
  border-radius: var(--radius-md);
  border-left: 3px solid var(--fifa-blue);
  margin: 0;
}

/* Membership limit warning styles */
.limit-warning {
  margin-bottom: 24px;
  padding: 20px;
  border-left: 4px solid #ffc107;
  background: white;
  border: 1px solid rgba(255, 193, 7, 0.3);
}

.warning-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.warning-content i {
  color: #ffc107;
  font-size: 2rem;
  flex-shrink: 0;
}

.warning-text {
  flex-grow: 1;
}

.warning-text h4 {
  color: var(--fifa-dark-blue);
  margin: 0 0 8px 0;
  font-size: 1.1rem;
  font-weight: var(--font-weight-bold);
}

.warning-text p {
  color: var(--fifa-dark-blue);
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.8;
}

.upgrade-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #ffc107;
  color: #000;
  border: none;
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-bold);
  text-decoration: none;
  transition: all 0.3s ease;
}

.upgrade-btn:hover {
  background: #e6ac00;
  transform: translateY(-1px);
}

.btn-primary.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

@media (max-width: 768px) {
  .main-content {
    padding: 1rem;
  }
  
  .tournament-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .tournament-header h1 {
    font-size: 2rem;
  }
  
  .tournaments-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-overlay {
    padding: 1rem;
  }
  
  .modal-actions {
    flex-direction: column;
  }
}
</style>