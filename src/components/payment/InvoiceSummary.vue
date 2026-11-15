<script setup>
// Purchase summary / invoice panel (Feature 6).
//
// Renders only fields the backend actually provides:
//  - From the Premium offer: title, price, currency, duration_description.
//  - From the created invoice (POST /users/premium/payment):
//      order_id, amount, currency, status.
// The backend does NOT return a payment-expiry timestamp for a created
// transaction, so no expiry row is shown (we do not invent one).
import StatusChip from '../StatusChip.vue'
import { formatCurrency } from '../../lib/format'

/**
 * @typedef {Object} InvoiceSummaryProps
 * @property {import('../../types/api').Plan|null} [plan] - Premium plan from GET /users/premium/offer; null while loading
 * @property {import('../../types/api').Invoice|null} [invoice] - Created invoice; null before creation
 */

/** @type {InvoiceSummaryProps} */
const props = defineProps({
  plan: { type: Object, default: null },
  invoice: { type: Object, default: null }
})
</script>

<template>
  <v-card class="pa-5 pa-md-6">
    <h3 class="text-title-medium mb-4">Ringkasan pesanan</h3>

    <div class="d-flex align-center ga-3 mb-5">
      <v-avatar color="premium" rounded="lg" size="44">
        <v-icon icon="mdi-crown" color="navy" />
      </v-avatar>
      <div class="invoice-summary__plan">
        <div class="text-title-medium">{{ plan ? plan.title : 'Tryout App Premium' }}</div>
        <!-- duration_description is backend-built HTML, e.g. "tahun <small>(365 hari)</small>". -->
        <div v-if="plan" class="text-body-small text-medium-emphasis" v-html="plan.duration_description" />
      </div>
    </div>

    <div class="d-flex justify-space-between ga-4 py-2">
      <span class="text-body-medium text-medium-emphasis">Harga</span>
      <span class="text-body-medium invoice-summary__num text-end">
        {{ plan ? formatCurrency(plan.price, plan.currency) : '-' }}
      </span>
    </div>
    <div v-if="plan" class="d-flex justify-space-between ga-4 py-2">
      <span class="text-body-medium text-medium-emphasis">Durasi</span>
      <span class="text-body-medium invoice-summary__num text-end">{{ plan.duration_days }} hari</span>
    </div>

    <template v-if="invoice">
      <v-divider class="my-2" />
      <div class="d-flex justify-space-between ga-4 py-2">
        <span class="text-body-medium text-medium-emphasis text-no-wrap">ID pesanan</span>
        <span class="font-mono text-body-medium text-end text-break">{{ invoice.order_id }}</span>
      </div>
      <div class="d-flex justify-space-between align-center ga-4 py-2">
        <span class="text-body-medium text-medium-emphasis">Status</span>
        <StatusChip :value="invoice.status" />
      </div>
    </template>

    <div class="d-flex justify-space-between align-center flex-wrap ga-3 mt-4 pa-4 rounded-lg bg-surface-light">
      <span class="text-title-medium">Total bayar</span>
      <span class="app-figure text-headline-small text-primary">
        {{
          invoice
            ? formatCurrency(invoice.amount, invoice.currency)
            : plan
              ? formatCurrency(plan.price, plan.currency)
              : '-'
        }}
      </span>
    </div>
  </v-card>
</template>

<style scoped>
.invoice-summary__plan {
  min-width: 0;
}

.invoice-summary__num {
  font-variant-numeric: tabular-nums;
}

.font-mono {
  font-family: ui-monospace, 'Cascadia Mono', Consolas, monospace;
}
</style>
