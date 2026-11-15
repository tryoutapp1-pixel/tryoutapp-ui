<script setup>
// Feature 8 - payment success page.
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

// If Premium is active, show success. Otherwise the payment was received but
// activation has not caught up yet, so present it as pending settlement.
/** @type {import('vue').ComputedRef<'success'|'pending'>} */
const state = computed(() => (isPremium.value ? 'success' : 'pending'))
const title = computed(() =>
  isPremium.value ? 'Premium sudah aktif' : 'Pembayaran diterima'
)
const message = computed(() =>
  isPremium.value
    ? 'Terima kasih sudah upgrade. Sekarang kamu bisa membuka semua konten Premium.'
    : 'Pembayaranmu sudah kami terima. Premium biasanya aktif tidak lama setelah penyedia pembayaran mengonfirmasi. Halaman ini menampilkan status terbarumu.'
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
            :state="state"
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
