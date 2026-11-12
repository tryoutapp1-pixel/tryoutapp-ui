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
  { value: 'bank_transfer', title: 'Bank Transfer / Virtual Account', icon: 'mdi-bank-outline' },
  { value: 'gopay', title: 'GoPay / QRIS', icon: 'mdi-qrcode' },
  { value: 'credit_card', title: 'Credit / Debit Card', icon: 'mdi-credit-card-outline' },
  { value: 'other', title: 'Other channels', icon: 'mdi-dots-horizontal-circle-outline' }
]

/** @type {import('vue').WritableComputedRef<string>} */
const selected = computed({
  get: () => props.modelValue,
  /** @param {string} v */
  set: (v) => emit('update:modelValue', v)
})
</script>

<template>
  <v-card variant="outlined" class="pa-6">
    <h3 class="text-subtitle-1 font-weight-bold mb-1">Payment method</h3>
    <p class="text-caption text-medium-emphasis mb-4">
      Pick a preferred method. You will confirm and complete it securely in the
      payment window on the next step.
    </p>

    <v-radio-group v-model="selected" hide-details>
      <v-radio
        v-for="m in methods"
        :key="m.value"
        :value="m.value"
        class="method-radio mb-2"
      >
        <template #label>
          <div class="d-flex align-center ga-3">
            <v-icon :icon="m.icon" color="primary" />
            <span>{{ m.title }}</span>
          </div>
        </template>
      </v-radio>
    </v-radio-group>
  </v-card>
</template>

<style scoped>
.method-radio {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
  padding: 8px 12px;
}
</style>
