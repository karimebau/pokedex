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

    <nav v-if="isAuthenticated" class="navbar">
      <div class="navbar-inner">
        <router-link to="/pokemon" class="navbar-brand">
          <div class="pokeball-icon"></div>
          PokéRosa 🌸
        </router-link>
        
        <div class="navbar-links">
          <router-link to="/pokemon">Explorar 🎀</router-link>
          <router-link to="/favorites">Favoritos 💖</router-link>
          <router-link to="/teams">Equipos ✨</router-link>
          <router-link to="/friends">Amigos 💌</router-link>
          <router-link to="/battles">Batallas ⚔️</router-link>
          <router-link to="/notifications" class="nav-notifications">
            Notificaciones 🔔
            <span v-if="unreadCount > 0" class="badge-count">{{ unreadCount }}</span>
          </router-link>
        </div>
        
        <div class="navbar-user">
          <!-- Botón de depuración temporal -->
          <button @click="testNotification" class="btn-debug" title="Probar Notificaciones">🔔</button>
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
import api from './services/api';
import { NotificationService } from './services/notifications';

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
    }
  },
  beforeUnmount() {
    window.removeEventListener('online', this.updateOnlineStatus);
    window.removeEventListener('offline', this.updateOnlineStatus);
    clearInterval(this.pollInterval);
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
    logout() {
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
