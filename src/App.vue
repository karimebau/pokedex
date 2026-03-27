<template>
  <div id="app">
    <nav v-if="isAuthenticated" class="navbar">
      <div class="navbar-inner">
        <router-link to="/pokemon" class="navbar-brand">
          <div class="pokeball-icon"></div>
          PokéRosa 🌸
        </router-link>
        
        <div class="navbar-links">
          <router-link to="/pokemon">Explorar 🎀</router-link>
          <router-link to="/favorites">Favoritos 💖</router-link>
          <router-link to="/teams">Equipos ✨</router-link>
          <router-link to="/friends">Amigos 💌</router-link>
          <router-link to="/battles">Batallas ⚔️</router-link>
          <router-link to="/notifications" class="nav-notifications">
            Notificaciones 🔔
            <span v-if="unreadCount > 0" class="badge-dot"></span>
          </router-link>
        </div>
        
        <div class="navbar-user">
          <span class="username">Hola, {{ username }}</span>
          <button @click="logout" class="btn-logout">Cerrar Sesión</button>
        </div>
      </div>
    </nav>
    
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script>
import api from './services/api';

export default {
  name: 'App',
  data() {
    return {
      unreadCount: 0,
      pollInterval: null
    };
  },
  mounted() {
    if (this.isAuthenticated) {
      this.fetchNotifications();
      this.pollInterval = setInterval(this.fetchNotifications, 30000);
    }
  },
  beforeUnmount() {
    clearInterval(this.pollInterval);
  },
  computed: {
    isAuthenticated() {
      return !!localStorage.getItem('token');
    },
    username() {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        return user?.username || '';
      } catch {
        return '';
      }
    }
  },
  methods: {
    async fetchNotifications() {
      try {
        if (!this.isAuthenticated) return;
        const res = await api.get('/notifications');
        this.unreadCount = res.data.filter(n => !n.read).length;
      } catch (e) {
        console.error('Error fetching notifications', e);
      }
    },
    logout() {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      this.$router.push('/');
    }
  }
}
</script>
