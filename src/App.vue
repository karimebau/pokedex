<template>
  <div id="app">
    <!-- Offline Banner -->
    <div v-if="isOffline" class="offline-banner">
      📡 Estás en modo offline. Algunas funciones requieren internet.
    </div>

    <!-- New Notification Toast -->
    <transition name="toast">
      <div v-if="showToast" class="notification-toast" @click="$router.push('/notifications')">
        <div class="toast-content">
          <span class="toast-icon">💌</span>
          <div class="toast-text">
            <strong>¡Nueva invitación!</strong>
            <span>Tienes una nueva notificación de amistad o batalla.</span>
          </div>
        </div>
        <button class="toast-close" @click.stop="showToast = false">×</button>
      </div>
    </transition>

    <!-- Battle Invitation Popup -->
    <transition name="toast">
      <div v-if="battleInvite" class="notification-toast" style="background-color: var(--card-bg); border-left: 4px solid var(--accent); padding: 1.5rem; bottom: 80px;">
        <div style="font-weight: 700; margin-bottom: 0.5rem;">⚔️ ¡Reto de Batalla!</div>
        <p style="margin-bottom: 1rem; font-size: 0.9rem;">
          <strong>{{ battleInvite.challengerName }}</strong> te ha desafiado usando uno de tus equipos. ¿Aceptas?
        </p>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-primary btn-sm" @click="acceptBattle">¡Aceptar!</button>
          <button class="btn btn-secondary btn-sm" @click="declineBattle">Rechazar</button>
        </div>
      </div>
    </transition>

    <nav v-if="isAuthenticated" class="navbar">
      <div class="navbar-inner">
        <router-link to="/pokemon" class="navbar-brand">
          <div class="pokeball-icon"></div>
          PokéRosa 🌸
        </router-link>
        
        <div class="navbar-links">
          <router-link to="/pokemon" title="Explorar">
            <span class="nav-icon">🎀</span>
            <span class="nav-text">Explorar</span>
          </router-link>
          <router-link to="/favorites" title="Favoritos">
            <span class="nav-icon">💖</span>
            <span class="nav-text">Favoritos</span>
          </router-link>
          <router-link to="/teams" title="Equipos">
            <span class="nav-icon">✨</span>
            <span class="nav-text">Equipos</span>
          </router-link>
          <router-link to="/friends" title="Amigos">
            <span class="nav-icon">💌</span>
            <span class="nav-text">Amigos</span>
          </router-link>
          <router-link to="/battles" title="Batallas">
            <span class="nav-icon">⚔️</span>
            <span class="nav-text">Batallas</span>
          </router-link>
          <router-link to="/notifications" class="nav-notifications" title="Notificaciones">
            <span class="nav-icon">
              🔔
              <span v-if="unreadCount > 0" class="badge-count">{{ unreadCount }}</span>
            </span>
            <span class="nav-text">Notis</span>
          </router-link>
        </div>
        
        <div class="navbar-user">
          <button @click="testNotification" class="btn btn-secondary btn-sm" style="padding: 0.5rem; border-radius: 50%; width: 40px; height: 40px;" title="Probar Notificaciones">🔔</button>
          <span class="username">Hola, {{ username }}</span>
          <button @click="logout" class="btn btn-primary btn-sm">Salir</button>
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
import { NotificationService } from './services/notifications';
import { connectSocket, disconnectSocket, getSocket, socketState } from './services/socket';

export default {
  name: 'App',
  data() {
    return {
      unreadCount: 0,
      pollInterval: null,
      isOffline: !navigator.onLine,
      showToast: false,
      lastCheckCount: null
    };
  },
  mounted() {
    window.addEventListener('online', this.updateOnlineStatus);
    window.addEventListener('offline', this.updateOnlineStatus);

    // Solicitar permiso de notificaciones al entrar (independiente de login)
    NotificationService.requestPermission();

    // Fallback por si el navegador bloquea la solicitud automática
    const handleFirstInteraction = () => {
      if (NotificationService.permission === 'default') {
        console.log('[App] Reintentando solicitar permiso tras interacción...');
        NotificationService.requestPermission();
      }
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);

    if (this.isAuthenticated) {
      this.fetchNotifications();
      this.pollInterval = setInterval(this.fetchNotifications, 30000);
      connectSocket(); // Conectar sockets al montar si hay login
    }
    
    // Auto navegador
    window.addEventListener('battle-start-event', () => {
      if (this.$route.path !== '/battles') {
        this.$router.push('/battles');
      }
    });
  },
  beforeUnmount() {
    window.removeEventListener('online', this.updateOnlineStatus);
    window.removeEventListener('offline', this.updateOnlineStatus);
    clearInterval(this.pollInterval);
    disconnectSocket();
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
    },
    battleInvite() {
      return socketState.inviteParams;
    }
  },
  methods: {
    async fetchNotifications() {
      try {
        if (!this.isAuthenticated) return;
        const res = await api.get('/notifications');
        const newCount = res.data.filter(n => !n.read).length;
        
        
        // Si el contador sube respecto al último check exitoso
        if (this.lastCheckCount !== null && newCount > this.lastCheckCount) {
          this.triggerToast();
          
          // Notificación nativa si hay permiso
          if (NotificationService.permission === 'granted') {
            NotificationService.showLocalNotification('¡Nueva notificación!', {
              body: 'Tienes una nueva invitación o mensaje en PokéRosa.',
              tag: 'new-notification',
              renotify: true
            });
          }
        }
        
        this.unreadCount = newCount;
        this.lastCheckCount = newCount;
      } catch (e) {
        console.error('Error fetching notifications', e);
      }
    },
    acceptBattle() {
      const socket = getSocket();
      if (socket && this.battleInvite) {
        socket.emit('battle_accept', {
          challengerId: this.battleInvite.challengerId,
          defenderTeamId: this.battleInvite.challengerTeamMeta.opponentTeamId
        });
        socketState.inviteParams = null; // Esconder popup
      }
    },
    declineBattle() {
      const socket = getSocket();
      if (socket && this.battleInvite) {
        socket.emit('battle_decline', {
          challengerId: this.battleInvite.challengerId
        });
        socketState.inviteParams = null;
      }
    },
    logout() {
      disconnectSocket();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      this.$router.push('/');
    },
    updateOnlineStatus() {
      this.isOffline = !navigator.onLine;
    },
    triggerToast() {
      this.showToast = true;
      setTimeout(() => {
        this.showToast = false;
      }, 5000);
    },
    testNotification() {
      NotificationService.requestPermission().then(granted => {
        if (granted) {
          NotificationService.showLocalNotification('¡Funciona!', {
            body: 'Las notificaciones están configuradas correctamente.'
          });
        } else {
          alert('Estado actual del permiso: ' + NotificationService.permission + '\nSi es "denied", debes cambiarlo manualmente en la configuración del navegador (clic en el candado 🔒).');
        }
      });
    }
  },
  watch: {
    '$route.path'(newPath) {
      if (newPath === '/notifications') {
        this.unreadCount = 0;
      }
    }
  }
}
</script>
