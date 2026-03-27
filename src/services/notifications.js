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
    console.log('[NotificationService] Solicitando al navegador mostrar:', title);
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
      console.warn('[NotificationService] Abortado: permiso no concedido o API no disponible.');
      return;
    }

    const defaultOptions = {
      body: 'Tienes algo nuevo en PokéRosa 🎀',
      icon: 'https://cdn-icons-png.flaticon.com/128/188/188940.png', // Icono externo para probar si es un tema de ruta local
      badge: 'https://cdn-icons-png.flaticon.com/128/188/188940.png',
      ...options
    };

    try {
      // En escritorio preferimos la API estándar para respuesta inmediata
      const notification = new Notification(title, defaultOptions);
      console.log('[NotificationService] Enviada mediante API estándar');
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (e) {
      console.log('[NotificationService] API estándar falló, intentando Service Worker:', e.message);
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          await reg.showNotification(title, defaultOptions);
          console.log('[NotificationService] Enviada mediante Service Worker');
        }
      }
    }
  }
};
