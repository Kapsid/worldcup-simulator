<template>
  <div class="admin-content">
    <div class="section-header">
      <h2>Content Management</h2>
      <div class="content-tabs">
        <button 
          @click="activeContentTab = 'tournaments'"
          :class="['tab-btn', { active: activeContentTab === 'tournaments' }]"
        >
          <i class="fas fa-trophy"></i>
          Tournaments
        </button>
        <button 
          @click="activeContentTab = 'worlds'"
          :class="['tab-btn', { active: activeContentTab === 'worlds' }]"
        >
          <i class="fas fa-globe"></i>
          Worlds
        </button>
      </div>
    </div>

    <!-- Tournaments Tab -->
    <div v-if="activeContentTab === 'tournaments'" class="content-section">
      <div class="controls-bar">
        <input
          v-model="tournamentSearch"
          @input="debouncedTournamentSearch"
          type="text"
          placeholder="Search tournaments..."
          class="search-input"
        />
        <select v-model="tournamentStatus" @change="loadTournaments" class="filter-select">
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div v-if="loadingTournaments" class="loading">
        <i class="fas fa-spinner fa-spin"></i> Loading tournaments...
      </div>

      <div v-else class="table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Tournament</th>
              <th>Creator</th>
              <th>Status</th>
              <th>Host Country</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tournament in tournaments" :key="tournament._id">
              <td class="content-info">
                <strong>{{ tournament.name }}</strong>
                <small>{{ tournament.type }} tournament</small>
              </td>
              <td class="user-cell">
                <strong>{{ tournament.createdBy?.name || 'Unknown' }}</strong>
                <small>@{{ tournament.createdBy?.username || 'unknown' }}</small>
              </td>
              <td>
                <span :class="`status-badge status-${tournament.status}`">
                  {{ formatStatus(tournament.status) }}
                </span>
              </td>
              <td class="host-cell">
                <span>{{ tournament.hostCountry }}</span>
                <small>{{ tournament.hostCountryCode }}</small>
              </td>
              <td class="date-cell">{{ formatDate(tournament.createdAt) }}</td>
              <td class="actions-cell">
                <button @click="viewTournament(tournament)" class="btn-action view" title="View">
                  <i class="fas fa-eye"></i>
                </button>
                <button @click="deleteTournament(tournament)" class="btn-action delete" title="Delete">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tournament Pagination -->
      <div v-if="tournamentPagination.total > 1" class="pagination">
        <button 
          @click="changeTournamentPage(page)" 
          v-for="page in tournamentPaginationPages" 
          :key="page"
          :class="['page-btn', { active: page === tournamentPagination.current }]"
          :disabled="page === '...'"
        >
          {{ page }}
        </button>
      </div>
    </div>

    <!-- Worlds Tab -->
    <div v-if="activeContentTab === 'worlds'" class="content-section">
      <div class="controls-bar">
        <input
          v-model="worldSearch"
          @input="debouncedWorldSearch"
          type="text"
          placeholder="Search worlds..."
          class="search-input"
        />
      </div>

      <div v-if="loadingWorlds" class="loading">
        <i class="fas fa-spinner fa-spin"></i> Loading worlds...
      </div>

      <div v-else class="table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>World</th>
              <th>Creator</th>
              <th>Settings</th>
              <th>Tournaments</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="world in worlds" :key="world._id">
              <td class="content-info">
                <strong>{{ world.name }}</strong>
                <div class="world-labels" v-if="world.labels && world.labels.length > 0">
                  <span v-for="label in world.labels.slice(0, 2)" :key="label" class="world-label">
                    {{ label }}
                  </span>
                  <span v-if="world.labels.length > 2" class="world-label more">
                    +{{ world.labels.length - 2 }}
                  </span>
                </div>
              </td>
              <td class="user-cell">
                <strong>{{ world.createdBy?.name || 'Unknown' }}</strong>
                <small>@{{ world.createdBy?.username || 'unknown' }}</small>
              </td>
              <td class="settings-cell">
                <div class="setting-item">
                  <small>Year: {{ world.beginningYear }}</small>
                </div>
                <div class="setting-item">
                  <span :class="`data-badge ${world.useRealHistoricData ? 'real' : 'simulated'}`">
                    {{ world.useRealHistoricData ? 'Real Data' : 'Simulated' }}
                  </span>
                </div>
              </td>
              <td class="tournaments-cell">
                <span class="tournament-count">{{ world.tournaments?.length || 0 }}</span>
                <small>tournaments</small>
              </td>
              <td class="date-cell">{{ formatDate(world.createdAt) }}</td>
              <td class="actions-cell">
                <button @click="viewWorld(world)" class="btn-action view" title="View">
                  <i class="fas fa-eye"></i>
                </button>
                <button @click="deleteWorld(world)" class="btn-action delete" title="Delete">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- World Pagination -->
      <div v-if="worldPagination.total > 1" class="pagination">
        <button 
          @click="changeWorldPage(page)" 
          v-for="page in worldPaginationPages" 
          :key="page"
          :class="['page-btn', { active: page === worldPagination.current }]"
          :disabled="page === '...'"
        >
          {{ page }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminContent',
  data() {
    return {
      activeContentTab: 'tournaments',
      
      // Tournaments
      tournaments: [],
      loadingTournaments: false,
      tournamentSearch: '',
      tournamentStatus: '',
      tournamentPagination: { current: 1, total: 1, limit: 20 },
      tournamentSearchTimeout: null,
      
      // Worlds
      worlds: [],
      loadingWorlds: false,
      worldSearch: '',
      worldPagination: { current: 1, total: 1, limit: 20 },
      worldSearchTimeout: null
    }
  },
  computed: {
    tournamentPaginationPages() {
      return this.generatePaginationPages(this.tournamentPagination)
    },
    
    worldPaginationPages() {
      return this.generatePaginationPages(this.worldPagination)
    }
  },
  mounted() {
    this.loadTournaments()
    this.loadWorlds()
  },
  methods: {
    async loadTournaments() {
      this.loadingTournaments = true
      try {
        const token = localStorage.getItem('token')
        const params = new URLSearchParams({
          page: this.tournamentPagination.current,
          limit: this.tournamentPagination.limit,
          search: this.tournamentSearch,
          status: this.tournamentStatus
        })

        const response = await fetch(`http://localhost:3001/api/admin/tournaments?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          this.tournaments = data.data.tournaments
          this.tournamentPagination = data.data.pagination
        }
      } catch (error) {
        console.error('Error loading tournaments:', error)
      } finally {
        this.loadingTournaments = false
      }
    },

    async loadWorlds() {
      this.loadingWorlds = true
      try {
        const token = localStorage.getItem('token')
        const params = new URLSearchParams({
          page: this.worldPagination.current,
          limit: this.worldPagination.limit,
          search: this.worldSearch
        })

        const response = await fetch(`http://localhost:3001/api/admin/worlds?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          this.worlds = data.data.worlds
          this.worldPagination = data.data.pagination
        }
      } catch (error) {
        console.error('Error loading worlds:', error)
      } finally {
        this.loadingWorlds = false
      }
    },

    debouncedTournamentSearch() {
      clearTimeout(this.tournamentSearchTimeout)
      this.tournamentSearchTimeout = setTimeout(() => {
        this.tournamentPagination.current = 1
        this.loadTournaments()
      }, 500)
    },

    debouncedWorldSearch() {
      clearTimeout(this.worldSearchTimeout)
      this.worldSearchTimeout = setTimeout(() => {
        this.worldPagination.current = 1
        this.loadWorlds()
      }, 500)
    },

    changeTournamentPage(page) {
      if (page !== '...' && page !== this.tournamentPagination.current) {
        this.tournamentPagination.current = page
        this.loadTournaments()
      }
    },

    changeWorldPage(page) {
      if (page !== '...' && page !== this.worldPagination.current) {
        this.worldPagination.current = page
        this.loadWorlds()
      }
    },

    generatePaginationPages(pagination) {
      const pages = []
      const total = pagination.total
      const current = pagination.current
      
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
    },

    viewTournament(tournament) {
      window.open(`/tournament/${tournament._id}`, '_blank')
    },

    viewWorld(world) {
      window.open(`/worlds/${world._id}`, '_blank')
    },

    async deleteTournament(tournament) {
      if (!confirm(`Delete tournament "${tournament.name}"? This action cannot be undone.`)) return

      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/admin/tournaments/${tournament._id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          await this.loadTournaments()
        }
      } catch (error) {
        console.error('Error deleting tournament:', error)
      }
    },

    async deleteWorld(world) {
      if (!confirm(`Delete world "${world.name}"? This action cannot be undone.`)) return

      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/admin/worlds/${world._id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          await this.loadWorlds()
        }
      } catch (error) {
        console.error('Error deleting world:', error)
      }
    },

    formatStatus(status) {
      const statusMap = {
        draft: 'Draft',
        active: 'Active',
        completed: 'Completed',
        cancelled: 'Cancelled'
      }
      return statusMap[status] || status
    },

    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString()
    }
  }
}
</script>

