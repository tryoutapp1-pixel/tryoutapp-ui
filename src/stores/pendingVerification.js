// Pending-verification store (Pinia Option Store).
//
// Carries the email of a returning, still-unverified signup from SignupPage to
// VerifyEmailPage without putting it in the URL. It is in-memory only, so a
// refresh or closed tab drops it. VerifyEmailPage clears it when the flow ends
// so the value cannot leak into unrelated code.

import { defineStore } from 'pinia'

export const usePendingVerificationStore = defineStore('pendingVerification', {
  state: () => ({
    /** @type {string} */
    email: ''
  }),

  getters: {
    /** @returns {boolean} */
    hasPending: (state) => state.email !== ''
  },

  actions: {
    /** @param {string} email */
    set(email) {
      this.email = typeof email === 'string' ? email.trim() : ''
    },
    clear() {
      this.email = ''
    }
  }
})
