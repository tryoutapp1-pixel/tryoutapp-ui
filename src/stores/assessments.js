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
    },

    // Previous attempts for ONE assessment.
    //
    // Backend reality (verified against api/src/services/userApiService.js):
    //  - Try Out: GET /users/tryout/statistics returns one row per
    //    COMPLETED/EXPIRED Try Out attempt for the user, including attempt_id
    //    and assessment_id. We filter to the requested assessment and sort
    //    newest-first. IN_PROGRESS attempts are NOT included by the backend.
    //  - Latihan: there is NO endpoint that lists a user's Latihan attempts.
    //    We therefore return `supported: false` so the UI can render an honest
    //    notice instead of fabricating history.
    //
    // Returns: { supported, items: [{ attempt_id, assessment_id, completed_at,
    //   total_score, twk_score, tiu_score, tkp_score, status }] }
    async fetchAttemptHistory(kind, assessmentId) {
      if (kind !== 'tryout') {
        return { supported: false, items: [] }
      }
      const rows = (await userService.getTryoutStatistics()) || []
      const items = rows
        .filter((r) => String(r.assessment_id) === String(assessmentId))
        .map((r) => ({
          attempt_id: r.attempt_id,
          assessment_id: r.assessment_id,
          assessment_title: r.assessment_title,
          completed_at: r.completed_at,
          total_score: Number(r.total_score),
          twk_score: Number(r.twk_score),
          tiu_score: Number(r.tiu_score),
          tkp_score: Number(r.tkp_score),
          // Statistics only ever contains finalized attempts; the backend does
          // not distinguish COMPLETED vs EXPIRED here, so we report COMPLETED.
          status: 'COMPLETED'
        }))
        .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
      return { supported: true, items }
    }
  }
})
