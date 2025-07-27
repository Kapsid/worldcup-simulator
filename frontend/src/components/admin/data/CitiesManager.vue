<template>
  <div class="cities-manager">
    <div class="manager-header">
      <div class="header-left">
        <h3><i class="fas fa-city"></i> Cities Management</h3>
        <p>Manage cities database grouped by country</p>
      </div>
      <div class="header-actions">
        <button @click="showAddForm = true" class="btn-add">
          <i class="fas fa-plus"></i>
          Add Country
        </button>
        <button @click="loadCities" :disabled="loading" class="btn-refresh">
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
          Refresh
        </button>
      </div>
    </div>

    <!-- Search -->
    <div class="filters">
      <div class="search-box">
        <i class="fas fa-search"></i>
        <input 
          v-model="searchQuery" 
          placeholder="Search countries or cities..." 
          @input="filterCountries"
        />
      </div>
    </div>

    <!-- Countries Grid -->
    <div class="countries-grid">
      <div 
        v-for="(countryData, countryCode) in filteredCountries" 
        :key="countryCode"
        class="country-card"
      >
        <div class="country-header">
          <div class="country-info">
            <h4>{{ getCountryName(countryCode) }} ({{ countryCode }})</h4>
            <p>{{ getCityStats(countryData) }}</p>
          </div>
          <div class="country-actions">
            <button @click="editCountry(countryCode, countryData)" class="btn-edit-country">
              <i class="fas fa-edit"></i>
            </button>
            <button @click="deleteCountry(countryCode)" class="btn-delete-country">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        
        <div class="cities-preview">
          <div class="cities-section">
            <h5>Capital: <span class="capital-name">{{ countryData.capital }}</span></h5>
          </div>
          
          <div class="cities-section">
            <h5>Cities <span class="count">({{ countryData.cities?.length || 0 }})</span></h5>
            <div class="cities-list">
              <span 
                v-for="(city, index) in (countryData.cities || []).slice(0, 12)" 
                :key="index"
                :class="['city-tag', { 'capital': city === countryData.capital }]"
              >
                {{ city }}
              </span>
              <span v-if="(countryData.cities?.length || 0) > 12" class="more-count">
                +{{ (countryData.cities?.length || 0) - 12 }} more
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showAddForm || showEditForm" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h4>{{ showAddForm ? 'Add New Country' : `Edit ${getCountryName(editingCountry)}` }}</h4>
          <button @click="closeModal" class="btn-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <form @submit.prevent="saveCountry" class="country-form">
          <div v-if="showAddForm" class="form-group">
            <label>Country Code *</label>
            <input v-model="formData.countryCode" required placeholder="e.g., USA, GER, BRA" style="text-transform: uppercase" />
            <small>Use 3-letter country code</small>
          </div>
          
          <div class="form-group">
            <label>Capital City *</label>
            <input v-model="formData.capital" required placeholder="e.g., Washington D.C." />
          </div>
          
          <div class="cities-editor">
            <div class="cities-column">
              <div class="column-header">
                <h5>Cities</h5>
                <div class="column-actions">
                  <button type="button" @click="addCity" class="btn-add-city">
                    <i class="fas fa-plus"></i>
                  </button>
                  <button type="button" @click="clearCities" class="btn-clear">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
              <div class="cities-input-area">
                <textarea 
                  v-model="citiesText"
                  @input="updateCities"
                  rows="20"
                  placeholder="Enter cities, one per line..."
                ></textarea>
                <div class="cities-count">{{ formData.cities.length }} cities</div>
              </div>
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="closeModal" class="btn-cancel">Cancel</button>
            <button 
              type="submit" 
              :disabled="saving || !isFormValid" 
              class="btn-save"
            >
              <i v-if="saving" class="fas fa-spinner fa-spin"></i>
              {{ saving ? 'Saving...' : 'Save Country' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && cities.length === 0" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      Loading cities...
    </div>
  </div>
</template>

<script>
export default {
  name: 'CitiesManager',
  data() {
    return {
      loading: false,
      saving: false,
      countries: {},
      filteredCountries: {},
      searchQuery: '',
      showAddForm: false,
      showEditForm: false,
      editingCountry: null,
      formData: {
        countryCode: '',
        capital: '',
        cities: []
      },
      citiesText: '',
      countryNames: {}
    }
  },
  computed: {
    isFormValid() {
      return (this.showAddForm ? this.formData.countryCode.trim() : true) &&
             this.formData.capital.trim() &&
             this.formData.cities.length > 0
    }
  },
  mounted() {
    this.loadCities()
    this.loadCountryNames()
  },
  methods: {
    async loadCities() {
      this.loading = true
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('http://localhost:3001/api/admin/data/cities', {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          const data = await response.json()
          
          // Transform array data back to country-grouped format
          const countryData = {}
          if (Array.isArray(data.data)) {
            for (const city of data.data) {
              const countryCode = city.country
              if (!countryData[countryCode]) {
                countryData[countryCode] = {
                  capital: city.capital || city.name,
                  cities: []
                }
              }
              
              if (!countryData[countryCode].cities.includes(city.name)) {
                countryData[countryCode].cities.push(city.name)
              }
              
              if (city.isCapital) {
                countryData[countryCode].capital = city.name
              }
            }
          } else {
            // Data is already in the correct grouped format
            Object.assign(countryData, data.data)
          }
          
          this.countries = countryData
          this.filterCountries()
        } else {
          console.error('Failed to load cities')
        }
      } catch (error) {
        console.error('Error loading cities:', error)
      } finally {
        this.loading = false
      }
    },

    async loadCountryNames() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('http://localhost:3001/api/admin/data/countries', {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          const data = await response.json()
          const nameMapping = {}
          data.data.forEach(country => {
            nameMapping[country.code] = country.name
          })
          this.countryNames = nameMapping
        }
      } catch (error) {
        console.error('Error loading country names:', error)
      }
    },

    filterCountries() {
      let filtered = { ...this.countries }

      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase()
        const result = {}
        
        for (const [countryCode, data] of Object.entries(filtered)) {
          const countryName = this.getCountryName(countryCode).toLowerCase()
          const capital = data.capital.toLowerCase()
          const cities = data.cities || []
          
          // Check if query matches country name, capital, or any city
          if (countryName.includes(query) || 
              capital.includes(query) || 
              cities.some(city => city.toLowerCase().includes(query))) {
            result[countryCode] = data
          }
        }
        
        filtered = result
      }

      this.filteredCountries = filtered
    },

    getCountryName(countryCode) {
      return this.countryNames[countryCode] || countryCode
    },

    getCityStats(countryData) {
      const citiesCount = countryData.cities?.length || 0
      return `Capital: ${countryData.capital}, ${citiesCount} cities`
    },

    editCountry(countryCode, countryData) {
      this.editingCountry = countryCode
      this.formData = {
        countryCode: countryCode,
        capital: countryData.capital,
        cities: [...(countryData.cities || [])]
      }
      this.citiesText = this.formData.cities.join('\n')
      this.showEditForm = true
    },

    async deleteCountry(countryCode) {
      if (!confirm(`Are you sure you want to delete all cities for ${this.getCountryName(countryCode)}?`)) return

      try {
        // This would need a specific endpoint to delete a country's cities
        alert('Delete country functionality would need backend implementation')
      } catch (error) {
        console.error('Error deleting country:', error)
        alert('Error deleting country')
      }
    },

    async saveCountry() {
      this.saving = true
      try {
        // For now, we'll need to work with the existing individual city endpoints
        // This is a simplified approach - ideally we'd have country-level endpoints
        alert('Save functionality needs backend implementation for country-level operations')
        this.closeModal()
      } catch (error) {
        console.error('Error saving country:', error)
        alert('Error saving country')
      } finally {
        this.saving = false
      }
    },

    updateCities() {
      this.formData.cities = this.citiesText
        .split('\n')
        .map(city => city.trim())
        .filter(city => city.length > 0)
    },

    addCity() {
      const city = prompt('Enter city name:')
      if (city && city.trim()) {
        this.formData.cities.push(city.trim())
        this.citiesText = this.formData.cities.join('\n')
      }
    },

    clearCities() {
      if (confirm('Clear all cities?')) {
        this.formData.cities = []
        this.citiesText = ''
      }
    },

    closeModal() {
      this.showAddForm = false
      this.showEditForm = false
      this.editingCountry = null
      this.formData = {
        countryCode: '',
        capital: '',
        cities: []
      }
      this.citiesText = ''
    }
  }
}
</script>

