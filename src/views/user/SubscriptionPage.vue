<script setup>
// FU2 (a/b/c) + FU6 - subscription status and Premium offer.
//
// Upgrading routes straight to the payment flow (Feature 7 -> 8):
//   /app/payment   : order summary + "Bayar sekarang" (creates the order and
//                    opens Midtrans Snap)
//   /app/payment/* : success / pending / failed outcomes
// The former /app/checkout step is disabled (see CheckoutPage.vue).
// The backend webhook remains authoritative for Premium activation; this page
// only shows the current (authoritative) subscription status.
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useSubscriptionStore } from '../../stores/subscription'
import { useUiStore } from '../../stores/ui'
import PageHeader from '../../components/PageHeader.vue'
import StatePanel from '../../components/StatePanel.vue'
import StatusChip from '../../components/StatusChip.vue'
import { formatCurrency, formatDateOnly } from '../../lib/format'
import { isSnapConfigured } from '../../lib/midtrans'

const router = useRouter()
const store = useSubscriptionStore()
const uiStore = useUiStore()
const {
  offerLoading,
  offerError,
  subscription,
  subscriptionLoading,
  subscriptionError,
  premiumPlan,
  isPremium
} = storeToRefs(store)

const loading = computed(() => offerLoading.value || subscriptionLoading.value)
/** First error to show; the subscription error takes precedence. */
const error = computed(() => subscriptionError.value || offerError.value)

/** @type {string[]} */
const benefits = [
  'Akses semua Materi Premium',
  'Buka paket Latihan dan Try Out Premium',
  'Pantau perkembangan skor Try Out lewat Progres Saya'
]

function reload() {
  store.fetchSubscription()
  store.fetchOffer()
}

function onUpgrade() {
  if (!isSnapConfigured()) {
    uiStore.error('Pembayaran online belum dikonfigurasi.')
    return
  }
  // Go straight to the payment page; the order is created there on "Bayar sekarang".
  router.push({ name: 'user-payment' })
}

onMounted(reload)
</script>

<template>
  <div>
    <PageHeader title="Langganan" subtitle="Paket kamu saat ini dan pilihan upgrade ke Premium." />

    <StatePanel :loading="loading" :error="error" @retry="reload">
      <v-row>
        <!-- Current status (FU6): quiet card -->
        <v-col cols="12" md="5">
          <v-card variant="flat" class="pa-5 pa-md-6 h-100">
            <div class="d-flex align-center justify-space-between ga-3 mb-5">
              <h2 class="text-title-medium mb-0">Paket saat ini</h2>
              <StatusChip :value="subscription ? subscription.status : 'FREE'" />
            </div>

            <template v-if="isPremium">
              <p class="text-headline-small mb-5">Premium</p>
              <div class="d-flex justify-space-between ga-4 py-3 border-b">
                <span class="text-body-medium text-medium-emphasis">Mulai</span>
                <span class="text-body-medium text-end">{{ formatDateOnly(subscription.started_at) }}</span>
              </div>
              <div class="d-flex justify-space-between ga-4 py-3">
                <span class="text-body-medium text-medium-emphasis">Berlaku sampai</span>
                <span class="text-title-small text-end">
                  {{ formatDateOnly(subscription.expired_at) }}
                </span>
              </div>
              <v-alert type="success" variant="tonal" density="comfortable" class="mt-4 mb-0">
                Kamu bisa membuka semua konten Premium.
              </v-alert>
            </template>

            <template v-else>
              <p class="text-headline-small mb-3">Gratis</p>
              <p class="text-body-medium text-medium-emphasis mb-0">
                Kamu sedang di paket Gratis. Upgrade untuk membuka semua Materi Premium
                serta paket Latihan dan Try Out Premium.
              </p>
            </template>
          </v-card>
        </v-col>

        <!-- Premium offer + upgrade (FU2a / FU2b / FU2c): the featured dark card -->
        <v-col cols="12" md="7">
          <v-card color="navy" class="rounded-xl pa-6 pa-md-8 h-100 d-flex flex-column">
            <div class="mb-4">
              <v-chip color="premium" variant="flat" size="small" prepend-icon="mdi-crown">Premium</v-chip>
            </div>
            <h2 class="text-headline-small mb-4">
              {{ premiumPlan ? premiumPlan.title : 'Tryout App Premium' }}
            </h2>

            <div v-if="premiumPlan" class="mb-6">
              <p class="mb-2">
                <span class="app-figure text-display-small">
                  <template v-if="formatCurrency(premiumPlan.price, premiumPlan.currency).startsWith('Rp')">
                    <span class="app-figure-unit">Rp</span>{{ formatCurrency(premiumPlan.price, premiumPlan.currency).slice(2).trim() }}
                  </template>
                  <template v-else>{{ formatCurrency(premiumPlan.price, premiumPlan.currency) }}</template>
                </span>
              </p>
              <span class="text-body-medium premium-offer__muted">
                / <span v-html="premiumPlan.duration_description" />
              </span>
            </div>

            <v-list density="compact" class="bg-transparent text-white pa-0 mb-6 flex-grow-1">
              <v-list-item v-for="b in benefits" :key="b" class="px-0" prepend-gap="12">
                <template #prepend>
                  <v-icon icon="mdi-check-circle" color="premium" size="22" />
                </template>
                <v-list-item-title class="text-body-large text-wrap">{{ b }}</v-list-item-title>
              </v-list-item>
            </v-list>

            <v-btn
              color="premium"
              variant="flat"
              size="large"
              block
              prepend-icon="mdi-crown"
              @click="onUpgrade"
            >
              {{ isPremium ? 'Perpanjang Premium' : 'Upgrade ke Premium' }}
            </v-btn>

            <p
              v-if="!isSnapConfigured()"
              class="d-flex align-center justify-center ga-2 text-body-small premium-offer__muted mt-3 mb-0"
            >
              <v-icon icon="mdi-alert-circle-outline" color="premium" size="16" />
              Pembayaran online belum dikonfigurasi di lingkungan ini.
            </p>
          </v-card>
        </v-col>
      </v-row>
    </StatePanel>
  </div>
</template>

<style scoped>
.premium-offer__muted {
  color: rgb(255 255 255 / 0.78);
}
</style>
