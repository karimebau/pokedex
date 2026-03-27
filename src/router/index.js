import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import PokemonList from '../views/PokemonList.vue'
import PokemonDetail from '../views/PokemonDetail.vue'
import Favorites from '../views/Favorites.vue'
import Teams from '../views/Teams.vue'
import Friends from '../views/Friends.vue'
import Battles from '../views/Battles.vue'
import Notifications from '../views/Notifications.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Login, meta: { guest: true } },
    { path: '/register', component: Register, meta: { guest: true } },
    { path: '/pokemon', component: PokemonList, meta: { auth: true } },
    { path: '/pokemon/:id', component: PokemonDetail, meta: { auth: true } },
    { path: '/favorites', component: Favorites, meta: { auth: true } },
    { path: '/teams', component: Teams, meta: { auth: true } },
    { path: '/friends', component: Friends, meta: { auth: true } },
    { path: '/battles', component: Battles, meta: { auth: true } },
    { path: '/notifications', component: Notifications, meta: { auth: true } },
  ]
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  if (to.meta.auth && !token) {
    return next('/')
  }

  if (to.meta.guest && token) {
    return next('/pokemon')
  }

  next()
})

export default router
