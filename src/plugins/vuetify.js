// Vuetify setup. No vite-plugin-vuetify is installed, so components and
// directives are registered explicitly and styles imported directly.
// Design tokens and global component overrides live in src/style.css; see
// docs/design-system.md for how the theme is meant to be used.

import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { id, en } from 'vuetify/locale'

const NAVY = '#0B2540'

export const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi'
  },
  // Built-in component text (no-data, pagination labels, file counters) in Indonesian.
  locale: {
    locale: 'id',
    fallback: 'en',
    messages: { id, en }
  },
  defaults: {
    VAppBar: { flat: true },
    VBtn: { variant: 'flat' },
    VChip: { rounded: 'pill' },
    VTextField: { variant: 'outlined', density: 'comfortable', color: 'primary' },
    VTextarea: { variant: 'outlined', density: 'comfortable', color: 'primary' },
    VSelect: { variant: 'outlined', density: 'comfortable', color: 'primary' },
    VAutocomplete: { variant: 'outlined', density: 'comfortable', color: 'primary' },
    VCombobox: { variant: 'outlined', density: 'comfortable', color: 'primary' },
    VFileInput: { variant: 'outlined', density: 'comfortable', color: 'primary' },
    VCheckbox: { color: 'primary' },
    VRadioGroup: { color: 'primary' },
    VSwitch: { color: 'primary', inset: true },
    VAlert: { variant: 'tonal', rounded: 'lg' },
    VTabs: { color: 'primary' },
    VProgressLinear: { rounded: true, color: 'primary' },
    VProgressCircular: { color: 'primary' },
    VTooltip: { location: 'top' },
    VDataTable: { hover: true },
    VNavigationDrawer: {
      VList: {
        VListItem: { rounded: 'pill', color: 'primary' }
      }
    }
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          background: '#F2F7FC',
          surface: '#FFFFFF',
          'surface-bright': '#FFFFFF',
          'surface-light': '#E8F1FA',
          'surface-variant': NAVY,
          'on-surface-variant': '#FFFFFF',
          primary: '#0A6CBF',
          'primary-darken-1': '#08589C',
          secondary: NAVY,
          'secondary-darken-1': '#06182B',
          accent: '#1FB5E0',
          navy: NAVY,
          premium: '#F5B83D',
          'on-premium': NAVY,
          'premium-ink': '#8A5A00',
          error: '#C93A30',
          success: '#12805C',
          warning: '#A15F00',
          info: '#0E7490'
        },
        variables: {
          'border-color': '#0A3D6B',
          'border-opacity': 0.14,
          'shadow-color': NAVY,
          'medium-emphasis-opacity': 0.68,
          'hover-opacity': 0.05,
          'theme-on-light': NAVY,
          'theme-code': '#E8F1FA',
          'theme-on-code': NAVY
        }
      }
    }
  }
})
