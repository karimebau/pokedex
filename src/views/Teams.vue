<template>
  <div class="main-content">
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.5rem; margin-bottom: 2.5rem;">
      <div style="flex: 1; min-width: 250px;">
        <h1 class="page-title">Mis Equipos Pokémon 🛡️</h1>
        <p style="color: var(--text-secondary); margin-bottom: 0;">Arma tus equipos ideales (máx. 6 Pokémon por equipo)</p>
      </div>
      <button @click="showCreateModal = true" class="btn btn-primary" style="height: 50px;">
        + Crear Nuevo Equipo ✨
      </button>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <div v-else-if="teams.length === 0" class="empty-state" style="text-align: center; padding: 4rem 2rem;">
      <div style="font-size: 4rem; margin-bottom: 1rem;">🛡️</div>
      <h3 style="color: var(--primary);">No tienes equipos registrados</h3>
      <p style="color: var(--text-secondary);">Crea tu primer equipo para competir en batallas.</p>
      <button @click="showCreateModal = true" class="btn btn-primary" style="margin-top: 2rem;">Crear Mi Primer Equipo</button>
    </div>

    <div v-else style="display: flex; flex-direction: column; gap: 2.5rem;">
      <div v-for="team in teams" :key="team.id" class="card team-card" style="padding: 2.5rem;">
        <div class="team-header" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1.5rem; margin-bottom: 2rem;">
          <div style="flex: 1; min-width: 200px;">
            <h2 class="team-name" style="margin-bottom: 0.5rem; font-size: 1.8rem; text-transform: capitalize;">{{ team.name }}</h2>
            <div 
              class="status-badge" 
              :class="team.pokemonData && team.pokemonData.some(p => p !== null) ? 'status-ready' : 'status-empty'"
              style="display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; font-weight: 700; padding: 0.3rem 0.8rem; border-radius: 20px;"
              :style="team.pokemonData && team.pokemonData.some(p => p !== null) ? 'background: rgba(74, 222, 128, 0.1); color: var(--success);' : 'background: rgba(251, 133, 0, 0.1); color: var(--warning);'"
            >
              {{ team.pokemonData && team.pokemonData.some(p => p !== null) ? '✓ Equipo Listo' : '⚠ Equipo Vacío' }}
            </div>
          </div>
          <div style="display: flex; gap: 0.8rem; align-items: center;">
            <button @click="openAddModal(team)" class="btn btn-secondary btn-sm" :disabled="team.pokemonData && team.pokemonData.filter(p => p !== null).length >= 6">
              Añadir 🎀
            </button>
            <button @click="deleteTeam(team.id)" class="btn btn-primary btn-sm" style="background: var(--error); border-color: var(--error);">
              Eliminar
            </button>
          </div>
        </div>

        <div class="team-pokemon-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 1.2rem;">
          <div v-for="slot in 6" :key="slot" class="team-slot card" 
            :class="{ filled: team.pokemonData && team.pokemonData[slot-1], loading: fetchingSlots[team.id + '-' + slot] }"
            style="min-height: 180px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; border-style: dashed; border-width: 2px; border-color: var(--glass-border); background: transparent;"
          >
            <div v-if="fetchingSlots[team.id + '-' + slot]" class="spinner" style="width: 30px; height: 30px; border-width: 3px;"></div>
            <template v-else-if="team.pokemonData && team.pokemonData[slot-1]">
              <div style="background: var(--card-bg); width: 100%; height: 100%; border-radius: inherit; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 1rem;">
                <img :src="team.pokemonData[slot-1].sprite" :alt="team.pokemonData[slot-1].name" :title="team.pokemonData[slot-1].name" style="width: 80px; height: 80px; object-fit: contain; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));" />
                <button class="remove-btn" @click="removePokemon(team.id, team.pokemonData[slot-1].id)" title="Remover del equipo" style="position: absolute; top: 0.5rem; right: 0.5rem; background: var(--error); color: white; border: none; width: 24px; height: 24px; border-radius: 50%; font-size: 0.7rem; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                  ✖
                </button>
                <div class="slot-name" style="margin-top: 0.8rem; font-weight: 700; font-size: 0.85rem; color: var(--text-primary); text-transform: capitalize;">{{ team.pokemonData[slot-1].name }}</div>
              </div>
            </template>
            <template v-else>
              <div style="text-align: center; opacity: 0.3;">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">+</div>
                <span style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase;">Vacío</span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Team Modal (Overlay) -->
    <transition name="toast">
      <div v-if="showCreateModal" class="modal-overlay" @click="showCreateModal = false" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 1rem;">
        <div class="card" @click.stop style="width: 100%; max-width: 450px; padding: 2.5rem; border-color: var(--primary);">
          <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
            <h3 class="page-title" style="margin-bottom: 0; font-size: 1.5rem;">Nuevo Equipo 🛡️</h3>
            <button @click="showCreateModal = false" style="background: none; border: none; color: var(--text-secondary); font-size: 2rem; cursor: pointer;">&times;</button>
          </div>
          <form @submit.prevent="createTeam">
            <div class="form-group">
              <label class="form-label">Nombre del Equipo</label>
              <input v-model="newTeamName" type="text" class="form-input" placeholder="Ej. Dream Team 🌸" required autofocus />
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1.5rem; height: 50px;">Guardar Equipo ✨</button>
          </form>
        </div>
      </div>
    </transition>

    <!-- Add Pokemon Modal (Overlay) -->
    <transition name="toast">
      <div v-if="showAddModal" class="modal-overlay" @click="showAddModal = false" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 1rem;">
        <div class="card" @click.stop style="width: 100%; max-width: 700px; padding: 2.5rem; max-height: 90vh; display: flex; flex-direction: column;">
          <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
            <h3 class="page-title" style="margin-bottom: 0; font-size: 1.5rem;">Añadir Pokémon 🔗</h3>
            <button @click="showAddModal = false" style="background: none; border: none; color: var(--text-secondary); font-size: 2rem; cursor: pointer;">&times;</button>
          </div>
          
          <div class="form-group" style="margin-bottom: 2rem;">
            <input v-model="addSearch" @input="debounceAddSearch" type="text" class="form-input" placeholder="Buscar por nombre o ID de Pokémon..." style="padding: 1rem 1.5rem; font-size: 1.1rem;" />
          </div>

          <div v-if="searchingPokemon" class="loading" style="padding: 3rem;">
            <div class="spinner"></div>
          </div>
          
          <div v-else-if="searchResults.length === 0 && addSearch" class="empty-state" style="text-align: center; padding: 3rem;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🤔</div>
            <p style="color: var(--text-secondary);">No se encontraron Pokémon con ese nombre.</p>
          </div>

          <div v-else style="flex: 1; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 1rem; padding: 0.5rem;" class="custom-scrollbar">
            <div 
              v-for="p in searchResults" 
              :key="p.id" 
              class="card" 
              style="padding: 1.5rem; text-align: center; cursor: pointer; border-color: rgba(255,255,255,0.05); transition: var(--transition);"
              @mouseover="$event.currentTarget.style.borderColor = 'var(--primary)'"
              @mouseleave="$event.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'"
              @click="addPokemonToTeam(p.id)"
            >
              <img :src="p.sprite" style="width: 70px; height: 70px; object-fit: contain; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));" />
              <div style="font-size: 0.85rem; font-weight: 700; text-transform: capitalize; margin-top: 1rem;">{{ p.name }}</div>
              <div style="font-size: 0.7rem; color: var(--text-secondary); opacity: 0.6; margin-top: 0.2rem;">#{{ String(p.id).padStart(4, '0') }}</div>
            </div>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script>
