import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

export const vuetify = createVuetify({
  components,
  theme: {
    defaultTheme: 'tryoutLight',
    themes: {
      tryoutLight: {
        dark: false,
        colors: {
          primary: '#285f9e',
          secondary: '#187c72',
          surface: '#ffffff',
          background: '#f5f7fb',
          error: '#b42318',
          success: '#16794b',
        },
      },
    },
  },
  defaults: {
    VBtn: { rounded: 'lg', elevation: 0 },
    VTextField: { variant: 'outlined', density: 'comfortable', rounded: 'lg' },
    VCard: { rounded: 'xl' },
  },
})
