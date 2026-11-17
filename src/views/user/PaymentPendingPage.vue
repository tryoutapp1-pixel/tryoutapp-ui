<script setup>
// Feature 8 - pending payment page.
//
// Shown when the payment is still being processed (Snap reported pending, or
// the record has not settled yet). It never shows Premium as active. The user
// can re-check the status, which re-reads the authoritative transaction +
// subscription state from the backend. If a re-check finds THIS order PAID, we
// move them to the success page. The general subscription status is not used:
// a renewing user is already Premium before the new order is paid.
//
// "Lihat detail pembayaran" re-opens Snap for the same order so the user can
// see the payment instructions again (VA number, QRIS code, etc.). The Snap
// token is reused from memory; after a page reload it is not available, so the
// backend is asked to resume the latest PENDING order, which returns the same
// order and token while Midtrans still reports it as pending.
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useSubscriptionStore } from '../../stores/subscription'
import { useUiStore } from '../../stores/ui'
import PageHeader from '../../components/PageHeader.vue'
import StatePanel from '../../components/StatePanel.vue'
import PaymentStatus from '../../components/payment/PaymentStatus.vue'
import { isSnapConfigured } from '../../lib/midtrans'
import { settledRouteFor, useSnapPayment } from '../../composables/useSnapPayment'

const router = useRouter()
const store = useSubscriptionStore()
const uiStore = useUiStore()
const { activeInvoice, activeTransaction, transactions } = storeToRefs(store)
const { paying, openSnap } = useSnapPayment()

const loading = ref(true)
const error = ref('')
const checking = ref(false)
const snapConfigured = isSnapConfigured()

/** Snap can only be re-opened for an order that is still awaiting payment. */
const canReopen = computed(() => {
  if (!snapConfigured || !activeInvoice.value) return false
  const status = activeTransaction.value ? activeTransaction.value.status : activeInvoice.value.status
  return status === 'PENDING'
})

/**
 * Re-reads the subscription and the current order. After a page reload there
 * is no order in memory, so the newest PENDING transaction is adopted.
 */
async function refresh() {
  await store.refreshAfterPayment()
  if (!activeInvoice.value) {
    const latestPending = transactions.value.find((t) => t.status === 'PENDING')
    if (latestPending) store.adoptTransaction(latestPending)
  }
  if (activeInvoice.value) {
    await store.findTransactionByOrderId(activeInvoice.value.order_id)
  }
}

/** @returns {import('vue-router').RouteLocationRaw|null} */
function currentSettledRoute() {
  return settledRouteFor(activeTransaction.value ? activeTransaction.value.status : null)
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    await refresh()
    const target = currentSettledRoute()
    if (target) {
      router.replace(target)
      return
    }
  } catch (e) {
    error.value = e.message
  }
  loading.value = false
}

async function recheck() {
  if (checking.value) return
  checking.value = true
  try {
    await refresh()
    const target = currentSettledRoute()
    if (target) router.replace(target)
    else uiStore.notify('Pembayaran masih diproses. Coba cek lagi beberapa saat lagi.', 'info')
  } catch (e) {
    uiStore.error(e.message)
  } finally {
    checking.value = false
  }
}

/**
 * The invoice whose Snap popup should be re-opened.
 * @returns {Promise<import('../../types/api').Invoice|null>}
 */
async function invoiceToReopen() {
  const current = activeInvoice.value
  if (!current) return null
  if (current.snap_token) return current

  // No token in memory (page reload): let the backend resume the order.
  const resumed = await store.createPayment()
  if (resumed && resumed.order_id !== current.order_id) {
    // The previous order is no longer pending at Midtrans, so the backend
    // prepared a new one; Snap will show that new order.
    uiStore.notify('Tagihan sebelumnya sudah tidak berlaku. Kami siapkan tagihan baru.', 'info')
  }
  return resumed
}

async function reopenSnap() {
  if (paying.value || !canReopen.value) return
  try {
    const result = await openSnap(invoiceToReopen)
    if (!result) return
    if (result.settledRoute) router.replace(result.settledRoute)
    else if (result.outcome === 'error') router.replace({ name: 'user-payment-failed' })
    // Closed, or still pending: stay here; the status card shows the latest state.
  } catch (e) {
    uiStore.error(e.message || 'Detail pembayaran belum bisa dibuka. Coba lagi.')
  }
}

const message = computed(
  () =>
    'Penyedia pembayaran masih memproses pembayaranmu. Premium aktif otomatis setelah pembayaran dikonfirmasi. Kamu bisa membuka lagi detail pembayaran (misalnya nomor VA atau kode QRIS) atau cek statusnya di bawah.'
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
            state="pending"
            title="Pembayaran sedang diproses"
            :message="message"
            :invoice="activeInvoice"
            :transaction="activeTransaction"
          >
            <template #actions>
              <v-btn
                v-if="canReopen"
                color="primary"
                variant="flat"
                prepend-icon="mdi-open-in-new"
                :loading="paying"
                :disabled="paying || checking"
                @click="reopenSnap"
              >
                Lihat detail pembayaran
              </v-btn>
              <v-btn
                color="primary"
                :variant="canReopen ? 'tonal' : 'flat'"
                prepend-icon="mdi-refresh"
                :loading="checking"
                :disabled="paying || checking"
                @click="recheck"
              >
                Cek status
              </v-btn>
              <v-btn variant="text" :to="{ name: 'user-transactions' }" prepend-icon="mdi-receipt-text-outline">
                Lihat transaksi
              </v-btn>
              <v-btn variant="text" :to="{ name: 'user-dashboard' }" prepend-icon="mdi-home-variant-outline">
                Ke Beranda
              </v-btn>
            </template>
          </PaymentStatus>
        </v-col>
      </v-row>
    </StatePanel>
  </div>
</template>
