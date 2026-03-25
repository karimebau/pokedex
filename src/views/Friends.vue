<template>
  <div>
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: flex-end;">
      <div>
        <h1 class="page-title">Amigos</h1>
        <p class="page-subtitle">Conecta con otros entrenadores para combatir</p>
      </div>
      <button @click="showAddModal = true" class="btn btn-primary">
        + Agregar Amigo
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="friends.length === 0" class="empty-state">
      <div class="empty-icon">🤝</div>
      <h3>Aún no tienes amigos agregados</h3>
      <p>Agrega a otros usuarios por su correo para poder desafiarlos a batallas.</p>
    </div>

    <!-- Friends List -->
    <div v-else>
      <div v-for="friend in friends" :key="friend.id" class="friend-item">
        <div class="friend-info">
          <div class="friend-avatar">
            {{ friend.username.charAt(0).toUpperCase() }}
          </div>
          <div>
            <div style="font-weight: 700;">{{ friend.username }}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">{{ friend.email }}</div>
          </div>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button @click="$router.push(`/battles?opponent=${friend.friend_user_id}`)" class="btn btn-primary btn-sm">
            Retar a Batalla
          </button>
          <button @click="removeFriend(friend.friend_user_id)" class="btn btn-danger btn-sm">
            Eliminar
          </button>
        </div>
      </div>
    </div>

    <!-- Add Friend Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click="showAddModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">Agregar Amigo</h3>
          <button class="modal-close" @click="showAddModal = false">&times;</button>
        </div>
        <form @submit.prevent="addFriend">
          <div class="form-group">
            <label class="form-label">Correo del Entrenador</label>
            <input v-model="newFriendEmail" type="email" class="form-input" placeholder="entrenador@pokemon.com" required autofocus />
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;" :disabled="adding">
            {{ adding ? 'Buscando...' : 'Agregar' }}
          </button>
        </form>
      </div>
    </div>

  </div>
</template>

<script>
import api from '../services/api';

export default {
  data() {
    return {
      friends: [],
      loading: true,
      showAddModal: false,
      newFriendEmail: '',
      adding: false,
    };
  },
  async mounted() {
    await this.fetchFriends();
  },
  methods: {
    async fetchFriends() {
      this.loading = true;
      try {
        const res = await api.get('/friends');
        this.friends = res.data;
      } catch (e) {
        console.error('Error fetching friends', e);
      } finally {
        this.loading = false;
      }
    },
    async addFriend() {
      this.adding = true;
      try {
        await api.post('/friends', { email: this.newFriendEmail });
        this.newFriendEmail = '';
        this.showAddModal = false;
        await this.fetchFriends();
        alert('¡Amigo agregado exitosamente!');
      } catch (e) {
        alert(e.response?.data?.error || 'Error al agregar amigo');
      } finally {
        this.adding = false;
      }
    },
    async removeFriend(friendId) {
      if (confirm('¿Seguro que deseas eliminar a este amigo?')) {
        try {
          await api.delete(`/friends/${friendId}`);
          await this.fetchFriends();
        } catch (e) {
          alert('Error al eliminar amigo');
        }
      }
    }
  }
}
</script>
