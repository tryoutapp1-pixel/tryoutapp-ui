// Assessment catalog store, shared by Latihan and Try Out. `kind` is 'latihan'
// or 'tryout' and maps to the backend route segment. Lists are kept per kind so
// switching menus does not clobber the other list.
import { defineStore } from 'pinia'
import userService from '../services/userService'

/** @typedef {import('../types/api').AssessmentKind} AssessmentKind */
/** @typedef {import('../types/api').AssessmentSummary} AssessmentSummary */

/**
 * @typedef {Object} AssessmentListState
 * @property {AssessmentSummary[]} items
 * @property {import('../types/api').Pagination} pagination
 * @property {boolean} loading
 * @property {string} error
 */

/** @returns {AssessmentListState} */
function emptyList() {
  return {
    items: [],
    pagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
    loading: false,
    error: ''
  }
}

export const useAssessmentsStore = defineStore('assessments', {
  state: () => ({
    latihan: emptyList(),
    tryout: emptyList()
  }),

  actions: {
    /**
     * Loads every released assessment of `kind`, FREE and PREMIUM.
     * @param {AssessmentKind} kind
     * @param {import('../types/api').PageQuery} [query]
     */
    async fetchList(kind, { page = 1, limit = 12 } = {}) {
      const slice = this[kind]
      slice.loading = true
      slice.error = ''
      try {
        const data = await userService.listAssessments(kind, { page, limit })
        slice.items = data.items || []
        slice.pagination = data.pagination || slice.pagination
      } catch (error) {
        slice.error = error.message
      } finally {
        slice.loading = false
      }
    },

    /**
     * Not cached, so the detail page always reflects current access state.
     * @param {AssessmentKind} kind
     * @param {number|string} assessmentId
     * @returns {Promise<import('../types/api').AssessmentDetail>}
     */
    async fetchDetail(kind, assessmentId) {
      return userService.getAssessment(kind, assessmentId)
    },

    /**
     * The user's finalized attempts of one assessment, newest first. Works for
     * both kinds and for Free and Premium users.
     * @param {AssessmentKind} kind
     * @param {number|string} assessmentId
     * @returns {Promise<import('../types/api').AttemptHistoryEntry[]>}
     */
    async fetchAttemptHistory(kind, assessmentId) {
      return (await userService.getAttemptHistory(kind, assessmentId)) || []
    }
  }
})
