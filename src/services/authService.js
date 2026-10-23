// Auth API service. Owns HTTP details for authentication endpoints and returns
// normalized data. Routes verified against api/src/routes/authRoutes.js and
// api/src/controllers/authController.js.

import http, { getEnvelopeData } from '../lib/api'

export default {
  // POST /api/auth/login -> data: { accessToken, user: { id, name, email, role } }
  async login({ email, password }) {
    const res = await http.post('/auth/login', { email, password })
    return getEnvelopeData(res)
  },

  // POST /api/auth/signup -> 201 data: { userId, name, email } (does NOT authenticate)
  async signup({ name, email, password }) {
    const res = await http.post('/auth/signup', { name, email, password })
    return getEnvelopeData(res)
  },

  // POST /api/auth/logout -> stateless; client still clears its own token.
  async logout() {
    const res = await http.post('/auth/logout')
    return res.data
  },

  // GET /api/auth/verify-email?token=...
  async verifyEmail(token) {
    const res = await http.get('/auth/verify-email', { params: { token } })
    return res.data
  },

  // POST /api/auth/resend-verification -> enumeration-safe message
  async resendVerification(email) {
    const res = await http.post('/auth/resend-verification', { email })
    return res.data
  },

  // POST /api/auth/forgot-password -> enumeration-safe message
  async forgotPassword(email) {
    const res = await http.post('/auth/forgot-password', { email })
    return res.data
  },

  // POST /api/auth/reset-password
  async resetPassword({ token, newPassword }) {
    const res = await http.post('/auth/reset-password', { token, newPassword })
    return res.data
  },

  // PATCH /api/auth/change-password (requires JWT)
  async changePassword({ currentPassword, newPassword }) {
    const res = await http.patch('/auth/change-password', { currentPassword, newPassword })
    return res.data
  }
}
