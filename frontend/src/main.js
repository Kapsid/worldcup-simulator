import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Login from './views/Login.vue'
import Register from './views/Register.vue'
import Dashboard from './views/Dashboard.vue'
import Worlds from './views/Worlds.vue'
import WorldDetail from './views/WorldDetail.vue'
import Tournament from './views/Tournament.vue'
import TournamentDetail from './views/TournamentDetail.vue'
import TeamDetail from './views/TeamDetail.vue'
import QualifyingTeamDetail from './views/QualifyingTeamDetail.vue'
import MatchDetail from './views/MatchDetail.vue'
import PlayerDetail from './views/PlayerDetail.vue'
import Profile from './views/Profile.vue'
import AdminDashboard from './views/AdminDashboard.vue'
import './styles/global.css'

const routes = [
  { path: '/', component: Login },
  { path: '/register', component: Register },
  { path: '/dashboard', component: Dashboard },
  { path: '/worlds', component: Worlds },
  { path: '/worlds/:id', component: WorldDetail },
  { path: '/tournaments', component: Tournament },
  { path: '/tournament/:id', component: TournamentDetail },
  { path: '/tournament/:id/edit', component: TournamentDetail },
  { path: '/tournament/:tournamentId/team/:teamId', component: TeamDetail },
  { path: '/tournament/:tournamentId/qualifying-team/:teamId', component: QualifyingTeamDetail },
  { path: '/tournament/:tournamentId/match/:matchId', component: MatchDetail },
  { path: '/player/:playerId', component: PlayerDetail },
  { path: '/profile', component: Profile },
  { path: '/admin', component: AdminDashboard }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

createApp(App).use(router).mount('#app')