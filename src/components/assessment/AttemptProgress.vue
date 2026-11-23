<script setup>
// FU12c / FU19c - progress indicator. Shows answered/total and a progress bar.
// Values are derived from persisted answer state in the attempt store.
import { computed } from 'vue'

/**
 * @typedef {Object} AttemptProgressProps
 * @property {number} [answered] - Questions answered so far
 * @property {number} [total] - Questions in the attempt
 */

/** @type {AttemptProgressProps} */
const props = defineProps({
  answered: { type: Number, default: 0 },
  total: { type: Number, default: 0 }
})

const percent = computed(() => (props.total ? Math.round((props.answered / props.total) * 100) : 0))
</script>

<template>
  <div>
    <div class="d-flex flex-wrap align-baseline justify-space-between gc-2 mb-2">
      <span class="text-body-small text-medium-emphasis">Soal terjawab</span>
      <span class="text-title-small">
        <span class="app-figure">{{ answered }}</span>
        <span class="text-medium-emphasis"> dari {{ total }}</span>
      </span>
    </div>
    <v-progress-linear
      :model-value="percent"
      color="primary"
      height="8"
      rounded
      :aria-label="`${answered} dari ${total} soal terjawab`"
    />
  </div>
</template>
