// Admin users store (read-only; backend exposes list + detail only).
import { defineStore } from 'pinia'
import adminService from '../services/adminService'

export const useAdminUsersStore = defineStore('adminUsers', {
  state: () => ({
    items: [],
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    loading: false,
    error: ''
  }),

  actions: {
    async fetchList({ page = 1, limit = 20 } = {}) {
      this.loading = true
      this.error = ''
      try {
        const data = await adminService.listUsers({ page, limit })
        this.items = data.items || []
        this.pagination = data.pagination || this.pagination
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async fetchUser(id) {
      return adminService.getUser(id)
    },

    async setSuspended(id, suspend) {
      const updated = await adminService.setUserSuspended(id, suspend)
      // Keep the list in sync if the user is currently loaded there.
      const row = this.items.find((u) => String(u.id) === String(id))
      if (row) row.status = updated.status
      return updated
    }
  }
})
