// User (learner) API service. Owns HTTP details for every learner-facing
// /users/* endpoint. Routes and response shapes match:
//   tryoutapp-server/src/routes/userRoutes.js
//   tryoutapp-server/src/services/userApiService.js
//
// Response envelope is { success, data }. Signed file URLs (materials,
// question/option/explanation images) expire in about 60 seconds; callers
// refetch the owning resource for a fresh URL instead of caching it.

import http, { getEnvelopeData } from '../lib/api'

/** @typedef {import('../types/api').AssessmentKind} AssessmentKind */
/** @typedef {import('../types/api').PageQuery} PageQuery */

/**
 * @param {PageQuery} [query]
 * @returns {{ params: { page: number, limit: number } }}
 */
function pageParams({ page = 1, limit = 20 } = {}) {
  return { params: { page, limit } }
}

export default {
  // ---- Subscription and payment ----

  /** @returns {Promise<import('../types/api').Plan[]>} */
  async getOffer() {
    return getEnvelopeData(await http.get('/users/premium/offer'))
  },

  /** @returns {Promise<import('../types/api').Subscription>} */
  async getSubscription() {
    return getEnvelopeData(await http.get('/users/subscription'))
  },

  /**
   * Creates a Snap payment. The backend reuses the user's PENDING transaction.
   * @returns {Promise<import('../types/api').Invoice>}
   */
  async createPayment() {
    return getEnvelopeData(await http.post('/users/premium/payment'))
  },

  /**
   * @param {PageQuery} [query]
   * @returns {Promise<import('../types/api').Page<import('../types/api').Transaction>>}
   */
  async listTransactions(query) {
    return getEnvelopeData(await http.get('/users/transactions', pageParams(query)))
  },

  // ---- Materials ----

  /**
   * Every released material, FREE and PREMIUM. Opening a PREMIUM one as a
   * Free user returns 403.
   * @param {PageQuery} [query]
   * @returns {Promise<import('../types/api').Page<import('../types/api').Material>>}
   */
  async listMaterials(query) {
    return getEnvelopeData(await http.get('/users/materials', pageParams(query)))
  },

  /**
   * @param {number|string} id
   * @returns {Promise<import('../types/api').Material>} Includes `file.url` (signed, 60s)
   */
  async getMaterial(id) {
    return getEnvelopeData(await http.get(`/users/materials/${id}`))
  },

  // ---- Assessments (Latihan and Try Out) ----

  /**
   * Every released assessment of `kind`, FREE and PREMIUM.
   * @param {AssessmentKind} kind
   * @param {PageQuery} [query]
   * @returns {Promise<import('../types/api').Page<import('../types/api').AssessmentSummary>>}
   */
  async listAssessments(kind, query) {
    return getEnvelopeData(await http.get(`/users/${kind}`, pageParams(query)))
  },

  /**
   * @param {AssessmentKind} kind
   * @param {number|string} assessmentId
   * @returns {Promise<import('../types/api').AssessmentDetail>}
   */
  async getAssessment(kind, assessmentId) {
    return getEnvelopeData(await http.get(`/users/${kind}/${assessmentId}`))
  },

  /**
   * Starts an attempt or returns the IN_PROGRESS one.
   * @param {AssessmentKind} kind
   * @param {number|string} assessmentId
   * @returns {Promise<import('../types/api').AttemptState>}
   */
  async startAttempt(kind, assessmentId) {
    return getEnvelopeData(await http.post(`/users/${kind}/${assessmentId}/attempts`))
  },

  /**
   * The user's finalized attempts of one assessment, newest first.
   * @param {AssessmentKind} kind
   * @param {number|string} assessmentId
   * @returns {Promise<import('../types/api').AttemptHistoryEntry[]>}
   */
  async getAttemptHistory(kind, assessmentId) {
    return getEnvelopeData(await http.get(`/users/${kind}/${assessmentId}/attempts`))
  },

  /**
   * @param {number|string} attemptId
   * @returns {Promise<import('../types/api').AttemptState>} With `questions`
   */
  async getAttempt(attemptId) {
    return getEnvelopeData(await http.get(`/users/attempts/${attemptId}`))
  },

  /**
   * Upserts one answer. The UI marks it saved only after this resolves.
   * @param {number|string} attemptId
   * @param {number} questionId
   * @param {number} selectedOptionId
   * @param {import('axios').AxiosRequestConfig} [config] - e.g. an AbortSignal
   */
  async saveAnswer(attemptId, questionId, selectedOptionId, config = {}) {
    const res = await http.post(
      `/users/attempts/${attemptId}/answers`,
      { question_id: questionId, selected_option_id: selectedOptionId },
      config
    )
    return getEnvelopeData(res)
  },

  /**
   * Finalizes the attempt. Unanswered questions are allowed.
   * @param {number|string} attemptId
   * @returns {Promise<import('../types/api').SubmitResponse>}
   */
  async submitAttempt(attemptId) {
    return getEnvelopeData(await http.post(`/users/attempts/${attemptId}/submit`))
  },

  /**
   * Review of a finalized attempt: the latest one, or `attemptId` when given.
   * @param {AssessmentKind} kind
   * @param {number|string} assessmentId
   * @param {number|string|null} [attemptId]
   * @returns {Promise<import('../types/api').ExplanationItem[]>}
   */
  async getExplanations(kind, assessmentId, attemptId = null) {
    const config = attemptId ? { params: { attempt_id: attemptId } } : {}
    return getEnvelopeData(await http.get(`/users/${kind}/${assessmentId}/explanations`, config))
  },

  /**
   * One feedback per assessment; a duplicate returns 409.
   * @param {number|string} assessmentId
   * @param {import('../types/api').FeedbackPayload} payload
   */
  async submitFeedback(assessmentId, payload) {
    return getEnvelopeData(await http.post(`/users/assessments/${assessmentId}/feedback`, payload))
  },

  /**
   * Every finalized Try Out attempt, oldest first. Premium only (403 for Free).
   * @returns {Promise<import('../types/api').StatisticsRow[]>}
   */
  async getTryoutStatistics() {
    return getEnvelopeData(await http.get('/users/tryout/statistics'))
  }
}
