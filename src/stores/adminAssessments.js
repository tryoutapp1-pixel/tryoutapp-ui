// Admin assessments store (list, detail, create, update, release/unrelease).
// Question-package operations go through adminService directly from the builder
// page since they are one-shot flows that do not need shared state.
import { defineStore } from 'pinia'
import adminService from '../services/adminService'

export const useAdminAssessmentsStore = defineStore('adminAssessments', {
  state: () => ({
    items: [],
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    loading: false,
    saving: false,
    error: ''
  }),

  actions: {
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

    async fetchDetail(id) {
      return adminService.getAssessment(id)
    },

    async create(payload) {
      this.saving = true
      try {
        return await adminService.createAssessment(payload)
      } finally {
        this.saving = false
      }
    },

    async update(id, payload) {
      this.saving = true
      try {
        return await adminService.updateAssessment(id, payload)
      } finally {
        this.saving = false
      }
    },

    async setReleased(id, released) {
      await adminService.setAssessmentReleased(id, released)
      const row = this.items.find((a) => String(a.id) === String(id))
      if (row) row.is_released = released ? 1 : 0
    }
  }
})
