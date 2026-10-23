<script setup>
// Learner dashboard. Greets the user from shared profile/auth state and links
// to the main learner areas. Subscription status is loaded lazily and shown as
// a badge; the full subscription page is a later feature stage.
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../../stores/auth'
import { useProfileStore } from '../../stores/profile'
import PageHeader from '../../components/PageHeader.vue'

const authStore = useAuthStore()
const profileStore = useProfileStore()
const { user } = storeToRefs(authStore)

const cards = [
  { title: 'Materials', text: 'Read released learning materials.', to: '/app/materials', icon: 'mdi-book-open-page-variant-outline' },
  { title: 'Latihan', text: 'Untimed practice assessments.', to: '/app/latihan', icon: 'mdi-pencil-outline' },
  { title: 'Try Out', text: 'Timed try out assessments.', to: '/app/tryout', icon: 'mdi-timer-outline' },
  { title: 'Subscription', text: 'View your plan and go Premium.', to: '/app/subscription', icon: 'mdi-crown-outline' }
]

onMounted(() => {
  // Warm the profile store so the menu/name is fresh.
  profileStore.loadProfile().catch(() => {})
})
</script>

<template>
  <div>
    <PageHeader :title="`Hi, ${user ? user.name : 'there'}`" subtitle="Pick up where you left off." />
    <v-row>
      <v-col v-for="card in cards" :key="card.to" cols="12" sm="6" md="3">
        <v-card :to="card.to" class="pa-5 h-100" hover>
          <v-icon :icon="card.icon" color="primary" size="32" class="mb-3" />
          <h3 class="text-subtitle-1 font-weight-bold mb-1">{{ card.title }}</h3>
          <p class="text-body-2 text-medium-emphasis mb-0">{{ card.text }}</p>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
