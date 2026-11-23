<script setup>
// Feature 8 - payment success page.
//
// Success is shown ONLY when the transaction for the current order is PAID in
// the backend. The general subscription status is not enough on its own: an
// already-Premium user who renews would otherwise see "success" without paying.
//
// The current order comes from the in-memory invoice (normal Snap popup flow)
// or, after a full page load, from the `order_id` query parameter that Midtrans
// appends to the Finish Redirect URL. Without either, there is nothing to
// confirm, so the user is sent back to the Subscription page.
//
// If the order is not PAID yet, the user is moved to the pending page; if it
// ended FAILED/CANCELLED/EXPIRED, to the failed page.
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useSubscriptionStore, FAILED_TX_STATUSES } from '../../stores/subscription'
import PageHeader from '../../components/PageHeader.vue'
import StatePanel from '../../components/StatePanel.vue'
import PaymentStatus from '../../components/payment/PaymentStatus.vue'
import StatusChip from '../../components/StatusChip.vue'
import { formatDateOnly } from '../../lib/format'

const route = useRoute()
const router = useRouter()
const store = useSubscriptionStore()
const { activeInvoice, activeTransaction, subscription, isPremium } = storeToRefs(store)

const loading = ref(true)
const error = ref('')

/** @returns {string} Order to confirm, or '' when unknown */
function currentOrderId() {
  if (activeInvoice.value && activeInvoice.value.order_id) return activeInvoice.value.order_id
  const fromQuery = route.query.order_id
  return typeof fromQuery === 'string' ? fromQuery : ''
}

/**
 * Resolves where this visit should go. Returns null when the order is PAID and
 * the success content may render.
 * @returns {Promise<import('vue-router').RouteLocationRaw|null>}
 */
async function resolveRedirect() {
  const orderId = currentOrderId()
  if (!orderId) return { name: 'user-subscription' }

  await store.refreshAfterPayment()
  const tx = await store.findTransactionByOrderId(orderId)
  // Unknown order (e.g. a hand-typed URL): nothing to confirm.
  if (!tx) return { name: 'user-subscription' }

  // Arrived via the Finish Redirect URL: make the order the active invoice so
  // the outcome pages can show and re-check it.
  if (!activeInvoice.value) store.adoptTransaction(tx)

  if (FAILED_TX_STATUSES.includes(tx.status)) return { name: 'user-payment-failed' }
  if (tx.status !== 'PAID') return { name: 'user-payment-pending' }
  return null
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const target = await resolveRedirect()
    if (target) {
      // Keep the loader up while navigating so the success card never flashes.
      router.replace(target)
      return
    }
  } catch (e) {
    error.value = e.message
  }
  loading.value = false
}

// Reaching this point means the order is PAID. Premium is normally active in
// the same webhook; if the subscription read lags, say so instead of claiming
// activation.
const title = computed(() => (isPremium.value ? 'Premium sudah aktif' : 'Pembayaran diterima'))
const message = computed(() =>
  isPremium.value
    ? 'Terima kasih sudah upgrade. Sekarang kamu bisa membuka semua konten Premium.'
    : 'Pembayaranmu sudah kami terima. Premium aktif tidak lama lagi. Halaman ini menampilkan status terbarumu.'
)

onMounted(load)
</script>

<template>
  <div>
    <PageHeader title="Status pembayaran" />

    <StatePanel :loading="loading" :error="error" @retry="load">
      <v-row justify="center">
        <v-col cols="12" md="8" lg="7">
          <PaymentStatus
            state="success"
            :title="title"
            :message="message"
            :invoice="activeInvoice"
            :transaction="activeTransaction"
          >
            <template #actions>
              <v-btn color="primary" variant="flat" :to="{ name: 'user-dashboard' }" prepend-icon="mdi-home-variant-outline">
                Ke Beranda
              </v-btn>
              <v-btn variant="tonal" color="primary" :to="{ name: 'user-subscription' }" prepend-icon="mdi-crown-outline">
                Lihat langganan
              </v-btn>
              <v-btn variant="text" :to="{ name: 'user-transactions' }" prepend-icon="mdi-receipt-text-outline">
                Lihat transaksi
              </v-btn>
            </template>
          </PaymentStatus>

          <v-card v-if="subscription" variant="flat" class="pa-4 mt-4 text-center">
            <div class="d-flex align-center justify-center flex-wrap ga-2">
              <span class="text-body-medium text-medium-emphasis">Paket saat ini</span>
              <StatusChip :value="subscription.status" />
            </div>
            <div v-if="isPremium && subscription.expired_at" class="text-body-small text-medium-emphasis mt-1">
              Berlaku sampai {{ formatDateOnly(subscription.expired_at) }}
            </div>
          </v-card>
        </v-col>
      </v-row>
    </StatePanel>
  </div>
</template>
