<script setup>
// Learner dashboard. Greets the user from shared profile and auth state and
// links to the main learner areas. Subscription status loads on mount and
// shows as a plan badge in the header.
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../../stores/auth'
import { useProfileStore } from '../../stores/profile'
import { useSubscriptionStore } from '../../stores/subscription'
import PageHeader from '../../components/PageHeader.vue'
import StatusChip from '../../components/StatusChip.vue'

const authStore = useAuthStore()
const profileStore = useProfileStore()
const subscriptionStore = useSubscriptionStore()
const { user } = storeToRefs(authStore)
const { subscription } = storeToRefs(subscriptionStore)

/**
 * @typedef {Object} DashboardCard
 * @property {string} title
 * @property {string} text - One-line description
 * @property {string} to - Route path; also used as the list key
 * @property {string} icon - MDI icon name
 */

/** @type {DashboardCard[]} */
const cards = [
  { title: 'Materials', text: 'Read released learning materials.', to: '/app/materials', icon: 'mdi-book-open-page-variant-outline' },
  { title: 'Latihan', text: 'Untimed practice assessments.', to: '/app/latihan', icon: 'mdi-pencil-outline' },
  { title: 'Try Out', text: 'Timed try out assessments.', to: '/app/tryout', icon: 'mdi-timer-outline' },
  { title: 'My Progress', text: 'Track your Try Out scores.', to: '/app/tryout/statistics', icon: 'mdi-chart-line' },
  { title: 'Subscription', text: 'View your plan and go Premium.', to: '/app/subscription', icon: 'mdi-crown-outline' },
  { title: 'Transactions', text: 'Your payment history.', to: '/app/transactions', icon: 'mdi-receipt-text-outline' }
]

onMounted(() => {
  // Warm the profile store so the menu/name is fresh.
  profileStore.loadProfile().catch(() => {})
  // Show the current plan badge; subscription store is authoritative.
  subscriptionStore.fetchSubscription().catch(() => {})
})
</script>

<template>
  <div>
    <PageHeader :title="`Hi, ${user ? user.name : 'there'}`" subtitle="Pick up where you left off.">
      <template #actions>
        <div v-if="subscription" class="d-flex align-center ga-2">
          <span class="text-caption text-medium-emphasis">Plan</span>
          <StatusChip :value="subscription.status" />
        </div>
      </template>
    </PageHeader>
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
