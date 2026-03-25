<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Pokémon Favoritos</h1>
      <p class="page-subtitle">Tu colección personal de Pokémon preferidos</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="favorites.length === 0" class="empty-state">
      <div class="empty-icon">❤️</div>
      <h3>Aún no tienes favoritos</h3>
      <p>Ve al directorio y agrega algunos Pokémon a tu lista.</p>
      <button @click="$router.push('/pokemon')" class="btn btn-primary" style="margin-top: 1.5rem;">
        Explorar Pokémon
      </button>
    </div>

    <!-- Favorites Grid -->
    <div v-else class="pokemon-grid">
      <div 
        v-for="p in favorites" 
        :key="p.id" 
        class="card pokemon-card"
        @click="$router.push(`/pokemon/${p.id}`)"
      >
        <button 
          class="favorite-btn active" 
          @click.stop="removeFavorite(p.id)"
          title="Quitar de favoritos"
        >
          ❤️
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
  </div>
</template>

<script>
import api from '../services/api';

export default {
  data() {
    return {
      favorites: [],
      loading: true
    };
  },
  async mounted() {
    await this.fetchFavorites();
  },
  methods: {
    async fetchFavorites() {
      this.loading = true;
      try {
        const res = await api.get('/favorites');
        const favIds = res.data.map(f => f.pokemon_id);
        
        // Fetch details for all favorite IDs
        const details = await Promise.all(
          favIds.map(async (id) => {
            try {
              const p = await api.get(`/pokemon/${id}`);
              return p.data;
            } catch (e) {
              return null;
            }
          })
        );
        
        this.favorites = details.filter(Boolean);
      } catch (e) {
        console.error('Error fetching favorites', e);
      } finally {
        this.loading = false;
      }
    },
    async removeFavorite(id) {
      if (confirm('¿Seguro que deseas quitar a este Pokémon de tus favoritos?')) {
        try {
          await api.delete(`/favorites/${id}`);
          this.favorites = this.favorites.filter(p => p.id !== id);
        } catch (e) {
          console.error('Error removing favorite', e);
        }
      }
    }
  }
}
</script>
