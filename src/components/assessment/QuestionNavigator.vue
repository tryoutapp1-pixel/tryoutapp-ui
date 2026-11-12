<script setup>
// FU12a / FU19a - question number navigation + answer status legend.
// Reused by both Latihan and Try Out. Purely presentational: it receives the
// question list, the answered-status map and the active index, and emits a
// navigation event. Answer status comes from real persisted answer data.
import { computed } from 'vue'

/**
 * @typedef {Object} NavigatorQuestion
 * @property {number} id
 * @property {number} number - Display number
 */

/**
 * @typedef {Object} QuestionNavigatorProps
 * @property {NavigatorQuestion[]} [questions]
 * @property {Record<number, number|null|{ correct: boolean }>} [answers] - questionId to optionId|null;
 *   in review mode, questionId to { correct }
 * @property {number} [activeIndex] - Index of the current question
 * @property {boolean} [review] - Highlights correct/incorrect instead of answered
 */

/** @type {QuestionNavigatorProps} */
const props = defineProps({
  questions: { type: Array, default: () => [] },
  answers: { type: Object, default: () => ({}) },
  activeIndex: { type: Number, default: 0 },
  review: { type: Boolean, default: false }
})

/**
 * @typedef {Object} QuestionNavigatorEmits
 * @property {(index: number) => void} navigate - Go to the question at this index
 */
const emit = defineEmits(['navigate'])

/** @type {import('vue').ComputedRef<{ label: string, color: string }[]>} */
const legend = computed(() =>
  props.review
    ? [
        { label: 'Correct', color: 'success' },
        { label: 'Incorrect', color: 'error' },
        { label: 'Not answered', color: 'grey' }
      ]
    : [
        { label: 'Answered', color: 'primary' },
        { label: 'Not answered', color: 'grey' },
        { label: 'Current', color: 'info' }
      ]
)

/**
 * @param {NavigatorQuestion} question
 * @param {number} index
 * @returns {string} Vuetify color name
 */
function tileColor(question, index) {
  if (!props.review && index === props.activeIndex) return 'info'
  const answered = Boolean(props.answers[question.id])
  if (props.review) {
    // In review mode answers map carries { correct: boolean } per question.
    const state = props.answers[question.id]
    if (!state) return 'grey'
    return state.correct ? 'success' : 'error'
  }
  return answered ? 'primary' : 'grey'
}

/**
 * @param {number} index
 * @returns {'flat'|'tonal'}
 */
function tileVariant(index) {
  return !props.review && index === props.activeIndex ? 'flat' : 'tonal'
}
</script>

<template>
  <v-card variant="outlined" class="pa-4">
    <h3 class="text-subtitle-2 font-weight-bold mb-3">Questions</h3>
    <div class="nav-grid mb-4">
      <v-btn
        v-for="(q, index) in questions"
        :key="q.id"
        :color="tileColor(q, index)"
        :variant="tileVariant(index)"
        size="small"
        class="nav-tile"
        @click="emit('navigate', index)"
      >
        {{ q.number }}
      </v-btn>
    </div>
    <v-divider class="mb-3" />
    <div class="d-flex flex-column ga-2">
      <div v-for="item in legend" :key="item.label" class="d-flex align-center ga-2">
        <span class="legend-swatch" :class="`bg-${item.color}`" />
        <span class="text-caption text-medium-emphasis">{{ item.label }}</span>
      </div>
    </div>
  </v-card>
</template>

<style scoped>
.nav-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  gap: 8px;
}
.nav-tile {
  min-width: 0;
  padding: 0;
}
.legend-swatch {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  display: inline-block;
}
</style>