<style scoped>
.admin-content {
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

.content-tabs {
  display: flex;
  gap: 0.5rem;
}

.tab-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #dee2e6;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #6c757d;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: #f8f9fa;
  color: #495057;
}

.tab-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.controls-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.search-input, .filter-select {
  padding: 0.5rem 1rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
}

.search-input {
  flex: 1;
  max-width: 300px;
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
  margin-bottom: 1.5rem;
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

.admin-table tr:hover {
  background: #f8f9fa;
}

.content-info strong {
  display: block;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.content-info small {
  color: #6c757d;
  font-size: 0.85rem;
}

.user-cell strong {
  display: block;
  color: #2c3e50;
}

.user-cell small {
  color: #6c757d;
  font-size: 0.85rem;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.status-draft {
  background: #e9ecef;
  color: #6c757d;
}

.status-badge.status-active {
  background: #d4edda;
  color: #155724;
}

.status-badge.status-completed {
  background: #cce5ff;
  color: #0056b3;
}

.status-badge.status-cancelled {
  background: #f8d7da;
  color: #721c24;
}

.host-cell span {
  display: block;
  color: #2c3e50;
}

.host-cell small {
  color: #6c757d;
  font-size: 0.85rem;
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

.btn-action.delete {
  background: #dc3545;
  color: white;
}

.btn-action:hover {
  transform: translateY(-1px);
  opacity: 0.9;
}

.world-labels {
  display: flex;
  gap: 0.25rem;
  margin-top: 0.25rem;
}

.world-label {
  padding: 0.125rem 0.5rem;
  background: #e9ecef;
  color: #495057;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
}

.world-label.more {
  background: #dee2e6;
}

.settings-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.setting-item small {
  color: #6c757d;
  font-size: 0.8rem;
}

.data-badge {
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
}

.data-badge.real {
  background: #d4edda;
  color: #155724;
}

.data-badge.simulated {
  background: #fff3cd;
  color: #856404;
}

.tournaments-cell {
  text-align: center;
}

.tournament-count {
  display: block;
  font-size: 1.25rem;
  font-weight: 600;
  color: #007bff;
}

.tournaments-cell small {
  color: #6c757d;
  font-size: 0.8rem;
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
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

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .controls-bar {
    flex-direction: column;
  }
  
  .search-input {
    max-width: none;
  }
  
  .admin-table {
    font-size: 0.8rem;
  }
  
  .admin-table th,
  .admin-table td {
    padding: 0.5rem;
  }
  
  .actions-cell {
    flex-direction: column;
  }
  
  .world-labels {
    flex-wrap: wrap;
  }
}
</style>