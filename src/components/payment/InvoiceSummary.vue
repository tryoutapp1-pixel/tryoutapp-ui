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

defineProps({
  // The Premium plan from GET /users/premium/offer (may be null while loading).
  plan: { type: Object, default: null },
  // The created invoice (may be null before creation).
  invoice: { type: Object, default: null }
})
</script>

<template>
  <v-card variant="outlined" class="pa-6">
    <h3 class="text-subtitle-1 font-weight-bold mb-4">Purchase summary</h3>

    <div class="d-flex align-center ga-2 mb-4">
      <v-icon icon="mdi-crown-outline" color="amber" />
      <div>
        <div class="font-weight-medium">{{ plan ? plan.title : 'Tryout App Premium' }}</div>
        <div v-if="plan" class="text-caption text-medium-emphasis">
          {{ plan.duration_description }}
        </div>
      </div>
    </div>

    <v-divider class="mb-3" />

    <div class="d-flex justify-space-between mb-2">
      <span class="text-medium-emphasis">Price</span>
      <span>{{ plan ? formatCurrency(plan.price, plan.currency) : '-' }}</span>
    </div>
    <div v-if="plan" class="d-flex justify-space-between mb-2">
      <span class="text-medium-emphasis">Duration</span>
      <span>{{ plan.duration_days }} days</span>
    </div>

    <template v-if="invoice">
      <v-divider class="my-3" />
      <div class="d-flex justify-space-between mb-2">
        <span class="text-medium-emphasis">Order ID</span>
        <span class="font-mono text-body-2">{{ invoice.order_id }}</span>
      </div>
      <div class="d-flex justify-space-between align-center mb-2">
        <span class="text-medium-emphasis">Status</span>
        <StatusChip :value="invoice.status" />
      </div>
    </template>

    <v-divider class="my-3" />

    <div class="d-flex justify-space-between align-center">
      <span class="text-subtitle-1 font-weight-bold">Total</span>
      <span class="text-h6 font-weight-bold text-primary">
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
.font-mono {
  font-family: monospace;
}
</style>
