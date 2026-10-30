<script setup>
// FU12c / FU19c - progress indicator. Shows answered/total and a progress bar.
// Values are derived from persisted answer state in the attempt store.
import { computed } from 'vue'

const props = defineProps({
  answered: { type: Number, default: 0 },
  total: { type: Number, default: 0 }
})

const percent = computed(() => (props.total ? Math.round((props.answered / props.total) * 100) : 0))
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-1">
      <span class="text-caption text-medium-emphasis">Progress</span>
      <span class="text-caption font-weight-medium">{{ answered }} / {{ total }}</span>
    </div>
    <v-progress-linear :model-value="percent" color="primary" height="8" rounded />
  </div>
</template>
