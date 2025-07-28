// API Service - All API endpoints in one place
import apiClient from '../utils/apiClient.js'

export const authAPI = {
  login: (credentials) => apiClient.post('/login', credentials),
  register: (userData) => apiClient.post('/register', userData),
  logout: () => apiClient.post('/logout'),
  getProfile: () => apiClient.get('/profile'),
  getCaptcha: () => apiClient.get('/captcha')
}

export const worldsAPI = {
  getAll: () => apiClient.get('/worlds'),
  getById: (id) => apiClient.get(`/worlds/${id}`),
  create: (data) => apiClient.post('/worlds', data),
  update: (id, data) => apiClient.put(`/worlds/${id}`, data),
  delete: (id) => apiClient.delete(`/worlds/${id}`),
  getStats: (id) => apiClient.get(`/worlds/${id}/stats`),
  getHistory: (id) => apiClient.get(`/worlds/${id}/history`),
  getRankings: (id) => apiClient.get(`/worlds/${id}/rankings`),
  getHostCandidates: (id) => apiClient.get(`/worlds/${id}/host-candidates`)
}

export const tournamentsAPI = {
  getAll: () => apiClient.get('/tournaments'),
  getById: (id) => apiClient.get(`/tournaments/${id}`),
  create: (data) => apiClient.post('/tournaments', data),
  update: (id, data) => apiClient.put(`/tournaments/${id}`, data),
  delete: (id) => apiClient.delete(`/tournaments/${id}`),
  getCountries: () => apiClient.get('/tournament/countries'),
  getLastOpened: () => apiClient.get('/tournament/last-opened'),
  getTopScorers: (id, limit = 20) => apiClient.get(`/tournament/${id}/top-scorers?limit=${limit}`),
  getTopAssists: (id, limit = 20) => apiClient.get(`/tournament/${id}/top-assists?limit=${limit}`),
  getStatistics: (id) => apiClient.get(`/tournament/${id}/statistics`),
  updateStatus: (id, status) => apiClient.put(`/tournament/${id}/status`, { status })
}

export const teamsAPI = {
  getByTournament: (tournamentId) => apiClient.get(`/teams/tournament/${tournamentId}`),
  getDetails: (tournamentId, teamId) => apiClient.get(`/teams/${teamId}?tournamentId=${tournamentId}`),
  updateLineup: (teamId, lineup) => apiClient.put(`/teams/${teamId}/lineup`, { lineup })
}

export const matchesAPI = {
  getByTournament: (tournamentId) => apiClient.get(`/matches/tournament/${tournamentId}`),
  getById: (id) => apiClient.get(`/matches/${id}`),
  simulate: (id) => apiClient.post(`/matches/${id}/simulate`),
  simulateAll: (tournamentId, matchday) => apiClient.post(`/matches/tournament/${tournamentId}/simulate-matchday`, { matchday })
}

export const knockoutAPI = {
  getByTournament: (tournamentId) => apiClient.get(`/knockout/tournament/${tournamentId}`),
  generate: (tournamentId) => apiClient.post(`/knockout/tournament/${tournamentId}/generate`),
  simulate: (matchId) => apiClient.post(`/knockout/match/${matchId}/simulate`),
  simulateRound: (tournamentId, round) => apiClient.post(`/knockout/tournament/${tournamentId}/simulate-round`, { round })
}

export const qualificationAPI = {
  getByTournament: (tournamentId) => apiClient.get(`/qualification/${tournamentId}`),
  create: (data) => apiClient.post('/qualification', data),
  getConfederations: () => apiClient.get('/qualification/confederations'),
  simulateMatchday: (qualificationId, confederation, matchday) => 
    apiClient.post(`/qualification/${qualificationId}/simulate-matchday`, { confederation, matchday }),
  simulatePlayoffs: (qualificationId) => apiClient.post(`/qualification/${qualificationId}/simulate-playoffs`),
  getQualifiedTeams: (qualificationId) => apiClient.get(`/qualification/${qualificationId}/qualified-teams`)
}

export const playersAPI = {
  getByTournament: (tournamentId) => apiClient.get(`/players/tournament/${tournamentId}`),
  getById: (id) => apiClient.get(`/players/${id}`),
  getStats: (playerId, tournamentId) => apiClient.get(`/players/${playerId}/stats?tournamentId=${tournamentId}`)
}

export const membershipAPI = {
  getStatus: () => apiClient.get('/membership/status'),
  getPlans: () => apiClient.get('/membership/plans'),
  subscribe: (plan) => apiClient.post('/membership/subscribe', { plan })
}

export const drawAPI = {
  getPots: (tournamentId) => apiClient.get(`/draw/${tournamentId}/pots`),
  performDraw: (tournamentId) => apiClient.post(`/draw/${tournamentId}/perform`)
}

export const newsAPI = {
  getByTournament: (tournamentId, limit = 10) => apiClient.get(`/news/tournament/${tournamentId}?limit=${limit}`)
}

export const profileAPI = {
  get: () => apiClient.get('/profile'),
  update: (data) => apiClient.put('/profile', data),
  changePassword: (data) => apiClient.put('/profile/change-password', data),
  updateSubscription: (tier) => apiClient.put('/profile/subscription', { subscriptionTier: tier })
}

// Export all APIs
export default {
  auth: authAPI,
  worlds: worldsAPI,
  tournaments: tournamentsAPI,
  teams: teamsAPI,
  matches: matchesAPI,
  knockout: knockoutAPI,
  qualification: qualificationAPI,
  players: playersAPI,
  membership: membershipAPI,
  draw: drawAPI,
  news: newsAPI,
  profile: profileAPI
}