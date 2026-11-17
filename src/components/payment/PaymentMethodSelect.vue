<!--
  DISABLED: PaymentMethodSelect.vue (checkout payment-method preview).
  The purchase flow now goes Subscription -> /app/payment directly, so this
  file is no longer used. The original code is kept below, fully commented
  out, for reference. Inner HTML comments are written as '<! -- ... -- >' so
  they do not close this outer comment; restore them when re-enabling.

  To re-enable: remove this wrapper and the stub template at the bottom,
  restore the inner comments, and (for CheckoutPage) uncomment the
  'user-checkout' route in src/router/index.js.
========================================================================
<script setup>
// Payment method selection (Feature 6).
//
// IMPORTANT (verified against api/src/services/userApiService.js): the backend
// creates the Midtrans Snap transaction WITHOUT restricting payment channels,
// and POST /users/premium/payment accepts no method parameter. Midtrans Snap
// itself renders and handles the actual method choice inside its popup. So this
// control is a preview of the methods the Snap popup will offer; the user's
// final, authoritative choice is made inside Snap. We surface this clearly
// rather than implying the frontend drives the channel.
//
// The list mirrors the channels commonly enabled on a standard Midtrans Snap
// account. It is presentational only and does not get sent to the backend.
import { computed } from 'vue'

/**
 * @typedef {Object} PaymentMethodSelectProps
 * @property {string} [modelValue] - Selected method value (v-model)
 */

/** @type {PaymentMethodSelectProps} */
const props = defineProps({
  modelValue: { type: String, default: '' }
})

/**
 * @typedef {Object} PaymentMethodSelectEmits
 * @property {(value: string) => void} update:modelValue
 */
const emit = defineEmits(['update:modelValue'])

/** @type {{ value: string, title: string, icon: string }[]} */
const methods = [
  { value: 'bank_transfer', title: 'Transfer bank / Virtual Account', icon: 'mdi-bank-outline' },
  { value: 'gopay', title: 'GoPay / QRIS', icon: 'mdi-qrcode' },
  { value: 'credit_card', title: 'Kartu kredit / debit', icon: 'mdi-credit-card-outline' },
  { value: 'other', title: 'Metode lainnya', icon: 'mdi-dots-horizontal-circle-outline' }
]

/** @type {import('vue').WritableComputedRef<string>} */
const selected = computed({
  get: () => props.modelValue,
  /** @param {string} v */
  set: (v) => emit('update:modelValue', v)
})
</script>

<template>
  <v-card class="pa-5 pa-md-6">
    <h3 class="text-title-medium mb-1">Metode pembayaran</h3>
    <p class="text-body-medium text-medium-emphasis mb-5">
      Pilih metode yang kamu inginkan. Kamu akan mengonfirmasi dan menyelesaikan
      pembayaran di jendela pembayaran pada langkah berikutnya.
    </p>

    <v-radio-group v-model="selected" hide-details>
      <v-radio
        v-for="m in methods"
        :key="m.value"
        :value="m.value"
        class="method-radio mb-3"
      >
        <template #label>
          <div class="d-flex align-center ga-3">
            <v-avatar color="surface-light" rounded="lg" size="36">
              <v-icon :icon="m.icon" color="primary" size="20" />
            </v-avatar>
            <span class="text-body-large">{{ m.title }}</span>
          </div>
        </template>
      </v-radio>
    </v-radio-group>
  </v-card>
</template>

<style scoped>
/* Each option is a full-width selectable row; the selected row gets a primary
   outline and a faint blue fill. */
.method-radio {
  min-height: 60px;
  border: 1px solid rgb(var(--app-line));
  border-radius: var(--app-r-control);
  padding: 8px 12px 8px 8px;
  transition: border-color 0.16s ease, background-color 0.16s ease;
}

.method-radio:hover {
  border-color: rgb(var(--app-line-strong));
}

.method-radio.v-selection-control--dirty {
  border-color: rgb(var(--v-theme-primary));
  background: rgb(var(--app-azure) / 0.05);
  box-shadow: inset 0 0 0 1px rgb(var(--v-theme-primary));
}

.method-radio :deep(.v-label) {
  flex: 1 1 auto;
  height: 100%;
  opacity: 1;
  color: rgb(var(--app-navy));
  cursor: pointer;
}
</style>
-->

<!-- Stub so the SFC stays valid if it is ever imported by mistake. -->
<template><div /></template>
