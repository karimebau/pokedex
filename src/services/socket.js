import { io } from 'socket.io-client';
import { reactive } from 'vue';

export const socketState = reactive({
  inviteParams: null,
  activeBattlePayload: null,
  waitingForOpponent: false,
  pendingChallengerTeamId: null  // ✅ FIX: mover aquí para que persista entre componentes
});

let socket = null;

export const connectSocket = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  if (socket && socket.connected) return socket;

  // ✅ FIX: construir la URL base correctamente
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const serverUrl = backendUrl.replace(/\/api$/, '');  // quita solo el /api del final

  console.log('🔗 Conectando sockets a:', serverUrl);

  socket = io(serverUrl, {
    auth: { token },
    // ✅ FIX: iniciar con polling (compatible con Railway) y luego upgradear
    transports: ['polling', 'websocket'],
    reconnectionAttempts: 5,
    reconnectionDelay: 2000
  });

  socket.on('connect', () => {
    console.log('✅ Sockets conectados, id:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.error('❌ Error de conexión socket:', err.message);
  });

  // Escuchar invitaciones de batalla
  socket.on('battle_invite_received', (data) => {
    console.log('📨 Invitación de batalla recibida:', data);
    socketState.inviteParams = data;
  });

  // Retador recibe rechazo
  socket.on('battle_declined', (data) => {
    socketState.waitingForOpponent = false;
    alert(`El entrenador ${data.defenderName} rechazó tu invitación de batalla.`);
  });

  // ✅ FIX: usar pendingChallengerTeamId desde socketState
  socket.on('battle_accepted', async (data) => {
    try {
      const api = (await import('./api')).default;
      await api.post('/battles', {
        opponent_id: data.defenderId,
        challenger_team_id: socketState.pendingChallengerTeamId,  // ✅ ahora tiene valor
        opponent_team_id: data.defenderTeamId
      });
    } catch (e) {
      console.error('Error starting realtime battle:', e);
      socketState.waitingForOpponent = false;
      alert('Error de conexión al generar la arena. Intenta de nuevo.');
    }
  });

  // Ambos reciben el inicio de batalla
  socket.on('battle_started', (payload) => {
    socketState.waitingForOpponent = false;
    socketState.pendingChallengerTeamId = null;
    socketState.inviteParams = null;
    socketState.activeBattlePayload = payload;
    window.dispatchEvent(new CustomEvent('battle-start-event'));
  });

  socket.on('battle_turn_result', (data) => {
    window.dispatchEvent(new CustomEvent('battle-turn-result', { detail: data }));
  });

  // Error de invitación (oponente offline)
  socket.on('battle_invite_error', (data) => {
    socketState.waitingForOpponent = false;
    alert(data.error || 'El oponente no está disponible.');
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};