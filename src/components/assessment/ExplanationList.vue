<script setup>
// Review of a finalized attempt, one question at a time. Everything except the
// written explanation comes from the backend for Free and Premium users:
//  - `is_selected` marks the learner's answer (all question types)
//  - `is_correct` marks the correct answer (TWK and TIU only)
//  - `score` is shown for every option, so TKP learners see what their choice earned
// The written explanation and its image are Premium only; Free users see an
// upgrade prompt in their place.
import { computed, ref } from 'vue'
import SignedImage from './SignedImage.vue'
import PremiumNotice from './PremiumNotice.vue'

/** @typedef {import('../../types/api').ExplanationItem} ExplanationItem */
/** @typedef {import('../../types/api').ExplanationOption} ExplanationOption */
/** @typedef {'correct'|'wrong'|'scored'|'unanswered'} ReviewState */

/**
 * @typedef {Object} ExplanationListProps
 * @property {ExplanationItem[]} questions
 * @property {boolean} [showExplanation=true] - False hides the written explanation behind a Premium prompt
 */

/** @type {ExplanationListProps} */
const props = defineProps({
  questions: { type: Array, default: () => [] },
  showExplanation: { type: Boolean, default: true }
})

/**
 * @typedef {Object} ExplanationListEmits
 * @property {() => void} refresh - A signed image URL expired
 */
const emit = defineEmits(['refresh'])

const activeIndex = ref(0)
const active = computed(() => props.questions[activeIndex.value] || null)

/** @param {ExplanationItem} question */
const hasCorrectAnswer = (question) => question.type !== 'TKP'

/** @param {ExplanationItem} question */
function selectedOption(question) {
  return question.options.find((option) => option.is_selected) || null
}

/**
 * @param {ExplanationItem} question
 * @returns {ReviewState}
 */
function reviewState(question) {
  const selected = selectedOption(question)
  if (!selected) return 'unanswered'
  if (!hasCorrectAnswer(question)) return 'scored'
  return selected.is_correct ? 'correct' : 'wrong'
}

/** @type {Record<ReviewState, { color: string, label: string }>} */
const STATE_META = {
  correct: { color: 'success', label: 'Correct' },
  wrong: { color: 'error', label: 'Wrong' },
  scored: { color: 'info', label: 'Answered' },
  unanswered: { color: 'grey', label: 'Not answered' }
}

/**
 * @param {ExplanationItem} question
 * @param {ExplanationOption} option
 */
function optionClass(question, option) {
  if (hasCorrectAnswer(question) && option.is_correct) return 'option-correct'
  if (option.is_selected) return hasCorrectAnswer(question) ? 'option-wrong' : 'option-selected'
  return ''
}

/**
 * @param {ExplanationItem} question
 * @param {ExplanationOption} option
 */
function optionIcon(question, option) {
  if (hasCorrectAnswer(question) && option.is_correct) return { icon: 'mdi-check-circle', color: 'success' }
  if (option.is_selected) {
    return hasCorrectAnswer(question) ? { icon: 'mdi-close-circle', color: 'error' } : { icon: 'mdi-record-circle', color: 'info' }
  }
  return { icon: 'mdi-circle-outline', color: 'grey' }
}

/** @param {number} score */
const formatScore = (score) => (Number.isInteger(score) ? String(score) : score.toFixed(2))

/** @param {number} index */
function go(index) {
  if (index >= 0 && index < props.questions.length) activeIndex.value = index
}
</script>

