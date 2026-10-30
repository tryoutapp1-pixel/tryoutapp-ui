// Learner materials store (FU8, FU9).
//
// The backend already filters materials by the user's effective subscription
// (Free users see FREE only; Premium users see FREE + PREMIUM) and by release
// state, so the frontend just displays what it receives. Detail responses embed
// a short-lived (60s) signed file URL; we refetch the detail to refresh it
// rather than caching the URL.
import { defineStore } from 'pinia'
import userService from '../services/userService'

export const useMaterialsStore = defineStore('materials', {
  state: () => ({
    items: [],
    pagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
    loading: false,
    error: ''
  }),

  actions: {
    async fetchList({ page = 1, limit = 12 } = {}) {
      this.loading = true
      this.error = ''
      try {
        const data = await userService.listMaterials({ page, limit })
        this.items = data.items || []
        this.pagination = data.pagination || this.pagination
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    // Returns the full material (including a fresh signed file URL). Not cached
    // in state so the signed URL is never reused past its lifetime.
    async fetchDetail(id) {
      return userService.getMaterial(id)
    }
  }
})
