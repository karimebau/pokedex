import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
});

// ── Offline Queue & Auto-Retry ────────────────────────────────
let offlineQueue = [];

const processQueue = async () => {
  if (offlineQueue.length === 0) return;
  
  console.log(`[Offline] Sincronizando ${offlineQueue.length} petición(es) pendiente(s)...`);
  const queue = [...offlineQueue];
  offlineQueue = [];

  for (const request of queue) {
    try {
      await api(request);
      console.log(`[Offline] Sincronizado: ${request.method} ${request.url}`);
    } catch (e) {
      console.error(`[Offline] Error reintentando ${request.url}:`, e);
      offlineQueue.push(request); // Re-encolar si falla de nuevo
    }
  }
};

window.addEventListener('online', processQueue);

// ── Attach JWT token and Offline check ───────────────────────
api.interceptors.request.use((config) => {
  if (!navigator.onLine && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
    alert('🚫 Sin internet: Tu petición se ha guardado y se enviará automáticamente al recuperar la conexión.');
    offlineQueue.push({
      url: config.url,
      method: config.method,
      data: config.data,
      headers: config.headers
    });
    return Promise.reject(new Error('Petición encolada (Offline)'));
  }

  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Handle 401 responses (expired/invalid token) ──────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
