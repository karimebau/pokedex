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

  showLocalNotification(title, options = {}) {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        return new Notification(title, {
          icon: '/pwa-192x192.png',
          badge: '/favicon.ico',
          ...options
        });
      } catch (e) {
        console.error('Error al mostrar notificación local:', e);
      }
    }
  }
};
