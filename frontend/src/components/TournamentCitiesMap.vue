<template>
  <div class="cities-map-container">
    <div id="cities-map" class="cities-map">
      <div v-if="!map" class="map-loading">
        <i class="fas fa-spinner fa-spin"></i>
        <span>Loading map...</span>
      </div>
    </div>
    
    <!-- Cities Legend -->
    <div class="cities-legend">
      <h5>
        <i class="fas fa-map-marker-alt"></i>
        Tournament Host Cities
      </h5>
      <div class="legend-items">
        <div v-for="city in cities" :key="city.name" class="legend-item">
          <div class="legend-marker">
            <i class="fas fa-futbol"></i>
          </div>
          <div class="legend-info">
            <span class="legend-city">{{ city.name }}</span>
            <span class="legend-stadium" v-if="city.stadium">{{ city.stadium }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export default {
  name: 'TournamentCitiesMap',
  props: {
    cities: {
      type: Array,
      required: true
    },
    hostCountry: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      map: null,
      markers: []
    }
  },
  mounted() {
    // Wait a bit longer for DOM to be fully ready
    setTimeout(() => {
      this.initMap()
    }, 100)
  },
  watch: {
    cities: {
      handler() {
        if (this.map) {
          this.map.remove()
          this.map = null
          this.markers = []
        }
        setTimeout(() => {
          this.initMap()
        }, 100)
      },
      deep: true
    }
  },
  beforeUnmount() {
    if (this.map) {
      this.map.remove()
    }
  },
  methods: {
    async initMap() {
      try {
        console.log('Initializing map...')
        console.log('Cities prop:', this.cities)
        
        // Check if map container exists
        const mapContainer = document.getElementById('cities-map')
        if (!mapContainer) {
          console.error('Map container not found')
          return
        }
        
        // Add coordinates to cities if not present
        const citiesWithCoords = await this.addCoordinatesToCities()
        console.log('Cities with coordinates:', citiesWithCoords)
        
        if (citiesWithCoords.length === 0) {
          console.warn('No cities with coordinates found')
          // Show a default world map
          this.map = L.map('cities-map', {
            center: [20, 0],
            zoom: 2,
            zoomControl: true,
            scrollWheelZoom: true
          })
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
          }).addTo(this.map)
          return
        }
        
        // Calculate center and bounds
        const { center, bounds } = this.calculateMapBounds(citiesWithCoords)
        console.log('Map center:', center, 'bounds:', bounds)
        
        // Initialize map
        this.map = L.map('cities-map', {
          center: center,
          zoom: 6,
          zoomControl: false,
          scrollWheelZoom: false,
          doubleClickZoom: false,
          boxZoom: false,
          keyboard: false,
          dragging: false,
          touchZoom: false
        })
        
        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 18
        }).addTo(this.map)
        
        // Create custom ball icon using favicon
        const ballIcon = L.divIcon({
          html: `<div class="city-marker-content">
                   <img src="/favicon.svg" class="city-marker-icon" alt="Football">
                   <span class="city-marker-label"></span>
                 </div>`,
          iconSize: [60, 45],
          iconAnchor: [30, 40],
          popupAnchor: [0, -40],
          className: 'city-marker'
        })
        
        // Add markers for each city
        citiesWithCoords.forEach(city => {
          console.log('Adding marker for:', city.name, city.latitude, city.longitude)
          
          // Create custom icon with city name
          const cityIcon = L.divIcon({
            html: `<div class="city-marker-content">
                     <img src="/favicon.svg" class="city-marker-icon" alt="Football">
                     <span class="city-marker-label">${city.name}</span>
                   </div>`,
            iconSize: [80, 50],
            iconAnchor: [40, 45],
            popupAnchor: [0, -45],
            className: 'city-marker'
          })
          
          const marker = L.marker([city.latitude, city.longitude], { 
            icon: cityIcon 
          }).addTo(this.map)
          
          // Create popup content
          const popupContent = this.createPopupContent(city)
          marker.bindPopup(popupContent)
          
          this.markers.push(marker)
        })
        
        // Fit map to show all markers
        if (citiesWithCoords.length > 1 && bounds) {
          this.map.fitBounds(bounds, { padding: [20, 20] })
        } else if (citiesWithCoords.length === 1) {
          this.map.setView([citiesWithCoords[0].latitude, citiesWithCoords[0].longitude], 8)
        }
        
        // Force map to invalidate size and redraw
        setTimeout(() => {
          if (this.map) {
            this.map.invalidateSize()
          }
        }, 200)
        
        console.log('Map initialized successfully')
        
      } catch (error) {
        console.error('Error initializing map:', error)
      }
    },
    
    async addCoordinatesToCities() {
      // Predefined coordinates for common cities
      const cityCoordinates = {
        // USA cities
        'New York': { latitude: 40.7128, longitude: -74.0060 },
        'Los Angeles': { latitude: 34.0522, longitude: -118.2437 },
        'Chicago': { latitude: 41.8781, longitude: -87.6298 },
        'Miami': { latitude: 25.7617, longitude: -80.1918 },
        'Dallas': { latitude: 32.7767, longitude: -96.7970 },
        'Boston': { latitude: 42.3601, longitude: -71.0589 },
        'Seattle': { latitude: 47.6062, longitude: -122.3321 },
        'Atlanta': { latitude: 33.7490, longitude: -84.3880 },
        'Philadelphia': { latitude: 39.9526, longitude: -75.1652 },
        'Kansas City': { latitude: 39.0997, longitude: -94.5786 },
        'Houston': { latitude: 29.7604, longitude: -95.3698 },
        
        // Germany cities
        'Berlin': { latitude: 52.5200, longitude: 13.4050 },
        'Munich': { latitude: 48.1351, longitude: 11.5820 },
        'Hamburg': { latitude: 53.5511, longitude: 9.9937 },
        'Cologne': { latitude: 50.9375, longitude: 6.9603 },
        'Frankfurt': { latitude: 50.1109, longitude: 8.6821 },
        'Stuttgart': { latitude: 48.7758, longitude: 9.1829 },
        'Dortmund': { latitude: 51.5136, longitude: 7.4653 },
        'Düsseldorf': { latitude: 51.2277, longitude: 6.7735 },
        'Leipzig': { latitude: 51.3397, longitude: 12.3731 },
        'Gelsenkirchen': { latitude: 51.5177, longitude: 7.0857 },
        
        // Brazil cities
        'Rio de Janeiro': { latitude: -22.9068, longitude: -43.1729 },
        'São Paulo': { latitude: -23.5505, longitude: -46.6333 },
        'Brasília': { latitude: -15.8267, longitude: -47.9218 },
        'Salvador': { latitude: -12.9714, longitude: -38.5014 },
        'Belo Horizonte': { latitude: -19.9167, longitude: -43.9345 },
        'Fortaleza': { latitude: -3.7319, longitude: -38.5267 },
        'Recife': { latitude: -8.0476, longitude: -34.8770 },
        'Porto Alegre': { latitude: -30.0346, longitude: -51.2177 },
        'Curitiba': { latitude: -25.4284, longitude: -49.2733 },
        'Manaus': { latitude: -3.1190, longitude: -60.0217 },
        'Natal': { latitude: -5.7945, longitude: -35.2110 },
        'Cuiabá': { latitude: -15.6014, longitude: -56.0979 },
        
        // South Korea cities
        'Seoul': { latitude: 37.5665, longitude: 126.9780 },
        'Busan': { latitude: 35.1796, longitude: 129.0756 },
        'Incheon': { latitude: 37.4563, longitude: 126.7052 },
        'Daegu': { latitude: 35.8714, longitude: 128.6014 },
        'Daejeon': { latitude: 36.3504, longitude: 127.3845 },
        'Gwangju': { latitude: 35.1595, longitude: 126.8526 },
        'Suwon': { latitude: 37.2636, longitude: 127.0286 },
        'Ulsan': { latitude: 35.5384, longitude: 129.3114 },
        'Jeonju': { latitude: 35.8242, longitude: 127.1480 },
        
        // Japan cities
        'Tokyo': { latitude: 35.6762, longitude: 139.6503 },
        'Osaka': { latitude: 34.6937, longitude: 135.5023 },
        'Yokohama': { latitude: 35.4437, longitude: 139.6380 },
        'Sapporo': { latitude: 43.0642, longitude: 141.3469 },
        'Sendai': { latitude: 38.2682, longitude: 140.8694 },
        'Shizuoka': { latitude: 34.9756, longitude: 138.3828 },
        'Niigata': { latitude: 37.9161, longitude: 139.0364 },
        'Ibaraki': { latitude: 36.3418, longitude: 140.4468 },
        'Oita': { latitude: 33.2382, longitude: 131.6126 },
        'Kobe': { latitude: 34.6901, longitude: 135.1956 },
        
        // Other common cities
        'London': { latitude: 51.5074, longitude: -0.1278 },
        'Paris': { latitude: 48.8566, longitude: 2.3522 },
        'Madrid': { latitude: 40.4168, longitude: -3.7038 },
        'Rome': { latitude: 41.9028, longitude: 12.4964 },
        'Moscow': { latitude: 55.7558, longitude: 37.6173 },
        'Beijing': { latitude: 39.9042, longitude: 116.4074 },
        'Sydney': { latitude: -33.8688, longitude: 151.2093 },
        'Melbourne': { latitude: -37.8136, longitude: 144.9631 },
        'Cairo': { latitude: 30.0444, longitude: 31.2357 },
        'Johannesburg': { latitude: -26.2041, longitude: 28.0473 },
        
        // Qatar cities
        'Doha': { latitude: 25.2854, longitude: 51.5310 },
        'Al Rayyan': { latitude: 25.2919, longitude: 51.4240 },
        'Al Wakrah': { latitude: 25.1657, longitude: 51.6069 },
        'Lusail': { latitude: 25.3548, longitude: 51.5265 },
        
        // Russia cities
        'Saint Petersburg': { latitude: 59.9311, longitude: 30.3609 },
        'Kaliningrad': { latitude: 54.7104, longitude: 20.4522 },
        'Kazan': { latitude: 55.8304, longitude: 49.0661 },
        'Nizhny Novgorod': { latitude: 56.2965, longitude: 43.9361 },
        'Samara': { latitude: 53.2001, longitude: 50.1500 },
        'Volgograd': { latitude: 48.7080, longitude: 44.5133 },
        'Saransk': { latitude: 54.1838, longitude: 45.1749 },
        'Rostov-on-Don': { latitude: 47.2357, longitude: 39.7015 },
        'Sochi': { latitude: 43.6028, longitude: 39.7342 },
        'Yekaterinburg': { latitude: 56.8431, longitude: 60.6454 },
        
        // South Africa cities
        'Cape Town': { latitude: -33.9249, longitude: 18.4241 },
        'Durban': { latitude: -29.8587, longitude: 31.0218 },
        'Port Elizabeth': { latitude: -33.9608, longitude: 25.6022 },
        'Bloemfontein': { latitude: -29.0852, longitude: 26.1596 },
        'Pretoria': { latitude: -25.7479, longitude: 28.2293 },
        'Nelspruit': { latitude: -25.4753, longitude: 30.9700 },
        'Polokwane': { latitude: -23.9045, longitude: 29.4689 },
        'Rustenburg': { latitude: -25.6672, longitude: 27.2424 },
        
        // France cities
        'Marseille': { latitude: 43.2965, longitude: 5.3698 },
        'Lyon': { latitude: 45.7640, longitude: 4.8357 },
        'Toulouse': { latitude: 43.6047, longitude: 1.4442 },
        'Nice': { latitude: 43.7102, longitude: 7.2620 },
        'Nantes': { latitude: 47.2184, longitude: -1.5536 },
        'Strasbourg': { latitude: 48.5734, longitude: 7.7521 },
        'Montpellier': { latitude: 43.6110, longitude: 3.8767 },
        'Bordeaux': { latitude: 44.8378, longitude: -0.5792 },
        'Lille': { latitude: 50.6292, longitude: 3.0573 },
        'Rennes': { latitude: 48.1173, longitude: -1.6778 },
        'Reims': { latitude: 49.2583, longitude: 4.0317 },
        'Saint-Étienne': { latitude: 45.4397, longitude: 4.3872 },
        'Le Havre': { latitude: 49.4944, longitude: 0.1079 },
        'Lens': { latitude: 50.4292, longitude: 2.8317 },
        
        // Mexico cities
        'Mexico City': { latitude: 19.4326, longitude: -99.1332 },
        'Guadalajara': { latitude: 20.6597, longitude: -103.3496 },
        'Monterrey': { latitude: 25.6866, longitude: -100.3161 },
        'Puebla': { latitude: 19.0414, longitude: -98.2063 },
        'Tijuana': { latitude: 32.5149, longitude: -117.0382 },
        'León': { latitude: 21.1619, longitude: -101.6921 },
        'Toluca': { latitude: 19.2889, longitude: -99.6562 },
        'Tuxtla Gutiérrez': { latitude: 16.7516, longitude: -93.1161 },
        'Hermosillo': { latitude: 29.0759, longitude: -110.9559 },
        'Oaxaca': { latitude: 17.0732, longitude: -96.7266 },
        'Morelia': { latitude: 19.7006, longitude: -101.1844 },
        'Aguascalientes': { latitude: 21.8853, longitude: -102.2916 },
        
        // Canada/USA cities (additional)
        'Toronto': { latitude: 43.6532, longitude: -79.3832 },
        'Montreal': { latitude: 45.5017, longitude: -73.5673 },
        'Vancouver': { latitude: 49.2827, longitude: -123.1207 },
        'Denver': { latitude: 39.7392, longitude: -104.9903 },
        'Nashville': { latitude: 36.1627, longitude: -86.7816 },
        'Cincinnati': { latitude: 39.1031, longitude: -84.5120 },
        'Orlando': { latitude: 28.5383, longitude: -81.3792 },
        'Santa Clara': { latitude: 37.3541, longitude: -121.9552 },
        'East Rutherford': { latitude: 40.8135, longitude: -74.0707 },
        'Foxborough': { latitude: 42.0909, longitude: -71.2643 },
        'Landover': { latitude: 38.9076, longitude: -76.864 },
        
        // Argentina cities
        'Buenos Aires': { latitude: -34.6118, longitude: -58.3960 },
        'Córdoba': { latitude: -31.4201, longitude: -64.1888 },
        'Rosario': { latitude: -32.9442, longitude: -60.6505 },
        'Mendoza': { latitude: -32.8908, longitude: -68.8272 },
        'La Plata': { latitude: -34.9215, longitude: -57.9545 },
        'Mar del Plata': { latitude: -38.0055, longitude: -57.5426 },
        'Salta': { latitude: -24.7859, longitude: -65.4117 },
        'Santa Fe': { latitude: -31.6333, longitude: -60.7000 },
        
        // Chile cities
        'Santiago': { latitude: -33.4489, longitude: -70.6693 },
        'Valparaíso': { latitude: -33.0472, longitude: -71.6127 },
        'Concepción': { latitude: -36.8201, longitude: -73.0444 },
        'La Serena': { latitude: -29.9027, longitude: -71.2519 },
        'Antofagasta': { latitude: -23.6509, longitude: -70.3975 },
        'Temuco': { latitude: -38.7359, longitude: -72.5904 },
        'Rancagua': { latitude: -34.1708, longitude: -70.7394 },
        'Talca': { latitude: -35.4264, longitude: -71.6554 },
        
        // England cities
        'Manchester': { latitude: 53.4808, longitude: -2.2426 },
        'Liverpool': { latitude: 53.4084, longitude: -2.9916 },
        'Birmingham': { latitude: 52.4862, longitude: -1.8904 },
        'Leeds': { latitude: 53.8008, longitude: -1.5491 },
        'Sheffield': { latitude: 53.3811, longitude: -1.4701 },
        'Bristol': { latitude: 51.4545, longitude: -2.5879 },
        'Newcastle': { latitude: 54.9783, longitude: -1.6178 },
        'Nottingham': { latitude: 52.9548, longitude: -1.1581 },
        'Leicester': { latitude: 52.6369, longitude: -1.1398 },
        'Coventry': { latitude: 52.4068, longitude: -1.5197 },
        'London': { latitude: 51.5074, longitude: -0.1278 },
        'Southampton': { latitude: 50.9097, longitude: -1.4044 },
        
        // Wales cities
        'Cardiff': { latitude: 51.4816, longitude: -3.1791 },
        'Swansea': { latitude: 51.6214, longitude: -3.9436 },
        'Newport': { latitude: 51.5877, longitude: -2.9984 },
        'Wrexham': { latitude: 53.0478, longitude: -2.9916 },
        'Bangor': { latitude: 53.2280, longitude: -4.1299 },
        'Aberystwyth': { latitude: 52.4140, longitude: -4.0830 },
        
        // Scotland cities
        'Edinburgh': { latitude: 55.9533, longitude: -3.1883 },
        'Glasgow': { latitude: 55.8642, longitude: -4.2518 },
        'Aberdeen': { latitude: 57.1497, longitude: -2.0943 },
        'Dundee': { latitude: 56.4620, longitude: -2.9707 },
        'Stirling': { latitude: 56.1165, longitude: -3.9369 },
        'Inverness': { latitude: 57.4778, longitude: -4.2247 },
        'Perth': { latitude: 56.3953, longitude: -3.4316 },
        
        // Northern Ireland cities
        'Belfast': { latitude: 54.5973, longitude: -5.9301 },
        'Derry': { latitude: 54.9966, longitude: -7.3086 },
        'Londonderry': { latitude: 54.9966, longitude: -7.3086 },
        'Lisburn': { latitude: 54.5162, longitude: -6.0583 },
        'Newry': { latitude: 54.1751, longitude: -6.3402 }
        
      }
      
      return this.cities.map(city => {
        // Try exact match first
        let coords = cityCoordinates[city.name]
        
        // If no exact match, try case-insensitive match
        if (!coords) {
          const cityName = city.name.toLowerCase()
          const matchingKey = Object.keys(cityCoordinates).find(key => 
            key.toLowerCase() === cityName
          )
          if (matchingKey) {
            coords = cityCoordinates[matchingKey]
          }
        }
        
        // If still no match, try partial matching
        if (!coords) {
          const cityName = city.name.toLowerCase()
          const matchingKey = Object.keys(cityCoordinates).find(key => 
            key.toLowerCase().includes(cityName) || cityName.includes(key.toLowerCase())
          )
          if (matchingKey) {
            coords = cityCoordinates[matchingKey]
          }
        }
        
        if (coords) {
          console.log(`Found coordinates for ${city.name}:`, coords)
          return {
            ...city,
            latitude: coords.latitude,
            longitude: coords.longitude
          }
        } else {
          console.warn(`No coordinates found for city: ${city.name}`)
        }
        return null
      }).filter(Boolean)
    },
    
    calculateMapBounds(cities) {
      if (cities.length === 0) {
        return { center: [0, 0], bounds: null }
      }
      
      if (cities.length === 1) {
        return { 
          center: [cities[0].latitude, cities[0].longitude], 
          bounds: null 
        }
      }
      
      const lats = cities.map(city => city.latitude)
      const lngs = cities.map(city => city.longitude)
      
      const minLat = Math.min(...lats)
      const maxLat = Math.max(...lats)
      const minLng = Math.min(...lngs)
      const maxLng = Math.max(...lngs)
      
      const center = [(minLat + maxLat) / 2, (minLng + maxLng) / 2]
      const bounds = [[minLat, minLng], [maxLat, maxLng]]
      
      return { center, bounds }
    },
    
    createPopupContent(city) {
      return `
        <div class="city-popup">
          <h4 class="popup-city-name">
            <i class="fas fa-map-marker-alt"></i>
            ${city.name}
          </h4>
          ${city.stadium ? `
            <div class="popup-detail">
              <i class="fas fa-futbol"></i>
              <strong>Stadium:</strong> ${city.stadium}
            </div>
          ` : ''}
          ${city.capacity ? `
            <div class="popup-detail">
              <i class="fas fa-users"></i>
              <strong>Capacity:</strong> ${city.capacity.toLocaleString()}
            </div>
          ` : ''}
          ${city.population ? `
            <div class="popup-detail">
              <i class="fas fa-city"></i>
              <strong>Population:</strong> ${city.population}
            </div>
          ` : ''}
        </div>
      `
    }
  }
}
</script>

