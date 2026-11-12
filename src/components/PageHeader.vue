<script setup>
// Reusable page header with title, optional subtitle, and an actions slot.

/**
 * @typedef {Object} PageHeaderProps
 * @property {string} title - Page heading
 * @property {string} [subtitle] - Optional line under the heading
 */

/** @type {PageHeaderProps} */
const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' }
})
</script>

<template>
  <div class="d-flex flex-wrap align-center justify-space-between gap-4 mb-6">
    <div>
      <h1 class="text-h5 font-weight-bold mb-1">{{ title }}</h1>
      <p v-if="subtitle" class="text-body-2 text-medium-emphasis mb-0">{{ subtitle }}</p>
    </div>
    <div class="d-flex align-center ga-2">
      <slot name="actions" />
    </div>
  </div>
</template>
