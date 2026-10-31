<script setup>
// Reusable payment status/outcome display (Features 7 & 8).
//
// Shows a headline state (success / pending / failed / processing) with the
// order info that is available. It reflects backend/transaction state passed in
// by the parent; it never decides a payment is successful on its own. The
// Midtrans webhook (backend-to-backend) is the only authority for activation —
// the frontend only displays what the transaction API reports.
import StatusChip from '../StatusChip.vue'
import { formatCurrency, formatDate } from '../../lib/format'

defineProps({
  // 'success' | 'pending' | 'failed' | 'processing'
  state: { type: String, default: 'processing' },
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  // Optional invoice { order_id, amount, currency } and the authoritative
  // transaction row { status, payment_method, updated_at } if resolved.
  invoice: { type: Object, default: null },
  transaction: { type: Object, default: null }
})

const VISUALS = {
  success: { icon: 'mdi-check-circle', color: 'success' },
  pending: { icon: 'mdi-clock-outline', color: 'warning' },
  failed: { icon: 'mdi-close-circle', color: 'error' },
  processing: { icon: 'mdi-progress-clock', color: 'info' }
}
</script>

<template>
  <v-card variant="outlined" class="pa-8 text-center">
    <v-icon
      :icon="(VISUALS[state] || VISUALS.processing).icon"
      :color="(VISUALS[state] || VISUALS.processing).color"
      size="64"
      class="mb-4"
    />
    <h2 class="text-h5 font-weight-bold mb-2">{{ title }}</h2>
    <p class="text-body-2 text-medium-emphasis mb-6" style="white-space: pre-line">
      {{ message }}
    </p>

    <v-card
      v-if="invoice || transaction"
      variant="tonal"
      class="pa-4 text-left mx-auto mb-2"
      max-width="420"
    >
      <div v-if="invoice" class="d-flex justify-space-between mb-2">
        <span class="text-medium-emphasis">Order ID</span>
        <span class="font-mono text-body-2">{{ invoice.order_id }}</span>
      </div>
      <div v-if="invoice" class="d-flex justify-space-between mb-2">
        <span class="text-medium-emphasis">Amount</span>
        <span>{{ formatCurrency(invoice.amount, invoice.currency) }}</span>
      </div>
      <div class="d-flex justify-space-between align-center mb-2">
        <span class="text-medium-emphasis">Payment status</span>
        <StatusChip :value="transaction ? transaction.status : invoice ? invoice.status : 'PENDING'" />
      </div>
      <div
        v-if="transaction && transaction.payment_method"
        class="d-flex justify-space-between mb-2"
      >
        <span class="text-medium-emphasis">Method</span>
        <span>{{ transaction.payment_method }}</span>
      </div>
      <div v-if="transaction && transaction.updated_at" class="d-flex justify-space-between">
        <span class="text-medium-emphasis">Updated</span>
        <span>{{ formatDate(transaction.updated_at) }}</span>
      </div>
    </v-card>

    <div class="d-flex flex-wrap ga-3 justify-center mt-6">
      <slot name="actions" />
    </div>
  </v-card>
</template>

<style scoped>
.font-mono {
  font-family: monospace;
}
</style>