import api from '../services/api';

export default {
  data() {
    return {
      teams: [],
      loading: true,
      
      showCreateModal: false,
      newTeamName: '',
      
      showAddModal: false,
      activeTeam: null,
      addSearch: '',
      searchResults: [],
      searchingPokemon: false,
      searchTimeout: null,
      fetchingSlots: {},
    };
  },
  async mounted() {
    await this.fetchTeams();
  },
  methods: {
    async fetchTeams() {
      this.loading = true;
      try {
        const res = await api.get('/teams');
        const dbTeams = res.data;

        // Fetch sprite info for each pokemon in each team in parallel
        await Promise.all(dbTeams.map(async (team) => {
          team.pokemonData = Array(6).fill(null);
          
          if (team.pokemon && team.pokemon.length > 0) {
            const pokemonLoadingPromises = team.pokemon.map(async (p) => {
              const slotIdx = p.slot - 1;
              const slotKey = `${team.id}-${p.slot}`;
              this.fetchingSlots[slotKey] = true;
              
              try {
                const detail = await api.get(`/pokemon/${p.pokemon_id}`);
                if (slotIdx >= 0 && slotIdx < 6) {
                  team.pokemonData[slotIdx] = {
                    id: p.pokemon_id,
                    name: detail.data.name,
                    sprite: detail.data.sprite,
                    slot: p.slot
                  };
                }
              } catch (e) {
                console.error(`Error loading slot ${p.slot} for team ${team.name}`, e);
              } finally {
                this.fetchingSlots[slotKey] = false;
              }
            });
            await Promise.all(pokemonLoadingPromises);
          }
        }));

        this.teams = [...dbTeams];
      } catch (e) {
        console.error('Error fetching teams', e);
      } finally {
        this.loading = false;
      }
    },
    async createTeam() {
      try {
        await api.post('/teams', { name: this.newTeamName });
        this.newTeamName = '';
        this.showCreateModal = false;
        await this.fetchTeams();
      } catch (e) {
        alert(e.response?.data?.error || 'Error al crear equipo');
      }
    },
    async deleteTeam(id) {
      if (confirm('¿Seguro que deseas eliminar el equipo completo?')) {
        try {
          await api.delete(`/teams/${id}`);
          this.teams = this.teams.filter(t => t.id !== id);
        } catch (e) {
          alert('Error al eliminar equipo');
        }
      }
    },
    openAddModal(team) {
      this.activeTeam = team;
      console.log('[Teams] openAddModal - team:', team, 'id:', team.id, '_id:', team._id);
      this.addSearch = '';
      this.searchResults = [];
      this.showAddModal = true;
      
      // Load a diverse set of pokemon initially
      this.performPokemonSearch('generation-i'); 
    },
    debounceAddSearch() {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        if (this.addSearch) {
          this.performPokemonSearch(this.addSearch);
        } else {
          this.searchResults = [];
        }
      }, 500);
    },
    async performPokemonSearch(query) {
      this.searchingPokemon = true;
      try {
        // We use the pokemon edge with 'name' query
        const res = await api.get(`/pokemon?name=${query}`);
        this.searchResults = res.data.pokemon || [];
      } catch (e) {
        this.searchResults = [];
      } finally {
        this.searchingPokemon = false;
      }
    },
    async addPokemonToTeam(pokemonId) {
      const teamId = this.activeTeam?.id || this.activeTeam?._id;
      console.log('[Teams] addPokemonToTeam - teamId:', teamId, 'pokemonId:', pokemonId);
      if (!teamId) {
        alert('Error: No se pudo identificar el equipo. Intenta recargando la página.');
        return;
      }
      try {
        await api.post(`/teams/${teamId}/pokemon`, { pokemon_id: pokemonId });
        this.showAddModal = false;
        await this.fetchTeams();
      } catch (e) {
        alert(e.response?.data?.error || 'Error al agregar Pokémon');
      }
    },
    async removePokemon(teamId, pokemonId) {
      if (confirm('¿Remover este pokémon del equipo?')) {
        try {
          await api.delete(`/teams/${teamId}/pokemon/${pokemonId}`);
          await this.fetchTeams();
        } catch (e) {
          alert('Error al remover pokémon');
        }
      }
    }
  }
}
</script>
