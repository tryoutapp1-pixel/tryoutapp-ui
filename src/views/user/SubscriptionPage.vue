<script setup>
// FU2 (a/b/c) + FU6 - Subscription status, Premium offer, and payment.
//
// Flow:
//  - Show the authoritative subscription status (FU6). An effective Premium
//    subscription = status PREMIUM with a future expired_at (the backend already
//    computes this in GET /users/subscription).
//  - Show the Premium offer (FU2a) using backend-provided price/duration.
//  - "Upgrade" creates/reuses a PENDING transaction (FU2b) and opens the
//    Midtrans Snap popup (FU2c). The backend webhook is authoritative, so after
//    the popup resolves we re-read subscription + transactions and tell the user
//    the real state (which may still be pending).
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSubscriptionStore } from '../../stores/subscription'
import { useUiStore } from '../../stores/ui'
import PageHeader from '../../components/PageHeader.vue'
import StatePanel from '../../components/StatePanel.vue'
import StatusChip from '../../components/StatusChip.vue'
import { formatCurrency, formatDateOnly } from '../../lib/format'
import { isSnapConfigured, payWithSnap } from '../../lib/midtrans'

const store = useSubscriptionStore()
const uiStore = useUiStore()
const {
  offer,
  offerLoading,
  offerError,
  subscription,
  subscriptionLoading,
  subscriptionError,
  premiumPlan,
  isPremium,
  creatingPayment
} = storeToRefs(store)

const lastInvoice = ref(null) // { order_id, amount, status }
const paying = ref(false)

const loading = computed(() => offerLoading.value || subscriptionLoading.value)
const error = computed(() => subscriptionError.value || offerError.value)

const benefits = [
  'Access all Premium materials',
  'Unlock Premium Latihan and Try Out packages',
  'Track your Try Out progress over time'
]

function reload() {
  store.fetchSubscription()
  store.fetchOffer()
}

async function onUpgrade() {
  if (paying.value || creatingPayment.value) return
  if (!isSnapConfigured()) {
    uiStore.error('Online payment is not configured.')
    return
  }
  paying.value = true
  try {
    // FU2b - create/reuse the pending invoice.
    const invoice = await store.createPayment()
    // A null result means a creation is already in flight (concurrent-click
    // guard): quietly stop, do not show an error.
    if (invoice === null) return
    if (!invoice || !invoice.snap_token) {
      uiStore.error('Could not start the payment. Please try again.')
      return
    }
    lastInvoice.value = invoice

    // FU2c - open Snap. The result is informational only.
    const { outcome } = await payWithSnap(invoice.snap_token)

    // Always re-read authoritative state from the backend.
    await store.refreshAfterPayment()

    if (isPremium.value) {
      uiStore.success('Premium is now active. Enjoy!')
    } else if (outcome === 'success') {
      uiStore.notify('Payment received. Your Premium access will activate shortly.', 'info')
    } else if (outcome === 'pending') {
      uiStore.notify('Your payment is pending. We will update your status once it settles.', 'info')
    } else if (outcome === 'error') {
      uiStore.error('The payment could not be completed.')
    }
    // 'close' with no change: stay silent; the pending invoice remains reusable.
  } catch (e) {
    uiStore.error(e.message)
  } finally {
    paying.value = false
  }
}

onMounted(reload)
</script>

