<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-logo">
        <div class="pokeball-icon" style="width:48px;height:48px;margin:0 auto 1rem;"></div>
        <h1>Registro PokéRosa 🎀</h1>
        <p>Conviértete en una Entrenadora Pokémon</p>
      </div>

      <div v-if="error" class="auth-error">{{ error }}</div>

      <form @submit.prevent="register">
        <div class="form-group">
          <label class="form-label">Nombre de Entrenadora</label>
          <input v-model="username" type="text" class="form-input" placeholder="Serena" required />
        </div>

        <div class="form-group">
          <label class="form-label">Correo Electrónico</label>
          <input v-model="email" type="email" class="form-input" placeholder="serena@pokemon.com" required />
        </div>
        
        <div class="form-group">
          <label class="form-label">Contraseña</label>
          <input v-model="password" type="password" class="form-input" placeholder="••••••••" required />
        </div>
        
        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;" :disabled="loading">
          {{ loading ? 'Registrando...' : 'Obtener Licencia Rosa ✨' }}
        </button>
      </form>

      <div class="auth-link">
        ¿Ya eres entrenador? <router-link to="/">Inicia sesión</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../services/api'

export default {
  data() {
    return {
      username: '',
      email: '',
      password: '',
      error: '',
      loading: false
    }
  },
  methods: {
    async register() {
      this.error = '';
      this.loading = true;
      try {
        const res = await api.post('/auth/register', {
          username: this.username,
          email: this.email,
          password: this.password
        });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        
        alert(`¡Registro exitoso!\n\nTu Código de Entrenador es: ${res.data.user.user_code}\n\nCompártelo con tus amigos para que te agreguen.`);
        window.location.href = '/pokemon';
      } catch (err) {
        this.error = err.response?.data?.error || 'Error al registrarse';
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>
