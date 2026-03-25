import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/main.css'

const app = createApp(App)

app.use(router)
app.mount('#app')

// REGISTRAR SW
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js")
    .then(() => console.log("✅ SW registrado"))
    .catch(err => console.log("❌ Error SW", err));
}