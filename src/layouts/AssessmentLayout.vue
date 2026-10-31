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
// AttemptPage's onBeforeRouteLeave guard without resetting the attempt store —
// saved answers and the server-tracked timer are preserved. The layout is
// responsive (fluid container) so it works on desktop and mobile.
import { RouterView } from 'vue-router'
</script>

<template>
  <v-app>
    <v-app-bar flat border density="comfortable">
      <v-container class="d-flex align-center py-0">
        <div class="d-flex align-center text-primary">
          <v-icon icon="mdi-school-outline" class="me-2" />
          <span class="text-subtitle-1 font-weight-bold">Tryout App</span>
        </div>
        <v-spacer />
        <v-chip size="small" variant="tonal" color="secondary" prepend-icon="mdi-pencil-ruler">
          Assessment in progress
        </v-chip>
      </v-container>
    </v-app-bar>

    <v-main>
      <v-container class="py-4 py-md-6">
        <RouterView />
      </v-container>
    </v-main>
  </v-app>
</template>
