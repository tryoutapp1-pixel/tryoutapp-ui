<script setup>
// One row in an assessment's attempt history (Feature 1 / Feature 2).
//
// Shows the backend-calculated result of a finalized attempt: completed date,
// status, total score, per-category (TWK/TIU/TKP) scores with pass/fail, and
// correct/wrong/unanswered counts. The frontend never computes scores.
// Finalized rows offer a review button that opens the answer review for that
// attempt; an in-progress row offers Continue. Both identify the attempt by
// attempt_id, never by the assessment id.
import StatusChip from '../StatusChip.vue'
import { formatDate } from '../../lib/format'

/** @typedef {import('../../types/api').AttemptHistoryEntry} AttemptHistoryEntry */
/** @typedef {'twk'|'tiu'|'tkp'} CategoryKey */

/**
 * @typedef {Object} AttemptHistoryItemProps
 * @property {AttemptHistoryEntry} attempt - The attempt shown in this row
 * @property {number} [index] - Ordinal label (e.g. 1 for "Attempt 1"); presentation only
 * @property {boolean} [premium] - Premium users also get written explanations
 */

/** @type {AttemptHistoryItemProps} */
const props = defineProps({
  attempt: { type: Object, required: true },
  index: { type: Number, default: 0 },
  premium: { type: Boolean, default: false }
})

/**
 * @typedef {Object} AttemptHistoryItemEmits
 * @property {(attempt: AttemptHistoryEntry) => void} review - Open the answer review of this attempt
 * @property {(attempt: AttemptHistoryEntry) => void} continue - Resume this in-progress attempt
 */
defineEmits(['review', 'continue'])

/** @type {{ key: CategoryKey, label: string }[]} */
const categories = [
  { key: 'twk', label: 'TWK' },
  { key: 'tiu', label: 'TIU' },
  { key: 'tkp', label: 'TKP' }
]

/**
 * @param {CategoryKey} key
 * @returns {boolean} Whether the category passed, as reported by the backend
 */
function passed(key) {
  return Boolean(props.attempt[`${key}_passed`])
}
</script>

<template>
  <v-card class="pa-4 pa-md-5">
    <div class="d-flex align-center justify-space-between flex-wrap ga-3">
      <div class="d-flex align-center ga-3">
        <v-avatar color="surface-light" rounded="lg" size="44">
          <span class="app-figure text-title-medium text-primary">{{ index }}</span>
        </v-avatar>
        <div>
          <div class="d-flex flex-wrap align-center ga-2">
            <span class="text-title-small">Pengerjaan {{ index }}</span>
            <StatusChip :value="attempt.status" />
          </div>
          <div class="text-body-small text-medium-emphasis">
            {{ attempt.completed_at ? formatDate(attempt.completed_at) : 'Sedang berlangsung' }}
          </div>
        </div>
      </div>

      <div class="d-flex align-center ga-4 ms-auto">
        <div v-if="attempt.status !== 'IN_PROGRESS'" class="text-end">
          <div class="text-body-small text-medium-emphasis">Skor total</div>
          <div class="app-figure text-headline-small text-primary">{{ attempt.total_score }}</div>
        </div>
        <v-btn
          v-if="attempt.status === 'IN_PROGRESS'"
          color="primary"
          variant="flat"
          prepend-icon="mdi-play"
          @click="$emit('continue', attempt)"
        >
          Lanjutkan
        </v-btn>
        <v-btn
          v-else
          color="primary"
          variant="tonal"
          prepend-icon="mdi-book-open-variant"
          @click="$emit('review', attempt)"
        >
          Lihat jawaban
        </v-btn>
      </div>
    </div>

    <template v-if="attempt.status !== 'IN_PROGRESS'">
      <v-row class="mt-3" dense>
        <v-col v-for="c in categories" :key="c.key" cols="4">
          <div class="border rounded-lg pa-2 pa-sm-3 h-100">
            <div class="text-label-medium text-medium-emphasis">{{ c.label }}</div>
            <div class="app-figure text-title-large my-1">{{ attempt[`${c.key}_score`] }}</div>
            <div
              class="d-flex align-center ga-1 text-body-small font-weight-bold"
              :class="passed(c.key) ? 'text-success' : 'text-error'"
            >
              <v-icon :icon="passed(c.key) ? 'mdi-check-circle' : 'mdi-close-circle'" size="14" />
              {{ passed(c.key) ? 'Lulus' : 'Belum lulus' }}
            </div>
          </div>
        </v-col>
      </v-row>

      <v-row class="mt-2" dense no-gutters>
        <v-col cols="4">
          <div class="app-figure text-title-medium text-success">{{ attempt.total_correct }}</div>
          <div class="text-body-small text-medium-emphasis">Benar</div>
        </v-col>
        <v-col cols="4">
          <div class="app-figure text-title-medium text-error">{{ attempt.total_wrong }}</div>
          <div class="text-body-small text-medium-emphasis">Salah</div>
        </v-col>
        <v-col cols="4">
          <div class="app-figure text-title-medium text-medium-emphasis">{{ attempt.total_unanswered }}</div>
          <div class="text-body-small text-medium-emphasis">Tidak dijawab</div>
        </v-col>
      </v-row>
    </template>
  </v-card>
</template>
