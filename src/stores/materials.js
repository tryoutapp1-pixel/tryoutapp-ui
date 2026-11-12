// Learner materials store.
//
// The list holds every released material, FREE and PREMIUM; the list page asks
// Free users to upgrade before opening a PREMIUM one, and the backend returns
// 403 if they open it anyway. Detail responses embed a signed file URL that
// expires in about 60 seconds, so details are refetched instead of cached.
import { defineStore } from 'pinia'
import userService from '../services/userService'

/** @typedef {import('../types/api').Material} Material */

export const useMaterialsStore = defineStore('materials', {
  state: () => ({
    /** @type {Material[]} */
    items: [],
    /** @type {import('../types/api').Pagination} */
    pagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
    loading: false,
    error: ''
  }),

  actions: {
    /** @param {import('../types/api').PageQuery} [query] */
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

    /**
     * @param {number|string} id
     * @returns {Promise<Material>} Includes a fresh signed file URL
     */
    async fetchDetail(id) {
      return userService.getMaterial(id)
    }
  }
})
