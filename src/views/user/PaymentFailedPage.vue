<script setup>
// Feature 8 - payment failed page.
//
// Shown when the payment did not go through (Snap error, or the transaction
// record is FAILED/CANCELLED/EXPIRED). It shows the available failure details
// and offers a retry that returns the user to the payment page. It does NOT
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

// Retry: drop the stale invoice reference and go back to the payment page,
// where "Bayar sekarang" creates/reuses a PENDING transaction. We never
// silently re-charge.
function retry() {
  store.clearActiveInvoice()
  router.push({ name: 'user-payment' })
}

const message = computed(
  () =>
    'Tidak ada biaya yang ditagih untuk pembayaran yang gagal atau dibatalkan. Kamu bisa mencoba lagi kapan saja.'
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
            state="failed"
            title="Pembayaran tidak selesai"
            :message="message"
            :invoice="activeInvoice"
            :transaction="activeTransaction"
          >
            <template #actions>
              <v-btn color="primary" variant="flat" prepend-icon="mdi-refresh" @click="retry">
                Coba lagi
              </v-btn>
              <v-btn variant="tonal" color="primary" :to="{ name: 'user-transactions' }" prepend-icon="mdi-receipt-text-outline">
                Lihat transaksi
              </v-btn>
              <v-btn variant="text" :to="{ name: 'user-subscription' }" prepend-icon="mdi-crown-outline">
                Lihat langganan
              </v-btn>
            </template>
          </PaymentStatus>
        </v-col>
      </v-row>
    </StatePanel>
  </div>
</template>
