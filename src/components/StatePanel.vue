<script setup>
// Consistent loading / error / empty state panel.
// Usage:
//   <StatePanel :loading="loading" :error="error" :empty="items.length === 0"
//               @retry="reload">
//     ...default slot: the real content...
//   </StatePanel>

/**
 * @typedef {Object} StatePanelProps
 * @property {boolean} [loading] - Shows the loading state
 * @property {string} [error] - Shows the error state with a retry button
 * @property {boolean} [empty] - Shows the empty state
 * @property {string} [loadingText]
 * @property {string} [emptyText]
 * @property {string} [emptyIcon] - MDI icon for the empty state
 */

/** @type {StatePanelProps} */
const props = defineProps({
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  empty: { type: Boolean, default: false },
  loadingText: { type: String, default: 'Memuat...' },
  emptyText: { type: String, default: 'Belum ada data untuk ditampilkan.' },
  emptyIcon: { type: String, default: 'mdi-inbox-outline' }
})

/**
 * @typedef {Object} StatePanelEmits
 * @property {() => void} retry - The user pressed Try again
 */
defineEmits(['retry'])
</script>

<template>
  <div>
    <div
      v-if="loading"
      class="d-flex flex-column align-center justify-center py-12 text-medium-emphasis"
      role="status"
      aria-live="polite"
    >
      <v-progress-circular indeterminate size="36" width="3" class="mb-4" />
      <span class="text-body-medium">{{ loadingText }}</span>
    </div>

    <div
      v-else-if="error"
      class="d-flex flex-column align-center justify-center text-center py-12 px-6 bg-surface rounded-xl border"
      role="alert"
    >
      <v-avatar color="error" variant="tonal" size="56" class="mb-4">
        <v-icon icon="mdi-alert-circle-outline" size="28" />
      </v-avatar>
      <p class="text-title-medium mb-1">Data belum bisa dimuat</p>
      <p class="text-body-medium text-medium-emphasis mb-5 state-panel__text">{{ error }}</p>
      <v-btn color="primary" prepend-icon="mdi-refresh" @click="$emit('retry')">Coba lagi</v-btn>
    </div>

    <div
      v-else-if="empty"
      class="d-flex flex-column align-center justify-center text-center py-12 px-6 bg-surface rounded-xl border border-dashed"
    >
      <v-avatar color="surface-light" size="56" class="mb-4">
        <v-icon :icon="emptyIcon" color="primary" size="28" />
      </v-avatar>
      <p class="text-body-large text-medium-emphasis mb-0 state-panel__text">{{ emptyText }}</p>
    </div>

    <slot v-else />
  </div>
</template>

<style scoped>
.state-panel__text {
  max-width: 48ch;
}
</style>
