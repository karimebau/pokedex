<template>
  <div>
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 2.5rem;">
      <div style="flex: 1; min-width: 250px;">
        <h1 class="page-title">Notificaciones 🔔</h1>
        <p style="color: var(--text-secondary); margin-bottom: 0;">Mantente al tanto de tus solicitudes y actividad</p>
      </div>
      <button v-if="notifications.length > 0" @click="readAll" class="btn btn-secondary btn-sm" style="height: 40px;">
        Marcar todas como leídas ✨
      </button>
    </div>

    <!-- Notification Permission Banner -->
    <div v-if="permission === 'default'" class="card" style="margin-bottom: 2rem; border-color: var(--primary); background: linear-gradient(135deg, rgba(255,143,177,0.2) 0%, rgba(255,71,126,0.1) 100%); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.5rem; padding: 2rem;">
      <div class="banner-content" style="display: flex; align-items: center; gap: 1.5rem; flex: 1; min-width: 280px;">
        <div class="banner-icon" style="font-size: 3rem; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));">🔔</div>
        <div class="banner-text">
          <h3 style="margin-bottom: 0.3rem; color: var(--primary); font-size: 1.3rem;">Activar Notificaciones 🎀</h3>
          <p style="color: var(--text-secondary); margin: 0; font-size: 0.95rem;">Recibe alertas instantáneas de batallas y amigos en tiempo real.</p>
        </div>
      </div>
      <button @click="requestPermission" class="btn btn-primary" style="height: 45px; padding: 0 2rem;">Habilitar ✨</button>
    </div>

    <!-- Denied Permission State -->
    <div v-if="permission === 'denied'" class="card" style="margin-bottom: 2rem; border-color: var(--error); background: rgba(230,57,70,0.1); padding: 1.5rem; display: flex; align-items: center; gap: 1.5rem;">
      <div style="font-size: 2.5rem;">🚫</div>
      <div>
        <h3 style="color: var(--error); margin-bottom: 0.3rem; font-size: 1.2rem;">Notificaciones Bloqueadas</h3>
        <p style="color: var(--text-secondary); margin: 0; font-size: 0.9rem;">Has bloqueado las notificaciones. Cambia el permiso en tu navegador para recibir alertas.</p>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <div v-else-if="notifications.length === 0" class="empty-state" style="text-align: center; padding: 5rem 2rem;">
      <div style="font-size: 4rem; margin-bottom: 1.5rem; opacity: 0.5;">🎈</div>
      <h3 style="color: var(--primary);">No tienes notificaciones</h3>
      <p style="color: var(--text-secondary);">Te avisaremos cuando pase algo interesante en la arena.</p>
    </div>

    <div v-else class="notifications-list" style="display: flex; flex-direction: column; gap: 1rem;">
      <div 
        v-for="n in notifications" 
        :key="n.id" 
        class="card notification-card" 
        :class="{ unread: !n.read }"
        @click="markAsRead(n)"
        style="padding: 1.5rem; display: flex; align-items: center; gap: 1.5rem; position: relative; cursor: pointer; transition: transform 0.2s;"
        :style="!n.read ? 'border-left: 4px solid var(--primary); background: rgba(255,71,126,0.05);' : 'opacity: 0.8;'"
      >
        <div class="notification-icon" style="font-size: 1.8rem; background: rgba(0,0,0,0.1); width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          {{ getIcon(n.type) }}
        </div>
        <div class="notification-body" style="flex: 1;">
          <div class="notification-message" style="font-weight: 700; color: var(--text-primary); font-size: 1.05rem;">{{ n.message }}</div>
          <div class="notification-time" style="font-size: 0.8rem; color: var(--text-secondary); opacity: 0.6; margin-top: 0.4rem; display: flex; align-items: center; gap: 0.3rem;">
            <span>🕒</span> {{ formatDate(n.created_at) }}
          </div>
        </div>
        <button class="delete-btn" @click.stop="deleteNotification(n.id)" style="background: none; border: none; color: var(--text-secondary); font-size: 1.5rem; cursor: pointer; opacity: 0.5; transition: opacity 0.2s; padding: 0.5rem;">&times;</button>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../services/api';
import { NotificationService } from '../services/notifications';

export default {
  name: 'Notifications',
  data() {
    return {
      notifications: [],
      loading: true,
      permission: NotificationService.permission
    };
  },
  async mounted() {
    await this.fetchNotifications();
    if (this.notifications.some(n => !n.read)) {
      await this.readAll();
    }
  },
  methods: {
    async fetchNotifications() {
      this.loading = true;
      try {
        const res = await api.get('/notifications');
        this.notifications = res.data;
      } catch (e) {
        console.error('Error fetching notifications', e);
      } finally {
        this.loading = false;
      }
    },
    async markAsRead(notification) {
      if (notification.read) return;
      try {
        await api.patch(`/notifications/${notification.id}/read`);
        notification.read = 1;
      } catch (e) {
        console.error('Error marking as read', e);
      }
    },
    async readAll() {
      try {
        await api.post('/notifications/read-all');
        this.notifications.forEach(n => n.read = 1);
      } catch (e) {
        console.error('Error marking all as read', e);
      }
    },
    async deleteNotification(id) {
      try {
        await api.delete(`/notifications/${id}`);
        this.notifications = this.notifications.filter(n => n.id !== id);
      } catch (e) {
        console.error('Error deleting notification', e);
      }
    },
    getIcon(type) {
      switch (type) {
        case 'friend_request': return '🌸';
        case 'friend_request_accepted': return '🎉';
        case 'battle_invite': return '⚔️';
        default: return '✨';
      }
    },
    formatDate(dateStr) {
      const date = new Date(dateStr);
      return date.toLocaleString();
    },
    async requestPermission() {
      const granted = await NotificationService.requestPermission();
      this.permission = NotificationService.permission;
      if (granted) {
        NotificationService.showLocalNotification('¡Notificaciones activadas!', {
          body: 'Ahora recibirás alertas de PokéRosa en tu escritorio.'
        });
      }
    }
  }
}
</script>

<style scoped>
.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.notification-card {
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  position: relative;
  cursor: pointer;
}

.notification-card.unread {
  border-left: 4px solid var(--accent);
  background: rgba(255, 71, 126, 0.05);
}

.notification-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.notification-body {
  flex: 1;
}

.notification-message {
  font-weight: 500;
  color: var(--text-primary);
}

.notification-time {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
}

.delete-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0 0.5rem;
  transition: color 0.1s;
}

.delete-btn:hover {
  color: var(--accent);
}

.permission-card-banner {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #ff477e 0%, #ff8fa3 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  border: none;
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.banner-icon {
  font-size: 2.5rem;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
}

.banner-text h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
}

.banner-text p {
  margin: 0.25rem 0 0;
  font-size: 0.9rem;
  opacity: 0.9;
}

.permission-card-banner .btn-primary {
  background: white;
  color: var(--accent);
  white-space: nowrap;
  padding: 0.75rem 1.5rem;
  font-weight: 700;
}

.permission-card-banner .btn-primary:hover {
  background: #f8f9fa;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.permission-card-banner.denied {
  background: linear-gradient(135deg, #444 0%, #222 100%);
  opacity: 0.9;
}

@media (max-width: 600px) {
  .permission-card-banner {
    flex-direction: column;
    text-align: center;
    align-items: center;
  }
  .banner-content {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
