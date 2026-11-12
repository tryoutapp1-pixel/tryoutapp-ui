<script setup>
// Small status badge with consistent colors for the enums used across the app
// (user status, subscription, release state, access type, transaction status,
// assessment type, and material section).
import { computed } from 'vue'

/**
 * @typedef {Object} StatusChipProps
 * @property {string|number|boolean} [value] - Enum value, e.g. 'PREMIUM'
 */

/** @type {StatusChipProps} */
const props = defineProps({
  value: { type: [String, Number, Boolean], default: '' }
})

/** @type {Record<string, string>} */
const COLORS = {
  ACTIVE: 'success',
  PENDING_VERIFICATION: 'warning',
  SUSPENDED: 'error',
  RELEASED: 'success',
  UNRELEASED: 'grey',
  FREE: 'grey',
  PREMIUM: 'primary',
  ADMIN: 'primary',
  USER: 'secondary',
  TRYOUT: 'info',
  LATIHAN: 'secondary',
  PAID: 'success',
  PENDING: 'warning',
  FAILED: 'error',
  EXPIRED: 'error',
  CANCELLED: 'grey',
  COMPLETED: 'success',
  IN_PROGRESS: 'info',
  TWK: 'deep-purple',
  TIU: 'teal',
  TKP: 'orange-darken-2'
}

const label = computed(() => String(props.value).replaceAll('_', ' '))
const color = computed(() => COLORS[String(props.value).toUpperCase()] || 'grey')
</script>

<template>
  <v-chip size="small" :color="color" variant="tonal">{{ label }}</v-chip>
</template>
