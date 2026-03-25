<template>
  <div>
    <!-- Loading -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>
    
    <div v-else-if="!pokemon" class="empty-state">
      <h3>Pokémon no encontrado</h3>
      <button @click="$router.push('/pokemon')" class="btn btn-primary mt-4">Regresar</button>
    </div>

    <div v-else>
      <button @click="$router.push('/pokemon')" class="btn btn-secondary" style="margin-bottom: 2rem;">
        ← Volver al Directorio
      </button>

      <div class="pokemon-detail-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: start;">
        
        <!-- Left Column: Image & Basic Info -->
        <div class="card-glass" style="text-align: center; position: relative;">
          <div class="pokemon-id" style="position: absolute; top: 1rem; left: 1rem; font-weight: 700; color: var(--text-muted);">
            #{{ String(pokemon.id).padStart(4, '0') }}
          </div>
          
          <button 
            class="favorite-btn" 
            :class="{ active: isFav }"
            @click="toggleFavorite"
            style="top: 1rem; right: 1rem; font-size: 1.5rem;"
          >
            {{ isFav ? '❤️' : '🤍' }}
          </button>

          <img :src="pokemon.sprite" :alt="pokemon.name" style="width: 250px; height: 250px; object-fit: contain; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.5));" />
          
          <h1 class="page-title" style="text-transform: capitalize; margin: 1rem 0;">{{ pokemon.name }}</h1>
          
          <div class="pokemon-types" style="display: flex; gap: 0.5rem; justify-content: center; margin-bottom: 1.5rem;">
            <span 
              v-for="type in pokemon.types" 
              :key="type" 
              class="type-badge"
              :class="`type-${type}`"
              style="font-size: 0.9rem; padding: 0.4rem 1rem;"
            >
              {{ type }}
            </span>
          </div>

          <p style="color: var(--text-secondary); font-style: italic; margin-bottom: 2rem;">
            "{{ pokemon.species.flavor_text }}"
          </p>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; background: var(--bg-primary); padding: 1rem; border-radius: var(--radius-md);">
            <div>
              <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Altura</div>
              <div style="font-weight: 600;">{{ pokemon.height / 10 }} m</div>
            </div>
            <div>
              <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Peso</div>
              <div style="font-weight: 600;">{{ pokemon.weight / 10 }} kg</div>
            </div>
            <div>
              <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Categoría</div>
              <div style="font-weight: 600;">{{ pokemon.species.genus }}</div>
            </div>
            <div>
              <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Habilidades</div>
              <div style="font-weight: 600; font-size: 0.85rem;">
                <div v-for="a in pokemon.abilities" :key="a.name" style="text-transform: capitalize;">
                  {{ a.name }} <span v-if="a.hidden" style="color: var(--text-muted);">(Oculta)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Stats & Evolutions -->
        <div>
          <!-- Base Stats -->
          <div class="card" style="padding: 2rem; margin-bottom: 2rem;">
            <h3 style="margin-bottom: 1.5rem;">Estadísticas Base</h3>
            
            <div v-for="stat in formattedStats" :key="stat.name" class="stat-bar-container">
              <div class="stat-name">{{ stat.label }}</div>
              <div class="stat-bar-bg">
                <div 
                  class="stat-bar-fill" 
                  :class="stat.colorClass"
                  :style="{ width: `${(stat.value / 255) * 100}%` }"
                ></div>
              </div>
              <div class="stat-value">{{ stat.value }}</div>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color); font-weight: 700;">
              <span>Total</span>
              <span>{{ totalStats }}</span>
            </div>
          </div>

          <!-- Evolutionary Chain -->
          <div v-if="pokemon.evolution_chain?.length > 1" class="card" style="padding: 2rem;">
            <h3 style="margin-bottom: 1.5rem;">Línea Evolutiva</h3>
            
            <div class="evolution-chain">
              <template v-for="(evo, index) in pokemon.evolution_chain" :key="evo.id">
                
                <div class="evolution-item" @click="goToPokemon(evo.id)">
                  <img :src="evo.sprite" :alt="evo.name" :style="evo.id === pokemon.id ? 'filter: drop-shadow(0 0 10px var(--accent));' : ''" />
                  <div class="evo-name" :style="evo.id === pokemon.id ? 'color: var(--accent); font-weight: 700;' : ''">
                    {{ evo.name }}
                  </div>
                </div>

                <div v-if="index < pokemon.evolution_chain.length - 1" class="evolution-arrow">
                  →
                </div>
                
              </template>
            </div>
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
      pokemon: null,
      loading: true,
      isFav: false
    };
  },
  computed: {
    formattedStats() {
      if (!this.pokemon) return [];
      
      const statMap = {
        'hp': 'HP',
        'attack': 'ATK',
        'defense': 'DEF',
        'special-attack': 'SPA',
        'special-defense': 'SPD',
        'speed': 'SPE'
      };

      return this.pokemon.stats.map(s => {
        let colorClass = 'medium';
        if (s.value >= 100) colorClass = 'high';
        else if (s.value < 60) colorClass = 'low';

        return {
          name: s.name,
          label: statMap[s.name],
          value: s.value,
          colorClass
        };
      });
    },
    totalStats() {
      if (!this.pokemon) return 0;
      return this.pokemon.stats.reduce((acc, curr) => acc + curr.value, 0);
    }
  },
  watch: {
    '$route.params.id': {
      immediate: true,
      handler(newId) {
        if (newId) this.fetchData();
      }
    }
  },
  methods: {
    async fetchData() {
      this.loading = true;
      try {
        const [pokeRes, favRes] = await Promise.all([
          api.get(`/pokemon/${this.$route.params.id}`),
          api.get('/favorites')
        ]);
        
        this.pokemon = pokeRes.data;
        this.isFav = favRes.data.some(f => f.pokemon_id === this.pokemon.id);
      } catch (e) {
        console.error('Error fetching detail', e);
        this.pokemon = null;
      } finally {
        this.loading = false;
      }
    },
    async toggleFavorite() {
      try {
        if (this.isFav) {
          await api.delete(`/favorites/${this.pokemon.id}`);
          this.isFav = false;
        } else {
          await api.post('/favorites', { pokemon_id: this.pokemon.id });
          this.isFav = true;
        }
      } catch (e) {
        alert("Error de API: " + (e.response?.data?.error || e.message));
        console.error('Error toggling favorite', e);
      }
    },
    goToPokemon(id) {
      if (id !== this.pokemon.id) {
        this.$router.push(`/pokemon/${id}`);
      }
    }
  }
}
</script>
