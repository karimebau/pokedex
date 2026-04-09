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

      <div class="pokemon-detail-layout">
        
        <!-- Left Column: Image & Basic Info -->
        <div class="card pokemon-main-info" style="text-align: center; position: relative;">
          <div class="pokemon-id" style="position: absolute; top: 1.5rem; left: 1.5rem; font-weight: 800; color: var(--text-secondary); opacity: 0.5;">
            #{{ String(pokemon.id).padStart(4, '0') }}
          </div>
          
          <button 
            class="favorite-btn" 
            :class="{ active: isFav }"
            @click="toggleFavorite"
            style="position: absolute; top: 1.5rem; right: 1.5rem; font-size: 1.8rem; background: none; border: none; cursor: pointer;"
          >
            {{ isFav ? '❤️' : '🤍' }}
          </button>

          <img :src="pokemon.sprite" :alt="pokemon.name" class="pokemon-sprite-large" />
          
          <h1 class="page-title" style="text-transform: capitalize; margin: 1.5rem 0;">{{ pokemon.name }}</h1>
          
          <div class="pokemon-types" style="display: flex; gap: 0.8rem; justify-content: center; margin-bottom: 2rem;">
            <span 
              v-for="type in pokemon.types" 
              :key="type" 
              class="type-badge"
              :class="`type-${type}`"
              style="padding: 0.5rem 1.2rem; font-size: 0.9rem;"
            >
              {{ type }}
            </span>
          </div>

          <p class="pokemon-description" style="color: var(--text-secondary); line-height: 1.8; margin-bottom: 2.5rem; font-size: 1.1rem;">
            "{{ pokemon.species.flavor_text }}"
          </p>

          <div class="pokemon-physical-stats" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: var(--radius-md);">
            <div class="stat-item">
              <span class="stat-label" style="display: block; font-size: 0.7rem; color: var(--accent); text-transform: uppercase; font-weight: 800; margin-bottom: 0.3rem;">Altura</span>
              <span class="stat-value" style="font-size: 1.2rem; font-weight: 700;">{{ pokemon.height / 10 }} m</span>
            </div>
            <div class="stat-item">
              <span class="stat-label" style="display: block; font-size: 0.7rem; color: var(--accent); text-transform: uppercase; font-weight: 800; margin-bottom: 0.3rem;">Peso</span>
              <span class="stat-value" style="font-size: 1.2rem; font-weight: 700;">{{ pokemon.weight / 10 }} kg</span>
            </div>
            <div class="stat-item">
              <span class="stat-label" style="display: block; font-size: 0.7rem; color: var(--accent); text-transform: uppercase; font-weight: 800; margin-bottom: 0.3rem;">Categoría</span>
              <span class="stat-value" style="font-size: 1rem; font-weight: 600;">{{ pokemon.species.genus }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label" style="display: block; font-size: 0.7rem; color: var(--accent); text-transform: uppercase; font-weight: 800; margin-bottom: 0.3rem;">Habilidades</span>
              <div class="abilities-list" style="margin-top: 0.2rem;">
                <div v-for="a in pokemon.abilities" :key="a.name" style="text-transform: capitalize; font-size: 0.9rem; font-weight: 600;">
                  {{ a.name }} <span v-if="a.hidden" style="opacity: 0.6; font-size: 0.7rem;">(Oculta)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Stats & Evolutions -->
        <div class="pokemon-secondary-info" style="display: flex; flex-direction: column; gap: 2rem;">
          <!-- Base Stats -->
          <div class="card pokemon-stats">
            <h3 style="margin-bottom: 2rem; display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 1.5rem;">📊</span> Estadísticas Base
            </h3>
            
            <div class="stats-container" style="display: flex; flex-direction: column; gap: 1.2rem;">
              <div v-for="stat in formattedStats" :key="stat.name" class="stat-row" style="display: grid; grid-template-columns: 45px 1fr 35px; align-items: center; gap: 1rem;">
                <div class="stat-label" style="font-weight: 800; font-size: 0.8rem; color: var(--text-secondary);">{{ stat.label }}</div>
                <div class="stat-bar-bg" style="height: 10px; background: rgba(255,255,255,0.05); border-radius: 5px; overflow: hidden;">
                  <div 
                    class="stat-bar-fill" 
                    :class="stat.colorClass"
                    :style="{ width: `${(stat.value / 255) * 100}%`, height: '100%', background: stat.colorClass === 'high' ? 'var(--success)' : (stat.colorClass === 'low' ? 'var(--error)' : 'var(--primary)') }"
                  ></div>
                </div>
                <div class="stat-value" style="font-weight: 700; font-size: 0.9rem; text-align: right;">{{ stat.value }}</div>
              </div>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--glass-border); font-weight: 800;">
              <span style="color: var(--text-secondary);">Total</span>
              <span style="color: var(--primary); font-size: 1.2rem;">{{ totalStats }}</span>
            </div>
          </div>

          <!-- Evolutionary Chain -->
          <div v-if="pokemon.evolution_chain?.length > 1" class="card evolutionary-chain">
            <h3 style="margin-bottom: 2rem; display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 1.5rem;">🧬</span> Línea Evolutiva
            </h3>
            
            <div class="evolution-chain" style="display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 1rem;">
              <template v-for="(evo, index) in pokemon.evolution_chain" :key="evo.id">
                
                <div class="evolution-item" @click="goToPokemon(evo.id)" style="text-align: center; cursor: pointer; transition: transform 0.3s; padding: 0.5rem;">
                  <div class="evo-img-container" :style="evo.id === pokemon.id ? 'border: 2px solid var(--primary); padding: 5px; border-radius: 50%; background: rgba(255,71,126,0.1);' : ''">
                    <img :src="evo.sprite" :alt="evo.name" style="width: 80px; height: 80px; object-fit: contain;" />
                  </div>
                  <div class="evo-name" :style="evo.id === pokemon.id ? 'color: var(--primary); font-weight: 800;' : 'color: var(--text-secondary); font-size: 0.8rem;'">
                    {{ evo.name }}
                  </div>
                </div>

                <div v-if="index < pokemon.evolution_chain.length - 1" class="evolution-arrow" style="font-size: 1.5rem; opacity: 0.3;">
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
