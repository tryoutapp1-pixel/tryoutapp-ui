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
        { label: 'Benar', color: 'success' },
        { label: 'Salah', color: 'error' },
        { label: 'Tidak dijawab', color: 'secondary' }
      ]
    : [
        { label: 'Terjawab', color: 'primary' },
        { label: 'Belum dijawab', color: 'secondary' },
        { label: 'Sedang dibuka', color: 'info' }
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
    if (!state) return 'secondary'
    return state.correct ? 'success' : 'error'
  }
  return answered ? 'primary' : 'secondary'
}

/**
 * Presentational: LJK bubble modifier for a legend color.
 * @param {string} color
 * @returns {string}
 */
function legendBubble(color) {
  return (
    {
      primary: 'app-bubble--filled',
      success: 'app-bubble--correct',
      error: 'app-bubble--wrong',
      info: 'app-bubble--current'
    }[color] || ''
  )
}

/**
 * Presentational: LJK bubble modifiers for a question button. The current
 * question keeps its answered fill and gets the ring on top.
 * @param {NavigatorQuestion} question
 * @param {number} index
 * @returns {Record<string, boolean>}
 */
function bubbleClass(question, index) {
  const color = tileColor(question, index)
  return {
    'app-bubble--filled': color === 'primary' || (color === 'info' && Boolean(props.answers[question.id])),
    'app-bubble--current': color === 'info',
    'app-bubble--correct': color === 'success',
    'app-bubble--wrong': color === 'error'
  }
}

/**
 * Presentational: accessible name for a question button, e.g. "Soal 5, terjawab".
 * @param {NavigatorQuestion} question
 * @param {number} index
 * @returns {string}
 */
function bubbleLabel(question, index) {
  let state
  if (props.review) {
    const color = tileColor(question, index)
    state = color === 'success' ? 'benar' : color === 'error' ? 'salah' : 'tidak dijawab'
  } else {
    state = props.answers[question.id] ? 'terjawab' : 'belum dijawab'
  }
  return `Soal ${question.number}, ${state}`
}

/**
 * Presentational: small icon on review bubbles so correct and wrong are not
 * told apart by color alone.
 * @param {NavigatorQuestion} question
 * @param {number} index
 * @returns {string}
 */
function reviewIcon(question, index) {
  if (!props.review) return ''
  const color = tileColor(question, index)
  if (color === 'success') return 'mdi-check'
  if (color === 'error') return 'mdi-close'
  return ''
}
</script>

<template>
  <v-card class="pa-4 pa-md-5">
    <h2 id="question-nav-title" class="text-title-small mb-4">Daftar soal</h2>
    <nav class="nav-grid mb-5" aria-labelledby="question-nav-title">
      <button
        v-for="(q, index) in questions"
        :key="q.id"
        type="button"
        class="app-bubble nav-bubble"
        :class="bubbleClass(q, index)"
        :aria-label="bubbleLabel(q, index)"
        :aria-current="!review && index === activeIndex ? 'step' : undefined"
        @click="emit('navigate', index)"
      >
        {{ q.number }}
        <v-icon
          v-if="reviewIcon(q, index)"
          :icon="reviewIcon(q, index)"
          :color="tileColor(q, index)"
          size="12"
          class="nav-bubble__badge"
          aria-hidden="true"
        />
      </button>
    </nav>
    <v-divider class="mb-4" />
    <ul class="nav-legend d-flex flex-wrap gc-4 gr-2 text-body-small text-medium-emphasis">
      <li v-for="item in legend" :key="item.label" class="d-inline-flex align-center ga-2">
        <span class="app-bubble app-bubble--sm" :class="legendBubble(item.color)" aria-hidden="true" />
        {{ item.label }}
      </li>
    </ul>
  </v-card>
</template>

<style scoped>
.nav-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  gap: 8px;
  justify-items: center;
}

/* Native button rendered as an LJK bubble; 40px keeps a comfortable touch
   target. Only properties the bubble modifiers do not set are styled here. */
.nav-bubble {
  --app-bubble-size: 40px;
  position: relative;
  padding: 0;
  cursor: pointer;
}

.nav-bubble:not(.app-bubble--filled):not(.app-bubble--correct):not(.app-bubble--wrong):not(.app-bubble--current):hover {
  border-color: rgb(var(--v-theme-primary));
  background: rgb(var(--v-theme-surface-light));
}

.nav-bubble__badge {
  position: absolute;
  top: -4px;
  right: -4px;
  inline-size: 16px;
  block-size: 16px;
  border-radius: 50%;
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 0 0 1.5px currentColor;
}

.nav-legend {
  list-style: none;
  padding: 0;
  margin: 0;
}
</style>
