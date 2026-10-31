<script setup>
// Premium upsell shown where a Free user hits Premium-only content
// (Feature 3 / Feature 4 explanations). Presentation only — it never grants
// access. Backend authorization remains the sole authority; this just routes
// the user to the subscription page.
defineProps({
  title: { type: String, default: 'Premium feature' },
  message: {
    type: String,
    default: 'Upgrade to Premium to unlock this content.'
  }
})
</script>

<template>
  <v-card variant="tonal" color="amber" class="pa-6 text-center">
    <v-icon icon="mdi-crown-outline" color="amber-darken-2" size="44" class="mb-3" />
    <h3 class="text-h6 font-weight-bold mb-2">{{ title }}</h3>
    <p class="text-body-2 mb-4">{{ message }}</p>
    <v-btn color="primary" variant="flat" to="/app/subscription" prepend-icon="mdi-crown">
      Go Premium
    </v-btn>
  </v-card>
</template>
