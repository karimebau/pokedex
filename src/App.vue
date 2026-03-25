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
          <router-link to="/teams">Mis Equipos ✨</router-link>
          <router-link to="/friends">Amigos 💌</router-link>
          <router-link to="/battles">Batallas ⚔️</router-link>
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
export default {
  name: 'App',
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
    logout() {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      this.$router.push('/');
    }
  }
}
</script>
