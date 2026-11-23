<script setup>
// Premium upsell shown where a Free user hits Premium-only content
// (Feature 3 / Feature 4 explanations). Presentation only; it never grants
// access. Backend authorization remains the sole authority; this just routes
// the user to the subscription page.

/**
 * @typedef {Object} PremiumNoticeProps
 * @property {string} [title] - Heading text
 * @property {string} [message] - Body text
 */

/** @type {PremiumNoticeProps} */
const props = defineProps({
  title: { type: String, default: 'Fitur ini khusus Premium' },
  message: {
    type: String,
    default: 'Upgrade ke Premium untuk membuka konten ini.'
  }
})
</script>

<template>
  <v-card variant="flat" color="surface-light" class="pa-6 pa-md-8 text-center rounded-xl">
    <v-avatar color="surface" size="56" class="mb-4">
      <v-icon icon="mdi-crown" color="premium-ink" size="28" />
    </v-avatar>
    <h3 class="text-title-large mb-2">{{ title }}</h3>
    <p class="text-body-medium text-medium-emphasis mb-5 mx-auto premium-notice__text">{{ message }}</p>
    <v-btn color="primary" variant="flat" to="/app/subscription" prepend-icon="mdi-crown">
      Lihat paket Premium
    </v-btn>
  </v-card>
</template>

<style scoped>
.premium-notice__text {
  max-width: 48ch;
}
</style>
