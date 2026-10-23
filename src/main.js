import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { vuetify } from './plugins/vuetify'
import { onInvalidSession } from './lib/api'
import { useAuthStore } from './stores/auth'
import { useProfileStore } from './stores/profile'

import './style.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(vuetify)

// Bridge the Axios invalid-session signal (401 with a stored token) to app
// state: clear auth/profile and send a protected current route to login.
onInvalidSession(() => {
  const authStore = useAuthStore()
  const profileStore = useProfileStore()
  authStore.handleInvalidSession()
  profileStore.reset()
  const current = router.currentRoute.value
  if (current.matched.some((r) => r.meta.requiresAuth)) {
    router.replace({ path: '/login', query: { redirect: current.fullPath } })
  }
})

app.mount('#app')
