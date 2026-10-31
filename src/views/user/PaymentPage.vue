<script setup>
// Feature 7 - Dedicated payment execution page.
//
// Separate from the checkout/invoice page. It shows the current order and runs
// the Midtrans Snap popup using the snap_token the backend returned. The Snap
// callback is treated as informational only: after it resolves we re-read the
// authoritative subscription + transaction state from the backend and then
// route to the matching outcome page. The backend webhook (not the client
// callback) is what actually activates Premium.
//
// Guards:
//  - If there is no active invoice (e.g. direct URL / refresh after the store
//    cleared), we send the user back to checkout to create one.
//  - If the subscription is already PREMIUM, we route to the success page.
//  - A single in-flight flag prevents repeated Snap opens / double submits.
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useSubscriptionStore } from '../../stores/subscription'
import { useUiStore } from '../../stores/ui'
import PageHeader from '../../components/PageHeader.vue'
import StatePanel from '../../components/StatePanel.vue'
import InvoiceSummary from '../../components/payment/InvoiceSummary.vue'
import { isSnapConfigured, payWithSnap } from '../../lib/midtrans'

const router = useRouter()
const store = useSubscriptionStore()
const uiStore = useUiStore()
const { activeInvoice, premiumPlan, isPremium } = storeToRefs(store)

const loading = ref(true)
const error = ref('')
const paying = ref(false)
const snapConfigured = isSnapConfigured()

const invoice = computed(() => activeInvoice.value)

async function load() {
  loading.value = true
  error.value = ''
  try {
    if (!premiumPlan.value) await store.fetchOffer()
    if (!invoice.value || !invoice.value.snap_token) {
      // No prepared order — restart the checkout flow.
      router.replace({ name: 'user-checkout' })
      return
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function pay() {
  if (paying.value || !invoice.value || !snapConfigured) return
  paying.value = true
  try {
    const { outcome } = await payWithSnap(invoice.value.snap_token)

    // Always re-read authoritative state; the webhook may or may not have run.
    await store.refreshAfterPayment()
    await store.findTransactionByOrderId(invoice.value.order_id)

    // Prefer the real subscription/transaction state over the Snap callback.
    if (isPremium.value) {
      router.replace({ name: 'user-payment-success' })
      return
    }
    const tx = store.activeTransaction
    const txStatus = tx && tx.status

    if (txStatus === 'PAID') {
      router.replace({ name: 'user-payment-success' })
    } else if (txStatus === 'FAILED' || txStatus === 'CANCELLED' || txStatus === 'EXPIRED') {
      router.replace({ name: 'user-payment-failed' })
    } else if (outcome === 'success') {
      // Snap said success but the webhook hasn't settled the record yet.
      router.replace({ name: 'user-payment-pending' })
    } else if (outcome === 'pending') {
      router.replace({ name: 'user-payment-pending' })
    } else if (outcome === 'error') {
      router.replace({ name: 'user-payment-failed' })
    } else {
      // 'close' with no terminal change: stay here; the invoice is reusable.
      uiStore.notify('Payment window closed. You can resume the payment anytime.', 'info')
    }
  } catch (e) {
    uiStore.error(e.message || 'The payment could not be started.')
  } finally {
    paying.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <PageHeader title="Payment" subtitle="Complete your Premium payment.">
      <template #actions>
        <v-btn variant="text" prepend-icon="mdi-arrow-left" :to="{ name: 'user-checkout' }">
          Back
        </v-btn>
      </template>
    </PageHeader>

    <StatePanel :loading="loading" :error="error" @retry="load">
      <v-row justify="center">
        <v-col cols="12" md="6">
          <InvoiceSummary :plan="premiumPlan" :invoice="invoice" />

          <v-alert
            v-if="!snapConfigured"
            type="warning"
            variant="tonal"
            class="mt-4 mb-0"
          >
            Online payment is not configured in this environment.
          </v-alert>

          <template v-else>
            <v-btn
              color="primary"
              variant="flat"
              size="large"
              block
              class="mt-4"
              prepend-icon="mdi-lock-check-outline"
              :loading="paying"
              :disabled="paying || !invoice"
              @click="pay"
            >
              Pay now
            </v-btn>
            <p class="text-caption text-medium-emphasis text-center mt-3 mb-0">
              Your Premium access activates once we receive confirmation from the
              payment provider. This can take a short while after you pay.
            </p>
          </template>
        </v-col>
      </v-row>
    </StatePanel>
  </div>
</template>
