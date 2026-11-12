<script setup>
// One row in an assessment's attempt history (Feature 1 / Feature 2).
//
// Shows the metadata the backend provides for a finalized attempt (completed
// date, status, total and per-category scores) and offers a button that opens
// that attempt's result page. The attempt_id identifies the individual attempt,
// never the assessment, so the result page loads the correct attempt.
import StatusChip from '../StatusChip.vue'
import { formatDate } from '../../lib/format'

/** @typedef {import('../../types/api').AttemptHistoryEntry} AttemptHistoryEntry */

/**
 * @typedef {Object} AttemptHistoryItemProps
 * @property {AttemptHistoryEntry} attempt - The attempt shown in this row
 * @property {number} [index] - Ordinal label (e.g. 1 for "Attempt 1"); presentation only
 */

/** @type {AttemptHistoryItemProps} */
const props = defineProps({
  attempt: { type: Object, required: true },
  index: { type: Number, default: 0 }
})

/**
 * @typedef {Object} AttemptHistoryItemEmits
 * @property {(attempt: AttemptHistoryEntry) => void} view - Continue or view the result of this attempt
 */
defineEmits(['view'])
</script>

<template>
  <v-card variant="outlined" class="pa-4">
    <div class="d-flex align-center justify-space-between flex-wrap ga-3">
      <div class="d-flex align-center ga-3">
        <v-avatar color="primary" variant="tonal" size="40">
          <span class="font-weight-bold">{{ index }}</span>
        </v-avatar>
        <div>
          <div class="d-flex align-center ga-2">
            <span class="text-subtitle-2 font-weight-bold">Attempt {{ index }}</span>
            <StatusChip :value="attempt.status" />
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ attempt.completed_at ? formatDate(attempt.completed_at) : 'In progress' }}
          </div>
        </div>
      </div>

      <div class="d-flex align-center ga-4">
        <div v-if="attempt.status !== 'IN_PROGRESS'" class="text-center">
          <div class="text-caption text-medium-emphasis">Score</div>
          <div class="text-h6 font-weight-bold text-primary">{{ attempt.total_score }}</div>
        </div>
        <v-btn
          v-if="attempt.status === 'IN_PROGRESS'"
          color="primary"
          variant="flat"
          prepend-icon="mdi-play"
          @click="$emit('view', attempt)"
        >
          Continue
        </v-btn>
        <v-btn
          v-else
          color="primary"
          variant="tonal"
          append-icon="mdi-arrow-right"
          @click="$emit('view', attempt)"
        >
          View result
        </v-btn>
      </div>
    </div>

    <v-row
      v-if="attempt.status !== 'IN_PROGRESS'"
      class="text-center mt-1"
      dense
      no-gutters
    >
      <v-col cols="4">
        <div class="text-caption text-medium-emphasis">TWK</div>
        <div class="font-weight-medium">{{ attempt.twk_score }}</div>
      </v-col>
      <v-col cols="4">
        <div class="text-caption text-medium-emphasis">TIU</div>
        <div class="font-weight-medium">{{ attempt.tiu_score }}</div>
      </v-col>
      <v-col cols="4">
        <div class="text-caption text-medium-emphasis">TKP</div>
        <div class="font-weight-medium">{{ attempt.tkp_score }}</div>
      </v-col>
    </v-row>
  </v-card>
</template>
