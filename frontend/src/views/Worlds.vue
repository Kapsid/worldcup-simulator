<template>
  <div class="worlds">
    <AppHeader 
      :username="username" 
      :subscription-tier="subscriptionTier"
      @logout="handleLogout" 
    />
    
    <main class="main-content">
      <div class="worlds-container">
        <div class="worlds-header">
          <h1>My Worlds</h1>
          <button 
            @click="openCreateModal" 
            class="btn-primary create-btn"
            :disabled="!canCreateWorld"
            :class="{ 'disabled': !canCreateWorld }"
          >
            <i class="fas fa-plus"></i>
            Create World
          </button>
        </div>
        
        <!-- Membership Limit Warning -->
        <div v-if="membershipStatus && !canCreateWorld" class="limit-warning glass-white">
          <div class="warning-content">
            <i class="fas fa-exclamation-triangle"></i>
            <div class="warning-text">
              <h4>World Creation Limit Reached</h4>
              <p>Your {{ membershipStatus.limits.name }} plan allows {{ membershipStatus.limits.worlds === -1 ? 'unlimited' : membershipStatus.limits.worlds }} world(s). You have created {{ membershipStatus.usage.worlds }}.</p>
            </div>
            <button @click="goToUpgrade" class="btn-primary upgrade-btn">
              <i class="fas fa-arrow-up"></i>
              Upgrade Plan
            </button>
          </div>
        </div>
        
        <div v-if="loading" class="loading-state">
          <i class="fas fa-spinner fa-spin"></i>
          Loading worlds...
        </div>
        
        <div v-else-if="worlds.length === 0" class="empty-state">
          <div class="empty-icon">
            <i class="fas fa-globe"></i>
          </div>
          <h3>No worlds yet</h3>
          <p>Create your first world to organize your tournaments and manage your football universe!</p>
          <button 
            @click="openCreateModal" 
            class="btn-primary"
            :disabled="!canCreateWorld"
            :class="{ 'disabled': !canCreateWorld }"
          >
            <i class="fas fa-plus"></i>
            Create Your First World
          </button>
        </div>
        
        <div v-else class="worlds-grid">
          <div 
            v-for="world in worlds" 
            :key="world._id"
            class="world-card glass-white"
            @click="openWorld(world._id)"
          >
            <div class="world-header-card">
              <div class="world-info">
                <span class="world-year">{{ world.beginningYear }}</span>
                <span class="data-type">{{ world.useRealHistoricData ? 'Real Data' : 'Simulated Data' }}</span>
              </div>
              <div class="world-status">
                <span class="status-badge status-active">
                  {{ world.tournaments?.length || 0 }} tournaments
                </span>
              </div>
            </div>
            
            <div class="world-content">
              <h3>{{ world.name }}</h3>
              <div v-if="world.labels && world.labels.length > 0" class="world-labels">
                <span 
                  v-for="label in world.labels.slice(0, 3)" 
                  :key="label" 
                  class="world-label"
                >
                  {{ label }}
                </span>
                <span v-if="world.labels.length > 3" class="world-label more">
                  +{{ world.labels.length - 3 }} more
                </span>
              </div>
              <div v-if="world.description" class="world-description">
                {{ world.description }}
              </div>
              <div class="world-meta">
                <div class="meta-item">
                  <i class="fas fa-calendar"></i>
                  <span>Created {{ formatDate(world.createdAt) }}</span>
                </div>
                <div class="meta-item">
                  <i class="fas fa-clock"></i>
                  <span>Last updated {{ formatDate(world.updatedAt) }}</span>
                </div>
              </div>
            </div>
            
            <div class="world-actions">
              <button class="action-btn primary">
                <i class="fas fa-play"></i>
                Open
              </button>
              <button @click.stop="editWorld(world)" class="action-btn secondary">
                <i class="fas fa-edit"></i>
                Edit
              </button>
              <button @click.stop="confirmDelete(world)" class="action-btn danger">
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
          <h2>Delete World</h2>
          <button @click="closeDeleteModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-content">
          <div class="warning-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <p class="delete-message">
            Are you sure you want to delete <strong>{{ worldToDelete?.name }}</strong>?
          </p>
          <p class="delete-submessage">
            This action cannot be undone. All world data including associated tournaments will be permanently deleted.
          </p>
        </div>
        
        <div class="modal-actions">
          <button @click="closeDeleteModal" class="btn-secondary modal-btn">
            <i class="fas fa-times"></i>
            Cancel
          </button>
          <button @click="deleteWorld" :disabled="deleting" class="btn-danger modal-btn">
            <i v-if="deleting" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-trash"></i>
            {{ deleting ? 'Deleting...' : 'Delete World' }}
          </button>
        </div>
        
        <p v-if="deleteError" class="error-message">{{ deleteError }}</p>
      </div>
    </div>
    
    <!-- Create/Edit World Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="closeCreateModal">
      <div class="modal glass-white">
        <div class="modal-header">
          <h2>{{ editingWorld ? 'Edit World' : 'Create New World' }}</h2>
          <button @click="closeCreateModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <form @submit.prevent="saveWorld" class="modal-form">
          <div class="form-group">
            <label for="worldName">World Name</label>
            <input 
              type="text" 
              id="worldName"
              v-model="createForm.name" 
              required
              minlength="3"
              maxlength="100"
              placeholder="e.g., My Football Universe"
              class="input"
              :class="{ 'error': createErrors.name }"
            />
            <span v-if="createErrors.name" class="field-error">{{ createErrors.name }}</span>
          </div>
          
          <div class="form-group">
            <label for="beginningYear">Beginning Year</label>
            <input 
              type="number" 
              id="beginningYear"
              v-model.number="createForm.beginningYear" 
              required
              min="1900"
              max="2100"
              placeholder="e.g., 2024"
              class="input"
              :class="{ 'error': createErrors.beginningYear }"
            />
            <span v-if="createErrors.beginningYear" class="field-error">{{ createErrors.beginningYear }}</span>
          </div>
          
          <div class="form-group">
            <label class="checkbox-container">
              <input
                type="checkbox"
                v-model="createForm.useRealHistoricData"
                class="checkbox"
              />
              <span class="checkmark"></span>
              Use Real Historic Data
            </label>
            <div class="type-description">
              <p class="description-text">
                <i class="fas fa-info-circle"></i>
                When enabled, tournaments will use real world football data and history
              </p>
            </div>
          </div>
          
          <div class="form-group">
            <label for="worldDescription">Description (Optional)</label>
            <textarea 
              id="worldDescription"
              v-model="createForm.description" 
              placeholder="Describe your world..."
              maxlength="500"
              rows="3"
              class="input textarea"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label for="worldLabels">Labels (Optional)</label>
            <div class="labels-input-container">
              <input
                v-model="newLabel"
                type="text"
                placeholder="Add a label and press Enter"
                maxlength="50"
                class="input"
                @keydown.enter.prevent="addLabel"
              />
              <button type="button" @click="addLabel" class="add-label-btn">
                <i class="fas fa-plus"></i>
              </button>
            </div>
            <div v-if="createForm.labels.length > 0" class="current-labels">
              <span 
                v-for="(label, index) in createForm.labels" 
                :key="index" 
                class="form-label"
              >
                {{ label }}
                <button type="button" @click="removeLabel(index)" class="remove-label-btn">
                  <i class="fas fa-times"></i>
                </button>
              </span>
            </div>
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="closeCreateModal" class="btn-secondary modal-btn">
              <i class="fas fa-times"></i>
              Cancel
            </button>
            <button type="submit" :disabled="creating" class="btn-primary modal-btn">
              <i v-if="creating" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-save"></i>
              {{ creating ? (editingWorld ? 'Updating...' : 'Creating...') : (editingWorld ? 'Update World' : 'Create World') }}
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
import api from '../services/api.js'

