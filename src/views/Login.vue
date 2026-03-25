<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-logo">
        <div class="pokeball-icon" style="width:48px;height:48px;margin:0 auto 1rem;"></div>
        <h1>Pokédex</h1>
        <p>Inicia sesión para continuar</p>
      </div>

      <div v-if="error" class="auth-error">{{ error }}</div>

      <form @submit.prevent="login">
        <div class="form-group">
          <label class="form-label">Correo Electrónico</label>
          <input v-model="email" type="email" class="form-input" placeholder="entrenador@pokemon.com" required />
        </div>
        
        <div class="form-group">
          <label class="form-label">Contraseña</label>
          <input v-model="password" type="password" class="form-input" placeholder="••••••••" required />
        </div>
        
        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;" :disabled="loading">
          {{ loading ? 'Ingresando...' : 'Entrar al Mundo Pokémon' }}
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
