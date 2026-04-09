<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-logo">
        <div class="pokeball-icon" style="margin: 0 auto 1.5rem;"></div>
        <h1 class="page-title" style="margin-bottom: 0.5rem;">PokéRosa 🌸</h1>
        <p style="color: var(--text-secondary);">¡Bienvenida! Inicia sesión para continuar ✨</p>
      </div>

      <div v-if="error" class="auth-error">{{ error }}</div>

      <form @submit.prevent="login">
        <div class="form-group">
          <label class="form-label">Correo Electrónico</label>
          <input v-model="email" type="email" class="form-input" placeholder="serena@pokemon.com" required />
        </div>
        
        <div class="form-group">
          <label class="form-label">Contraseña</label>
          <input v-model="password" type="password" class="form-input" placeholder="••••••••" required />
        </div>
        
        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1.5rem; height: 50px;" :disabled="loading">
          {{ loading ? 'Ingresando...' : 'Entrar al Mundo PokéRosa 💖' }}
        </button>
      </form>

      <div class="auth-link">
        ¿Aún no tienes cuenta? <router-link to="/register">Regístrate aquí</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../services/api'

export default {
  data() {
    return {
      email: '',
      password: '',
      error: '',
      loading: false
    }
  },
  methods: {
    async login() {
      this.error = '';
      this.loading = true;
      try {
        const res = await api.post('/auth/login', {
          email: this.email,
          password: this.password
        });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        
        // Refresh page to load App.vue navbar correctly
        window.location.href = '/pokemon';
      } catch (err) {
        this.error = err.response?.data?.error || 'Error al iniciar sesión';
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>