export default {
  name: 'Worlds',
  components: {
    AppHeader
  },
  data() {
    return {
      username: '',
      subscriptionTier: 'basic',
      membershipStatus: null,
      worlds: [],
      loading: false,
      showCreateModal: false,
      editingWorld: null,
      creating: false,
      createError: '',
      createErrors: {},
      createForm: {
        name: '',
        beginningYear: new Date().getFullYear(),
        useRealHistoricData: false,
        description: '',
        labels: []
      },
      newLabel: '',
      showDeleteModal: false,
      worldToDelete: null,
      deleting: false,
      deleteError: ''
    }
  },
  computed: {
    canCreateWorld() {
      return this.membershipStatus?.permissions?.canCreateWorld ?? true
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
    
    this.loadWorlds()
    this.loadMembershipStatus()
    this.loadUserProfile()
  },
  methods: {
    async loadWorlds() {
      this.loading = true
      try {
        const { data } = await api.worlds.getAll()
        this.worlds = data.data || []
      } catch (error) {
        console.error('Error loading worlds:', error)
      } finally {
        this.loading = false
      }
    },
    
    openWorld(worldId) {
      // Navigate to world detail page
      this.$router.push(`/worlds/${worldId}`)
    },
    
    validateCreateForm() {
      this.createErrors = {}
      
      if (!this.createForm.name || this.createForm.name.length < 3) {
        this.createErrors.name = 'World name must be at least 3 characters long'
      }
      
      if (this.createForm.name && this.createForm.name.length > 100) {
        this.createErrors.name = 'World name must not exceed 100 characters'
      }
      
      if (!this.createForm.beginningYear || this.createForm.beginningYear < 1900 || this.createForm.beginningYear > 2100) {
        this.createErrors.beginningYear = 'Beginning year must be between 1900 and 2100'
      }
      
      return Object.keys(this.createErrors).length === 0
    },
    
    async saveWorld() {
      if (!this.validateCreateForm()) {
        return
      }
      
      this.creating = true
      this.createError = ''
      
      try {
        if (this.editingWorld) {
          await api.worlds.update(this.editingWorld._id, this.createForm)
        } else {
          await api.worlds.create(this.createForm)
        }
        
        this.closeCreateModal()
        this.loadWorlds()
      } catch (error) {
        this.createError = error.data?.message || 'Failed to save world'
      } finally {
        this.creating = false
      }
    },
    
    editWorld(world) {
      this.editingWorld = world
      this.createForm = {
        name: world.name,
        beginningYear: world.beginningYear,
        useRealHistoricData: world.useRealHistoricData,
        description: world.description || '',
        labels: [...(world.labels || [])]
      }
      this.showCreateModal = true
    },
    
    openCreateModal() {
      if (!this.canCreateWorld) {
        // Show upgrade prompt instead of modal
        this.goToUpgrade()
        return
      }
      this.showCreateModal = true
    },

    goToUpgrade() {
      this.$router.push('/profile')
    },
    
    closeCreateModal() {
      this.showCreateModal = false
      this.editingWorld = null
      this.createForm = {
        name: '',
        beginningYear: new Date().getFullYear(),
        useRealHistoricData: false,
        description: '',
        labels: []
      }
      this.createErrors = {}
      this.createError = ''
      this.newLabel = ''
    },
    
    addLabel() {
      const label = this.newLabel.trim()
      if (label && !this.createForm.labels.includes(label)) {
        this.createForm.labels.push(label)
        this.newLabel = ''
      }
    },
    
    removeLabel(index) {
      this.createForm.labels.splice(index, 1)
    },
    
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString()
    },
    
    async loadUserProfile() {
      try {
        const { data: user } = await api.profile.get()
        this.subscriptionTier = user.subscriptionTier || 'basic'
      } catch (error) {
        console.error('Error loading user profile:', error)
      }
    },

    async loadMembershipStatus() {
      try {
        const { data } = await api.membership.getStatus()
        this.membershipStatus = data.data
      } catch (error) {
        console.error('Error loading membership status:', error)
      }
    },
    
    handleLogout() {
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      this.$router.push('/')
    },
    
    confirmDelete(world) {
      this.worldToDelete = world
      this.showDeleteModal = true
      this.deleteError = ''
    },
    
    closeDeleteModal() {
      this.showDeleteModal = false
      this.worldToDelete = null
      this.deleteError = ''
    },
    
    async deleteWorld() {
      if (!this.worldToDelete) return
      
      this.deleting = true
      this.deleteError = ''
      
      try {
        await api.worlds.delete(this.worldToDelete._id)
        this.closeDeleteModal()
        this.loadWorlds()
        this.loadMembershipStatus() // Refresh membership status after deletion
      } catch (error) {
        this.deleteError = error.data?.message || 'Failed to delete world'
      } finally {
        this.deleting = false
      }
    }
  }
}
</script>