<template>
  <div>
    <PageHeader title="Subscription" subtitle="Your plan and Premium upgrade." />

    <StatePanel :loading="loading" :error="error" @retry="reload">
      <v-row>
        <!-- Current status (FU6) -->
        <v-col cols="12" md="5">
          <v-card variant="outlined" class="pa-6 h-100">
            <div class="d-flex align-center justify-space-between mb-4">
              <h2 class="text-h6 font-weight-bold mb-0">Current plan</h2>
              <StatusChip :value="subscription ? subscription.status : 'FREE'" />
            </div>

            <template v-if="isPremium">
              <v-row class="mb-1">
                <v-col cols="5" class="text-medium-emphasis">Since</v-col>
                <v-col cols="7">{{ formatDateOnly(subscription.started_at) }}</v-col>
              </v-row>
              <v-row>
                <v-col cols="5" class="text-medium-emphasis">Valid until</v-col>
                <v-col cols="7" class="font-weight-medium">
                  {{ formatDateOnly(subscription.expired_at) }}
                </v-col>
              </v-row>
              <v-alert type="success" variant="tonal" density="comfortable" class="mt-4 mb-0">
                You have full access to Premium content.
              </v-alert>
            </template>

            <template v-else>
              <p class="text-body-2 text-medium-emphasis">
                You are on the Free plan. Upgrade to unlock all Premium materials
                and assessment packages.
              </p>
            </template>
          </v-card>
        </v-col>

        <!-- Premium offer + upgrade (FU2a / FU2b / FU2c) -->
        <v-col cols="12" md="7">
          <v-card
            variant="outlined"
            class="pa-6 h-100 d-flex flex-column"
            :color="isPremium ? undefined : 'primary'"
            :style="isPremium ? '' : 'border-color: rgb(var(--v-theme-primary))'"
          >
            <div class="d-flex align-center ga-2 mb-2">
              <v-icon icon="mdi-crown-outline" color="amber" />
              <h2 class="text-h6 font-weight-bold mb-0">
                {{ premiumPlan ? premiumPlan.title : 'Tryout App Premium' }}
              </h2>
            </div>

            <div v-if="premiumPlan" class="mb-4">
              <span class="text-h4 font-weight-bold">
                {{ formatCurrency(premiumPlan.price, premiumPlan.currency) }}
              </span>
              <span class="text-body-2 text-medium-emphasis">
                / {{ premiumPlan.duration_description }}
              </span>
            </div>

            <v-list density="compact" class="bg-transparent mb-4 flex-grow-1">
              <v-list-item v-for="b in benefits" :key="b" class="px-0">
                <template #prepend>
                  <v-icon icon="mdi-check-circle-outline" color="success" size="20" />
                </template>
                <v-list-item-title class="text-body-2">{{ b }}</v-list-item-title>
              </v-list-item>
            </v-list>

            <v-btn
              v-if="!isPremium"
              color="primary"
              variant="flat"
              size="large"
              block
              prepend-icon="mdi-crown"
              :loading="paying || creatingPayment"
              :disabled="paying || creatingPayment"
              @click="onUpgrade"
            >
              Upgrade to Premium
            </v-btn>
            <v-btn
              v-else
              color="primary"
              variant="flat"
              size="large"
              block
              prepend-icon="mdi-crown"
              :loading="paying || creatingPayment"
              :disabled="paying || creatingPayment"
              @click="onUpgrade"
            >
              Extend Premium
            </v-btn>

            <p v-if="!isSnapConfigured()" class="text-caption text-error mt-2 mb-0">
              Online payment is not configured in this environment.
            </p>
          </v-card>
        </v-col>
      </v-row>

      <!-- Latest invoice summary (FU2b), shown after a payment attempt. -->
      <v-card v-if="lastInvoice" variant="outlined" class="pa-6 mt-6" max-width="560">
        <h3 class="text-subtitle-1 font-weight-bold mb-3">Latest invoice</h3>
        <v-row class="mb-1">
          <v-col cols="5" class="text-medium-emphasis">Order ID</v-col>
          <v-col cols="7" class="font-mono text-body-2">{{ lastInvoice.order_id }}</v-col>
        </v-row>
        <v-row class="mb-1">
          <v-col cols="5" class="text-medium-emphasis">Amount</v-col>
          <v-col cols="7">{{ formatCurrency(lastInvoice.amount, lastInvoice.currency) }}</v-col>
        </v-row>
        <v-row>
          <v-col cols="5" class="text-medium-emphasis">Status</v-col>
          <v-col cols="7"><StatusChip :value="lastInvoice.status" /></v-col>
        </v-row>
        <v-btn
          variant="text"
          to="/app/transactions"
          append-icon="mdi-arrow-right"
          class="mt-3 px-0"
        >
          View all transactions
        </v-btn>
      </v-card>
    </StatePanel>
  </div>
</template>

<style scoped>
.font-mono {
  font-family: monospace;
}
</style>
