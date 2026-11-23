<script setup>
// Small status badge with consistent colors and Indonesian labels for the
// enums used across the app (user status, subscription, release state,
// access type, transaction status, assessment type, and material section).
// Only the displayed label is translated; the enum value itself is untouched.
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
  UNRELEASED: 'secondary',
  FREE: 'secondary',
  PREMIUM: 'premium-ink',
  ADMIN: 'primary',
  USER: 'secondary',
  TRYOUT: 'primary',
  LATIHAN: 'info',
  PAID: 'success',
  PENDING: 'warning',
  FAILED: 'error',
  EXPIRED: 'error',
  CANCELLED: 'secondary',
  COMPLETED: 'success',
  IN_PROGRESS: 'info',
  TWK: 'primary',
  TIU: 'info',
  TKP: 'premium-ink'
}

/** @type {Record<string, string>} */
const LABELS = {
  ACTIVE: 'Aktif',
  PENDING_VERIFICATION: 'Menunggu verifikasi',
  SUSPENDED: 'Ditangguhkan',
  RELEASED: 'Terbit',
  UNRELEASED: 'Belum terbit',
  FREE: 'Gratis',
  PREMIUM: 'Premium',
  ADMIN: 'Admin',
  USER: 'Pengguna',
  TRYOUT: 'Try Out',
  LATIHAN: 'Latihan',
  PAID: 'Lunas',
  PENDING: 'Menunggu',
  FAILED: 'Gagal',
  EXPIRED: 'Kedaluwarsa',
  CANCELLED: 'Dibatalkan',
  COMPLETED: 'Selesai',
  IN_PROGRESS: 'Berlangsung'
}

const key = computed(() => String(props.value).toUpperCase())
const label = computed(() => LABELS[key.value] || String(props.value).replaceAll('_', ' '))
const color = computed(() => COLORS[key.value] || 'secondary')
</script>

<template>
  <v-chip size="small" :color="color" variant="tonal">{{ label }}</v-chip>
</template>
