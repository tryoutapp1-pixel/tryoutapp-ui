// Admin images/files store. Signed URLs in the list expire after 60s; the
// detail action re-fetches a fresh URL on demand.
import { defineStore } from 'pinia'
import adminService from '../services/adminService'

export const useAdminFilesStore = defineStore('adminFiles', {
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
        const data = await adminService.listImages({ page, limit })
        this.items = data.items || []
        this.pagination = data.pagination || this.pagination
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async upload(file) {
      this.uploading = true
      try {
        const created = await adminService.uploadImage(file)
        // Refresh current page so the new item (and counts) are accurate.
        await this.fetchList({ page: this.pagination.page, limit: this.pagination.limit })
        return created
      } finally {
        this.uploading = false
      }
    },

    async refreshUrl(id) {
      const data = await adminService.getImageUrl(id)
      return data.url
    },

    async remove(id) {
      await adminService.deleteImage(id)
      await this.fetchList({ page: this.pagination.page, limit: this.pagination.limit })
    }
  }
})
