<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Arena de Batalla ⚔️</h1>
      <p style="color: var(--text-secondary); margin-bottom: 2rem;">Desafía a tus amigos con tus mejores equipos Pokémon</p>
    </div>

    <!-- Setup Phase -->
    <div v-if="!battleActive && !battleFinished" class="card" style="max-width: 800px; margin: 0 auto; padding: 2.5rem;">
      
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
      </div>

      <div v-else-if="friends.length === 0" style="text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🤝</div>
        <h3>Necesitas amigos para batallar</h3>
        <p style="color: var(--text-secondary);">Ve a la sección de amigos para agregar a otros entrenadores.</p>
        <button @click="$router.push('/friends')" class="btn btn-primary" style="margin-top: 2rem;">Ir a Amigos 💌</button>
      </div>

      <div v-else-if="teams.length === 0" style="text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">✨</div>
        <h3>Necesitas un equipo para batallar</h3>
        <p style="color: var(--text-secondary);">No tienes ningún equipo armado. Ve a la sección de equipos.</p>
        <button @click="$router.push('/teams')" class="btn btn-primary" style="margin-top: 2rem;">Crear Equipo ✨</button>
      </div>

      <form v-else @submit.prevent="startBattle">
        <div class="form-group">
          <label class="form-label">🔥 Selecciona a tu Oponente</label>
          <select v-model="setup.opponentId" class="form-select" required @change="fetchOpponentTeams">
            <option value="" disabled>Elige un amigo...</option>
            <option v-for="f in friends" :key="f.friend_user_id" :value="f.friend_user_id">
              {{ f.username }} ({{ f.email }})
            </option>
          </select>
        </div>

        <div class="form-group" style="margin-top: 1.5rem;">
          <label class="form-label">🛡️ Tu Equipo</label>
          <select v-model="setup.myTeamId" class="form-select" required>
            <option value="" disabled>Selecciona tu equipo...</option>
            <option v-for="t in teams" :key="t.id" :value="t.id">
              {{ t.name }} ({{ t.pokemon.length }} Pokémon) {{ t.pokemon.length === 0 ? '⚠️' : '' }}
            </option>
          </select>
          <p v-if="setup.myTeamId && teams.find(t => t.id === setup.myTeamId)?.pokemon.length === 0" style="color: var(--error); font-size: 0.8rem; margin-top: 0.5rem; font-weight: 600;">
            ⚠️ Este equipo está vacío. Añade Pokémon en la sección de Equipos para poder batallar.
          </p>
        </div>



        <div style="margin-top: 2.5rem;">
          <button 
            type="submit" 
            class="btn btn-primary" 
            style="width: 100%; font-size: 1.2rem; padding: 1.2rem;" 
            :disabled="!isValidSetup || loadingBattle || socketState.waitingForOpponent"
          >
            <span v-if="loadingBattle">Preparando arena...</span>
            <span v-else-if="socketState.waitingForOpponent">Esperando a {{ getOpponentName }}... ⏳</span>
            <span v-else>¡INICIAR BATALLA! ⚔️</span>
          </button>
          
          <p v-if="!isValidSetup && setup.myTeamId" style="text-align: center; font-size: 0.85rem; color: var(--text-secondary); margin-top: 1rem;">
            {{ getDisableReason }}
          </p>
        </div>
      </form>
    </div>

    <!-- Battle Phase (Animation) -->
    <div v-if="battleActive" class="battle-arena">
      
      <div class="battle-teams" style="display: flex; justify-content: space-around; align-items: center; margin-bottom: 2rem; gap: 1rem; flex-wrap: wrap;">
        <!-- Challenger -->
        <div class="team-summary" style="text-align: center; flex: 1; min-width: 200px;">
          <h2 style="color: var(--primary); margin-bottom: 1rem; font-size: 1.2rem;">{{ battleData.challenger.username }}</h2>
          <div style="display: flex; gap: 0.3rem; justify-content: center; flex-wrap: wrap;">
            <img 
              v-for="p in battleData.challenger.team" 
              :key="p.id" 
              :src="p.sprite" 
              style="width: 45px; height: 45px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));" 
            />
          </div>
        </div>

        <div class="battle-vs" style="font-size: 1.5rem; font-weight: 900; color: var(--text-secondary); opacity: 0.5;">VS</div>

        <!-- Opponent -->
        <div class="team-summary" style="text-align: center; flex: 1; min-width: 200px;">
          <h2 style="color: var(--accent); margin-bottom: 1rem; font-size: 1.2rem;">{{ battleData.opponent.username }}</h2>
          <div style="display: flex; gap: 0.3rem; justify-content: center; flex-wrap: wrap;">
            <img 
              v-for="p in battleData.opponent.team" 
              :key="p.id" 
              :src="p.sprite" 
              style="width: 45px; height: 45px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));" 
            />
          </div>
        </div>
      </div>

      <!-- Matchup Display Component -->
      <div v-if="currentMatchup" class="matchup-display" style="display: flex; flex-direction: row; justify-content: space-around; align-items: flex-end; margin-bottom: 2.5rem; padding: 2.5rem; background: var(--card-bg); border-radius: var(--radius-lg); border: 2px solid var(--glass-border); position: relative; gap: 1rem;">
        
        <div v-if="combatFX.attacker" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; border-radius: var(--radius-lg); z-index: 5; box-shadow: inset 0 0 50px var(--primary); opacity: 0.3;"></div>

        <!-- P1 -->
        <div class="pokemon-side p1" style="text-align: center; flex: 1;">
          <div style="font-weight: 800; text-transform: capitalize; font-size: 1.3rem; margin-bottom: 0.8rem; color: var(--text-primary);">
            {{ currentMatchup.pokemon1?.name || '...' }}
          </div>
          <div style="background: rgba(0,0,0,0.3); height: 12px; border-radius: 6px; margin-bottom: 1.5rem; overflow: hidden; border: 1px solid var(--glass-border);">
            <div 
              class="hp-bar"
              :class="getHpColorClass((currentMatchup.pokemon1?.hp || 0) / (currentMatchup.pokemon1?.maxHp || 1))"
              style="height: 100%; transition: width 0.4s ease-out; background: var(--success);"
              :style="{ width: `${((currentMatchup.pokemon1?.hp || 0) / (currentMatchup.pokemon1?.maxHp || 1)) * 100}%` }"
            ></div>
          </div>
          <img 
            v-if="currentMatchup.pokemon1" 
            :src="getSpriteObj(currentMatchup.pokemon1.id)" 
            class="battle-sprite p1-sprite"
            :class="{ 'is-attacking': combatFX.attacker === 1, 'is-hit': combatFX.defender === 1 }"
            style="width: 140px; height: 140px; object-fit: contain; filter: drop-shadow(0 0 20px rgba(255,71,126,0.2)); transform: scaleX(-1);" 
          />
        </div>

        <div class="vs-divider" style="font-size: 1.5rem; font-weight: 900; color: var(--text-secondary); padding-bottom: 2rem; opacity: 0.3;">VS</div>

        <!-- P2 -->
        <div class="pokemon-side p2" style="text-align: center; flex: 1;">
          <div style="font-weight: 800; text-transform: capitalize; font-size: 1.3rem; margin-bottom: 0.8rem; color: var(--text-primary);">
            {{ currentMatchup.pokemon2?.name || '...' }}
          </div>
          <div style="background: rgba(0,0,0,0.3); height: 12px; border-radius: 6px; margin-bottom: 1.5rem; overflow: hidden; border: 1px solid var(--glass-border);">
            <div 
              class="hp-bar"
              :class="getHpColorClass((currentMatchup.pokemon2?.hp || 0) / (currentMatchup.pokemon2?.maxHp || 1))"
              style="height: 100%; transition: width 0.4s ease-out; background: var(--success);"
              :style="{ width: `${((currentMatchup.pokemon2?.hp || 0) / (currentMatchup.pokemon2?.maxHp || 1)) * 100}%` }"
            ></div>
          </div>
          <img 
            v-if="currentMatchup.pokemon2" 
            :src="getSpriteObj(currentMatchup.pokemon2.id)" 
            class="battle-sprite p2-sprite"
            :class="{ 'is-attacking': combatFX.attacker === 2, 'is-hit': combatFX.defender === 2 }"
            style="width: 140px; height: 140px; object-fit: contain; filter: drop-shadow(0 0 20px rgba(255,133,161,0.2));" 
          />
        </div>
      </div>

      <!-- Attack Menu Component (Turn-based) -->
      <div v-if="battleActive && !battleFinished" class="battle-menu card" style="margin-bottom: 2.5rem; padding: 1.5rem; border: 1px solid var(--glass-border); text-align: center; background: rgba(0,0,0,0.2);">
        <h3 style="margin-bottom: 1rem; color: var(--primary);">¿Qué debería hacer <span style="text-transform: capitalize;">{{ myActivePokemon?.name || 'tu Pokémon' }}</span>?</h3>
        
        <div v-if="waitingForTurn" style="padding: 1rem;">
          <div class="spinner" style="margin: 0 auto 1rem;"></div>
          <p style="color: var(--text-secondary);">Esperando al oponente...</p>
        </div>
        
        <div v-else class="moves-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; max-width: 600px; margin: 0 auto;">
          <button 
            v-for="(move, idx) in myActivePokemon?.moves || []" 
            :key="idx"
            class="btn btn-secondary"
            @click="submitAttack(idx)"
            style="padding: 1rem; text-transform: capitalize; border: 2px solid var(--glass-border); transition: all 0.2s;"
          >
            <strong style="font-size: 1.1rem; display: block; margin-bottom: 0.3rem;">{{ move.name.replace('-', ' ') }}</strong>
            <span style="font-size: 0.85rem; opacity: 0.8; background: var(--card-bg); padding: 0.2rem 0.5rem; border-radius: 4px;">{{ move.type }} (Pwr: {{ move.power || '-' }})</span>
          </button>
        </div>
      </div>

      <!-- Log Display -->
      <div class="battle-log card" ref="logContainer" style="height: 250px; overflow-y: auto; padding: 1.5rem; border: 1px solid var(--glass-border); background: rgba(0,0,0,0.2);">
        <div 
          v-for="(entry, index) in visibleLog" 
          :key="index"
          class="battle-log-entry"
          :class="entry.type"
          style="margin-bottom: 0.5rem; font-size: 0.95rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.3rem;"
        >
          {{ entry.message }}
        </div>
      </div> <!-- Closes battle-log -->
    </div> <!-- Closes battle-arena -->
      
    <div style="text-align: center; margin-top: 3rem; animation: fadeIn 1s;" v-if="battleFinished">
        <h2 style="font-size: 2.5rem; color: var(--primary); margin-bottom: 2rem;">
          {{ getResultText() }}
        </h2>
        <button @click="resetBattle" class="btn btn-secondary">Volver a la Arena ✨</button>
      </div>

    </div> <!-- Closes wrapper -->