<style scoped>
.cities-map-container {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
  height: 400px;
}

.cities-map {
  width: 100%;
  height: 400px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 2px solid #e9ecef;
  background: #f8f9fa;
  position: relative;
}

.map-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--fifa-blue);
  font-size: 1rem;
}

.map-loading i {
  font-size: 2rem;
  color: var(--fifa-gold);
}

.cities-legend {
  background: white;
  border-radius: var(--radius-lg);
  padding: 20px;
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow-y: auto;
}

.cities-legend h5 {
  margin: 0 0 16px 0;
  color: var(--fifa-blue);
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 8px;
}

.legend-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.legend-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px;
  border-radius: var(--radius-sm);
  transition: background 0.2s ease;
}

.legend-item:hover {
  background: #f8f9fa;
}

.legend-marker {
  color: var(--fifa-blue);
  font-size: 1.1rem;
  margin-top: 2px;
}

.legend-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.legend-city {
  font-weight: 600;
  color: var(--fifa-dark-blue);
  font-size: 0.9rem;
}

.legend-stadium {
  font-size: 0.8rem;
  color: var(--gray);
}

@media (max-width: 768px) {
  .cities-map-container {
    grid-template-columns: 1fr;
    grid-template-rows: 300px auto;
    height: auto;
  }
  
  .cities-legend {
    max-height: 200px;
  }
}
</style>

<!-- Global styles for map markers and popups -->
<style>
.city-marker {
  background: transparent !important;
  border: none !important;
}

.city-marker-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.city-marker-content:hover {
  transform: scale(1.1);
}

.city-marker-icon {
  width: 19px;
  height: 19px;
  filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3));
  margin-bottom: 2px;
}

.city-marker-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--fifa-blue);
  text-align: center;
  background: rgba(255, 255, 255, 0.9);
  padding: 2px 6px;
  border-radius: 8px;
  border: 1px solid var(--fifa-blue);
  white-space: nowrap;
  text-shadow: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.city-popup {
  font-family: var(--font-family);
  min-width: 200px;
}

.popup-city-name {
  margin: 0 0 10px 0;
  color: var(--fifa-blue);
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 8px;
}

.popup-detail {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 0.9rem;
  color: var(--gray);
}

.popup-detail i {
  color: var(--fifa-blue);
  width: 14px;
}

.popup-detail strong {
  color: var(--fifa-dark-blue);
}
</style>