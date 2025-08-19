<template>
  <div class="countries-manager">
    <div class="manager-header">
      <div class="header-left">
        <h3><i class="fas fa-flag"></i> Countries Management</h3>
        <p>Manage country data, world rankings, and confederation assignments</p>
      </div>
      <div class="header-actions">
        <button @click="showAddForm = true" class="btn-add">
          <i class="fas fa-plus"></i>
          Add Country
        </button>
        <button @click="loadCountries" :disabled="loading" class="btn-refresh">
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
          Refresh
        </button>
      </div>
    </div>

    <!-- Search and Filters -->
    <div class="filters">
      <div class="search-box">
        <i class="fas fa-search"></i>
        <input 
          v-model="searchQuery" 
          placeholder="Search countries..." 
          @input="filterCountries"
        />
      </div>
      <select v-model="confederationFilter" @change="filterCountries" class="filter-select">
        <option value="">All Confederations</option>
        <option v-for="conf in confederations" :key="conf.id" :value="conf.id">
          {{ conf.name }}
        </option>
      </select>
    </div>

    <!-- Countries Table -->
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Flag</th>
            <th @click="sortBy('name')" class="sortable">
              Name <i class="fas fa-sort"></i>
            </th>
            <th @click="sortBy('code')" class="sortable">
              Code <i class="fas fa-sort"></i>
            </th>
            <th @click="sortBy('confederation')" class="sortable">
              Confederation <i class="fas fa-sort"></i>
            </th>
            <th @click="sortBy('worldRanking')" class="sortable">
              FIFA Ranking <i class="fas fa-sort"></i>
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="country in paginatedCountries" :key="country.code" class="data-row">
            <td class="flag-cell">{{ country.flag }}</td>
            <td class="name-cell">{{ country.name }}</td>
            <td class="code-cell">{{ country.code }}</td>
            <td class="confederation-cell">
              <span :class="['conf-badge', country.confederation]">
                {{ getConfederationName(country.confederation) }}
              </span>
            </td>
            <td class="ranking-cell">
              <span v-if="country.worldRanking" class="ranking-badge">
                #{{ country.worldRanking }}
              </span>
              <span v-else class="no-ranking">-</span>
            </td>
            <td class="actions-cell">
              <button @click="editCountry(country)" class="btn-edit">
                <i class="fas fa-edit"></i>
              </button>
              <button @click="deleteCountry(country)" class="btn-delete">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="pagination" v-if="totalPages > 1">
      <button 
        @click="currentPage = Math.max(1, currentPage - 1)" 
        :disabled="currentPage === 1"
        class="btn-page"
      >
        <i class="fas fa-chevron-left"></i>
      </button>
      <span class="page-info">
        Page {{ currentPage }} of {{ totalPages }}
      </span>
      <button 
        @click="currentPage = Math.min(totalPages, currentPage + 1)" 
        :disabled="currentPage === totalPages"
        class="btn-page"
      >
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showAddForm || showEditForm" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h4>{{ showAddForm ? 'Add New Country' : 'Edit Country' }}</h4>
          <button @click="closeModal" class="btn-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <form @submit.prevent="saveCountry" class="country-form">
          <div class="form-group">
            <label>Country Name *</label>
            <input v-model="formData.name" required />
          </div>
          <div class="form-group">
            <label>Country Code *</label>
            <input v-model="formData.code" required maxlength="3" style="text-transform: uppercase" />
          </div>
          <div class="form-group">
            <label>Flag Emoji</label>
            <input v-model="formData.flag" />
          </div>
          <div class="form-group">
            <label>Confederation *</label>
            <select v-model="formData.confederation" required>
              <option value="">Select Confederation</option>
              <option v-for="conf in confederations" :key="conf.id" :value="conf.id">
                {{ conf.name }} - {{ conf.fullName }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>FIFA World Ranking</label>
            <input v-model.number="formData.worldRanking" type="number" min="1" max="999" />
          </div>
          <div class="form-actions">
            <button type="button" @click="closeModal" class="btn-cancel">Cancel</button>
            <button type="submit" :disabled="saving" class="btn-save">
              <i v-if="saving" class="fas fa-spinner fa-spin"></i>
              {{ saving ? 'Saving...' : 'Save Country' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && countries.length === 0" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      Loading countries...
    </div>
  </div>
</template>

<script>
import { API_URL } from '../../../config/api.js'

export default {
  name: 'CountriesManager',
  data() {
    return {
      loading: false,
      saving: false,
      countries: [],
      filteredCountries: [],
      confederations: [],
      searchQuery: '',
      confederationFilter: '',
      sortField: 'worldRanking',
      sortOrder: 'asc',
      currentPage: 1,
      itemsPerPage: 20,
      showAddForm: false,
      showEditForm: false,
      editingCountry: null,
      formData: {
        name: '',
        code: '',
        flag: '',
        confederation: '',
        worldRanking: null
      }
    }
  },
  computed: {
    paginatedCountries() {
      const start = (this.currentPage - 1) * this.itemsPerPage
      return this.filteredCountries.slice(start, start + this.itemsPerPage)
    },
    totalPages() {
      return Math.ceil(this.filteredCountries.length / this.itemsPerPage)
    }
  },
  mounted() {
    this.loadCountries()
    this.loadConfederations()
  },
  methods: {
    async loadCountries() {
      this.loading = true
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/admin/data/countries`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          const data = await response.json()
          this.countries = data.data || []
          this.filterCountries()
        } else {
          console.error('Failed to load countries')
        }
      } catch (error) {
        console.error('Error loading countries:', error)
      } finally {
        this.loading = false
      }
    },

    async loadConfederations() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/admin/data/confederations`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          const data = await response.json()
          this.confederations = data.data || []
        }
      } catch (error) {
        console.error('Error loading confederations:', error)
      }
    },

    filterCountries() {
      let filtered = [...this.countries]

      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase()
        filtered = filtered.filter(country =>
          country.name.toLowerCase().includes(query) ||
          country.code.toLowerCase().includes(query)
        )
      }

      if (this.confederationFilter) {
        filtered = filtered.filter(country => country.confederation === this.confederationFilter)
      }

      this.sortCountries(filtered)
      this.filteredCountries = filtered
      this.currentPage = 1
    },

    sortBy(field) {
      if (this.sortField === field) {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc'
      } else {
        this.sortField = field
        this.sortOrder = 'asc'
      }
      this.sortCountries(this.filteredCountries)
    },

    sortCountries(countries) {
      countries.sort((a, b) => {
        let aVal = a[this.sortField]
        let bVal = b[this.sortField]

        if (this.sortField === 'worldRanking') {
          aVal = aVal || 999
          bVal = bVal || 999
        }

        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase()
          bVal = bVal.toLowerCase()
        }

        if (this.sortOrder === 'asc') {
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
        } else {
          return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
        }
      })
    },

    getConfederationName(id) {
      const conf = this.confederations.find(c => c.id === id)
      return conf ? conf.name : id
    },

    editCountry(country) {
      this.editingCountry = country
      this.formData = { ...country }
      this.showEditForm = true
    },

    async deleteCountry(country) {
      if (!confirm(`Are you sure you want to delete ${country.name}?`)) return

      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/admin/data/countries/${country.code}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          await this.loadCountries()
        } else {
          alert('Failed to delete country')
        }
      } catch (error) {
        console.error('Error deleting country:', error)
        alert('Error deleting country')
      }
    },

    async saveCountry() {
      this.saving = true
      try {
        const token = localStorage.getItem('token')
        const url = this.showAddForm 
          ? '${API_URL}/admin/data/countries'
          : `${API_URL}/admin/data/countries/${this.editingCountry.code}`
        
        const method = this.showAddForm ? 'POST' : 'PUT'

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(this.formData)
        })

        if (response.ok) {
          await this.loadCountries()
          this.closeModal()
        } else {
          const error = await response.json()
          alert(error.message || 'Failed to save country')
        }
      } catch (error) {
        console.error('Error saving country:', error)
        alert('Error saving country')
      } finally {
        this.saving = false
      }
    },

    closeModal() {
      this.showAddForm = false
      this.showEditForm = false
      this.editingCountry = null
      this.formData = {
        name: '',
        code: '',
        flag: '',
        confederation: '',
        worldRanking: null
      }
    }
  }
}
</script>