<style scoped>
.worlds {
  min-height: 100vh;
  background: linear-gradient(135deg, #0066CC 0%, #003366 100%);
}

.main-content {
  padding: 2rem;
  display: flex;
  justify-content: center;
}

.worlds-container {
  width: 100%;
  max-width: 1200px;
}

.worlds-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.worlds-header h1 {
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

.worlds-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.world-card {
  padding: 24px;
  border-radius: var(--radius-xl);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.world-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
}

.world-header-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.world-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.world-year {
  font-size: 1.2rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
}

.data-type {
  font-size: 0.8rem;
  font-weight: var(--font-weight-medium);
  color: var(--gray);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-active {
  background: rgba(40, 167, 69, 0.2);
  color: #28a745;
}

.world-content h3 {
  font-size: 1.25rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
  margin: 0 0 12px 0;
}

.world-labels {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.world-label {
  padding: 2px 8px;
  background: rgba(255, 215, 0, 0.2);
  color: var(--fifa-gold);
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: var(--font-weight-medium);
}

.world-label.more {
  background: rgba(0, 102, 204, 0.2);
  color: var(--fifa-blue);
}

.world-description {
  color: var(--gray);
  font-size: 0.9rem;
  line-height: 1.4;
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.world-meta {
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

.world-actions {
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

/* Modal Styles - Same as Tournament page */
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

.field-error {
  color: var(--fifa-red);
  font-size: 0.8rem;
  margin-top: 6px;
  display: block;
  font-weight: var(--font-weight-medium);
}

.checkbox-container {
  display: flex !important;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  text-transform: none !important;
  font-size: 1rem !important;
}

.checkbox {
  width: 18px;
  height: 18px;
}

.labels-input-container {
  display: flex;
  gap: 8px;
}

.add-label-btn {
  width: 40px;
  height: 40px;
  background: var(--fifa-gold);
  color: var(--dark);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.add-label-btn:hover {
  background: #e6c200;
}

.current-labels {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(255, 215, 0, 0.2);
  color: var(--fifa-gold);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
}

.remove-label-btn {
  width: 16px;
  height: 16px;
  background: rgba(255, 255, 255, 0.2);
  color: var(--white);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
}

.remove-label-btn:hover {
  background: rgba(255, 255, 255, 0.3);
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
  
  .worlds-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .worlds-header h1 {
    font-size: 2rem;
  }
  
  .worlds-grid {
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