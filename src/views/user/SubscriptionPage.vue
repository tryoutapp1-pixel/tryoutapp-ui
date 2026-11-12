<script setup>
// FU2 (a/b/c) + FU6 - subscription status and Premium offer.
//
// Upgrading routes to the dedicated checkout flow (Feature 6 -> 7 -> 8):
//   /app/checkout  : invoice summary + payment-method selection
//   /app/payment   : Midtrans Snap execution
//   /app/payment/* : success / pending / failed outcomes
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
  'Access all Premium materials',
  'Unlock Premium Latihan and Try Out packages',
  'Track your Try Out progress over time'
]

function reload() {
  store.fetchSubscription()
  store.fetchOffer()
}

function onUpgrade() {
  if (!isSnapConfigured()) {
    uiStore.error('Online payment is not configured.')
    return
  }
  // Go to the purchase-preparation (checkout) stage.
  router.push({ name: 'user-checkout' })
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
              color="primary"
              variant="flat"
              size="large"
              block
              prepend-icon="mdi-crown"
              @click="onUpgrade"
            >
              {{ isPremium ? 'Extend Premium' : 'Upgrade to Premium' }}
            </v-btn>

            <p v-if="!isSnapConfigured()" class="text-caption text-error mt-2 mb-0">
              Online payment is not configured in this environment.
            </p>
          </v-card>
        </v-col>
      </v-row>
    </StatePanel>
  </div>
</template>

<style scoped>
.font-mono {
  font-family: monospace;
}
</style>
