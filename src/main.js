import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import { useAuthStore } from './stores/auth'
import { vuetify } from './plugins/vuetify'
import './style.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(vuetify)
app.use(router)

const auth = useAuthStore(pinia)
window.addEventListener('auth:invalid-session', () => {
  auth.handleInvalidSession()
  const current = router.currentRoute.value
  if (current.meta.access === 'authenticated') {
    router.replace({ name: 'login', query: { redirect: current.fullPath } })
  }
})

router.isReady().then(() => app.mount('#app'))