<style scoped>
.countries-manager {
  max-width: 100%;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
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

.btn-add:hover {
  background: #218838;
}

.btn-refresh {
  background: #6c757d;
  color: white;
}

.btn-refresh:hover:not(:disabled) {
  background: #5a6268;
}

.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 250px;
}

.search-box i {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
}

.search-box input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  font-size: 0.9rem;
}

.filter-select {
  padding: 0.75rem 1rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  font-size: 0.9rem;
  min-width: 200px;
}

.table-container {
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e9ecef;
}

.data-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #495057;
  position: sticky;
  top: 0;
}

.sortable {
  cursor: pointer;
  user-select: none;
}

.sortable:hover {
  background: #e9ecef;
}

.flag-cell {
  font-size: 1.25rem;
  width: 60px;
  text-align: center;
}

.code-cell {
  font-family: monospace;
  font-weight: 600;
}

.conf-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.conf-badge.uefa { background: #e3f2fd; color: #1976d2; }
.conf-badge.conmebol { background: #fff3e0; color: #f57c00; }
.conf-badge.concacaf { background: #ffebee; color: #d32f2f; }
.conf-badge.afc { background: #e8f5e8; color: #388e3c; }
.conf-badge.caf { background: #f3e5f5; color: #7b1fa2; }
.conf-badge.ofc { background: #e0f2f1; color: #00796b; }

.ranking-badge {
  background: #007bff;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.no-ranking {
  color: #6c757d;
  font-style: italic;
}

.actions-cell {
  width: 120px;
}

.btn-edit, .btn-delete {
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 0.5rem;
  width: 35px;
  height: 35px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-edit {
  background: #ffc107;
  color: #212529;
}

.btn-edit:hover {
  background: #e0a800;
}

.btn-delete {
  background: #dc3545;
  color: white;
}

.btn-delete:hover {
  background: #c82333;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn-page {
  padding: 0.5rem 0.75rem;
  border: 1px solid #e9ecef;
  background: white;
  border-radius: 4px;
  cursor: pointer;
}

.btn-page:hover:not(:disabled) {
  background: #f8f9fa;
}

.btn-page:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  max-width: 500px;
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

.country-form {
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
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  font-size: 0.9rem;
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
  .manager-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: flex-end;
  }
  
  .filters {
    flex-direction: column;
  }
}
</style>