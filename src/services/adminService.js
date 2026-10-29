// Admin API service. Owns HTTP details for every /admin/* endpoint.
// Routes and response shapes verified against:
//   api/src/routes/adminRoutes.js
//   api/src/controllers/adminController.js
//   api/src/services/adminService.js
//   api/src/services/adminContentService.js
//
// Response envelope is { success, data, message? }. Paginated endpoints return
// data: { items, pagination: { page, limit, total, totalPages } }.

import http, { getEnvelopeData } from '../lib/api'

function pageParams({ page = 1, limit = 20 } = {}) {
  return { params: { page, limit } }
}

export default {
  // ---- Users (FA1, FA2) ----
  async listUsers(opts) {
    const res = await http.get('/admin/users', pageParams(opts))
    return getEnvelopeData(res)
  },
  async getUser(id) {
    const res = await http.get(`/admin/users/${id}`)
    return getEnvelopeData(res)
  },
  // Reversible suspension. suspend=true -> SUSPENDED, false -> ACTIVE.
  async setUserSuspended(id, suspend) {
    const path = suspend ? 'suspend' : 'reactivate'
    const res = await http.patch(`/admin/users/${id}/${path}`)
    return getEnvelopeData(res)
  },

  // ---- Images / files (FA3, FA4, FA5, FA7) ----
  async listImages(opts) {
    const res = await http.get('/admin/images', pageParams(opts))
    return getEnvelopeData(res)
  },
  // Multipart upload, field name "file". data: attachment metadata.
  async uploadImage(file) {
    const form = new FormData()
    form.append('file', file)
    const res = await http.post('/admin/images', form)
    return getEnvelopeData(res)
  },
  // Returns a fresh signed URL (expires in 60s). data: { url }
  async getImageUrl(id) {
    const res = await http.get(`/admin/images/${id}`)
    return getEnvelopeData(res)
  },
  async deleteImage(id) {
    const res = await http.delete(`/admin/images/${id}`)
    return res.data
  },

  // ---- Materials (FA8-11, FA24) ----
  async listMaterials(opts) {
    const res = await http.get('/admin/materials', pageParams(opts))
    return getEnvelopeData(res)
  },
  // Multipart: file (PDF) + title + optional description + optional access_type.
  async uploadMaterial({ title, description, access_type, file }) {
    const form = new FormData()
    form.append('file', file)
    form.append('title', title)
    if (description) form.append('description', description)
    if (access_type) form.append('access_type', access_type)
    const res = await http.post('/admin/materials', form)
    return getEnvelopeData(res)
  },
  async getMaterial(id) {
    const res = await http.get(`/admin/materials/${id}`)
    return getEnvelopeData(res)
  },
  // Fresh signed URL for the material PDF. data: { url }
  async getMaterialFileUrl(id) {
    const res = await http.get(`/admin/materials/${id}/file`)
    return getEnvelopeData(res)
  },
  async deleteMaterial(id) {
    const res = await http.delete(`/admin/materials/${id}`)
    return res.data
  },
  async setMaterialReleased(id, released) {
    const path = released ? 'release' : 'unrelease'
    const res = await http.patch(`/admin/materials/${id}/${path}`)
    return getEnvelopeData(res)
  },

  // ---- Assessments ----
  async listAssessments(opts) {
    const res = await http.get('/admin/assessments', pageParams(opts))
    return getEnvelopeData(res)
  },
  async getAssessment(id) {
    const res = await http.get(`/admin/assessments/${id}`)
    return getEnvelopeData(res)
  },
  async createAssessment(payload) {
    const res = await http.post('/admin/assessments', payload)
    return getEnvelopeData(res)
  },
  async updateAssessment(id, payload) {
    const res = await http.patch(`/admin/assessments/${id}`, payload)
    return getEnvelopeData(res)
  },
  async setAssessmentReleased(id, released) {
    const path = released ? 'release' : 'unrelease'
    const res = await http.post(`/admin/assessments/${id}/${path}`)
    return getEnvelopeData(res)
  },

  // ---- Question packages ----
  // body: { assessment_id, questions: [...] }. Built from the uploaded Excel.
  async createQuestionPackage(payload) {
    const res = await http.post('/admin/question-packages', payload)
    return getEnvelopeData(res)
  },
  // Note: backend path param is the ASSESSMENT id, not the package id.
  async getQuestionPackage(assessmentId) {
    const res = await http.get(`/admin/assessments/${assessmentId}/question-package`)
    return getEnvelopeData(res)
  },
  async updateQuestion(questionId, payload) {
    const res = await http.patch(`/admin/questions/${questionId}`, payload)
    return getEnvelopeData(res)
  },
  async updateOption(questionId, optionId, payload) {
    const res = await http.patch(`/admin/questions/${questionId}/options/${optionId}`, payload)
    return getEnvelopeData(res)
  }
}