<style scoped>
.cities-manager {
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

.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
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
}

.countries-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.country-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  overflow: hidden;
  transition: all 0.3s;
}

.country-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.country-header {
  background: #f8f9fa;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.country-info h4 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1.2rem;
}

.country-info p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.country-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-edit-country, .btn-delete-country {
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

.btn-edit-country {
  background: #ffc107;
  color: #212529;
}

.btn-delete-country {
  background: #dc3545;
  color: white;
}

.cities-preview {
  padding: 1.5rem;
}

.cities-section {
  margin-bottom: 1.5rem;
}

.cities-section:last-child {
  margin-bottom: 0;
}

.cities-section h5 {
  margin: 0 0 0.75rem 0;
  color: #495057;
  font-size: 1rem;
}

.capital-name {
  color: #007bff;
  font-weight: 600;
}

.count {
  color: #6c757d;
  font-weight: normal;
  font-size: 0.9rem;
}

.cities-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.city-tag {
  background: #e9ecef;
  color: #495057;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.city-tag.capital {
  background: #007bff;
  color: white;
}

.more-count {
  background: #6c757d;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
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

.form-group input {
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

.cities-editor {
  margin-bottom: 1.5rem;
}

.cities-column {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
}

.column-header {
  background: #f8f9fa;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e9ecef;
}

.column-header h5 {
  margin: 0;
  color: #495057;
}

.column-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-add-city, .btn-clear {
  padding: 0.25rem 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.btn-add-city {
  background: #28a745;
  color: white;
}

.btn-clear {
  background: #dc3545;
  color: white;
}

.cities-input-area {
  position: relative;
}

.cities-input-area textarea {
  width: 100%;
  border: none;
  padding: 1rem;
  font-family: monospace;
  font-size: 0.9rem;
  resize: vertical;
  outline: none;
}

.cities-count {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
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
  .countries-grid {
    grid-template-columns: 1fr;
  }
  
  .manager-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filters {
    flex-direction: column;
  }
}
</style>