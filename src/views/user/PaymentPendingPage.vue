<script setup>
// Feature 8 - pending payment page.
//
// Shown when the payment is still being processed (Snap reported pending, or
// the record has not settled yet). It never shows Premium as active. The user
// can re-check the status, which re-reads the authoritative transaction +
// subscription state from the backend. If a re-check finds the payment settled,
// we move them to the success page.
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useSubscriptionStore } from '../../stores/subscription'
import { useUiStore } from '../../stores/ui'
import PageHeader from '../../components/PageHeader.vue'
import StatePanel from '../../components/StatePanel.vue'
import PaymentStatus from '../../components/payment/PaymentStatus.vue'

const router = useRouter()
const store = useSubscriptionStore()
const uiStore = useUiStore()
const { activeInvoice, activeTransaction, isPremium } = storeToRefs(store)

const loading = ref(true)
const error = ref('')
const checking = ref(false)

/** Re-reads the subscription and, when an invoice is known, its transaction. */
async function refresh() {
  await store.refreshAfterPayment()
  if (activeInvoice.value) {
    await store.findTransactionByOrderId(activeInvoice.value.order_id)
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    await refresh()
    if (isPremium.value) router.replace({ name: 'user-payment-success' })
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function recheck() {
  if (checking.value) return
  checking.value = true
  try {
    await refresh()
    const status = activeTransaction.value && activeTransaction.value.status
    if (isPremium.value || status === 'PAID') {
      router.replace({ name: 'user-payment-success' })
    } else if (status === 'FAILED' || status === 'CANCELLED' || status === 'EXPIRED') {
      router.replace({ name: 'user-payment-failed' })
    } else {
      uiStore.notify('Still processing. Please check again in a moment.', 'info')
    }
  } catch (e) {
    uiStore.error(e.message)
  } finally {
    checking.value = false
  }
}

const message = computed(
  () =>
    'Your payment is still being processed by the provider. Premium will activate automatically once the payment is confirmed. You can re-check the status below.'
)

onMounted(load)
</script>

<template>
  <div>
    <PageHeader title="Payment pending" />

    <StatePanel :loading="loading" :error="error" @retry="load">
      <v-row justify="center">
        <v-col cols="12" md="7">
          <PaymentStatus
            state="pending"
            title="Payment is processing"
            :message="message"
            :invoice="activeInvoice"
            :transaction="activeTransaction"
          >
            <template #actions>
              <v-btn
                color="primary"
                variant="flat"
                prepend-icon="mdi-refresh"
                :loading="checking"
                @click="recheck"
              >
                Check status
              </v-btn>
              <v-btn variant="tonal" :to="{ name: 'user-transactions' }" prepend-icon="mdi-receipt-text-outline">
                Transactions
              </v-btn>
              <v-btn variant="text" :to="{ name: 'user-dashboard' }" prepend-icon="mdi-view-dashboard-outline">
                Dashboard
              </v-btn>
            </template>
          </PaymentStatus>
        </v-col>
      </v-row>
    </StatePanel>
  </div>
</template>
