// UI store (Pinia Option Store) for app-wide ephemeral notifications.
// Keeps the global snackbar state in one place so any action/component can
// surface a success or error message consistently.

import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', {
  state: () => ({
    snackbar: {
      show: false,
      message: '',
      color: 'info',
      timeout: 4000
    }
  }),

  actions: {
    notify(message, color = 'info', timeout = 4000) {
      this.snackbar = { show: true, message, color, timeout }
    },
    success(message) {
      this.notify(message, 'success')
    },
    error(message) {
      this.notify(message, 'error')
    },
    dismiss() {
      this.snackbar.show = false
    }
  }
})
