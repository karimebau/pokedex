<template>
  <div class="notifications-page">
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h1 class="page-title">Notificaciones 🔔</h1>
        <p class="page-subtitle">Mantente al tanto de tus solicitudes y actividad</p>
      </div>
      <button v-if="notifications.length > 0" @click="readAll" class="btn btn-secondary btn-sm">
        Marcar todas como leídas
      </button>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <div v-else-if="notifications.length === 0" class="empty-state">
      <div class="empty-icon">🎈</div>
      <h3>No tienes notificaciones</h3>
      <p>Te avisaremos cuando pase algo interesante.</p>
    </div>

    <div v-else class="notifications-list">
      <div 
        v-for="n in notifications" 
        :key="n.id" 
        class="card notification-card" 
        :class="{ unread: !n.read }"
        @click="markAsRead(n)"
      >
        <div class="notification-icon">
          {{ getIcon(n.type) }}
        </div>
        <div class="notification-body">
          <div class="notification-message">{{ n.message }}</div>
          <div class="notification-time">{{ formatDate(n.created_at) }}</div>
        </div>
        <button class="delete-btn" @click.stop="deleteNotification(n.id)">&times;</button>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../services/api';

export default {
  name: 'Notifications',
  data() {
    return {
      notifications: [],
      loading: true
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
</style>
