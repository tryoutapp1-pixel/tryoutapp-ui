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
    <v-card class="pa-2 text-center" role="alertdialog" aria-labelledby="time-up-title">
      <v-card-text class="pt-6">
        <v-icon icon="mdi-timer-off-outline" color="error" size="52" class="mb-3" />
        <h2 id="time-up-title" class="text-h6 font-weight-bold mb-2">Time is up</h2>
        <p class="text-body-2 mb-1">Your Try Out time has run out. Submit your attempt to see your score.</p>
        <p class="text-body-2 text-medium-emphasis mb-0">
          {{ props.answered }} of {{ props.total }} questions answered. Unanswered questions score 0.
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
          Submit attempt
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
