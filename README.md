# Pokedex Web App (Full-Stack Frontend)

Esta es la aplicación Frontend desarrollada en Vue 3 y Vite, que consume el BFF (Backend for Frontend) NodeJS Pokebackend.

## Características

- 🎨 **Diseño Moderno (Premium UI)**: Tema oscuro "Glassmorphism" con gradientes, colores dinámicos basados en el tipo de Pokémon y micro-animaciones en tarjetas.
- 📱 **Diseño Responsivo**: Se adapta a móviles, tabletas y computadoras.
- 🔐 **Autenticación Completa**: Inicio de sesión y registro protegido con JWT e intercepción de rutas `vue-router`.
- 🔍 **Buscador y Filtros**: Busca por nombre, e intersecta combinaciones de Tipo 1, Tipo 2 y Generación de la región.
- 📊 **Detalles de Pokémon**: Gráficas de barras de estadísticas (HP, ATK, etc.), texto descriptivo, tipos, peso, tamaño, habilidades ocultas y representación interactiva de la **cadena de evolución completa**.
- ❤️ **Favoritos Persistentes**: Agrega a tus Pokémon preferidos a tu colección personal guardada en la base de datos.
- 🛡️ **Armador de Equipos**: Crea, borra y pon un nombre a múltiples equipos, cada uno con capacidad máxima para 6 Pokémon elegibles usando un modal de búsqueda dinámica.
- 🤝 **Sistema de Amigos**: Agrega entrenadores escribiendo su correo electrónico, permitiendo conexiones bidireccionales.
- ⚔️ **Arena de Batalla Animada**: Selecciona a tu amigo oponente, elige tu equipo, escoge su equipo y observa un resumen animado y detallado de ataques y daños basado en la respuesta del motor de batallas del backend.
- 📶 **Offline / PWA Ready**: Caching avanzado usando Service Workers configurados manualmente (Estrategia App Shell + Caché dinámica).

## Ejecución Pokedex (Dev Run)

1. Instala dependencias:
   ```bash
   npm install
   ```
2. Ejecuta Vue Vite (por defecto puerto 5173):
   ```bash
   npm run dev
   ```

Asegúrate de tener funcionando concurrentemente el proyecto **pokebackend** en `http://localhost:3000` para que los endpoints respondan.

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
npm run serve

```
