<script setup>
// Distraction-free layout for an ACTIVE assessment attempt (Feature 5).
//
// Used only while a Latihan/Try Out attempt is being worked on. It deliberately
// omits the standard UserLayout navigation drawer and account app-bar so the
// learner focuses on the questions. A single slim top bar carries the brand;
// the attempt page body owns the essential controls (Try Out timer, question
// navigator, submit, and the exit/back control with its leave guard).
//
// Exit is handled inside the attempt page, so leaving routes back through the
// AttemptPage's onBeforeRouteLeave guard without resetting the attempt store;
// saved answers and the server-tracked timer are preserved. The layout is
// responsive so it works on desktop and mobile.
import { RouterView } from 'vue-router'
import AppBrand from '../components/AppBrand.vue'
</script>

<template>
  <v-app>
    <v-app-bar color="surface" height="64" class="assessment-bar">
      <div class="app-content app-content--wide d-flex align-center px-4 px-md-8">
        <AppBrand />
        <v-spacer />
        <v-chip size="small" variant="tonal" color="primary" prepend-icon="mdi-pencil-outline">
          Sedang mengerjakan
        </v-chip>
      </div>
    </v-app-bar>

    <v-main>
      <div class="app-content app-content--wide px-4 px-md-8 py-4 py-md-6">
        <RouterView />
      </div>
    </v-main>
  </v-app>
</template>

<style scoped>
.assessment-bar {
  border-bottom: 1px solid rgb(var(--app-line));
}

.app-content--wide {
  max-width: 1280px;
}
</style>
