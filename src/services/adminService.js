// Admin API service. Owns HTTP details for every /admin/* endpoint.
// Routes and response shapes match:
//   tryoutapp-server/src/routes/adminRoutes.js
//   tryoutapp-server/src/services/adminService.js
//   tryoutapp-server/src/services/adminContentService.js
//
// Response envelope is { success, data, message? }. Paginated endpoints return
// data: { items, pagination: { page, limit, total, totalPages } }.

import http, { getEnvelopeData } from '../lib/api'

/** @typedef {import('../types/api').PageQuery} PageQuery */
/** @typedef {import('../types/api').Material} Material */

/**
 * @param {PageQuery} [query]
 * @returns {{ params: { page: number, limit: number } }}
 */
function pageParams({ page = 1, limit = 20 } = {}) {
  return { params: { page, limit } }
}

/**
 * Drops empty filter values so they are not sent as query parameters.
 * @param {Record<string, unknown>} params
 * @returns {Record<string, unknown>}
 */
function compact(params) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== null && value !== undefined && value !== ''))
}

export default {
  // ---- Users ----

  /** @param {PageQuery} [query] */
  async listUsers(query) {
    return getEnvelopeData(await http.get('/admin/users', pageParams(query)))
  },

  /** @param {number|string} id */
  async getUser(id) {
    return getEnvelopeData(await http.get(`/admin/users/${id}`))
  },

  /**
   * Reversible suspension: true sets SUSPENDED, false sets ACTIVE.
   * @param {number|string} id
   * @param {boolean} suspend
   */
  async setUserSuspended(id, suspend) {
    return getEnvelopeData(await http.patch(`/admin/users/${id}/${suspend ? 'suspend' : 'reactivate'}`))
  },

  // ---- Images ----

  /** @param {PageQuery} [query] */
  async listImages(query) {
    return getEnvelopeData(await http.get('/admin/images', pageParams(query)))
  },

  /**
   * Multipart upload, field name "file".
   * @param {File} file
   */
  async uploadImage(file) {
    const form = new FormData()
    form.append('file', file)
    return getEnvelopeData(await http.post('/admin/images', form))
  },

  /**
   * @param {number|string} id
   * @returns {Promise<{ url: string }>} Signed URL, valid for 60 seconds
   */
  async getImageUrl(id) {
    return getEnvelopeData(await http.get(`/admin/images/${id}`))
  },

  /** @param {number|string} id */
  async deleteImage(id) {
    return (await http.delete(`/admin/images/${id}`)).data
  },

  // ---- Materials ----

  /**
   * @param {PageQuery} [query]
   * @returns {Promise<import('../types/api').Page<Material>>}
   */
  async listMaterials(query) {
    return getEnvelopeData(await http.get('/admin/materials', pageParams(query)))
  },

  /**
   * Multipart: PDF file plus metadata. `type` is required by the backend.
   * @param {{ title: string, description?: string, type: import('../types/api').SectionType, access_type?: import('../types/api').AccessType, file: File }} input
   * @returns {Promise<Material>}
   */
  async uploadMaterial({ title, description, type, access_type: accessType, file }) {
    const form = new FormData()
    form.append('file', file)
    form.append('title', title)
    form.append('type', type)
    if (description) form.append('description', description)
    if (accessType) form.append('access_type', accessType)
    return getEnvelopeData(await http.post('/admin/materials', form))
  },

  /**
   * @param {number|string} id
   * @returns {Promise<Material>}
   */
  async getMaterial(id) {
    return getEnvelopeData(await http.get(`/admin/materials/${id}`))
  },

  /**
   * Updates metadata only; the file cannot be replaced.
   * @param {number|string} id
   * @param {Partial<Pick<Material, 'title'|'description'|'type'|'access_type'>>} payload
   * @returns {Promise<Material>}
   */
  async updateMaterial(id, payload) {
    return getEnvelopeData(await http.patch(`/admin/materials/${id}`, payload))
  },

  /**
   * @param {number|string} id
   * @returns {Promise<{ url: string }>} Signed URL, valid for 60 seconds
   */
  async getMaterialFileUrl(id) {
    return getEnvelopeData(await http.get(`/admin/materials/${id}/file`))
  },

  /** @param {number|string} id */
  async deleteMaterial(id) {
    return (await http.delete(`/admin/materials/${id}`)).data
  },

  /**
   * @param {number|string} id
   * @param {boolean} released
   */
  async setMaterialReleased(id, released) {
    return getEnvelopeData(await http.patch(`/admin/materials/${id}/${released ? 'release' : 'unrelease'}`))
  },

  // ---- Assessments ----

  /** @param {PageQuery} [query] */
  async listAssessments(query) {
    return getEnvelopeData(await http.get('/admin/assessments', pageParams(query)))
  },

  /** @param {number|string} id */
  async getAssessment(id) {
    return getEnvelopeData(await http.get(`/admin/assessments/${id}`))
  },

  /** @param {Record<string, unknown>} payload */
  async createAssessment(payload) {
    return getEnvelopeData(await http.post('/admin/assessments', payload))
  },

  /**
   * @param {number|string} id
   * @param {Record<string, unknown>} payload
   */
  async updateAssessment(id, payload) {
    return getEnvelopeData(await http.patch(`/admin/assessments/${id}`, payload))
  },

  /**
   * @param {number|string} id
   * @param {boolean} released
   */
  async setAssessmentReleased(id, released) {
    return getEnvelopeData(await http.post(`/admin/assessments/${id}/${released ? 'release' : 'unrelease'}`))
  },

  // ---- Question packages ----

  /**
   * Built from the uploaded Excel.
   * @param {{ assessment_id: number, questions: Array<Record<string, unknown>> }} payload
   */
  async createQuestionPackage(payload) {
    return getEnvelopeData(await http.post('/admin/question-packages', payload))
  },

  /**
   * The path parameter is the ASSESSMENT id, not the package id.
   * @param {number|string} assessmentId
   */
  async getQuestionPackage(assessmentId) {
    return getEnvelopeData(await http.get(`/admin/assessments/${assessmentId}/question-package`))
  },

  /**
   * @param {number|string} questionId
   * @param {Record<string, unknown>} payload
   */
  async updateQuestion(questionId, payload) {
    return getEnvelopeData(await http.patch(`/admin/questions/${questionId}`, payload))
  },

  /**
   * @param {number|string} questionId
   * @param {number|string} optionId
   * @param {Record<string, unknown>} payload
   */
  async updateOption(questionId, optionId, payload) {
    return getEnvelopeData(await http.patch(`/admin/questions/${questionId}/options/${optionId}`, payload))
  },

  // ---- Feedback ----

  /**
   * Newest first. `summary` covers every row that matches the filters.
   * @param {PageQuery & import('../types/api').FeedbackFilters} [query]
   * @returns {Promise<import('../types/api').FeedbackPage>}
   */
  async listFeedback({ page = 1, limit = 20, ...filters } = {}) {
    return getEnvelopeData(await http.get('/admin/feedback', { params: compact({ page, limit, ...filters }) }))
  }
}
