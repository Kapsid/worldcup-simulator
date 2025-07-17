import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Login from './views/Login.vue'
import Register from './views/Register.vue'
import Dashboard from './views/Dashboard.vue'
import Tournament from './views/Tournament.vue'
import TournamentDetail from './views/TournamentDetail.vue'
import TeamDetail from './views/TeamDetail.vue'
import MatchDetail from './views/MatchDetail.vue'
import Profile from './views/Profile.vue'
import './styles/global.css'

const routes = [
  { path: '/', component: Login },
  { path: '/register', component: Register },
  { path: '/dashboard', component: Dashboard },
  { path: '/tournaments', component: Tournament },
  { path: '/tournament/:id', component: TournamentDetail },
  { path: '/tournament/:id/edit', component: TournamentDetail },
  { path: '/tournament/:tournamentId/team/:teamId', component: TeamDetail },
  { path: '/tournament/:tournamentId/match/:matchId', component: MatchDetail },
  { path: '/profile', component: Profile }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

createApp(App).use(router).mount('#app')