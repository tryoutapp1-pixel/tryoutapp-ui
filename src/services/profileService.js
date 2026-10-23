// Profile API service. Routes verified against api/src/routes/userRoutes.js and
// api/src/controllers/userController.js.
//
// GET  /api/users/me  -> data: { id, name, email, role, status, emailVerifiedAt }
// PATCH /api/users/me -> body { name }, returns updated public profile.

import http, { getEnvelopeData } from '../lib/api'

export default {
  async getMe() {
    const res = await http.get('/users/me')
    return getEnvelopeData(res)
  },

  async updateProfile({ name }) {
    const res = await http.patch('/users/me', { name })
    return getEnvelopeData(res)
  }
}
