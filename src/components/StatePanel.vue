<script setup>
// Consistent loading / error / empty state panel.
// Usage:
//   <StatePanel :loading="loading" :error="error" :empty="items.length === 0"
//               @retry="reload">
//     ...default slot: the real content...
//   </StatePanel>
defineProps({
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  empty: { type: Boolean, default: false },
  loadingText: { type: String, default: 'Loading...' },
  emptyText: { type: String, default: 'No data to display.' },
  emptyIcon: { type: String, default: 'mdi-inbox-outline' }
})
defineEmits(['retry'])
</script>

<template>
  <div>
    <div v-if="loading" class="d-flex flex-column align-center justify-center py-10 text-medium-emphasis">
      <v-progress-circular indeterminate color="primary" size="36" class="mb-3" />
      <span>{{ loadingText }}</span>
    </div>

    <div v-else-if="error" class="d-flex flex-column align-center justify-center py-10 text-center">
      <v-icon icon="mdi-alert-circle-outline" color="error" size="40" class="mb-3" />
      <p class="text-body-1 mb-4">{{ error }}</p>
      <v-btn color="primary" variant="tonal" @click="$emit('retry')">Try again</v-btn>
    </div>

    <div v-else-if="empty" class="d-flex flex-column align-center justify-center py-10 text-center text-medium-emphasis">
      <v-icon :icon="emptyIcon" size="40" class="mb-3" />
      <span>{{ emptyText }}</span>
    </div>

    <slot v-else />
  </div>
</template>
