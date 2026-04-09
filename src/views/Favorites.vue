<template>
  <div>
    <div class="page-header" style="margin-bottom: 2.5rem;">
      <h1 class="page-title">Pokémon Favoritos 💖</h1>
      <p style="color: var(--text-secondary);">Tu colección personal de Pokémon preferidos</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="favorites.length === 0" class="empty-state" style="text-align: center; padding: 4rem 2rem;">
      <div style="font-size: 4rem; margin-bottom: 1rem;">❤️</div>
      <h3 style="color: var(--primary);">Aún no tienes favoritos</h3>
      <p style="color: var(--text-secondary);">Ve al directorio y agrega algunos Pokémon a tu colección.</p>
      <button @click="$router.push('/pokemon')" class="btn btn-primary" style="margin-top: 2rem;">
        Explorar Pokémon ✨
      </button>
    </div>

    <!-- Favorites Grid -->
    <div v-else class="pokemon-grid">
      <div 
        v-for="p in favorites" 
        :key="p.id" 
        class="card pokemon-card"
        @click="$router.push(`/pokemon/${p.id}`)"
        style="cursor: pointer; position: relative;"
      >
        <button 
          class="favorite-btn active" 
          @click.stop="removeFavorite(p.id)"
          title="Quitar de favoritos"
          style="position: absolute; top: 1rem; right: 1rem; background: none; border: none; font-size: 1.5rem; cursor: pointer; z-index: 5; transition: transform 0.2s;"
        >
          ❤️
        </button>
        
        <span class="pokemon-id" style="font-size: 0.8rem; font-weight: 800; opacity: 0.3; margin-bottom: 0.5rem; display: block;">#{{ String(p.id).padStart(4, '0') }}</span>
        
        <div style="background: rgba(0,0,0,0.1); border-radius: 50%; width: 120px; height: 120px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
          <img :src="p.sprite" :alt="p.name" class="pokemon-sprite" loading="lazy" style="width: 100px; height: 100px; object-fit: contain; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));" />
        </div>
        
        <h3 class="pokemon-name" style="text-transform: capitalize; margin-bottom: 1rem; font-size: 1.3rem;">{{ p.name }}</h3>
        
        <div class="pokemon-types" style="display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap;">
          <span 
            v-for="type in p.types" 
            :key="type" 
            class="type-badge"
            :class="`type-${type}`"
            style="font-size: 0.75rem; padding: 0.2rem 0.8rem; border-radius: 20px; font-weight: 700; text-transform: uppercase;"
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
              console.warn(`[Offline] No se pudo cargar el detalle del Pokémon #${id} desde la red ni caché.`);
              return null;
            }
          })
        );
        
        this.favorites = details.filter(Boolean);
      } catch (e) {
        console.error('Error fetching favorites', e);
        // Intentar mostrar algo si falló la carga inicial (aunque NetworkFirst debería manejarlo)
        if (!navigator.onLine) {
          alert('Parece que estás offline. Mostrando los datos guardados en caché.');
        }
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
