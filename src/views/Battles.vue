<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Arena de Batalla</h1>
      <p class="page-subtitle">Desafía a tus amigos con tus mejores equipos Pokémon</p>
    </div>

    <!-- Setup Phase -->
    <div v-if="!battleActive && !battleResult" class="card-glass" style="max-width: 800px; margin: 0 auto;">
      
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
      </div>

      <div v-else-if="friends.length === 0">
        <h3>Necesitas amigos para batallar</h3>
        <p>Ve a la sección de amigos para agregar a otros entrenadores.</p>
        <button @click="$router.push('/friends')" class="btn btn-primary mt-4">Ir a Amigos</button>
      </div>

      <div v-else-if="teams.length === 0">
        <h3>Necesitas un equipo para batallar</h3>
        <p>No tienes ningún equipo armado. Ve a la sección de equipos.</p>
        <button @click="$router.push('/teams')" class="btn btn-primary mt-4">Crear Equipo</button>
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
          <p v-if="setup.myTeamId && teams.find(t => t.id === setup.myTeamId)?.pokemon.length === 0" style="color: #e63946; font-size: 0.8rem; margin-top: 0.5rem; font-weight: 600;">
            ⚠️ Este equipo está vacío. Añade Pokémon en la sección de Equipos para poder batallar.
          </p>
        </div>

        <div class="form-group" style="margin-top: 1.5rem;" v-if="setup.opponentId && !loadingOpponentTeams">
          <label class="form-label">⚔️ Equipo del Oponente</label>
          <select v-model="setup.opponentTeamId" class="form-select" required>
            <option value="" disabled>Selecciona el equipo a enfrentar...</option>
            <option v-for="t in opponentTeams" :key="t.id" :value="t.id">
              {{ t.name }} ({{ t.pokemon_count }} Pokémon) {{ t.pokemon_count === 0 ? '⚠️' : '' }}
            </option>
          </select>
          <p v-if="setup.opponentTeamId && opponentTeams.find(t => t.id === setup.opponentTeamId)?.pokemon_count === 0" style="color: #6890f0; font-size: 0.8rem; margin-top: 0.5rem; font-weight: 600;">
            ⚠️ El equipo seleccionado del oponente no tiene Pokémon. Pídele que añada algunos!
          </p>
          <p v-if="opponentTeams.length === 0" style="color: var(--accent); font-size: 0.8rem; margin-top: 0.5rem;">
            Tu amigo aún no ha creado ningún equipo.
          </p>
        </div>
        
        <div v-if="loadingOpponentTeams" class="spinner" style="margin: 1.5rem auto;"></div>

        <div style="margin-top: 2rem;">
          <button 
            type="submit" 
            class="btn btn-primary" 
            style="width: 100%; font-size: 1.2rem; padding: 1rem;" 
            :disabled="!isValidSetup || loadingBattle"
          >
            {{ loadingBattle ? 'Preparando arena...' : '¡INICIAR BATALLA!' }}
          </button>
          
          <p v-if="!isValidSetup && (setup.myTeamId || setup.opponentTeamId)" style="text-align: center; font-size: 0.85rem; color: var(--text-muted); margin-top: 0.75rem;">
            {{ getDisableReason }}
          </p>
        </div>
      </form>
    </div>

    <!-- Battle Phase (Animation) -->
    <div v-if="battleActive" class="battle-arena">
      
      <div class="battle-teams">
        <!-- Challenger -->
        <div style="text-align: center;">
          <h2 style="color: var(--accent); margin-bottom: 1rem;">{{ battleData.challenger.username }}</h2>
          <div style="display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap;">
            <img 
              v-for="p in battleData.challenger.team" 
              :key="p.id" 
              :src="p.sprite" 
              style="width: 60px; height: 60px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));" 
            />
          </div>
        </div>

        <div class="battle-vs">VS</div>

        <!-- Opponent -->
        <div style="text-align: center;">
          <h2 style="color: #6890f0; margin-bottom: 1rem;">{{ battleData.opponent.username }}</h2>
          <div style="display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap;">
            <img 
              v-for="p in battleData.opponent.team" 
              :key="p.id" 
              :src="p.sprite" 
              style="width: 60px; height: 60px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));" 
            />
          </div>
        </div>
      </div>

      <!-- Matchup Display Component -->
      <div v-if="currentMatchup" style="display: flex; justify-content: space-around; align-items: flex-end; margin-bottom: 2rem; padding: 2rem; background: var(--bg-primary); border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
        <!-- P1 -->
        <div style="text-align: center; width: 40%;">
          <div style="font-weight: 700; text-transform: capitalize; font-size: 1.2rem; margin-bottom: 0.5rem;">
            {{ currentMatchup.pokemon1?.name || '...' }}
          </div>
          <div style="background: var(--surface); height: 10px; border-radius: var(--radius-full); margin-bottom: 1rem; overflow: hidden; border: 1px solid var(--border-color);">
            <div 
              style="height: 100%; background: var(--gradient-accent); transition: width 0.3s ease;"
              :style="{ width: `${((currentMatchup.pokemon1?.hp || 0) / (currentMatchup.pokemon1?.maxHp || 1)) * 100}%` }"
            ></div>
          </div>
          <img 
            v-if="currentMatchup.pokemon1" 
            :src="getSpriteObj(currentMatchup.pokemon1.id)" 
            style="width: 150px; height: 150px; object-fit: contain; filter: drop-shadow(0 0 15px rgba(230,57,70,0.3)); transform: scaleX(-1);" 
          />
        </div>

        <div style="font-size: 2rem; font-weight: 900; color: var(--text-muted); padding-bottom: 3rem;">VS</div>

        <!-- P2 -->
        <div style="text-align: center; width: 40%;">
          <div style="font-weight: 700; text-transform: capitalize; font-size: 1.2rem; margin-bottom: 0.5rem;">
            {{ currentMatchup.pokemon2?.name || '...' }}
          </div>
          <div style="background: var(--surface); height: 10px; border-radius: var(--radius-full); margin-bottom: 1rem; overflow: hidden; border: 1px solid var(--border-color);">
            <div 
              style="height: 100%; background: linear-gradient(90deg, #6890f0, #4288f7); transition: width 0.3s ease;"
              :style="{ width: `${((currentMatchup.pokemon2?.hp || 0) / (currentMatchup.pokemon2?.maxHp || 1)) * 100}%` }"
            ></div>
          </div>
          <img 
            v-if="currentMatchup.pokemon2" 
            :src="getSpriteObj(currentMatchup.pokemon2.id)" 
            style="width: 150px; height: 150px; object-fit: contain; filter: drop-shadow(0 0 15px rgba(104,144,240,0.3));" 
          />
        </div>
      </div>

      <!-- Log Display -->
      <div class="battle-log" ref="logContainer">
        <div 
          v-for="(entry, index) in visibleLog" 
          :key="index"
          class="battle-log-entry"
          :class="entry.type"
        >
          {{ entry.message }}
        </div>
      </div>

      <div style="text-align: center; margin-top: 2rem;" v-if="battleFinished">
        <h2 style="font-size: 2rem; color: var(--accent); margin-bottom: 1.5rem;">
          {{ battleData.winner === 1 ? '¡HAS GANADO!' : (battleData.winner === 2 ? '¡HAS PERDIDO!' : '¡EMPATE!') }}
        </h2>
        <button @click="resetBattle" class="btn btn-primary">Volver a la Arena</button>
      </div>

    </div>

  </div>
