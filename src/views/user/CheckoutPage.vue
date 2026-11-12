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
      error.value = 'Could not prepare your invoice. Please try again.'
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
    <PageHeader title="Checkout" subtitle="Review your purchase and choose how to pay.">
      <template #actions>
        <v-btn variant="text" prepend-icon="mdi-arrow-left" :to="{ name: 'user-subscription' }">
          Back
        </v-btn>
      </template>
    </PageHeader>

    <StatePanel :loading="loading || creatingPayment" :error="error" @retry="load">
      <v-alert
        v-if="!snapConfigured"
        type="warning"
        variant="tonal"
        class="mb-4"
      >
        Online payment is not configured in this environment, so an invoice
        cannot be created. You can still review the plan below.
      </v-alert>

      <v-row>
        <v-col cols="12" md="7">
          <PaymentMethodSelect v-model="method" />
        </v-col>
        <v-col cols="12" md="5">
          <InvoiceSummary :plan="premiumPlan" :invoice="activeInvoice" />

          <v-btn
            color="primary"
            variant="flat"
            size="large"
            block
            class="mt-4"
            prepend-icon="mdi-arrow-right-circle"
            :loading="creatingPayment"
            :disabled="!canPay || creatingPayment"
            @click="proceed"
          >
            Proceed to payment
          </v-btn>
          <p class="text-caption text-medium-emphasis text-center mt-2 mb-0">
            You will complete the payment securely in the next step.
          </p>
        </v-col>
      </v-row>
    </StatePanel>
  </div>
</template>
