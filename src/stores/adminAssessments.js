// Admin assessments store (list, detail, create, update, release/unrelease).
// Question-package operations go through adminService directly from the builder
// page since they are one-shot flows that do not need shared state.
import { defineStore } from 'pinia'
import adminService from '../services/adminService'

/**
 * Fields shared by the admin list row and the admin detail response.
 * @typedef {Omit<import('../types/api').AssessmentDetail, 'question_count'> & {
 *   is_released: number|boolean,
 *   created_at: string,
 *   updated_at: string
 * }} AdminAssessmentBase
 */

/**
 * @typedef {AdminAssessmentBase & {
 *   question_package_id: number|null,
 *   question_count: number
 * }} AdminAssessmentRow
 */

/**
 * @typedef {AdminAssessmentBase & {
 *   question_package: { id: number, created_at: string, question_count: number }|null
 * }} AdminAssessmentDetail
 */

export const useAdminAssessmentsStore = defineStore('adminAssessments', {
  state: () => ({
    /** @type {AdminAssessmentRow[]} */
    items: [],
    /** @type {import('../types/api').Pagination} */
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    loading: false,
    saving: false,
    error: ''
  }),

  actions: {
    /** @param {import('../types/api').PageQuery} [query] */
    async fetchList({ page = 1, limit = 20 } = {}) {
      this.loading = true
      this.error = ''
      try {
        const data = await adminService.listAssessments({ page, limit })
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
     * @returns {Promise<AdminAssessmentDetail>}
     */
    async fetchDetail(id) {
      return adminService.getAssessment(id)
    },

    /**
     * @param {Record<string, unknown>} payload
     * @returns {Promise<AdminAssessmentDetail>} The created assessment
     */
    async create(payload) {
      this.saving = true
      try {
        return await adminService.createAssessment(payload)
      } finally {
        this.saving = false
      }
    },

    /**
     * @param {number|string} id
     * @param {Record<string, unknown>} payload - Only the fields to change
     * @returns {Promise<AdminAssessmentDetail>} The updated assessment
     */
    async update(id, payload) {
      this.saving = true
      try {
        return await adminService.updateAssessment(id, payload)
      } finally {
        this.saving = false
      }
    },

    /**
     * Releases or unreleases an assessment and patches the matching list row.
     * @param {number|string} id
     * @param {boolean} released
     */
    async setReleased(id, released) {
      await adminService.setAssessmentReleased(id, released)
      const row = this.items.find((a) => String(a.id) === String(id))
      if (row) row.is_released = released ? 1 : 0
    }
  }
})
