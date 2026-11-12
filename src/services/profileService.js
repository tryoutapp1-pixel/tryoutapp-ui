// Profile API service. Routes verified against api/src/routes/userRoutes.js and
// api/src/controllers/userController.js.
//
// GET  /api/users/me  -> data: { id, name, email, role, status, emailVerifiedAt }
// PATCH /api/users/me -> body { name }, returns updated public profile.

import http, { getEnvelopeData } from '../lib/api'

/**
 * Public profile of the signed-in user.
 * @typedef {Object} Profile
 * @property {number} id
 * @property {string} name
 * @property {string} email
 * @property {import('./authService').Role} role
 * @property {'PENDING_VERIFICATION'|'ACTIVE'|'SUSPENDED'} status
 * @property {string|null} emailVerifiedAt
 */

export default {
  /** @returns {Promise<Profile>} */
  async getMe() {
    const res = await http.get('/users/me')
    return getEnvelopeData(res)
  },

  /**
   * @param {{ name: string }} input
   * @returns {Promise<Profile>}
   */
  async updateProfile({ name }) {
    const res = await http.patch('/users/me', { name })
    return getEnvelopeData(res)
  }
}
