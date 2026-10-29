// Admin materials store (list, upload, detail, delete, release/unrelease).
import { defineStore } from 'pinia'
import adminService from '../services/adminService'

export const useAdminMaterialsStore = defineStore('adminMaterials', {
  state: () => ({
    items: [],
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    loading: false,
    uploading: false,
    error: ''
  }),

  actions: {
    async fetchList({ page = 1, limit = 20 } = {}) {
      this.loading = true
      this.error = ''
      try {
        const data = await adminService.listMaterials({ page, limit })
        this.items = data.items || []
        this.pagination = data.pagination || this.pagination
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async upload(payload) {
      this.uploading = true
      try {
        const created = await adminService.uploadMaterial(payload)
        await this.fetchList({ page: 1, limit: this.pagination.limit })
        return created
      } finally {
        this.uploading = false
      }
    },

    async fetchDetail(id) {
      return adminService.getMaterial(id)
    },

    async refreshFileUrl(id) {
      const data = await adminService.getMaterialFileUrl(id)
      return data.url
    },

    async setReleased(id, released) {
      await adminService.setMaterialReleased(id, released)
      // Reflect the new state in the current list without a full reload.
      const row = this.items.find((m) => String(m.id) === String(id))
      if (row) row.is_released = released ? 1 : 0
    },

    async remove(id) {
      await adminService.deleteMaterial(id)
      await this.fetchList({ page: this.pagination.page, limit: this.pagination.limit })
    }
  }
})
