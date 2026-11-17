<script setup>
// Feature 7 - payment page (entry point of the Premium purchase flow).
//
// The Subscription page routes here directly; there is no separate checkout
// step. The page shows the order summary from the Premium offer. "Bayar
// sekarang" creates (or resumes) the PENDING transaction and immediately opens
// the Midtrans Snap popup with the returned snap_token.
//
// Outcome routing is decided by the transaction for THIS order_id, never by the
// general subscription status: an already-Premium user who renews and then
// closes Snap must not land on the success page.
//  - Snap closed (X)      : stay here. Only move on if the backend already shows
//                           the order as PAID or failed (webhook arrived first).
//  - Transaction PAID     : success page.
//  - FAILED/CANCELLED/... : failed page.
//  - Snap success/pending : pending page until the webhook settles the order.
//  - Snap error           : failed page.
// The backend webhook (not the client callback) is what activates Premium.
//
// A single in-flight flag prevents double invoice creation / repeated Snap opens.
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useSubscriptionStore } from '../../stores/subscription'
import { useUiStore } from '../../stores/ui'
import PageHeader from '../../components/PageHeader.vue'
import StatePanel from '../../components/StatePanel.vue'
import InvoiceSummary from '../../components/payment/InvoiceSummary.vue'
import { isSnapConfigured } from '../../lib/midtrans'
import { useSnapPayment } from '../../composables/useSnapPayment'

const router = useRouter()
const store = useSubscriptionStore()
const uiStore = useUiStore()
const { activeInvoice, premiumPlan } = storeToRefs(store)
const { paying, openSnap } = useSnapPayment()

const loading = ref(true)
const error = ref('')
const snapConfigured = isSnapConfigured()

/** @type {import('vue').ComputedRef<import('../../types/api').Invoice|null>} */
const invoice = computed(() => activeInvoice.value)

async function load() {
  loading.value = true
  error.value = ''
  // The order is created on "Bayar sekarang", so drop any invoice left from an
  // earlier visit; the summary must not show a previous order's ID or status.
  store.clearActiveInvoice()
  try {
    if (!premiumPlan.value) await store.fetchOffer()
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function pay() {
  if (paying.value || !snapConfigured) return
  try {
    // Always ask the backend: it resumes a still-pending order or creates a new
    // one, so an in-memory token from an earlier (e.g. already PAID) order is
    // never reused.
    const result = await openSnap(() => store.createPayment())
    if (!result) return
    const { outcome, settledRoute } = result

    if (settledRoute) {
      router.replace(settledRoute)
    } else if (outcome === 'close') {
      // Dismissed without paying: stay here so the user can try again.
      uiStore.notify('Jendela pembayaran ditutup. Kamu bisa melanjutkan pembayaran kapan saja.', 'info')
    } else if (outcome === 'error') {
      router.replace({ name: 'user-payment-failed' })
    } else {
      // 'success' or 'pending' from Snap, but the webhook has not settled the
      // order yet.
      router.replace({ name: 'user-payment-pending' })
    }
  } catch (e) {
    uiStore.error(e.message || 'Pembayaran belum bisa dimulai. Coba lagi.')
  }
}

onMounted(load)
</script>

<template>
  <div>
    <PageHeader title="Pembayaran" subtitle="Periksa ringkasan pesanan, lalu selesaikan pembayaran untuk upgrade ke Premium.">
      <template #actions>
        <v-btn variant="text" prepend-icon="mdi-arrow-left" :to="{ name: 'user-subscription' }">
          Kembali
        </v-btn>
      </template>
    </PageHeader>

    <!-- Static step indicator: this page is step 1 of 2. -->
    <ol class="payment-steps d-flex align-center flex-wrap ga-3 pa-0 mt-0 mb-6" aria-label="Langkah pembelian">
      <li class="d-flex align-center ga-2" aria-current="step">
        <span class="app-bubble app-bubble--sm app-bubble--filled app-bubble--current">1</span>
        <span class="text-label-large">Pembayaran</span>
      </li>
      <li class="payment-steps__sep d-none d-sm-block" aria-hidden="true" />
      <li class="d-flex align-center ga-2 text-medium-emphasis">
        <span class="app-bubble app-bubble--sm">2</span>
        <span class="text-label-large">Selesai</span>
      </li>
    </ol>

    <StatePanel :loading="loading" :error="error" @retry="load">
      <v-row justify="center">
        <v-col cols="12" md="7" lg="6">
          <InvoiceSummary :plan="premiumPlan" :invoice="invoice" />

          <v-alert
            v-if="!snapConfigured"
            type="warning"
            variant="tonal"
            class="mt-4 mb-0"
          >
            Pembayaran online belum dikonfigurasi di lingkungan ini.
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
              :disabled="paying || !premiumPlan"
              @click="pay"
            >
              Bayar sekarang
            </v-btn>
            <p class="text-body-small text-medium-emphasis text-center mx-auto mt-3 mb-0 payment-note">
              Akses Premium aktif setelah kami menerima konfirmasi dari penyedia
              pembayaran. Ini bisa memakan waktu sebentar setelah kamu membayar.
            </p>
          </template>
        </v-col>
      </v-row>
    </StatePanel>
  </div>
</template>

<style scoped>
.payment-steps {
  list-style: none;
}

.payment-steps__sep {
  inline-size: 28px;
  border-top: 2px solid rgb(var(--app-line));
}

.payment-note {
  max-width: 44ch;
}
</style>
