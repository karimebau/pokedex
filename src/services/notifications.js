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
    console.log('[NotificationService] Intentando mostrar notificación:', title);
    if (typeof Notification === 'undefined') return;

    if (Notification.permission !== 'granted') {
      console.warn('[NotificationService] Permiso no concedido. Estado:', Notification.permission);
      return;
    }

    try {
      // Intentar primero con el Service Worker (mejor para PWA)
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          console.log('[NotificationService] Usando Service Worker para la notificación');
          await reg.showNotification(title, {
            icon: '/pwa-192x192.png',
            badge: '/favicon.ico',
            vibrate: [200, 100, 200],
            ...options
          });
          return;
        }
      }

      // Fallback o alternativa si no hay SW o no está listo
      console.log('[NotificationService] Usando API de Notificación estándar');
      new Notification(title, {
        icon: '/pwa-192x192.png',
        badge: '/favicon.ico',
        ...options
      });
    } catch (e) {
      console.error('[NotificationService] Error al mostrar notificación:', e);
    }
  }
};
