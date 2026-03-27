export const NotificationService = {
  get permission() {
    return typeof Notification !== 'undefined' ? Notification.permission : 'denied';
  },

  async requestPermission() {
    console.log('[NotificationService] Solicitando permiso...');
    if (!('Notification' in window)) {
      console.warn('[NotificationService] Este navegador no soporta notificaciones.');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('[NotificationService] Permiso obtenido:', permission);
      return permission === 'granted';
    } catch (e) {
      console.error('[NotificationService] Error al solicitar permiso:', e);
      return false;
    }
  },

  async showLocalNotification(title, options = {}) {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        // Intentar usar el Service Worker para mayor fiabilidad (especialmente en móviles/PWA)
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          await reg.showNotification(title, {
            icon: '/pwa-192x192.png',
            badge: '/favicon.ico',
            vibrate: [200, 100, 200],
            ...options
          });
        } else {
          // Fallback al API estándar si no hay SW
          new Notification(title, {
            icon: '/pwa-192x192.png',
            badge: '/favicon.ico',
            ...options
          });
        }
      } catch (e) {
        console.error('Error al mostrar notificación:', e);
      }
    }
  }
};