</template>

<script>
import api from '../services/api';
import { getSocket, socketState } from '../services/socket';

export default {
  data() {
    return {
      loading: true,
      friends: [],
      teams: [],
      opponentTeams: [],
      loadingOpponentTeams: false,
      
      setup: {
        opponentId: '',
        myTeamId: ''
      },

      loadingBattle: false,
      battleActive: false,
      battleFinished: false,
      battleData: null,
      fullLog: [],
      visibleLog: [],
      currentMatchup: null,
      myActivePokemon: null,
      isChallenger: false,
      waitingForTurn: false,
      
      pokemonSpriteMap: {},
      animationTimer: null,
      combatFX: { attacker: null, defender: null },
      socketState
    };
  },
  computed: {
    isValidSetup() {
      const myTeam = this.teams.find(t => t.id === this.setup.myTeamId);
      
      return this.setup.opponentId && 
             this.setup.myTeamId && 
             myTeam?.pokemon?.length > 0;
    },
    getDisableReason() {
      if (!this.setup.opponentId) return 'Selecciona un oponente';
      if (!this.setup.myTeamId) return 'Selecciona tu equipo';
      
      const myTeam = this.teams.find(t => t.id === this.setup.myTeamId);
      if (myTeam?.pokemon?.length === 0) return 'Tu equipo seleccionado no tiene Pokémon';
      
      return '';
    },
    getOpponentName() {
      if (!this.setup.opponentId) return '';
      return this.friends.find(f => f.friend_user_id === this.setup.opponentId)?.username || '';
    }
  },
  async mounted() {
    // Check if we came from friends page with an opponent pre-selected
    const opponentFromUrl = this.$route.query.opponent;
    if (opponentFromUrl) {
      this.setup.opponentId = String(opponentFromUrl);
    }
    
    window.addEventListener('battle-turn-result', this.handleTurnResult);

    await Promise.all([
      this.fetchFriends(),
      this.fetchMyTeams()
    ]);
    

    this.loading = false;

    // Check if there is an active battle right now when component mounts!
    if (this.socketState.activeBattlePayload) {
      this.loadSocketBattle(this.socketState.activeBattlePayload);
    }
  },
  watch: {
    'socketState.activeBattlePayload': {
      handler(newVal) {
        if (newVal) this.loadSocketBattle(newVal);
      },
      immediate: true
    }
  },
  beforeUnmount() {
    window.removeEventListener('battle-turn-result', this.handleTurnResult);
    if (this.animationTimer) clearInterval(this.animationTimer);
    this.resetBattle();
  },
  methods: {
    async fetchFriends() {
      const res = await api.get('/friends');
      this.friends = res.data;
    },
    async fetchMyTeams() {
      const res = await api.get('/teams');
      this.teams = res.data;
    },
    async fetchOpponentTeams() {
      if (!this.setup.opponentId) return;
      this.loadingOpponentTeams = true;
      try {
        const res = await api.get(`/teams/user/${this.setup.opponentId}`);
        this.opponentTeams = res.data;
        
        // Auto-select the first valid team (with pokemon)
        const validTeam = this.opponentTeams.find(t => t.pokemon_count > 0);
        if (validTeam) {
          this.setup.opponentTeamId = validTeam.id;
        } else if (this.opponentTeams.length > 0) {
          // Fallback to first one if none are valid, but it will show warning
          this.setup.opponentTeamId = this.opponentTeams[0].id;
        }
      } catch (e) {
        this.opponentTeams = [];
      } finally {
        this.loadingOpponentTeams = false;
      }
    },
    async startBattle() {
      const socket = getSocket();
      if (!socket || !socket.connected) {
        alert('Debes estar conectado a internet/sockets para invitar.');
        return;
      }
      
      this.socketState.waitingForOpponent = true;
      this.socketState.pendingChallengerTeamId = this.setup.myTeamId;
      socket.emit('battle_invite', {
        opponentId: this.setup.opponentId,
        teamMeta: {
          challengerTeamId: this.setup.myTeamId
        }
      });
      
      // Auto cancel after 30 seconds if nothing happens
      setTimeout(() => {
        if (this.socketState.waitingForOpponent && !this.battleActive) {
          this.socketState.waitingForOpponent = false;
          alert('El oponente no respondió a tiempo.');
        }
      }, 30000);

      // Now we wait... App.vue will hear 'battle_accepted' (actually we can just wait for 'battle_started')
    },
    async triggerRealtimeBattleViaAccept(defenderId, defenderTeamId) {
      // This runs on the challenger side when the defender accepts
      this.loadingBattle = true;
      try {
        await api.post('/battles', {
          opponent_id: defenderId,
          challenger_team_id: this.setup.myTeamId,
          opponent_team_id: defenderTeamId
        });
        // We do NOT call playAnimation here because the backend will emit 'battle_start' to both!
      } catch (e) {
        alert(e.response?.data?.error || 'Error al iniciar batalla real-time');
        this.socketState.waitingForOpponent = false;
      } finally {
        this.loadingBattle = false;
      }
    },
    loadSocketBattle(payload) {
      this.battleData = payload;
      this.fullLog = [];

      this.pokemonSpriteMap = {};
      this.battleData.challenger.team.forEach(p => { this.pokemonSpriteMap[p.id] = p.sprite; });
      this.battleData.opponent.team.forEach(p => { this.pokemonSpriteMap[p.id] = p.sprite; });

      const localUser = JSON.parse(localStorage.getItem('user'));
      this.isChallenger = (String(this.battleData.challenger.id) === String(localUser?.id || localUser?._id));
      
      this.myActivePokemon = this.isChallenger ? payload.initialState.p1Active : payload.initialState.p2Active;
      this.currentMatchup = {
        pokemon1: payload.initialState.p1Active,
        pokemon2: payload.initialState.p2Active
      };

      this.battleFinished = false;
      this.battleActive = true;
      this.waitingForTurn = false;
      // We do not play animation immediately since turn 1 hasn't occurred yet, 
      // but we wait for user to click a move.
    },
    submitAttack(idx) {
      if (this.waitingForTurn) return;
      this.waitingForTurn = true;
      const socket = getSocket();
      socket.emit('submit_action', {
        battleId: this.battleData.id,
        moveIndex: idx
      });
    },
    handleTurnResult(event) {
      const data = event.detail;
      this.fullLog = data.log; // This round's log
      this.playAnimation(() => {
        // After animation completes
        this.myActivePokemon = this.isChallenger ? data.p1Active : data.p2Active;
        this.currentMatchup = {
           pokemon1: data.p1Active,
           pokemon2: data.p2Active
        };
        
        if (data.winner) {
          this.battleData.winner = data.winner;
          this.battleData.winner_id = (data.winner === 1) ? this.battleData.challenger.id : (data.winner === 2) ? this.battleData.opponent.id : null;
          this.battleFinished = true;
        } else {
          this.waitingForTurn = false;
        }
      });
    },
    getSpriteObj(id) {
      return this.pokemonSpriteMap[id] || '';
    },
    getHpColorClass(ratio) {
      if (ratio > 0.5) return 'hp-high';
      if (ratio > 0.2) return 'hp-medium';
      return 'hp-low';
    },
    playAnimation(onComplete) {
      this.visibleLog = [];
      const startTime = Date.now();
      const intervalMs = 800; // 800ms time step per discrete action
      let lastI = -1;
      
      this.animationTimer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const targetFrame = Math.floor(elapsed / intervalMs);
        
        // Catch up on missed frames (e.g., if tab went inactive and browser paused setInterval)
        while (lastI < targetFrame && lastI < this.fullLog.length - 1) {
          lastI++;
          const entry = this.fullLog[lastI];
          this.visibleLog.push(entry);
          
          const isCatchingUp = lastI < targetFrame; // true if this isn't the final frame of this tick
          
          if (entry.type === 'matchup') {
            this.currentMatchup = {
              pokemon1: { ...entry.pokemon1 }, // challenger
              pokemon2: { ...entry.pokemon2 }  // opponent
            };
          } else if (entry.type === 'attack') {
            const attackerSide = entry.attacker === this.currentMatchup?.pokemon1?.name ? 1 : 2;
            const defenderSide = attackerSide === 1 ? 2 : 1;
            
            if (isCatchingUp) {
              // Skip FX timers during catch-up and apply instant state changes for perfect sync
              if (this.currentMatchup) {
                if (this.currentMatchup.pokemon1.name === entry.defender) {
                  this.currentMatchup.pokemon1.hp = entry.defenderHp;
                } else if (this.currentMatchup.pokemon2.name === entry.defender) {
                  this.currentMatchup.pokemon2.hp = entry.defenderHp;
                }
              }
            } else {
              // Play normal visual FX
              this.combatFX = { attacker: attackerSide, defender: defenderSide };
              
              setTimeout(() => {
                this.combatFX = { attacker: null, defender: null };
              }, 600);

              setTimeout(() => {
                if (this.currentMatchup) {
                  if (this.currentMatchup.pokemon1.name === entry.defender) {
                    this.currentMatchup.pokemon1.hp = entry.defenderHp;
                  } else if (this.currentMatchup.pokemon2.name === entry.defender) {
                    this.currentMatchup.pokemon2.hp = entry.defenderHp;
                  }
                }
              }, 300);
            }
          }
          
          // Auto scroll log (only for the last frame processed)
          if (!isCatchingUp) {
            this.$nextTick(() => {
              if (this.$refs.logContainer) {
                this.$refs.logContainer.scrollTop = this.$refs.logContainer.scrollHeight;
              }
            });
          }
        }
        
        if (lastI >= this.fullLog.length - 1) {
          clearInterval(this.animationTimer);
          this.$nextTick(() => {
            if (this.$refs.logContainer) {
              this.$refs.logContainer.scrollTop = this.$refs.logContainer.scrollHeight;
            }
          });
          if (onComplete) onComplete();
        }
      }, 100); // tick frequently but advance game-time based on actual wall-clock
    },
    resetBattle() {
      this.battleActive = false;
      this.battleFinished = false;
      this.battleData = null;
      this.fullLog = [];
      this.visibleLog = [];
      this.currentMatchup = null;
      this.socketState.activeBattlePayload = null; // Clear from state
    },
    getResultText() {
      if (!this.battleData) return '';
      // No winner = draw
      if (!this.battleData.winner_id) return '¡EMPATE!';
      try {
        const localUser = JSON.parse(localStorage.getItem('user'));
        const localId = localUser?.id || localUser?._id || '';
        const winnerId = String(this.battleData.winner_id);
        if (String(localId) === winnerId) return '🏆 ¡HAS GANADO!';
        return '💀 ¡HAS PERDIDO!';
      } catch {
        // fallback to positional
        return this.battleData.winner === 1 ? '🏆 ¡HAS GANADO!' : '💀 ¡HAS PERDIDO!';
      }
    }
  }
}
</script>

