// User (learner) API service. Owns HTTP details for every learner-facing
// /users/* endpoint. Routes and response shapes verified against:
//   api/src/routes/userRoutes.js
//   api/src/controllers/userApiController.js
//   api/src/services/userApiService.js
//
// Response envelope is { success, data }. Paginated endpoints return
// data: { items, pagination: { page, limit, total, totalPages } }.
// Signed file URLs (materials, question/option/explanation images) expire in
// ~60s; callers must refetch the owning resource to obtain a fresh URL rather
// than caching them.

import http, { getEnvelopeData } from '../lib/api'

function pageParams({ page = 1, limit = 20 } = {}) {
  return { params: { page, limit } }
}

export default {
  // ---- Subscription & payment (FU2, FU6, FU7) ----
  // GET /users/premium/offer -> data: [{ name, title, price, currency, duration_days, duration_description }]
  async getOffer() {
    const res = await http.get('/users/premium/offer')
    return getEnvelopeData(res)
  },
  // GET /users/subscription -> data: { status: 'FREE'|'PREMIUM', started_at, expired_at }
  async getSubscription() {
    const res = await http.get('/users/subscription')
    return getEnvelopeData(res)
  },
  // POST /users/premium/payment -> data: { order_id, transaction_id, snap_token, amount, currency, status }
  // Backend reuses an existing PENDING transaction (idempotent per user).
  async createPayment() {
    const res = await http.post('/users/premium/payment')
    return getEnvelopeData(res)
  },
  // GET /users/transactions -> data: { items:[{ order_id, amount, status, payment_method, created_at, updated_at }], pagination }
  async listTransactions(opts) {
    const res = await http.get('/users/transactions', pageParams(opts))
    return getEnvelopeData(res)
  },

  // ---- Materials (FU8, FU9) ----
  async listMaterials(opts) {
    const res = await http.get('/users/materials', pageParams(opts))
    return getEnvelopeData(res)
  },
  // GET /users/materials/:id -> data includes file: { ..., url } (signed, 60s)
  async getMaterial(id) {
    const res = await http.get(`/users/materials/${id}`)
    return getEnvelopeData(res)
  },

  // ---- Assessments: shared for Latihan & Try Out (FU10-FU22) ----
  // kind is 'latihan' or 'tryout' (matches the backend route segment).
  async listAssessments(kind, opts) {
    const res = await http.get(`/users/${kind}`, pageParams(opts))
    return getEnvelopeData(res)
  },
  async getAssessment(kind, assessmentId) {
    const res = await http.get(`/users/${kind}/${assessmentId}`)
    return getEnvelopeData(res)
  },
  // POST /users/:kind/:assessmentId/attempts -> data: attempt state
  // (reuses an IN_PROGRESS attempt if one exists).
  async startAttempt(kind, assessmentId) {
    const res = await http.post(`/users/${kind}/${assessmentId}/attempts`)
    return getEnvelopeData(res)
  },
  // GET /users/attempts/:attemptId -> data: { attempt_id, status, started_at,
  //   expired_at, server_time, remaining_seconds, questions:[...] }
  async getAttempt(attemptId) {
    const res = await http.get(`/users/attempts/${attemptId}`)
    return getEnvelopeData(res)
  },
  // POST /users/attempts/:attemptId/answers { question_id, selected_option_id }
  // Upserts a single answer. Backend confirms before we treat it as saved.
  async saveAnswer(attemptId, questionId, selectedOptionId, config = {}) {
    const res = await http.post(
      `/users/attempts/${attemptId}/answers`,
      { question_id: questionId, selected_option_id: selectedOptionId },
      config
    )
    return getEnvelopeData(res)
  },
  // POST /users/attempts/:attemptId/submit -> data: { is_feedback, result }
  async submitAttempt(attemptId) {
    const res = await http.post(`/users/attempts/${attemptId}/submit`)
    return getEnvelopeData(res)
  },
  // GET /users/:kind/attempts/:attemptId/result -> data: result object
  async getResult(kind, attemptId) {
    const res = await http.get(`/users/${kind}/attempts/${attemptId}/result`)
    return getEnvelopeData(res)
  },
  // GET /users/:kind/:assessmentId/explanations -> data: [question + options + explanation]
  async getExplanations(kind, assessmentId) {
    const res = await http.get(`/users/${kind}/${assessmentId}/explanations`)
    return getEnvelopeData(res)
  },
  // POST /users/assessments/:assessmentId/feedback { rating, difficulty, comment? }
  async submitFeedback(assessmentId, payload) {
    const res = await http.post(`/users/assessments/${assessmentId}/feedback`, payload)
    return getEnvelopeData(res)
  },
  // GET /users/tryout/statistics -> data: [{ attempt_id, assessment_id,
  //   assessment_title, completed_at, total_score, twk_score, tiu_score, tkp_score }]
  async getTryoutStatistics() {
    const res = await http.get('/users/tryout/statistics')
    return getEnvelopeData(res)
  }
}
