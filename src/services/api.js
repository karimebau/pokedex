import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
});

// ── Attach JWT token and Offline check ───────────────────────
api.interceptors.request.use((config) => {
  if (!navigator.onLine && config.method !== 'get') {
    alert('🚫 Sin conexión: Esperando internet para realizar esta acción.');
    return Promise.reject(new Error('Offline'));
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
