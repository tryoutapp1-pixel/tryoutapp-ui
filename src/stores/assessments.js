// Assessment catalog store, shared by Latihan (FU10-FU11) and Try Out
// (FU17-FU18). "kind" is 'latihan' or 'tryout' and maps to the backend route
// segment. Lists are kept per-kind so switching tabs doesn't clobber the other.
import { defineStore } from 'pinia'
import userService from '../services/userService'

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

    // Detail is fetched on demand and returned to the caller (not cached) so the
    // detail page always reflects current attempt/access state.
    async fetchDetail(kind, assessmentId) {
      return userService.getAssessment(kind, assessmentId)
    }
  }
})
