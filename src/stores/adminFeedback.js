// Admin feedback store: paginated, filterable list of learner feedback.
import { defineStore } from 'pinia'
import adminService from '../services/adminService'

/** @typedef {import('../types/api').FeedbackEntry} FeedbackEntry */
/** @typedef {import('../types/api').FeedbackFilters} FeedbackFilters */

/** @returns {FeedbackFilters} */
function emptyFilters() {
  return { assessment_id: null, assessment_type: null, rating: null, difficulty: null }
}

export const useAdminFeedbackStore = defineStore('adminFeedback', {
  state: () => ({
    /** @type {FeedbackEntry[]} */
    items: [],
    /** @type {import('../types/api').Pagination} */
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    /** @type {{ total: number, average_rating: number|null }} */
    summary: { total: 0, average_rating: null },
    /** @type {FeedbackFilters} */
    filters: emptyFilters(),
    loading: false,
    error: ''
  }),

  actions: {
    /** @param {number} [page=1] */
    async fetchList(page = 1) {
      this.loading = true
      this.error = ''
      try {
        const data = await adminService.listFeedback({ page, limit: this.pagination.limit, ...this.filters })
        this.items = data.items || []
        this.pagination = data.pagination || this.pagination
        this.summary = data.summary || this.summary
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    /**
     * Merges `patch` into the filters and reloads from page 1.
     * @param {Partial<FeedbackFilters>} patch
     */
    async applyFilters(patch) {
      this.filters = { ...this.filters, ...patch }
      await this.fetchList(1)
    },

    async resetFilters() {
      this.filters = emptyFilters()
      await this.fetchList(1)
    }
  }
})
