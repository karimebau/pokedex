<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Directorio Pokémon</h1>
      <p class="page-subtitle">Explora y descubre Pokémon de todas las regiones</p>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="filter-group">
        <label>Buscar por Nombre</label>
        <input v-model="filters.name" @input="debounceSearch" type="text" class="form-input" placeholder="Ej. Pikachu" />
      </div>
      
      <div class="filter-group">
        <label>Generación</label>
        <select v-model="filters.generation" @change="applyFilters" class="form-select">
          <option value="">Todas</option>
          <option v-for="gen in generations" :key="gen.id" :value="gen.id">
            Generación {{ gen.id }} ({{ gen.name }})
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label>Tipo 1</label>
        <select v-model="filters.type1" @change="applyFilters" class="form-select">
          <option value="">Todos</option>
          <option v-for="type in types" :key="type" :value="type" class="type-option">
            {{ type }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label>Tipo 2</label>
        <select v-model="filters.type2" @change="applyFilters" class="form-select" :disabled="!filters.type1" title="Selecciona Tipo 1 primero">
          <option value="">Todos</option>
          <option v-for="type in types" :key="type" :value="type">
            {{ type }}
          </option>
        </select>
      </div>
      
      <div class="filter-group" style="flex: 0 0 auto; display: flex; align-items: flex-end;">
        <button @click="clearFilters" class="btn btn-secondary" style="height: 44px;">Limpiar</button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="pokemon.length === 0" class="empty-state">
      <div class="empty-icon">🔍</div>
      <h3>No se encontraron Pokémon</h3>
      <p>Intenta ajustar tus filtros de búsqueda.</p>
    </div>

    <!-- Pokemon Grid -->
    <div v-else class="pokemon-grid">
      <div 
        v-for="p in pokemon" 
        :key="p.id" 
        class="card pokemon-card"
        @click="$router.push(`/pokemon/${p.id}`)"
      >
        <button 
          class="favorite-btn" 
          :class="{ active: isFavorite(p.id) }"
          @click.stop="toggleFavorite(p.id)"
          :title="isFavorite(p.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'"
        >
          {{ isFavorite(p.id) ? '❤️' : '🤍' }}
        </button>
        
        <span class="pokemon-id">#{{ String(p.id).padStart(4, '0') }}</span>
        
        <img :src="p.sprite" :alt="p.name" class="pokemon-sprite" loading="lazy" />
        
        <h3 class="pokemon-name">{{ p.name }}</h3>
        
        <div class="pokemon-types">
          <span 
            v-for="type in p.types" 
            :key="type" 
            class="type-badge"
            :class="`type-${type}`"
          >
            {{ type }}
          </span>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="!loading && totalPages > 1" class="pagination">
      <button 
        class="btn btn-secondary" 
        :disabled="currentPage === 1"
        @click="changePage(currentPage - 1)"
      >
        Anterior
      </button>
      <span style="display: flex; align-items: center; padding: 0 1rem; color: var(--text-secondary); font-size: 0.9rem;">
        Página {{ currentPage }} de {{ totalPages }}
      </span>
      <button 
        class="btn btn-secondary" 
        :disabled="currentPage === totalPages"
        @click="changePage(currentPage + 1)"
      >
        Siguiente
      </button>
    </div>
  </div>
</template>

<script>
import api from '../services/api';

export default {
  data() {
    return {
      pokemon: [],
      types: [],
      generations: [],
      favorites: new Set(),
      loading: true,
      totalCount: 0,
      limit: 20,
      currentPage: 1,
      filters: {
        name: '',
        generation: '',
        type1: '',
        type2: '',
      },
      searchTimeout: null
    };
  },
  computed: {
    totalPages() {
      return Math.ceil(this.totalCount / this.limit) || 1;
    }
  },
  async mounted() {
    await Promise.all([
      this.fetchTypes(),
      this.fetchGenerations(),
      this.fetchFavorites(),
      this.fetchPokemon()
    ]);
  },
  methods: {
    async fetchTypes() {
      try {
        const res = await api.get('/pokemon/types');
        this.types = res.data;
      } catch (e) {
        console.error('Error fetching types', e);
      }
    },
    async fetchGenerations() {
      try {
        const res = await api.get('/pokemon/generations');
        this.generations = res.data;
      } catch (e) {
        console.error('Error fetching generations', e);
      }
    },
    async fetchFavorites() {
      try {
        const res = await api.get('/favorites');
        this.favorites = new Set(res.data.map(f => f.pokemon_id));
      } catch (e) {
        console.error('Error fetching favorites', e);
      }
    },
    async fetchPokemon() {
      this.loading = true;
      try {
        const offset = (this.currentPage - 1) * this.limit;
        const params = new URLSearchParams({ limit: this.limit, offset });
        
        if (this.filters.name) params.append('name', this.filters.name);
        if (this.filters.generation) params.append('generation', this.filters.generation);
        if (this.filters.type1) params.append('type1', this.filters.type1);
        if (this.filters.type2) params.append('type2', this.filters.type2);

        const res = await api.get(`/pokemon?${params.toString()}`);
        this.pokemon = res.data.pokemon || [];
        this.totalCount = res.data.count || 0;
      } catch (e) {
        console.error('Error fetching pokemon', e);
        this.pokemon = [];
      } finally {
        this.loading = false;
      }
    },
    debounceSearch() {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.currentPage = 1;
        this.fetchPokemon();
      }, 500);
    },
    applyFilters() {
      if (!this.filters.type1) this.filters.type2 = '';
      this.currentPage = 1;
      this.fetchPokemon();
    },
    clearFilters() {
      this.filters = { name: '', generation: '', type1: '', type2: '' };
      this.currentPage = 1;
      this.fetchPokemon();
    },
    changePage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.fetchPokemon();
      }
    },
    isFavorite(id) {
      return this.favorites.has(id);
    },
    async toggleFavorite(id) {
      try {
        if (this.favorites.has(id)) {
          await api.delete(`/favorites/${id}`);
          this.favorites.delete(id);
        } else {
          await api.post('/favorites', { pokemon_id: id });
          this.favorites.add(id);
        }
      } catch (e) {
        alert("Error de API: " + (e.response?.data?.error || e.message));
        console.error('Error toggling favorite', e);
      }
    }
  }
}
</script>
