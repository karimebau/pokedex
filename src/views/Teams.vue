<template>
  <div>
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: flex-end;">
      <div>
        <h1 class="page-title">Equipos Pokémon</h1>
        <p class="page-subtitle">Arma tus equipos ideales para la batalla (máx. 6 Pokémon vales por equipo)</p>
      </div>
      <button @click="showCreateModal = true" class="btn btn-primary">
        + Crear Nuevo Equipo
      </button>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <div v-else-if="teams.length === 0" class="empty-state">
      <div class="empty-icon">🛡️</div>
      <h3>No tienes equipos registrados</h3>
      <p>Crea tu primer equipo para competir en batallas.</p>
    </div>

    <div v-else style="display: flex; flex-direction: column; gap: 2rem;">
      <div v-for="team in teams" :key="team.id" class="card team-card">
        <div class="team-header">
          <h2 class="team-name">{{ team.name }}</h2>
          <div style="display: flex; gap: 0.5rem;">
            <button @click="openAddModal(team)" class="btn btn-secondary btn-sm" :disabled="team.pokemonData.length >= 6">
              Añadir Pokémon
            </button>
            <button @click="deleteTeam(team.id)" class="btn btn-danger btn-sm">Eliminar</button>
          </div>
        </div>

        <div class="team-pokemon-grid">
          <div v-for="slot in 6" :key="slot" class="team-slot" :class="{ filled: team.pokemonData[slot-1] }">
            <template v-if="team.pokemonData[slot-1]">
              <img :src="team.pokemonData[slot-1].sprite" :alt="team.pokemonData[slot-1].name" :title="team.pokemonData[slot-1].name" />
              <button class="remove-btn" @click="removePokemon(team.id, team.pokemonData[slot-1].id)" title="Remover del equipo">
                ✖
              </button>
            </template>
            <template v-else>
              <span style="color: var(--text-muted); font-size: 0.8rem;">Vacío</span>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Team Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click="showCreateModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">Crear Nuevo Equipo</h3>
          <button class="modal-close" @click="showCreateModal = false">&times;</button>
        </div>
        <form @submit.prevent="createTeam">
          <div class="form-group">
            <label class="form-label">Nombre del Equipo</label>
            <input v-model="newTeamName" type="text" class="form-input" placeholder="Ej. Equipo Dinamita" required autofocus />
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">Guardar Equipo</button>
        </form>
      </div>
    </div>

    <!-- Add Pokemon Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click="showAddModal = false">
      <div class="modal-content" @click.stop style="max-width: 600px;">
        <div class="modal-header">
          <h3 class="modal-title">Añadir Pokémon a {{ activeTeam?.name }}</h3>
          <button class="modal-close" @click="showAddModal = false">&times;</button>
        </div>
        
        <div class="form-group">
          <input v-model="addSearch" @input="debounceAddSearch" type="text" class="form-input" placeholder="Buscar por nombre o ID..." />
        </div>

        <div v-if="searchingPokemon" class="loading" style="padding: 2rem;">
          <div class="spinner"></div>
        </div>
        
        <div v-else-if="searchResults.length === 0 && addSearch" class="empty-state" style="padding: 2rem;">
          <p>No se encontraron Pokémon</p>
        </div>

        <div v-else style="max-height: 400px; overflow-y: auto; display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; padding: 0.5rem;">
          <div 
            v-for="p in searchResults" 
            :key="p.id" 
            class="card" 
            style="padding: 1rem; text-align: center; cursor: pointer;"
            @click="addPokemonToTeam(p.id)"
          >
            <img :src="p.sprite" style="width: 60px; height: 60px; object-fit: contain;" />
            <div style="font-size: 0.8rem; font-weight: 600; text-transform: capitalize;">{{ p.name }}</div>
          </div>
        </div>
      </div>
    </div>

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

        // Fetch sprite info for each pokemon in each team
        for (const team of dbTeams) {
          team.pokemonData = [];
          for (const p of team.pokemon) {
            try {
              const detail = await api.get(`/pokemon/${p.pokemon_id}`);
              team.pokemonData.push({
                id: detail.data.id,
                name: detail.data.name,
                sprite: detail.data.sprite,
                slot: p.slot
              });
            } catch (e) {
              console.error('Error fetching poke detail for team', e);
            }
          }
          // Sort explicitly by slot just in case
          team.pokemonData.sort((a, b) => a.slot - b.slot);
        }

        this.teams = dbTeams;
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
      this.addSearch = '';
      this.searchResults = [];
      this.showAddModal = true;
      
      // Load some default pokemon to show initially
      this.performPokemonSearch('pikachu'); 
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
      try {
        await api.post(`/teams/${this.activeTeam.id}/pokemon`, { pokemon_id: pokemonId });
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
