<script setup>
// Reusable payment status/outcome display (Features 7 & 8).
//
// Shows a headline state (success / pending / failed / processing) with the
// order info that is available. It reflects backend/transaction state passed in
// by the parent; it never decides a payment is successful on its own. The
// Midtrans webhook (backend-to-backend) is the only authority for activation;
// the frontend only displays what the transaction API reports.
import StatusChip from '../StatusChip.vue'
import { formatCurrency, formatDate } from '../../lib/format'

/** @typedef {'success'|'pending'|'failed'|'processing'} PaymentState */

/**
 * @typedef {Object} PaymentStatusProps
 * @property {PaymentState} [state] - Headline state; unknown values fall back to 'processing'
 * @property {string} [title]
 * @property {string} [message]
 * @property {import('../../types/api').Invoice|null} [invoice] - Optional created invoice
 * @property {import('../../types/api').Transaction|null} [transaction] - Authoritative transaction row, if resolved
 */

/** @type {PaymentStatusProps} */
const props = defineProps({
  state: { type: String, default: 'processing' },
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  invoice: { type: Object, default: null },
  transaction: { type: Object, default: null }
})

/** @type {Record<PaymentState, { icon: string, color: string }>} */
const VISUALS = {
  success: { icon: 'mdi-check-circle', color: 'success' },
  pending: { icon: 'mdi-clock-outline', color: 'warning' },
  failed: { icon: 'mdi-close-circle', color: 'error' },
  processing: { icon: 'mdi-progress-clock', color: 'info' }
}
</script>

<template>
  <v-card class="rounded-xl pa-6 pa-md-10 text-center">
    <v-avatar
      :color="(VISUALS[state] || VISUALS.processing).color"
      variant="tonal"
      size="80"
      class="mb-5"
    >
      <v-icon
        :icon="(VISUALS[state] || VISUALS.processing).icon"
        :color="(VISUALS[state] || VISUALS.processing).color"
        size="44"
      />
    </v-avatar>
    <h2 class="text-headline-small mb-2">{{ title }}</h2>
    <p class="text-body-large text-medium-emphasis mx-auto mb-6 payment-status__message">
      {{ message }}
    </p>

    <v-card
      v-if="invoice || transaction"
      color="surface-light"
      variant="flat"
      class="pa-4 text-start mx-auto mb-2"
      max-width="440"
    >
      <div v-if="invoice" class="d-flex justify-space-between ga-4 py-1">
        <span class="text-body-medium text-medium-emphasis text-no-wrap">ID pesanan</span>
        <span class="font-mono text-body-medium text-end text-break">{{ invoice.order_id }}</span>
      </div>
      <div v-if="invoice" class="d-flex justify-space-between ga-4 py-1">
        <span class="text-body-medium text-medium-emphasis">Jumlah</span>
        <span class="text-title-small text-end payment-status__num">
          {{ formatCurrency(invoice.amount, invoice.currency) }}
        </span>
      </div>
      <div class="d-flex justify-space-between align-center ga-4 py-1">
        <span class="text-body-medium text-medium-emphasis">Status pembayaran</span>
        <StatusChip :value="transaction ? transaction.status : invoice ? invoice.status : 'PENDING'" />
      </div>
      <div
        v-if="transaction && transaction.payment_method"
        class="d-flex justify-space-between ga-4 py-1"
      >
        <span class="text-body-medium text-medium-emphasis">Metode</span>
        <span class="text-body-medium text-end text-break">{{ transaction.payment_method }}</span>
      </div>
      <div v-if="transaction && transaction.updated_at" class="d-flex justify-space-between ga-4 py-1">
        <span class="text-body-medium text-medium-emphasis">Diperbarui</span>
        <span class="text-body-medium text-end payment-status__num">{{ formatDate(transaction.updated_at) }}</span>
      </div>
    </v-card>

    <div class="d-flex flex-wrap ga-3 justify-center mt-6">
      <slot name="actions" />
    </div>
  </v-card>
</template>

<style scoped>
.payment-status__message {
  white-space: pre-line;
  max-width: 48ch;
}

.payment-status__num {
  font-variant-numeric: tabular-nums;
}

.font-mono {
  font-family: ui-monospace, 'Cascadia Mono', Consolas, monospace;
}
</style>
