<template>
  <div>
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: flex-end;">
      <div>
        <h1 class="page-title">Amigos</h1>
        <p class="page-subtitle">Conecta con otros entrenadores para combatir</p>
        <div v-if="userCode" class="user-code-badge" title="Comparte este código con tus amigos">
          Mi Código: <span>{{ userCode }}</span>
        </div>
      </div>
      <button @click="showAddModal = true" class="btn btn-primary">
        + Invitar Amigo
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <div v-else>
      <!-- Pending Requests -->
      <div v-if="requests.incoming.length > 0" class="requests-section" style="margin-bottom: 2rem;">
        <h3 style="color: var(--accent); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
          📥 Invitaciones Recibidas
          <span class="badge">{{ requests.incoming.length }}</span>
        </h3>
        <div v-for="req in requests.incoming" :key="req.id" class="friend-item request-item">
          <div class="friend-info">
            <div class="friend-avatar req">?</div>
            <div>
              <div style="font-weight: 700;">{{ req.username }}</div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">{{ req.email }}</div>
            </div>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button @click="acceptRequest(req.id)" class="btn btn-primary btn-sm">Aceptar</button>
            <button @click="rejectRequest(req.id)" class="btn btn-secondary btn-sm">Rechazar</button>
          </div>
        </div>
      </div>

      <!-- Friends List -->
      <div v-if="friends.length === 0 && requests.incoming.length === 0 && requests.outgoing.length === 0" class="empty-state">
        <div class="empty-icon">🤝</div>
        <h3>Aún no tienes amigos agregados</h3>
        <p>Invita a otros usuarios por su correo para poder desafiarlos a batallas.</p>
      </div>

      <div v-else-if="friends.length > 0">
        <h3 style="margin-bottom: 1rem; color: var(--text-secondary);">Mis Amigos</h3>
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

      <!-- Outgoing Requests -->
      <div v-if="requests.outgoing.length > 0" style="margin-top: 2rem; opacity: 0.8;">
        <h4 style="color: var(--text-muted); margin-bottom: 0.5rem;">Invitaciones Enviadas</h4>
        <div v-for="req in requests.outgoing" :key="req.id" class="friend-item" style="padding: 0.5rem 1rem; border-style: dashed;">
          <div class="friend-info">
            <div style="font-size: 0.9rem;">{{ req.username }} ({{ req.email }})</div>
          </div>
          <div style="font-size: 0.8rem; color: var(--text-muted); font-style: italic;">Pendiente...</div>
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
            <label class="form-label">Correo o Código de Entrenador</label>
            <input v-model="friendQuery" type="text" class="form-input" placeholder="ej. PK-X7Y2Z o email@test.com" required autofocus />
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;" :disabled="adding">
            {{ adding ? 'Buscando Entrenador...' : 'Enviar Solicitud' }}
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
      requests: { incoming: [], outgoing: [] },
      loading: true,
      showAddModal: false,
      friendQuery: '',
      adding: false,
      userCode: JSON.parse(localStorage.getItem('user'))?.user_code || ''
    };
  },
  async mounted() {
    await this.fetchData();
  },
  methods: {
    async fetchData() {
      this.loading = true;
      try {
        const [friendsRes, requestsRes] = await Promise.all([
          api.get('/friends'),
          api.get('/friends/requests')
        ]);
        this.friends = friendsRes.data;
        this.requests = requestsRes.data;
      } catch (e) {
        console.error('Error fetching data', e);
      } finally {
        this.loading = false;
      }
    },
    async addFriend() {
      this.adding = true;
      try {
        const payload = {};
        if (this.friendQuery.includes('@')) {
          payload.email = this.friendQuery;
        } else {
          payload.user_code = this.friendQuery;
        }

        const res = await api.post('/friends', payload);
        this.friendQuery = '';
        this.showAddModal = false;
        await this.fetchData();
        alert(res.data.message || '¡Invitación enviada!');
      } catch (e) {
        alert(e.response?.data?.error || 'Error al enviar invitación');
      } finally {
        this.adding = false;
      }
    },
    async acceptRequest(id) {
      try {
        await api.post(`/friends/requests/${id}/accept`);
        await this.fetchData();
      } catch (e) {
        alert('Error al aceptar solicitud');
      }
    },
    async rejectRequest(id) {
      if (confirm('¿Rechazar esta solicitud de amistad?')) {
        try {
          await api.post(`/friends/requests/${id}/reject`);
          await this.fetchData();
        } catch (e) {
          alert('Error al rechazar solicitud');
        }
      }
    },
    async removeFriend(friendId) {
      if (confirm('¿Seguro que deseas eliminar a este amigo?')) {
        try {
          await api.delete(`/friends/${friendId}`);
          await this.fetchData();
        } catch (e) {
          alert('Error al eliminar amigo');
        }
      }
    }
  }
}
</script>

<style>
.user-code-badge {
  display: inline-block;
  margin-top: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: var(--bg-card);
  border: 1px dashed var(--accent);
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.user-code-badge span {
  font-weight: 800;
  color: var(--accent);
  letter-spacing: 0.05em;
  margin-left: 0.25rem;
}
</style>
