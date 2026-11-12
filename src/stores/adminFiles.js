// Admin images/files store. Signed URLs in the list expire after 60s; the
// detail action re-fetches a fresh URL on demand.
import { defineStore } from 'pinia'
import adminService from '../services/adminService'

/** @typedef {import('../types/api').FileInfo} FileInfo */

export const useAdminFilesStore = defineStore('adminFiles', {
  state: () => ({
    /** @type {FileInfo[]} */
    items: [],
    /** @type {import('../types/api').Pagination} */
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    loading: false,
    uploading: false,
    error: ''
  }),

  actions: {
    /** @param {import('../types/api').PageQuery} [query] */
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

    /**
     * Uploads an image, then reloads the current page.
     * @param {File} file
     * @returns {Promise<Record<string, any>>} The created attachment record
     */
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

    /**
     * @param {number|string} id
     * @returns {Promise<string>} A fresh signed URL
     */
    async refreshUrl(id) {
      const data = await adminService.getImageUrl(id)
      return data.url
    },

    /**
     * Deletes an image, then reloads the current page.
     * @param {number|string} id
     */
    async remove(id) {
      await adminService.deleteImage(id)
      await this.fetchList({ page: this.pagination.page, limit: this.pagination.limit })
    }
  }
})
