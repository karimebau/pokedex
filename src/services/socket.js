import { io } from 'socket.io-client';
import { reactive } from 'vue';
import router from '../router'; // Asumiendo que router está aquí si necesitamos push

export const socketState = reactive({
  inviteParams: null, // Para guardar quien te invitó
  activeBattlePayload: null, // Para guardar los datos de la batalla cuando inicie
  waitingForOpponent: false // Para que el retador sepa que está esperando
});

let socket = null;

export const connectSocket = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  if (socket && socket.connected) return socket;

  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const serverUrl = backendUrl.replace('/api', '');

  socket = io(serverUrl, {
    auth: { token }
  });

  socket.on('connect', () => {
    console.log('🔗 Sockets Conectados');
  });

  // Escuchar invitaciones
  socket.on('battle_invite_received', (data) => {
    // data: { challengerId, challengerName, challengerTeamId, opponentTeamId }
    socketState.inviteParams = data;
  });

  // Retador recibe rechazo
  socket.on('battle_declined', (data) => {
    socketState.waitingForOpponent = false;
    alert(`El entrenador ${data.defenderName} rechazó tu invitación de batalla.`);
  });

  // Retador recibe aceptación y gatilla la batalla
  socket.on('battle_accepted', async (data) => {
    // data: { defenderId, defenderTeamId }
    // Only the challenger gets here. They must have the setup in their inviteParams memory? No, we created teamMeta in backend
    // Since we are the challenger, we have to fire POST /battles
    try {
      const api = (await import('./api')).default;
      await api.post('/battles', {
        opponent_id: data.defenderId,
        challenger_team_id: socketState.pendingChallengerTeamId,
        opponent_team_id: data.defenderTeamId
      });
      // The push of battle_started will arrive naturally
    } catch (e) {
      console.error('Error starting realtime battle:', e);
      socketState.waitingForOpponent = false;
      alert('Error de conexión al generar la arena. Intenta de nuevo.');
    }
  });

  // Ambos reciben el inicio de batalla
  socket.on('battle_started', (payload) => {
    socketState.waitingForOpponent = false;
    socketState.inviteParams = null; // quitar popup si existía
    socketState.activeBattlePayload = payload;
    
    // Navegar automáticamente a la batalla
    // Asegurarse de que el router esté importado / manejado
    window.dispatchEvent(new CustomEvent('battle-start-event'));
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
