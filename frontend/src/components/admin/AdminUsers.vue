<template>
  <div class="admin-users">
    <div class="section-header">
      <h2>User Management</h2>
      <div class="search-controls">
        <input
          v-model="searchQuery"
          @input="debouncedSearch"
          type="text"
          placeholder="Search users..."
          class="search-input"
        />
        <select v-model="sortBy" @change="loadUsers" class="sort-select">
          <option value="createdAt">Sort by: Date Joined</option>
          <option value="username">Sort by: Username</option>
          <option value="name">Sort by: Name</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i> Loading users...
    </div>

    <div v-else>
      <!-- Users Table -->
      <div class="table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Membership</th>
              <th>Usage</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user._id" class="user-row">
              <td class="user-info">
                <div class="user-details">
                  <strong>{{ user.name }}</strong>
                  <span class="username">@{{ user.username }}</span>
                </div>
              </td>
              <td>
                <span :class="`membership-badge ${user.membership.plan}`">
                  {{ formatPlan(user.membership.plan) }}
                </span>
                <div class="membership-status">
                  <span :class="`status-badge ${user.membership.status}`">
                    {{ user.membership.status }}
                  </span>
                </div>
              </td>
              <td class="usage-info">
                <div class="usage-item">
                  <span class="usage-label">T:</span>
                  <span class="usage-value">{{ user.membership.tournamentsCreated || 0 }}</span>
                </div>
                <div class="usage-item">
                  <span class="usage-label">W:</span>
                  <span class="usage-value">{{ user.membership.worldsCreated || 0 }}</span>
                </div>
              </td>
              <td class="date-cell">
                {{ formatDate(user.createdAt) }}
              </td>
              <td class="actions-cell">
                <button @click="viewUser(user)" class="btn-action view" title="View Details">
                  <i class="fas fa-eye"></i>
                </button>
                <button @click="editMembership(user)" class="btn-action edit" title="Edit Membership">
                  <i class="fas fa-edit"></i>
                </button>
                <button @click="resetUsage(user)" class="btn-action reset" title="Reset Usage">
                  <i class="fas fa-undo"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.total > 1" class="pagination">
        <button 
          @click="changePage(page)" 
          v-for="page in paginationPages" 
          :key="page"
          :class="['page-btn', { active: page === pagination.current }]"
          :disabled="page === '...'"
        >
          {{ page }}
        </button>
      </div>
    </div>

    <!-- User Details Modal -->
    <div v-if="selectedUser" class="modal-overlay" @click.self="closeModal">
      <div class="modal user-modal">
        <div class="modal-header">
          <h3>User Details</h3>
          <button @click="closeModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-content">
          <div class="user-profile">
            <div class="profile-section">
              <h4>Profile Information</h4>
              <div class="info-grid">
                <div class="info-item">
                  <label>Name:</label>
                  <span>{{ selectedUser.name }}</span>
                </div>
                <div class="info-item">
                  <label>Username:</label>
                  <span>@{{ selectedUser.username }}</span>
                </div>
                <div class="info-item">
                  <label>Member Since:</label>
                  <span>{{ formatDate(selectedUser.createdAt) }}</span>
                </div>
              </div>
            </div>
            
            <div class="profile-section">
              <h4>Membership Status</h4>
              <div class="membership-details">
                <span :class="`membership-badge large ${selectedUser.membership.plan}`">
                  {{ formatPlan(selectedUser.membership.plan) }}
                </span>
                <div class="membership-info">
                  <p>Status: <span :class="`status-badge ${selectedUser.membership.status}`">{{ selectedUser.membership.status }}</span></p>
                  <p v-if="selectedUser.membership.endDate">Expires: {{ formatDate(selectedUser.membership.endDate) }}</p>
                </div>
              </div>
            </div>

            <div class="profile-section">
              <h4>Usage Statistics</h4>
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-value">{{ selectedUser.membership.tournamentsCreated || 0 }}</span>
                  <span class="stat-label">Tournaments Created</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ selectedUser.membership.worldsCreated || 0 }}</span>
                  <span class="stat-label">Worlds Created</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Membership Modal -->
    <div v-if="editingUser" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal edit-modal">
        <div class="modal-header">
          <h3>Edit Membership</h3>
          <button @click="closeEditModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-content">
          <form @submit.prevent="updateMembership">
            <div class="form-group">
              <label>Plan:</label>
              <select v-model="editForm.plan" class="form-control">
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="football_maniac">Football Maniac</option>
              </select>
            </div>
            <div class="form-group">
              <label>Status:</label>
              <select v-model="editForm.status" class="form-control">
                <option value="active">Active</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <div class="form-actions">
              <button type="button" @click="closeEditModal" class="btn-secondary">Cancel</button>
              <button type="submit" :disabled="updating" class="btn-primary">
                <i v-if="updating" class="fas fa-spinner fa-spin"></i>
                {{ updating ? 'Updating...' : 'Update' }}
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
  name: 'AdminUsers',
  data() {
    return {
      users: [],
      loading: false,
      updating: false,
      searchQuery: '',
      sortBy: 'createdAt',
      pagination: {
        current: 1,
        total: 1,
        limit: 20
      },
      selectedUser: null,
      editingUser: null,
      editForm: {
        plan: '',
        status: ''
      },
      searchTimeout: null
    }
  },
  computed: {
    paginationPages() {
      const pages = []
      const total = this.pagination.total
      const current = this.pagination.current
      
      if (total <= 7) {
        for (let i = 1; i <= total; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        if (current > 4) pages.push('...')
        
        const start = Math.max(2, current - 2)
        const end = Math.min(total - 1, current + 2)
        
        for (let i = start; i <= end; i++) {
          pages.push(i)
        }
        
        if (current < total - 3) pages.push('...')
        pages.push(total)
      }
      
      return pages
    }
  },
  mounted() {
    this.loadUsers()
  },
  methods: {
    async loadUsers() {
      this.loading = true
      try {
        const token = localStorage.getItem('token')
        const params = new URLSearchParams({
          page: this.pagination.current,
          limit: this.pagination.limit,
          search: this.searchQuery,
          sortBy: this.sortBy
        })

        const response = await fetch(`${API_URL}/admin/users?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          this.users = data.data.users
          this.pagination = data.data.pagination
        }
      } catch (error) {
        console.error('Error loading users:', error)
      } finally {
        this.loading = false
      }
    },

    debouncedSearch() {
      clearTimeout(this.searchTimeout)
      this.searchTimeout = setTimeout(() => {
        this.pagination.current = 1
        this.loadUsers()
      }, 500)
    },

    changePage(page) {
      if (page !== '...' && page !== this.pagination.current) {
        this.pagination.current = page
        this.loadUsers()
      }
    },

    viewUser(user) {
      this.selectedUser = user
    },

    editMembership(user) {
      this.editingUser = user
      this.editForm = {
        plan: user.membership.plan,
        status: user.membership.status
      }
    },

    async updateMembership() {
      this.updating = true
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/admin/users/${this.editingUser._id}/membership`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(this.editForm)
        })

        if (response.ok) {
          await this.loadUsers()
          this.closeEditModal()
        }
      } catch (error) {
        console.error('Error updating membership:', error)
      } finally {
        this.updating = false
      }
    },

    async resetUsage(user) {
      if (!confirm(`Reset usage counters for ${user.name}?`)) return

      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/admin/users/${user._id}/reset-usage`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          await this.loadUsers()
        }
      } catch (error) {
        console.error('Error resetting usage:', error)
      }
    },

    closeModal() {
      this.selectedUser = null
    },

    closeEditModal() {
      this.editingUser = null
    },

    formatPlan(plan) {
      const plans = {
        free: 'Free',
        pro: 'Pro',
        football_maniac: 'Football Maniac'
      }
      return plans[plan] || plan
    },

    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString()
    }
  }
}
</script>

<style scoped>
.admin-users {
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

.search-controls {
  display: flex;
  gap: 1rem;
}

.search-input, .sort-select {
  padding: 0.5rem 1rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
}

.search-input {
  width: 250px;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #6c757d;
}

.table-container {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  font-size: 0.9rem;
}

.admin-table th {
  background: #f8f9fa;
  padding: 1rem 0.75rem;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
}

.admin-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #dee2e6;
  vertical-align: middle;
}

.user-row:hover {
  background: #f8f9fa;
}

.user-details strong {
  display: block;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.username {
  color: #6c757d;
  font-size: 0.85rem;
}

.membership-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.membership-badge.free {
  background: #e9ecef;
  color: #6c757d;
}

.membership-badge.pro {
  background: #cce5ff;
  color: #0056b3;
}

.membership-badge.football_maniac {
  background: #fff3cd;
  color: #856404;
}

.membership-badge.large {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.status-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  margin-top: 0.25rem;
}

.status-badge.active {
  background: #d4edda;
  color: #155724;
}

.status-badge.cancelled {
  background: #f8d7da;
  color: #721c24;
}

.status-badge.expired {
  background: #fff3cd;
  color: #856404;
}

.usage-info {
  display: flex;
  gap: 1rem;
}

.usage-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.usage-label {
  font-size: 0.75rem;
  color: #6c757d;
  font-weight: 600;
}

.usage-value {
  font-weight: 600;
  color: #2c3e50;
}

.date-cell {
  color: #6c757d;
  font-size: 0.85rem;
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
}

.btn-action {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.btn-action.view {
  background: #17a2b8;
  color: white;
}

.btn-action.edit {
  background: #ffc107;
  color: #212529;
}

.btn-action.reset {
  background: #6c757d;
  color: white;
}

.btn-action:hover {
  transform: translateY(-1px);
  opacity: 0.9;
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 2rem;
}

.page-btn {
  padding: 0.5rem 0.75rem;
  border: 1px solid #dee2e6;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #e9ecef;
}

.page-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.page-btn:disabled {
  cursor: default;
  background: transparent;
  border: none;
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
  max-width: 600px;
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

.profile-section {
  margin-bottom: 2rem;
}

.profile-section h4 {
  margin: 0 0 1rem 0;
  color: #495057;
  font-size: 1.1rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-item label {
  font-size: 0.85rem;
  color: #6c757d;
  font-weight: 600;
}

.info-item span {
  color: #2c3e50;
}

.membership-details {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.membership-info p {
  margin: 0.25rem 0;
  font-size: 0.9rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 600;
  color: #007bff;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.85rem;
  color: #6c757d;
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
  
  .search-controls {
    flex-direction: column;
    width: 100%;
  }
  
  .search-input {
    width: 100%;
  }
  
  .admin-table {
    font-size: 0.8rem;
  }
  
  .admin-table th,
  .admin-table td {
    padding: 0.5rem;
  }
  
  .usage-info {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .actions-cell {
    flex-direction: column;
  }
}
</style>