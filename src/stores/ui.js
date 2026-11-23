// UI store (Pinia Option Store) for app-wide ephemeral notifications.
// Keeps the global snackbar state in one place so any action/component can
// surface a success or error message consistently.

import { defineStore } from 'pinia'

/**
 * @typedef {Object} SnackbarState
 * @property {boolean} show
 * @property {string} message
 * @property {string} color - Vuetify color name, e.g. 'info', 'success', 'error'
 * @property {number} timeout - Milliseconds before the snackbar hides
 */

export const useUiStore = defineStore('ui', {
  state: () => ({
    /** @type {SnackbarState} */
    snackbar: {
      show: false,
      message: '',
      color: 'info',
      timeout: 4000
    }
  }),

  actions: {
    /**
     * @param {string} message
     * @param {string} [color='info']
     * @param {number} [timeout=4000] - Milliseconds
     */
    notify(message, color = 'info', timeout = 4000) {
      this.snackbar = { show: true, message, color, timeout }
    },
    /** @param {string} message */
    success(message) {
      this.notify(message, 'success')
    },
    /** @param {string} message */
    error(message) {
      this.notify(message, 'error')
    },
    dismiss() {
      this.snackbar.show = false
    }
  }
})
