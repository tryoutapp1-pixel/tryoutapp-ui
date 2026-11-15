<script setup>
// Try Out only. Opens when the server deadline passes. It cannot be dismissed
// and has a single action, so the learner's only way forward is to submit the
// answers saved so far.

/**
 * @typedef {Object} TimeUpDialogProps
 * @property {boolean} modelValue - Dialog visibility
 * @property {boolean} [submitting] - Shows a spinner on the Submit button
 * @property {number} [answered] - Questions answered
 * @property {number} [total] - Questions in the attempt
 * @property {string} [error] - Last submit error, shown inline
 */

/** @type {TimeUpDialogProps} */
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  submitting: { type: Boolean, default: false },
  answered: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  error: { type: String, default: '' }
})

/**
 * @typedef {Object} TimeUpDialogEmits
 * @property {() => void} submit - The learner pressed Submit
 */
const emit = defineEmits(['submit'])
</script>

<template>
  <v-dialog :model-value="props.modelValue" max-width="440" persistent no-click-animation>
    <v-card class="pa-3 text-center" role="alertdialog" aria-labelledby="time-up-title">
      <v-card-text class="pt-6">
        <v-avatar color="error" variant="tonal" size="64" class="mb-4">
          <v-icon icon="mdi-timer-off-outline" size="32" />
        </v-avatar>
        <h2 id="time-up-title" class="text-title-large mb-2">Waktu habis</h2>
        <p class="text-body-medium mb-4">
          Waktu Try Out sudah habis. Kumpulkan jawabanmu untuk melihat skor.
        </p>
        <p class="text-body-medium text-medium-emphasis mb-0">
          <span class="app-figure text-title-medium text-high-emphasis">{{ props.answered }}</span>
          dari {{ props.total }} soal terjawab. Soal yang tidak dijawab bernilai 0.
        </p>
        <v-alert v-if="props.error" type="error" variant="tonal" density="compact" class="mt-4 text-start">
          {{ props.error }}
        </v-alert>
      </v-card-text>
      <v-card-actions class="px-4 pb-4">
        <v-btn
          color="primary"
          variant="flat"
          size="large"
          block
          prepend-icon="mdi-check-circle-outline"
          :loading="props.submitting"
          @click="emit('submit')"
        >
          Kumpulkan jawaban
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
