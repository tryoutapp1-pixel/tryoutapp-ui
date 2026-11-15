<script setup>
// Feature 6 - invoice and payment method selection (purchase preparation).
//
// One page with the purchase summary (from the Premium offer and the invoice)
// and a payment-method preview. This is NOT the payment execution screen;
// "Proceed to payment" routes to the dedicated PaymentPage.
//
// Backend workflow (verified):
//  - POST /users/premium/payment creates OR reuses a PENDING transaction and
//    returns { order_id, transaction_id, snap_token, amount, currency, status }.
//    It is idempotent per user, so a repeated request returns the same order.
//  - The backend accepts no payment-method parameter; Midtrans Snap presents the
//    actual channels. The selection here is a preview (see PaymentMethodSelect).
//
// If the user is already Premium we do not create an invoice; we send them to
// the subscription page instead (the backend would extend, but we keep the
// checkout entry intentional).
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useSubscriptionStore } from '../../stores/subscription'
import { useUiStore } from '../../stores/ui'
import PageHeader from '../../components/PageHeader.vue'
import StatePanel from '../../components/StatePanel.vue'
import InvoiceSummary from '../../components/payment/InvoiceSummary.vue'
import PaymentMethodSelect from '../../components/payment/PaymentMethodSelect.vue'
import { isSnapConfigured } from '../../lib/midtrans'

const router = useRouter()
const store = useSubscriptionStore()
const uiStore = useUiStore()
const { offer, premiumPlan, activeInvoice, creatingPayment } = storeToRefs(store)

const loading = ref(false)
const error = ref('')
const method = ref('bank_transfer')
const snapConfigured = isSnapConfigured()

// The invoice is created on "Proceed to payment" (not on mount), so the button
// only needs a configured gateway to be enabled.
const canPay = computed(() => snapConfigured)

async function load() {
  loading.value = true
  error.value = ''
  try {
    if (!offer.value.length) await store.fetchOffer()
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

// Create (or reuse) the PENDING invoice here, triggered by the user's explicit
// action, then move to the dedicated payment page. The backend is idempotent
// per user, so a repeated click simply returns the same order.
async function proceed() {
  if (!canPay.value || creatingPayment.value) return
  error.value = ''
  try {
    const invoice = await store.ensureInvoice()
    if (!invoice || !invoice.snap_token) {
      error.value = 'Tagihan belum bisa disiapkan. Coba lagi.'
      return
    }
    router.push({ name: 'user-payment' })
  } catch (e) {
    error.value = e.message
  }
}

onMounted(load)
</script>

<template>
  <div>
    <PageHeader title="Upgrade ke Premium" subtitle="Periksa ringkasan pesanan, lalu pilih metode pembayaran.">
      <template #actions>
        <v-btn variant="text" prepend-icon="mdi-arrow-left" :to="{ name: 'user-subscription' }">
          Kembali
        </v-btn>
      </template>
    </PageHeader>

    <!-- Static step indicator: this page is step 1 of 3. -->
    <ol class="checkout-steps d-flex align-center flex-wrap ga-3 pa-0 mt-0 mb-6" aria-label="Langkah pembelian">
      <li class="d-flex align-center ga-2" aria-current="step">
        <span class="app-bubble app-bubble--sm app-bubble--filled app-bubble--current">1</span>
        <span class="text-label-large">Ringkasan</span>
      </li>
      <li class="checkout-steps__sep d-none d-sm-block" aria-hidden="true" />
      <li class="d-flex align-center ga-2 text-medium-emphasis">
        <span class="app-bubble app-bubble--sm">2</span>
        <span class="text-label-large">Pembayaran</span>
      </li>
      <li class="checkout-steps__sep d-none d-sm-block" aria-hidden="true" />
      <li class="d-flex align-center ga-2 text-medium-emphasis">
        <span class="app-bubble app-bubble--sm">3</span>
        <span class="text-label-large">Selesai</span>
      </li>
    </ol>

    <StatePanel :loading="loading || creatingPayment" :error="error" @retry="load">
      <v-alert
        v-if="!snapConfigured"
        type="warning"
        variant="tonal"
        class="mb-4"
      >
        Pembayaran online belum dikonfigurasi di lingkungan ini, jadi tagihan
        belum bisa dibuat. Kamu tetap bisa melihat detail paket di bawah.
      </v-alert>

      <v-row>
        <v-col cols="12" md="7">
          <PaymentMethodSelect v-model="method" />
        </v-col>
        <v-col cols="12" md="5">
          <div class="checkout-aside">
            <InvoiceSummary :plan="premiumPlan" :invoice="activeInvoice" />

            <v-btn
              color="primary"
              variant="flat"
              size="large"
              block
              class="mt-4"
              append-icon="mdi-arrow-right"
              :loading="creatingPayment"
              :disabled="!canPay || creatingPayment"
              @click="proceed"
            >
              Lanjut ke pembayaran
            </v-btn>
            <p class="d-flex align-center justify-center ga-1 text-body-small text-medium-emphasis text-center mt-3 mb-0">
              <v-icon icon="mdi-lock-outline" size="14" />
              Kamu akan menyelesaikan pembayaran dengan aman di langkah berikutnya.
            </p>
          </div>
        </v-col>
      </v-row>
    </StatePanel>
  </div>
</template>

<style scoped>
.checkout-steps {
  list-style: none;
}

.checkout-steps__sep {
  inline-size: 28px;
  border-top: 2px solid rgb(var(--app-line));
}

/* Keep the total and the action in view while the method list scrolls. */
@media (min-width: 960px) {
  .checkout-aside {
    position: sticky;
    top: 88px;
  }
}
</style>
