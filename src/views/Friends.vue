<template>
  <div class="main-content">
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.5rem; margin-bottom: 2.5rem;">
      <div style="flex: 1; min-width: 250px;">
        <h1 class="page-title">Amigos & Colegas 💌</h1>
        <p style="color: var(--text-secondary); margin-bottom: 0.5rem;">Conecta con otros entrenadores para combatir</p>
        <div v-if="userCode" class="user-code-badge" title="Comparte este código con tus amigos" style="display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(255,71,126,0.1); padding: 0.3rem 1rem; border-radius: 20px; border: 1px solid var(--primary); font-size: 0.85rem;">
          <span>Mi Código:</span>
          <span style="font-weight: 800; color: var(--primary); font-family: monospace;">{{ userCode }}</span>
        </div>
      </div>
      <button @click="showAddModal = true" class="btn btn-primary" style="height: 50px;">
        + Invitar Entrenador ✨
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <div v-else>
      <!-- Pending Requests -->
      <div v-if="requests.incoming.length > 0" class="requests-section" style="margin-bottom: 3rem;">
        <h3 style="color: var(--accent); margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.8rem;">
          📥 Solicitudes Recibidas
          <span style="background: var(--primary); color: white; padding: 0.2rem 0.6rem; border-radius: 10px; font-size: 0.75rem;">{{ requests.incoming.length }}</span>
        </h3>
        <div style="display: grid; gap: 1rem;">
          <div v-for="req in requests.incoming" :key="req.id" class="card" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; padding: 1.5rem;">
            <div class="friend-info" style="display: flex; align-items: center; gap: 1rem;">
              <div class="friend-avatar" style="width: 45px; height: 45px; background: var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; color: white;">?</div>
              <div>
                <div style="font-weight: 800; font-size: 1.1rem;">{{ req.username }}</div>
                <div style="font-size: 0.85rem; color: var(--text-secondary);">{{ req.email }}</div>
              </div>
            </div>
            <div style="display: flex; gap: 0.8rem; flex: 1; justify-content: flex-end; min-width: 200px;">
              <button @click="acceptRequest(req.id)" class="btn btn-primary btn-sm" style="flex: 1;">Aceptar</button>
              <button @click="rejectRequest(req.id)" class="btn btn-secondary btn-sm" style="flex: 1;">Rechazar</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Friends List -->
      <div v-if="friends.length === 0 && requests.incoming.length === 0 && requests.outgoing.length === 0" class="empty-state" style="text-align: center; padding: 4rem 2rem;">
        <div style="font-size: 4rem; margin-bottom: 1rem;">🤝</div>
        <h3 style="color: var(--primary);">Aún no tienes amigos agregados</h3>
        <p style="color: var(--text-secondary);">Invita a otros usuarios por su correo o código para poder desafiarlos a batallas.</p>
        <button @click="showAddModal = true" class="btn btn-primary" style="margin-top: 2rem;">Enviar Mi Primera Invitación</button>
      </div>

      <div v-else-if="friends.length > 0">
        <h3 style="margin-bottom: 1.5rem; color: var(--text-secondary);">Mis Amigos ({{ friends.length }})</h3>
        <div style="display: grid; gap: 1rem;">
          <div v-for="friend in friends" :key="friend.id" class="card friend-item" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; padding: 1.5rem; border-color: rgba(255,255,255,0.05);">
            <div class="friend-info" style="display: flex; align-items: center; gap: 1rem; flex: 1; min-width: 200px;">
              <div class="friend-avatar" style="width: 50px; height: 50px; background: linear-gradient(45deg, var(--primary), var(--accent)); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; color: white; font-size: 1.2rem; box-shadow: 0 4px 10px rgba(255,71,126,0.3);">
                {{ friend.username.charAt(0).toUpperCase() }}
              </div>
              <div>
                <div style="font-weight: 800; font-size: 1.1rem; text-transform: capitalize;">{{ friend.username }}</div>
                <div style="font-size: 0.8rem; color: var(--text-secondary); opacity: 0.7;">{{ friend.email }}</div>
              </div>
            </div>
            <div style="display: flex; gap: 0.8rem; flex: 1; justify-content: flex-end; min-width: 250px;">
              <button @click="$router.push(`/battles?opponent=${friend.friend_user_id}`)" class="btn btn-primary btn-sm" style="flex: 2;">
                ⚔️ Retar
              </button>
              <button @click="removeFriend(friend.friend_user_id)" class="btn btn-secondary btn-sm" style="flex: 1; border-color: var(--error); color: var(--error);">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Outgoing Requests -->
      <div v-if="requests.outgoing.length > 0" style="margin-top: 3rem;">
        <h4 style="color: var(--text-secondary); margin-bottom: 1rem; opacity: 0.6; font-size: 1rem; text-transform: uppercase; letter-spacing: 0.05em;">Invitaciones Enviadas</h4>
        <div style="display: grid; gap: 0.8rem;">
          <div v-for="req in requests.outgoing" :key="req.id" class="card" style="padding: 1rem 1.5rem; border-style: dashed; opacity: 0.7; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 0.95rem; font-weight: 600;">{{ req.username }} <span style="font-weight: 400; opacity: 0.5; margin-left: 0.5rem;">({{ req.email }})</span></div>
            <div style="font-size: 0.75rem; color: var(--accent); font-weight: 700;">PENDIENTE ⏳</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Friend Modal -->
    <transition name="toast">
      <div v-if="showAddModal" class="modal-overlay" @click="showAddModal = false" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 1rem;">
        <div class="card" @click.stop style="width: 100%; max-width: 450px; padding: 2.5rem; border-color: var(--primary);">
          <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
            <h3 class="page-title" style="margin-bottom: 0; font-size: 1.5rem;">Agregar Amigo 🤝</h3>
            <button @click="showAddModal = false" style="background: none; border: none; color: var(--text-secondary); font-size: 2rem; cursor: pointer;">&times;</button>
          </div>
          <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1.5rem;">Ingresa el código de entrenador o el correo electrónico de tu amigo.</p>
          <form @submit.prevent="addFriend">
            <div class="form-group">
              <label class="form-label">Correo o Código</label>
              <input v-model="friendQuery" type="text" class="form-input" placeholder="ej. PK-X7Y2Z o email@test.com" required autofocus />
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1.5rem; height: 50px;" :disabled="adding">
              {{ adding ? 'Buscando Entrenador...' : 'Enviar Solicitud ✨' }}
            </button>
          </form>
        </div>
      </div>
    </transition>

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