<style scoped>
.battle-sprite {
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@media (max-width: 768px) {
  .matchup-display {
    flex-direction: column !important;
    align-items: center !important;
    padding: 1.5rem !important;
  }
  
  .pokemon-side {
    width: 100% !important;
  }
  
  .vs-divider {
    padding-bottom: 0 !important;
    margin: 1rem 0;
  }
  
  .battle-sprite {
    width: 100px !important;
    height: 100px !important;
  }
}

/* Attacking animation: lunge forward */
.p1-sprite.is-attacking {
  transform: scaleX(-1) translateX(-40px) scale(1.2) !important;
  z-index: 10;
}
.p2-sprite.is-attacking {
  transform: translateX(-40px) scale(1.2) !important;
  z-index: 10;
}

/* Hit animation: flash red and shake */
@keyframes shake-hurt {
  0% { transform: scaleX(var(--sx, 1)) translateX(0); filter: drop-shadow(0 0 15px rgba(255,0,0,0.8)) brightness(0.5) sepia(1) hue-rotate(-50deg) saturate(5); }
  20% { transform: scaleX(var(--sx, 1)) translateX(-15px); }
  40% { transform: scaleX(var(--sx, 1)) translateX(15px); }
  60% { transform: scaleX(var(--sx, 1)) translateX(-15px); }
  80% { transform: scaleX(var(--sx, 1)) translateX(15px); }
  100% { transform: scaleX(var(--sx, 1)) translateX(0); filter: drop-shadow(0 0 15px rgba(0,0,0,0)); }
}

.p1-sprite.is-hit {
  --sx: -1;
  animation: shake-hurt 0.5s ease-in-out both;
}
.p2-sprite.is-hit {
  --sx: 1;
  animation: shake-hurt 0.5s ease-in-out both;
}

/* HP Bar colors dynamically */
.hp-bar.hp-high { background: var(--success) !important; }
.hp-bar.hp-medium { background: var(--warning) !important; }
.hp-bar.hp-low { background: var(--error) !important; }

/* Battle Log entry type styles */
:deep(.battle-log-entry.status) { color: var(--accent); font-style: italic; font-weight: 600; }
:deep(.battle-log-entry.status_damage) { color: var(--error); font-weight: 600; }
:deep(.battle-log-entry.faint) { color: var(--text-secondary); font-weight: 700; letter-spacing: 0.5px; }
:deep(.battle-log-entry.switch) { color: #6890f0; font-weight: 600; font-style: italic; }
:deep(.battle-log-entry.miss) { color: var(--text-secondary); opacity: 0.8; }
:deep(.battle-log-entry.end) {
  color: #ffd700; font-size: 1.1rem; font-weight: 800;
  text-align: center; border-top: 1px solid rgba(255,215,0,0.3);
  padding-top: 0.5rem; margin-top: 0.5rem;
}
:deep(.battle-log-entry.start) {
  color: var(--primary); font-weight: 700; text-align: center; margin-bottom: 0.5rem;
}
:deep(.battle-log-entry.matchup) {
  color: #fff; font-weight: 800; font-size: 1rem;
  border-bottom: 1px solid var(--glass-border);
  padding-bottom: 0.5rem; margin-bottom: 0.5rem; text-align: center;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
