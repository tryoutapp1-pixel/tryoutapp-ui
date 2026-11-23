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
  { title: 'Materi', text: 'Pelajari materi per topik sebelum mengerjakan soal.', to: '/app/materials', icon: 'mdi-book-open-page-variant-outline' },
  { title: 'Latihan', text: 'Kerjakan paket soal tanpa batas waktu.', to: '/app/latihan', icon: 'mdi-pencil-outline' },
  { title: 'Try Out', text: 'Uji kesiapanmu dengan paket soal berwaktu.', to: '/app/tryout', icon: 'mdi-timer-outline' },
  { title: 'Progres Saya', text: 'Pantau perkembangan skor Try Out kamu.', to: '/app/tryout/statistics', icon: 'mdi-chart-line' },
  { title: 'Langganan', text: 'Lihat paketmu dan upgrade ke Premium.', to: '/app/subscription', icon: 'mdi-crown-outline' },
  { title: 'Transaksi', text: 'Lihat riwayat pembayaranmu.', to: '/app/transactions', icon: 'mdi-receipt-text-outline' }
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
    <PageHeader :title="`Halo, ${user ? user.name : 'kamu'}`" subtitle="Mau belajar apa hari ini? Lanjutkan dari salah satu menu di bawah.">
      <template #actions>
        <div v-if="subscription" class="d-flex align-center ga-2">
          <span class="text-body-medium text-medium-emphasis">Paket kamu</span>
          <StatusChip :value="subscription.status" />
        </div>
      </template>
    </PageHeader>

    <!-- The first three cards (Materi, Latihan, Try Out) are the learning
         entries and get the large layout; the rest are quieter rows. -->
    <v-row>
      <v-col
        v-for="card in cards"
        :key="card.to"
        cols="12"
        :sm="cards.indexOf(card) < 3 ? 4 : 12"
        md="4"
      >
        <v-card v-if="cards.indexOf(card) < 3" :to="card.to" class="pa-5 pa-md-6 h-100" hover>
          <v-avatar color="surface-light" rounded="lg" size="52" class="mb-5">
            <v-icon :icon="card.icon" color="primary" size="28" />
          </v-avatar>
          <h2 class="text-title-large mb-1">{{ card.title }}</h2>
          <p class="text-body-medium text-medium-emphasis mb-0">{{ card.text }}</p>
        </v-card>

        <v-card v-else :to="card.to" variant="flat" class="pa-4 h-100" hover>
          <div class="d-flex align-center ga-4">
            <v-avatar color="surface-light" rounded="lg" size="44">
              <v-icon :icon="card.icon" color="primary" size="22" />
            </v-avatar>
            <div class="flex-grow-1 dash-row__text">
              <div class="d-flex flex-wrap align-center ga-2">
                <h2 class="text-title-medium mb-0">{{ card.title }}</h2>
                <v-chip
                  v-if="card.to === '/app/tryout/statistics' && subscription && subscription.status === 'FREE'"
                  size="x-small"
                  color="premium-ink"
                  variant="tonal"
                  prepend-icon="mdi-crown-outline"
                >
                  Premium
                </v-chip>
              </div>
              <p class="text-body-medium text-medium-emphasis mb-0">{{ card.text }}</p>
            </div>
            <v-icon icon="mdi-chevron-right" class="text-medium-emphasis" aria-hidden="true" />
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
/* Lets the text column shrink so long descriptions wrap instead of
   pushing the chevron out of the card. */
.dash-row__text {
  min-width: 0;
}
</style>
