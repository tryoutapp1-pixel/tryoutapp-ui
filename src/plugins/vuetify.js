// Vuetify setup. No vite-plugin-vuetify is installed, so components and
// directives are registered explicitly and styles imported directly.

import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

export const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi'
  },
  defaults: {
    VBtn: { rounded: 'lg' },
    VCard: { rounded: 'lg' },
    VTextField: { variant: 'outlined', density: 'comfortable' }
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#2563EB',
          secondary: '#475569',
          error: '#DC2626',
          success: '#16A34A',
          warning: '#D97706',
          info: '#0EA5E9'
        }
      }
    }
  }
})
