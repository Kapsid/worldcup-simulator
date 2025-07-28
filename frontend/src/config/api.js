// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
export const API_URL = `${API_BASE_URL}/api`

// Helper function to get full API endpoint
export const getApiEndpoint = (path) => {
  return `${API_URL}${path.startsWith('/') ? path : '/' + path}`
}

export default {
  API_BASE_URL,
  API_URL,
  getApiEndpoint
}