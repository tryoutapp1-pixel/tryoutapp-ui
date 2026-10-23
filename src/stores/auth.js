// Authentication store (Pinia Option Store).
//
// Responsibilities:
// - Hold the current user, access token presence, and auth status.
// - Orchestrate login/logout and session bootstrap flows via authService.
// - Keep token storage in sync (sessionStorage via tokenStorage adapter).
//
// It does NOT keep passwords. Login input lives in component-local state only
// until the request completes. State changes happen directly in actions / via
// $patch (Pinia has no Vuex-style mutations).

import { defineStore } from 'pinia'
import authService from '../services/authService'
import profileService from '../services/profileService'
import { getToken, setToken, clearToken } from '../lib/tokenStorage'
import { toApiError } from '../lib/apiError'

export const ROLES = { USER: 'USER', ADMIN: 'ADMIN' }

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: getToken(),
    initialized: false,
    loading: false
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    role: (state) => (state.user ? state.user.role : null),
    isUser: (state) => Boolean(state.user && state.user.role === ROLES.USER),
    isAdmin: (state) => Boolean(state.user && state.user.role === ROLES.ADMIN),
    homeRoute() {
      if (this.isAdmin) return '/admin'
      if (this.isUser) return '/app'
      return '/'
    }
  },

  actions: {
    setSession({ token, user }) {
      this.$patch({ token: token || null, user: user || null })
      setToken(token || null)
    },

    clearSession() {
      this.$patch({ token: null, user: null })
      clearToken()
    },

    // Login: validate the response envelope and role before persisting the
    // token. We never treat login as successful before the backend confirms it.
    async login({ email, password }) {
      this.loading = true
      try {
        const data = await authService.login({ email, password })
        const token = data && data.accessToken
        const user = data && data.user
        if (!token || !user || !user.role) {
          throw toApiError({ response: { status: 500 } })
        }
        this.setSession({ token, user })
        return user
      } finally {
        this.loading = false
      }
    },

    // Logout: best-effort backend call, then always clear client state so no
    // previous-account data lingers after switching accounts.
    async logout() {
      try {
        if (this.token) await authService.logout()
      } catch {
        /* stateless logout: ignore backend errors, still clear locally */
      } finally {
        this.clearSession()
      }
    },

    // Fetch the current user from GET /users/me. Used by the router guard to
    // hydrate the session on first navigation / page reload.
    async fetchCurrentUser() {
      const user = await profileService.getMe()
      this.user = user
      return user
    },

    // One-time bootstrap: if a token exists but we have no user yet, load it.
    // An invalid/expired token (401) clears the session so guards can redirect.
    async initialize() {
      if (this.initialized) return
      if (this.token && !this.user) {
        try {
          await this.fetchCurrentUser()
        } catch (error) {
          if (error && error.status === 401) {
            this.clearSession()
          }
        }
      }
      this.initialized = true
    },

    // Called when the Axios layer detects an invalidated session (401).
    handleInvalidSession() {
      this.clearSession()
    }
  }
})
