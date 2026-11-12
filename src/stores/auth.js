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

/** @typedef {import('../services/authService').Role} Role */
/** @typedef {import('../services/authService').AuthUser} AuthUser */
/** @typedef {import('../services/profileService').Profile} Profile */

/** @type {{ USER: 'USER', ADMIN: 'ADMIN' }} */
export const ROLES = { USER: 'USER', ADMIN: 'ADMIN' }

export const useAuthStore = defineStore('auth', {
  state: () => ({
    /**
     * Login returns AuthUser; GET /users/me returns the fuller Profile.
     * @type {AuthUser|Profile|null}
     */
    user: null,
    /** @type {string|null} */
    token: getToken(),
    initialized: false,
    loading: false
  }),

  getters: {
    /** True when a token is stored; the user may not be loaded yet. */
    isAuthenticated: (state) => Boolean(state.token),
    /** @returns {Role|null} */
    role: (state) => (state.user ? state.user.role : null),
    isUser: (state) => Boolean(state.user && state.user.role === ROLES.USER),
    isAdmin: (state) => Boolean(state.user && state.user.role === ROLES.ADMIN),
    /** @returns {string} Landing path for the current role */
    homeRoute() {
      if (this.isAdmin) return '/admin'
      if (this.isUser) return '/app'
      return '/'
    }
  },

  actions: {
    /**
     * Stores the token and user in state and in sessionStorage.
     * @param {{ token?: string|null, user?: AuthUser|Profile|null }} session
     */
    setSession({ token, user }) {
      this.$patch({ token: token || null, user: user || null })
      setToken(token || null)
    },

    clearSession() {
      this.$patch({ token: null, user: null })
      clearToken()
    },

    /**
     * Validates the response envelope and role before persisting the token.
     * Login never counts as successful before the backend confirms it.
     * @param {{ email: string, password: string }} credentials
     * @returns {Promise<AuthUser>}
     */
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

    /**
     * Best-effort backend call, then always clears client state so no
     * previous-account data lingers after switching accounts.
     */
    async logout() {
      try {
        if (this.token) await authService.logout()
      } catch {
        /* stateless logout: ignore backend errors, still clear locally */
      } finally {
        this.clearSession()
      }
    },

    /**
     * Fetches the current user from GET /users/me. Used by the router guard
     * to hydrate the session on first navigation or page reload.
     * @returns {Promise<Profile>}
     */
    async fetchCurrentUser() {
      const user = await profileService.getMe()
      this.user = user
      return user
    },

    /**
     * One-time bootstrap: if a token exists but there is no user yet, loads
     * it. An invalid or expired token (401) clears the session so guards can
     * redirect.
     */
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