</template>

<script>
import api from '../services/api';

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
        myTeamId: '',
        opponentTeamId: '',
      },

      loadingBattle: false,
      battleActive: false,
      battleFinished: false,
      battleData: null,
      fullLog: [],
      visibleLog: [],
      currentMatchup: null,
      
      pokemonSpriteMap: {},
      animationTimer: null,
    };
  },
  computed: {
    isValidSetup() {
      const myTeam = this.teams.find(t => t.id === this.setup.myTeamId);
      const opponentTeam = this.opponentTeams.find(t => t.id === this.setup.opponentTeamId);
      
      return this.setup.opponentId && 
             this.setup.myTeamId && 
             this.setup.opponentTeamId &&
             myTeam?.pokemon?.length > 0 &&
             opponentTeam?.pokemon_count > 0;
    },
    getDisableReason() {
      if (!this.setup.opponentId) return 'Selecciona un oponente';
      if (!this.setup.myTeamId) return 'Selecciona tu equipo';
      if (!this.setup.opponentTeamId) return 'Selecciona el equipo del oponente';
      
      const myTeam = this.teams.find(t => t.id === this.setup.myTeamId);
      if (myTeam?.pokemon?.length === 0) return 'Tu equipo seleccionado no tiene Pokémon';
      
      const opponentTeam = this.opponentTeams.find(t => t.id === this.setup.opponentTeamId);
      if (opponentTeam?.pokemon_count === 0) return 'El equipo del oponente no tiene Pokémon';
      
      return '';
    }
  },
  async mounted() {
    // Check if we came from friends page with an opponent pre-selected
    const opponentFromUrl = this.$route.query.opponent;
    if (opponentFromUrl) {
      this.setup.opponentId = parseInt(opponentFromUrl);
    }
    
    await Promise.all([
      this.fetchFriends(),
      this.fetchMyTeams()
    ]);
    
    if (this.setup.opponentId) {
      await this.fetchOpponentTeams();
    }
    
    this.loading = false;
  },
  beforeUnmount() {
    if (this.animationTimer) clearInterval(this.animationTimer);
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
      this.loadingBattle = true;
      try {
        const res = await api.post('/battles', {
          opponent_id: this.setup.opponentId,
          challenger_team_id: this.setup.myTeamId,
          opponent_team_id: this.setup.opponentTeamId
        });
        
        this.battleData = res.data;
        this.fullLog = res.data.log;
        
        // Map sprites for easy access
        this.battleData.challenger.team.forEach(p => { this.pokemonSpriteMap[p.id] = p.sprite; });
        this.battleData.opponent.team.forEach(p => { this.pokemonSpriteMap[p.id] = p.sprite; });

        this.battleActive = true;
        this.playAnimation();
        
      } catch (e) {
        alert(e.response?.data?.error || 'Error al iniciar batalla');
      } finally {
        this.loadingBattle = false;
      }
    },
    getSpriteObj(id) {
      return this.pokemonSpriteMap[id] || '';
    },
    playAnimation() {
      this.visibleLog = [];
      let i = 0;
      
      this.animationTimer = setInterval(() => {
        if (i < this.fullLog.length) {
          const entry = this.fullLog[i];
          this.visibleLog.push(entry);
          
          if (entry.type === 'matchup') {
            this.currentMatchup = {
              pokemon1: { ...entry.pokemon1 }, // challenger
              pokemon2: { ...entry.pokemon2 }  // opponent
            };
          } else if (entry.type === 'attack') {
            // Update HP visually
            if (this.currentMatchup) {
              if (this.currentMatchup.pokemon1.name === entry.defender) {
                this.currentMatchup.pokemon1.hp = entry.defenderHp;
              } else if (this.currentMatchup.pokemon2.name === entry.defender) {
                this.currentMatchup.pokemon2.hp = entry.defenderHp;
              }
            }
          }
          
          // Auto scroll log
          this.$nextTick(() => {
            if (this.$refs.logContainer) {
              this.$refs.logContainer.scrollTop = this.$refs.logContainer.scrollHeight;
            }
          });
          
          i++;
        } else {
          clearInterval(this.animationTimer);
          this.battleFinished = true;
        }
      }, 800); // 800ms between log entries
    },
    resetBattle() {
      this.battleActive = false;
      this.battleFinished = false;
      this.battleData = null;
      this.fullLog = [];
      this.visibleLog = [];
      this.currentMatchup = null;
    }
  }
}
</script>
