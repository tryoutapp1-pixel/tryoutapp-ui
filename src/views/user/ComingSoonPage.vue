<script setup>
// Honest placeholder for learner feature areas not yet implemented in this
// stage (materials, latihan, tryout, subscription, transactions). These are
// intentionally not wired to the API yet; see the project report for the
// incremental plan. This avoids faking "done" features with mock data.
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import PageHeader from '../../components/PageHeader.vue'

const route = useRoute()
const title = computed(() => route.meta.title || 'Coming soon')
</script>

<template>
  <div>
    <PageHeader :title="title" subtitle="This feature is planned for an upcoming stage." />
    <v-card class="pa-10 text-center text-medium-emphasis">
      <v-icon icon="mdi-progress-wrench" size="48" class="mb-3" />
      <p class="text-body-1 mb-0">
        The backend API for this area is available. The user-facing screen will
        be built in a later increment, after Auth and Profile are verified.
      </p>
    </v-card>
  </div>
</template>
