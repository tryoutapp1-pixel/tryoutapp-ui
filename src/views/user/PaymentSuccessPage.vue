<script setup>
// Feature 8 - Payment success page.
//
// Reached after a payment interaction resolved favorably OR when the
// subscription already reads PREMIUM. We do NOT assume success just because the
// user landed here: we refresh the authoritative subscription + transaction
// state on mount and display whatever the backend reports. If the webhook has
// not settled yet, we say so and offer a way to re-check / view the pending
// state, rather than claiming activation prematurely.
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSubscriptionStore } from '../../stores/subscription'
import PageHeader from '../../components/PageHeader.vue'
import StatePanel from '../../components/StatePanel.vue'
import PaymentStatus from '../../components/payment/PaymentStatus.vue'
import StatusChip from '../../components/StatusChip.vue'
import { formatDateOnly } from '../../lib/format'

const store = useSubscriptionStore()
const { activeInvoice, activeTransaction, subscription, isPremium } = storeToRefs(store)

const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    await store.refreshAfterPayment()
    if (activeInvoice.value) {
      await store.findTransactionByOrderId(activeInvoice.value.order_id)
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

// If Premium is active we celebrate; otherwise the payment is confirmed-ish but
// activation is still catching up, so we present it as pending-settlement.
const state = computed(() => (isPremium.value ? 'success' : 'pending'))
const title = computed(() =>
  isPremium.value ? 'Premium is active' : 'Payment received'
)
const message = computed(() =>
  isPremium.value
    ? 'Thanks for upgrading. You now have full access to Premium content.'
    : 'We have your payment. Premium usually activates within a short while once the payment provider confirms it. This page reflects your current status.'
)

onMounted(load)
</script>

<template>
  <div>
    <PageHeader title="Payment result" />

    <StatePanel :loading="loading" :error="error" @retry="load">
      <v-row justify="center">
        <v-col cols="12" md="7">
          <PaymentStatus
            :state="state"
            :title="title"
            :message="message"
            :invoice="activeInvoice"
            :transaction="activeTransaction"
          >
            <template #actions>
              <v-btn color="primary" variant="flat" :to="{ name: 'user-dashboard' }" prepend-icon="mdi-view-dashboard-outline">
                Go to dashboard
              </v-btn>
              <v-btn variant="tonal" :to="{ name: 'user-subscription' }" prepend-icon="mdi-crown-outline">
                View subscription
              </v-btn>
              <v-btn variant="text" :to="{ name: 'user-transactions' }" prepend-icon="mdi-receipt-text-outline">
                Transactions
              </v-btn>
            </template>
          </PaymentStatus>

          <v-card v-if="subscription" variant="tonal" class="pa-4 mt-4 text-center">
            <div class="d-flex align-center justify-center ga-2">
              <span class="text-medium-emphasis">Current plan</span>
              <StatusChip :value="subscription.status" />
            </div>
            <div v-if="isPremium && subscription.expired_at" class="text-caption text-medium-emphasis mt-1">
              Valid until {{ formatDateOnly(subscription.expired_at) }}
            </div>
          </v-card>
        </v-col>
      </v-row>
    </StatePanel>
  </div>
</template>
