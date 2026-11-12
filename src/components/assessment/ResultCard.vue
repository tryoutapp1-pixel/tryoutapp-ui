<script setup>
// FU14 / FU21 - score result. Displays the backend-calculated result only; the
// frontend never computes scores. Shows total score, per-category (TWK/TIU/TKP)
// scores with pass/fail, and correct/wrong/unanswered counts when present.
import { formatDate } from '../../lib/format'

/** @typedef {'twk'|'tiu'|'tkp'} CategoryKey */

/**
 * @typedef {Object} ResultCardProps
 * @property {import('../../types/api').AttemptResult} result - Backend-calculated result
 */

/** @type {ResultCardProps} */
const props = defineProps({
  result: { type: Object, required: true }
})

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
  return props.result[`${key}_passed`]
}
</script>

<template>
  <v-card variant="outlined" class="pa-6">
    <div class="text-center mb-6">
      <div class="text-overline text-medium-emphasis">Total score</div>
      <div class="text-h2 font-weight-bold text-primary">{{ result.total_score }}</div>
      <v-chip
        size="small"
        :color="result.status === 'EXPIRED' ? 'error' : 'success'"
        variant="tonal"
        class="mt-2"
      >
        {{ result.status === 'EXPIRED' ? 'Time expired' : 'Completed' }}
      </v-chip>
    </div>

    <v-row>
      <v-col v-for="c in categories" :key="c.key" cols="12" sm="4">
        <v-card variant="tonal" :color="passed(c.key) ? 'success' : 'error'" class="pa-4 text-center">
          <div class="text-overline">{{ c.label }}</div>
          <div class="text-h5 font-weight-bold">{{ result[`${c.key}_score`] }}</div>
          <v-chip size="x-small" variant="flat" class="mt-1">
            {{ passed(c.key) ? 'Passed' : 'Not passed' }}
          </v-chip>
        </v-card>
      </v-col>
    </v-row>

    <v-divider class="my-5" />

    <v-row class="text-center">
      <v-col cols="4">
        <div class="text-h6 font-weight-bold text-success">{{ result.total_correct }}</div>
        <div class="text-caption text-medium-emphasis">Correct</div>
      </v-col>
      <v-col cols="4">
        <div class="text-h6 font-weight-bold text-error">{{ result.total_wrong }}</div>
        <div class="text-caption text-medium-emphasis">Wrong</div>
      </v-col>
      <v-col cols="4">
        <div class="text-h6 font-weight-bold text-medium-emphasis">{{ result.total_unanswered }}</div>
        <div class="text-caption text-medium-emphasis">Unanswered</div>
      </v-col>
    </v-row>

    <p v-if="result.completed_at" class="text-caption text-medium-emphasis text-center mt-4 mb-0">
      Completed {{ formatDate(result.completed_at) }}
    </p>
  </v-card>
</template>
