// Auth API service. Owns HTTP details for authentication endpoints and returns
// normalized data. Routes verified against api/src/routes/authRoutes.js and
// api/src/controllers/authController.js.

import http, { getEnvelopeData } from '../lib/api'

/** @typedef {'USER'|'ADMIN'} Role */

/**
 * The user object returned by login.
 * @typedef {Object} AuthUser
 * @property {number} id
 * @property {string} name
 * @property {string} email
 * @property {Role} role
 */

/**
 * @typedef {Object} LoginResponse
 * @property {string} accessToken
 * @property {AuthUser} user
 */

/**
 * @typedef {Object} SignupResponse
 * @property {number} userId
 * @property {string} name
 * @property {string} email
 */

/**
 * Body of message-only endpoints (logout, verification, password actions).
 * @typedef {Object} MessageResponse
 * @property {boolean} success
 * @property {string} message
 */

export default {
  /**
   * POST /api/auth/login
   * @param {{ email: string, password: string }} credentials
   * @returns {Promise<LoginResponse>}
   */
  async login({ email, password }) {
    const res = await http.post('/auth/login', { email, password })
    return getEnvelopeData(res)
  },

  /**
   * POST /api/auth/signup (201). Does NOT authenticate; the user must verify
   * their email first.
   * @param {{ name: string, email: string, password: string }} input
   * @returns {Promise<SignupResponse>}
   */
  async signup({ name, email, password }) {
    const res = await http.post('/auth/signup', { name, email, password })
    return getEnvelopeData(res)
  },

  /**
   * POST /api/auth/logout. Stateless; the client still clears its own token.
   * @returns {Promise<MessageResponse>}
   */
  async logout() {
    const res = await http.post('/auth/logout')
    return res.data
  },

  /**
   * GET /api/auth/verify-email?token=...
   * @param {string} token - Token from the verification email link
   * @returns {Promise<MessageResponse>}
   */
  async verifyEmail(token) {
    const res = await http.get('/auth/verify-email', { params: { token } })
    return res.data
  },

  /**
   * POST /api/auth/resend-verification. The message is enumeration-safe.
   * @param {string} email
   * @returns {Promise<MessageResponse>}
   */
  async resendVerification(email) {
    const res = await http.post('/auth/resend-verification', { email })
    return res.data
  },

  /**
   * POST /api/auth/forgot-password. The message is enumeration-safe.
   * @param {string} email
   * @returns {Promise<MessageResponse>}
   */
  async forgotPassword(email) {
    const res = await http.post('/auth/forgot-password', { email })
    return res.data
  },

  /**
   * POST /api/auth/reset-password
   * @param {{ token: string, newPassword: string }} input
   * @returns {Promise<MessageResponse>}
   */
  async resetPassword({ token, newPassword }) {
    const res = await http.post('/auth/reset-password', { token, newPassword })
    return res.data
  },

  /**
   * PATCH /api/auth/change-password (requires JWT)
   * @param {{ currentPassword: string, newPassword: string }} input
   * @returns {Promise<MessageResponse>}
   */
  async changePassword({ currentPassword, newPassword }) {
    const res = await http.patch('/auth/change-password', { currentPassword, newPassword })
    return res.data
  }
}
