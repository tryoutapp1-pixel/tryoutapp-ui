import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api, getEnvelopeData } from '../lib/api'
import { toApiError } from '../lib/apiError'
import { tokenStorage } from '../lib/tokenStorage'

const validRoles = ['USER', 'ADMIN']

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const accessToken = ref(tokenStorage.get())
  const initializing = ref(false)
  const initialized = ref(false)
  const loading = ref(false)
  const isAuthenticated = computed(() => Boolean(accessToken.value && user.value))

  function clearState() {
    tokenStorage.clear()
    accessToken.value = null
    user.value = null
  }

  async function login(credentials) {
    loading.value = true
    clearState()
    try {
      const response = await api.post('/auth/login', credentials)
      const data = getEnvelopeData(response)
      if (!data?.accessToken || !data?.user || !validRoles.includes(data.user.role)) {
        throw new Error('Respons login tidak sesuai format yang diharapkan.')
      }
      tokenStorage.set(data.accessToken)
      accessToken.value = data.accessToken
      user.value = data.user
      initialized.value = true
      return data.user
    } catch (error) {
      throw toApiError(error)
    } finally {
      loading.value = false
    }
  }

  async function fetchProfile() {
    if (!tokenStorage.get()) {
      clearState()
      initialized.value = true
      return null
    }
    loading.value = true
    try {
      const response = await api.get('/users/me')
      const profile = getEnvelopeData(response)
      if (!profile?.id || !validRoles.includes(profile.role)) {
        throw new Error('Respons profil tidak sesuai format yang diharapkan.')
      }
      user.value = profile
      accessToken.value = tokenStorage.get()
      return profile
    } catch (error) {
      if (error.status === 401) clearState()
      throw toApiError(error)
    } finally {
      loading.value = false
      initialized.value = true
    }
  }

  async function initialize() {
    if (initialized.value || initializing.value) return
    initializing.value = true
    try {
      if (tokenStorage.get()) await fetchProfile()
      else clearState()
    } catch {
      // The router will treat an invalid or unavailable session as unauthenticated.
      clearState()
    } finally {
      initialized.value = true
      initializing.value = false
    }
  }

  async function logout() {
    try {
      if (tokenStorage.get()) await api.post('/auth/logout')
    } catch {
      // Local logout must complete even when the stateless API cannot be reached.
    } finally {
      clearState()
      initialized.value = true
    }
  }

  function handleInvalidSession() {
    clearState()
    initialized.value = true
  }

  return {
    user,
    accessToken,
    initializing,
    initialized,
    loading,
    isAuthenticated,
    login,
    logout,
    fetchProfile,
    initialize,
    handleInvalidSession,
  }
})
