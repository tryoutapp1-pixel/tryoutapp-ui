// Admin users store (read-only; backend exposes list + detail only).
import { defineStore } from 'pinia'
import adminService from '../services/adminService'

/**
 * A user row from /admin/users, joined with the user's subscription.
 * @typedef {Object} AdminUser
 * @property {number} id
 * @property {string} name
 * @property {string} email
 * @property {import('../services/authService').Role} role
 * @property {'PENDING_VERIFICATION'|'ACTIVE'|'SUSPENDED'} status
 * @property {string|null} email_verified_at
 * @property {string} created_at
 * @property {string} updated_at
 * @property {import('../types/api').AccessType|null} subscription_status
 * @property {string|null} subscription_started_at
 * @property {string|null} subscription_expired_at
 */

export const useAdminUsersStore = defineStore('adminUsers', {
  state: () => ({
    /** @type {AdminUser[]} */
    items: [],
    /** @type {import('../types/api').Pagination} */
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    loading: false,
    error: ''
  }),

  actions: {
    /** @param {import('../types/api').PageQuery} [query] */
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

    /**
     * @param {number|string} id
     * @returns {Promise<AdminUser>}
     */
    async fetchUser(id) {
      return adminService.getUser(id)
    },

    /**
     * Suspends (true) or reactivates (false) a USER account and patches the
     * matching list row.
     * @param {number|string} id
     * @param {boolean} suspend
     * @returns {Promise<AdminUser>} The updated user
     */
    async setSuspended(id, suspend) {
      const updated = await adminService.setUserSuspended(id, suspend)
      // Keep the list in sync if the user is currently loaded there.
      const row = this.items.find((u) => String(u.id) === String(id))
      if (row) row.status = updated.status
      return updated
    }
  }
})