<template>
  <div>
    <nav class="nav-grid mb-2" aria-label="Questions">
      <v-btn
        v-for="(q, i) in questions"
        :key="q.id"
        size="small"
        :variant="i === activeIndex ? 'flat' : 'tonal'"
        :color="STATE_META[reviewState(q)].color"
        :class="['nav-tile', { 'nav-tile-active': i === activeIndex }]"
        :aria-label="`Question ${q.number}: ${STATE_META[reviewState(q)].label}`"
        :aria-current="i === activeIndex ? 'step' : undefined"
        @click="go(i)"
      >
        {{ q.number }}
      </v-btn>
    </nav>
    <div class="d-flex flex-wrap ga-4 text-caption text-medium-emphasis mb-4">
      <span v-for="(meta, key) in STATE_META" :key="key" class="d-flex align-center ga-1">
        <v-icon icon="mdi-square-rounded" :color="meta.color" size="14" />
        {{ meta.label }}
      </span>
    </div>

    <v-card v-if="active" variant="outlined" class="pa-6">
      <div class="d-flex align-center flex-wrap ga-2 mb-3">
        <span class="text-subtitle-1 font-weight-bold">Question {{ active.number }}</span>
        <v-chip size="x-small" variant="tonal" color="secondary">{{ active.type }}</v-chip>
        <v-chip size="x-small" variant="flat" :color="STATE_META[reviewState(active)].color" class="ms-auto">
          {{ STATE_META[reviewState(active)].label }}
          <template v-if="selectedOption(active)">
            · {{ formatScore(selectedOption(active).score) }} pts
          </template>
        </v-chip>
      </div>

      <p class="text-body-1 mb-4 pre-line">{{ active.question }}</p>
      <SignedImage
        v-if="active.question_image_url"
        :src="active.question_image_url"
        :alt="`Question ${active.number} image`"
        class="mb-4"
        @refresh="emit('refresh')"
      />

      <div class="d-flex flex-column ga-2 mb-4">
        <div
          v-for="opt in active.options"
          :key="opt.id"
          class="option-row rounded-lg pa-3"
          :class="optionClass(active, opt)"
        >
          <div class="d-flex align-start ga-3">
            <v-icon v-bind="optionIcon(active, opt)" class="mt-1" />
            <div class="flex-grow-1">
              <span class="font-weight-medium me-1">{{ opt.code }}.</span>{{ opt.text }}
              <SignedImage
                v-if="opt.image_url"
                :src="opt.image_url"
                :alt="`Option ${opt.code} image`"
                :max-height="200"
                class="mt-2"
                @refresh="emit('refresh')"
              />
              <div v-if="opt.is_selected || (hasCorrectAnswer(active) && opt.is_correct)" class="d-flex flex-wrap ga-1 mt-2">
                <v-chip v-if="opt.is_selected" size="x-small" variant="flat" :color="optionIcon(active, opt).color">
                  Your answer
                </v-chip>
                <v-chip v-if="hasCorrectAnswer(active) && opt.is_correct" size="x-small" variant="flat" color="success">
                  Correct answer
                </v-chip>
              </div>
            </div>
            <span class="score text-body-2 font-weight-bold" :aria-label="`Score ${formatScore(opt.score)}`">
              {{ formatScore(opt.score) }}
            </span>
          </div>
        </div>
      </div>

      <v-alert v-if="!selectedOption(active)" type="info" variant="tonal" density="compact" class="mb-4">
        You did not answer this question, so it scored 0.
      </v-alert>

      <v-divider class="mb-3" />
      <h3 class="text-subtitle-2 font-weight-bold mb-2">Explanation</h3>

      <template v-if="showExplanation">
        <p class="text-body-2 mb-3 pre-line">{{ active.explanation || 'No explanation provided.' }}</p>
        <SignedImage
          v-if="active.explanation_image_url"
          :src="active.explanation_image_url"
          :alt="`Explanation ${active.number} image`"
          @refresh="emit('refresh')"
        />
      </template>
      <PremiumNotice
        v-else
        title="Explanations are a Premium feature"
        message="Your answers, the correct answers, and every option's score are shown above. Upgrade to Premium to read the explanation for each question."
      />

      <div class="d-flex justify-space-between mt-5">
        <v-btn variant="text" :disabled="activeIndex === 0" prepend-icon="mdi-chevron-left" @click="go(activeIndex - 1)">
          Previous
        </v-btn>
        <v-btn
          variant="text"
          :disabled="activeIndex === questions.length - 1"
          append-icon="mdi-chevron-right"
          @click="go(activeIndex + 1)"
        >
          Next
        </v-btn>
      </div>
    </v-card>
  </div>
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
.nav-tile-active {
  outline: 2px solid rgb(var(--v-theme-on-surface));
  outline-offset: 2px;
}
.pre-line {
  white-space: pre-line;
}
.option-row {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.option-correct {
  border-color: rgb(var(--v-theme-success));
  background-color: rgba(var(--v-theme-success), 0.08);
}
.option-wrong {
  border-color: rgb(var(--v-theme-error));
  background-color: rgba(var(--v-theme-error), 0.06);
}
.option-selected {
  border-color: rgb(var(--v-theme-info));
  background-color: rgba(var(--v-theme-info), 0.08);
}
.score {
  min-width: 2.5rem;
  text-align: end;
  font-variant-numeric: tabular-nums;
}
</style>
