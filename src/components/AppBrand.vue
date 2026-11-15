<script setup>
// Brand mark: a filled LJK answer bubble next to the wordmark. Purely
// presentational; wrap it in a link where it should navigate.

/**
 * @typedef {Object} AppBrandProps
 * @property {string} [tag] - Optional small tag after the wordmark, e.g. "Admin"
 * @property {boolean} [onDark] - Light wordmark for dark backgrounds
 */

defineProps({
  tag: { type: String, default: '' },
  onDark: { type: Boolean, default: false }
})
</script>

<template>
  <span class="app-brand d-inline-flex align-center ga-2" :class="{ 'app-brand--on-dark': onDark }">
    <span class="app-bubble app-bubble--filled app-brand__mark" aria-hidden="true">T</span>
    <span class="app-brand__word">Tryout App</span>
    <v-chip v-if="tag" size="x-small" color="primary" variant="tonal" class="ms-1">{{ tag }}</v-chip>
  </span>
</template>

<style scoped>
.app-brand__mark {
  --app-bubble-size: 30px;
  font-size: 0.9375rem;
  font-weight: 760;
  box-shadow: inset 0 0 0 3px rgb(255 255 255 / 0.22);
}

.app-brand__word {
  font-size: 1.125rem;
  font-weight: 740;
  letter-spacing: -0.02em;
  color: rgb(var(--app-navy));
  white-space: nowrap;
}

.app-brand--on-dark .app-brand__word {
  color: #fff;
}
</style>
