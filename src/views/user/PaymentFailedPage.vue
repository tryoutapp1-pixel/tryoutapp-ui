<script setup>
// Feature 8 - payment failed page.
//
// Shown when the payment did not go through (Snap error, or the transaction
// record is FAILED/CANCELLED/EXPIRED). It shows the available failure details
// and offers a retry that returns the user to the checkout flow. It does NOT
// create a new payment automatically. The user must choose to retry, and the
// backend then reuses or re-creates the invoice idempotently.
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useSubscriptionStore } from '../../stores/subscription'
import PageHeader from '../../components/PageHeader.vue'
import StatePanel from '../../components/StatePanel.vue'
import PaymentStatus from '../../components/payment/PaymentStatus.vue'

const router = useRouter()
const store = useSubscriptionStore()
const { activeInvoice, activeTransaction } = storeToRefs(store)

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

// Retry: drop the stale invoice reference and go back to checkout, which will
// create/reuse a PENDING transaction. We never silently re-charge.
function retry() {
  store.clearActiveInvoice()
  router.push({ name: 'user-checkout' })
}

const message = computed(
  () =>
    'Your payment was not completed. No charge was applied for a failed or cancelled payment. You can try again whenever you are ready.'
)

onMounted(load)
</script>

<template>
  <div>
    <PageHeader title="Payment failed" />

    <StatePanel :loading="loading" :error="error" @retry="load">
      <v-row justify="center">
        <v-col cols="12" md="7">
          <PaymentStatus
            state="failed"
            title="Payment was not completed"
            :message="message"
            :invoice="activeInvoice"
            :transaction="activeTransaction"
          >
            <template #actions>
              <v-btn color="primary" variant="flat" prepend-icon="mdi-refresh" @click="retry">
                Try again
              </v-btn>
              <v-btn variant="tonal" :to="{ name: 'user-transactions' }" prepend-icon="mdi-receipt-text-outline">
                Transactions
              </v-btn>
              <v-btn variant="text" :to="{ name: 'user-subscription' }" prepend-icon="mdi-crown-outline">
                Subscription
              </v-btn>
            </template>
          </PaymentStatus>
        </v-col>
      </v-row>
    </StatePanel>
  </div>
</template>
