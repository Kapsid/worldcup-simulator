<template>
  <div class="data-management">
    <div class="section-header">
      <h2><i class="fas fa-database"></i> Data Management</h2>
      <p>Manage all backend data files including countries, confederations, cities, tactics, and World Cup history</p>
    </div>

    <!-- Overview Cards -->
    <div class="overview-grid" v-if="overview">
      <div class="data-card">
        <div class="data-icon countries">
          <i class="fas fa-flag"></i>
        </div>
        <div class="data-info">
          <h3>{{ overview.countries?.count || 0 }}</h3>
          <p>Countries</p>
          <small>{{ overview.countries?.confederations || 0 }} confederations</small>
        </div>
      </div>
      
      <div class="data-card">
        <div class="data-icon cities">
          <i class="fas fa-city"></i>
        </div>
        <div class="data-info">
          <h3>{{ overview.cities?.count || 0 }}</h3>
          <p>Cities</p>
          <small>{{ overview.cities?.countries || 0 }} countries</small>
        </div>
      </div>
      
      <div class="data-card">
        <div class="data-icon tactics">
          <i class="fas fa-chess"></i>
        </div>
        <div class="data-info">
          <h3>{{ overview.tactics?.count || 0 }}</h3>
          <p>Formations</p>
          <small>{{ overview.tactics?.formations?.slice(0, 2).join(', ') }}...</small>
        </div>
      </div>
      
      <div class="data-card">
        <div class="data-icon history">
          <i class="fas fa-history"></i>
        </div>
        <div class="data-info">
          <h3>{{ overview.worldCupHistory?.count || 0 }}</h3>
          <p>World Cups</p>
          <small v-if="overview.worldCupHistory?.yearRange">
            {{ overview.worldCupHistory.yearRange.earliest }} - {{ overview.worldCupHistory.yearRange.latest }}
          </small>
        </div>
      </div>
    </div>

    <!-- Data Management Tabs -->
    <div class="data-tabs">
      <button 
        v-for="tab in dataTabs" 
        :key="tab.id"
        @click="activeDataTab = tab.id"
        :class="['data-tab-btn', { active: activeDataTab === tab.id }]"
      >
        <i :class="tab.icon"></i>
        {{ tab.name }}
      </button>
    </div>

    <!-- Tab Content -->
    <div class="data-tab-content">
      <!-- Countries Management -->
      <div v-if="activeDataTab === 'countries'" class="data-section">
        <CountriesManager />
      </div>

      <!-- Confederations Management -->
      <div v-if="activeDataTab === 'confederations'" class="data-section">
        <ConfederationsManager />
      </div>

      <!-- Cities Management -->
      <div v-if="activeDataTab === 'cities'" class="data-section">
        <CitiesManager />
      </div>

      <!-- Tactics Management -->
      <div v-if="activeDataTab === 'tactics'" class="data-section">
        <TacticsManager />
      </div>

      <!-- World Cup History Management -->
      <div v-if="activeDataTab === 'history'" class="data-section">
        <HistoryManager />
      </div>

      <!-- Player Names Management -->
      <div v-if="activeDataTab === 'players'" class="data-section">
        <PlayerNamesManager />
      </div>

      <!-- Backup & Restore -->
      <div v-if="activeDataTab === 'backup'" class="data-section">
        <BackupManager />
      </div>
    </div>
  </div>
</template>

<script>
import CountriesManager from './data/CountriesManager.vue'
import ConfederationsManager from './data/ConfederationsManager.vue'
import CitiesManager from './data/CitiesManager.vue'
import TacticsManager from './data/TacticsManager.vue'
import HistoryManager from './data/HistoryManager.vue'
import PlayerNamesManager from './data/PlayerNamesManager.vue'
import BackupManager from './data/BackupManager.vue'
import { API_URL } from '../../config/api.js'

export default {
  name: 'AdminDataManagement',
  components: {
    CountriesManager,
    ConfederationsManager,
    CitiesManager,
    TacticsManager,
    HistoryManager,
    PlayerNamesManager,
    BackupManager
  },
  data() {
    return {
      loading: false,
      overview: null,
      activeDataTab: 'countries',
      dataTabs: [
        { id: 'countries', name: 'Countries', icon: 'fas fa-flag' },
        { id: 'confederations', name: 'Confederations', icon: 'fas fa-globe' },
        { id: 'cities', name: 'Cities', icon: 'fas fa-city' },
        { id: 'tactics', name: 'Tactics', icon: 'fas fa-chess' },
        { id: 'history', name: 'World Cup History', icon: 'fas fa-history' },
        { id: 'players', name: 'Player Names', icon: 'fas fa-users' },
        { id: 'backup', name: 'Backup & Restore', icon: 'fas fa-download' }
      ]
    }
  },
  mounted() {
    this.loadOverview()
  },
  methods: {
    async loadOverview() {
      this.loading = true
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/admin/data/overview`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          this.overview = data.data
        } else {
          console.error('Failed to load data overview')
        }
      } catch (error) {
        console.error('Error loading overview:', error)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.data-management {
  padding: 0;
}

.section-header {
  margin-bottom: 2rem;
}

.section-header h2 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1.5rem;
  font-weight: 600;
}

.section-header p {
  margin: 0;
  color: #6c757d;
  font-size: 0.95rem;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.data-card {
  background: #f8f9fa;
  padding: 1.25rem;
  border-radius: 8px;
  border-left: 4px solid #007bff;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s;
}

.data-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.data-icon {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: white;
}

.data-icon.countries { background: #e74c3c; }
.data-icon.cities { background: #3498db; }
.data-icon.tactics { background: #f39c12; }
.data-icon.history { background: #9b59b6; }

.data-info h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
}

.data-info p {
  margin: 0 0 0.25rem 0;
  color: #495057;
  font-weight: 500;
  font-size: 0.9rem;
}

.data-info small {
  color: #6c757d;
  font-size: 0.8rem;
}

.data-tabs {
  display: flex;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 0.25rem;
  margin-bottom: 1.5rem;
  overflow-x: auto;
  gap: 0.25rem;
}

.data-tab-btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #6c757d;
  transition: all 0.2s;
  white-space: nowrap;
  font-size: 0.85rem;
}

.data-tab-btn:hover {
  background: #e9ecef;
  color: #495057;
}

.data-tab-btn.active {
  background: #007bff;
  color: white;
}

.data-tab-content {
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  min-height: 400px;
}

.data-section {
  padding: 1.5rem;
}

@media (max-width: 768px) {
  .overview-grid {
    grid-template-columns: 1fr;
  }
  
  .data-tabs {
    flex-direction: column;
  }
  
  .data-tab-btn {
    justify-content: flex-start;
  }
}
</style>