// Admin materials store: list, upload, detail, metadata edit, delete, and
// release/unrelease.
import { defineStore } from 'pinia'
import adminService from '../services/adminService'

/** @typedef {import('../types/api').Material} Material */

export const useAdminMaterialsStore = defineStore('adminMaterials', {
  state: () => ({
    /** @type {Material[]} */
    items: [],
    /** @type {import('../types/api').Pagination} */
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    loading: false,
    uploading: false,
    saving: false,
    error: ''
  }),

  actions: {
    /** @param {import('../types/api').PageQuery} [query] */
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

    /**
     * Uploads a material and reloads page 1 so it appears at the top.
     * @param {Parameters<typeof adminService.uploadMaterial>[0]} payload
     * @returns {Promise<Material>}
     */
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

    /**
     * @param {number|string} id
     * @returns {Promise<Material>}
     */
    async fetchDetail(id) {
      return adminService.getMaterial(id)
    },

    /**
     * Saves metadata and patches the matching list row in place.
     * @param {number|string} id
     * @param {Parameters<typeof adminService.updateMaterial>[1]} payload
     * @returns {Promise<Material>}
     */
    async update(id, payload) {
      this.saving = true
      try {
        const updated = await adminService.updateMaterial(id, payload)
        const row = this.items.find((m) => String(m.id) === String(id))
        if (row) Object.assign(row, payload)
        return updated
      } finally {
        this.saving = false
      }
    },

    /**
     * @param {number|string} id
     * @returns {Promise<string>} A fresh signed URL
     */
    async refreshFileUrl(id) {
      const data = await adminService.getMaterialFileUrl(id)
      return data.url
    },

    /**
     * @param {number|string} id
     * @param {boolean} released
     */
    async setReleased(id, released) {
      await adminService.setMaterialReleased(id, released)
      const row = this.items.find((m) => String(m.id) === String(id))
      if (row) row.is_released = released ? 1 : 0
    },

    /** @param {number|string} id */
    async remove(id) {
      await adminService.deleteMaterial(id)
      await this.fetchList({ page: this.pagination.page, limit: this.pagination.limit })
    }
  }
})
