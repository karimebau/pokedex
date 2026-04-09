<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Directorio Pokémon 🌸</h1>
      <p style="color: var(--text-secondary); margin-bottom: 2rem;">Explora y descubre Pokémon de todas las regiones</p>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="filter-group">
        <label class="form-label">Buscar por Nombre</label>
        <input v-model="filters.name" @input="debounceSearch" type="text" class="form-input" placeholder="Ej. Pikachu" />
      </div>
      
      <div class="filter-group">
        <label class="form-label">Generación</label>
        <select v-model="filters.generation" @change="applyFilters" class="form-select">
          <option value="">Todas</option>
          <option v-for="gen in generations" :key="gen.id" :value="gen.id">
            Gen {{ gen.id }} ({{ gen.name }})
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label class="form-label">Tipo Principal</label>
        <select v-model="filters.type1" @change="applyFilters" class="form-select">
          <option value="">Todos</option>
          <option v-for="type in types" :key="type" :value="type">
            {{ type }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label class="form-label">Tipo Secundario</label>
        <select v-model="filters.type2" @change="applyFilters" class="form-select" :disabled="!filters.type1">
          <option value="">Todos</option>
          <option v-for="type in types" :key="type" :value="type">
            {{ type }}
          </option>
        </select>
      </div>
      
      <div class="filter-group" style="display: flex; align-items: flex-end;">
        <button @click="clearFilters" class="btn btn-secondary" style="width: 100%; height: 48px;">Limpiar ✨</button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="pokemon.length === 0" class="empty-state" style="text-align: center; padding: 4rem 2rem;">
      <div style="font-size: 4rem; margin-bottom: 1rem;">🔍</div>
      <h3 style="color: var(--primary);">No se encontraron Pokémon</h3>
      <p style="color: var(--text-secondary);">Intenta ajustar tus filtros de búsqueda.</p>
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
          style="position: absolute; top: 12px; right: 12px; background: none; border: none; font-size: 1.5rem; cursor: pointer; z-index: 10;"
        >
          {{ isFavorite(p.id) ? '❤️' : '🤍' }}
        </button>
        
        <span class="pokemon-id" style="font-size: 0.85rem; font-weight: 800; color: var(--text-secondary); opacity: 0.6; align-self: flex-start;">#{{ String(p.id).padStart(4, '0') }}</span>
        
        <img :src="p.sprite" :alt="p.name" class="pokemon-sprite" loading="lazy" />
        
        <h3 class="pokemon-name" style="margin-top: 1rem; text-transform: capitalize;">{{ p.name }}</h3>
        
        <div class="pokemon-types" style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
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
    <div v-if="!loading && totalPages > 1" class="pagination" style="display: flex; justify-content: center; align-items: center; gap: 1rem; margin-top: 3rem; margin-bottom: 2rem;">
      <button 
        class="btn btn-secondary" 
        :disabled="currentPage === 1"
        @click="changePage(currentPage - 1)"
      >
        Anterior
      </button>
      <span style="color: var(--text-secondary); font-weight: 600; font-size: 0.9rem;">
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
          // Trigger reactivity in Vue 3 for Set
          this.favorites = new Set(this.favorites);
        } else {
          await api.post('/favorites', { pokemon_id: id });
          this.favorites.add(id);
          // Trigger reactivity in Vue 3 for Set
          this.favorites = new Set(this.favorites);
        }
      } catch (e) {
        alert("Error de API: " + (e.response?.data?.error || e.message));
        console.error('Error toggling favorite', e);
      }
    }
  }
}
</script>
