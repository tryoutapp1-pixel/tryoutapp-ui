// Profile store (Pinia Option Store).
//
// Holds the viewable profile shared across pages (profile view, account
// settings) and keeps it in sync with the auth store's user so a name change
// does not leave stale data behind. Change-password is a stateless flow and is
// handled directly in the component via authService; it needs no shared state.

import { defineStore } from 'pinia'
import profileService from '../services/profileService'
import { useAuthStore } from './auth'

export const useProfileStore = defineStore('profile', {
  state: () => ({
    profile: null,
    loading: false,
    saving: false
  }),

  getters: {
    displayName: (state) => (state.profile ? state.profile.name : ''),
    email: (state) => (state.profile ? state.profile.email : '')
  },

  actions: {
    async loadProfile(force = false) {
      if (this.profile && !force) return this.profile
      this.loading = true
      try {
        const data = await profileService.getMe()
        this.profile = data
        // Keep the auth store user fresh too.
        useAuthStore().user = data
        return data
      } finally {
        this.loading = false
      }
    },

    async updateProfile({ name }) {
      this.saving = true
      try {
        const updated = await profileService.updateProfile({ name })
        this.profile = updated
        // Avoid stale name in nav/menu that reads from the auth store.
        useAuthStore().user = updated
        return updated
      } finally {
        this.saving = false
      }
    },

    reset() {
      this.$patch({ profile: null, loading: false, saving: false })
    }
  }
})
