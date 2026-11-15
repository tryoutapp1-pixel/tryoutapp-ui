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
  <header class="d-flex flex-wrap align-end justify-space-between ga-4 mb-6 mb-md-8">
    <div class="page-header__text">
      <h1 class="text-headline-medium mb-1">{{ title }}</h1>
      <p v-if="subtitle" class="text-body-large text-medium-emphasis mb-0">{{ subtitle }}</p>
    </div>
    <div class="d-flex flex-wrap align-center ga-2">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped>
.page-header__text {
  max-width: 62ch;
}
</style>
