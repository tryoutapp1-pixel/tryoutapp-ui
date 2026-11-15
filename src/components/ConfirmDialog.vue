<script setup>
// Reusable confirmation dialog. Controlled via v-model:modelValue.
// Emits "confirm" when the user accepts; parent performs the action and can
// bind :loading while it runs.

/**
 * @typedef {Object} ConfirmDialogProps
 * @property {boolean} modelValue - Dialog visibility (v-model)
 * @property {string} [title]
 * @property {string} [message]
 * @property {string} [confirmText] - Confirm button label
 * @property {string} [cancelText] - Cancel button label
 * @property {string} [confirmColor] - Vuetify color of the confirm button
 * @property {boolean} [loading] - Shows a spinner on Confirm and disables Cancel
 */

/** @type {ConfirmDialogProps} */
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: 'Lanjutkan tindakan ini?' },
  message: { type: String, default: '' },
  confirmText: { type: String, default: 'Konfirmasi' },
  cancelText: { type: String, default: 'Batal' },
  confirmColor: { type: String, default: 'error' },
  loading: { type: Boolean, default: false }
})

/**
 * @typedef {Object} ConfirmDialogEmits
 * @property {(value: boolean) => void} update:modelValue
 * @property {() => void} confirm - The user accepted; the parent performs the action
 */
const emit = defineEmits(['update:modelValue', 'confirm'])

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="440"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card class="pa-3">
      <v-card-title class="text-title-large text-wrap">{{ title }}</v-card-title>
      <v-card-text class="text-body-medium text-medium-emphasis">{{ message }}</v-card-text>
      <v-card-actions class="justify-end ga-2">
        <v-btn variant="text" :disabled="loading" @click="close">{{ cancelText }}</v-btn>
        <v-btn :color="confirmColor" variant="flat" :loading="loading" @click="emit('confirm')">
          {{ confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
