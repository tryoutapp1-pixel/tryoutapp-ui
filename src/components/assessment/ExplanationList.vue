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
  correct: { color: 'success', label: 'Benar' },
  wrong: { color: 'error', label: 'Salah' },
  scored: { color: 'info', label: 'Terjawab' },
  unanswered: { color: 'secondary', label: 'Tidak dijawab' }
}

/**
 * Presentational: LJK bubble modifier per review state.
 * @type {Record<ReviewState, string>}
 */
const STATE_BUBBLE = {
  correct: 'app-bubble--correct',
  wrong: 'app-bubble--wrong',
  scored: 'app-bubble--filled',
  unanswered: ''
}

/**
 * Presentational: icon per review state, so status is not told by color alone.
 * @type {Record<ReviewState, string>}
 */
const STATE_ICON = {
  correct: 'mdi-check-circle',
  wrong: 'mdi-close-circle',
  scored: 'mdi-record-circle-outline',
  unanswered: 'mdi-minus-circle-outline'
}

/**
 * Presentational: small corner mark on navigator bubbles.
 * @param {ReviewState} state
 * @returns {string}
 */
function stateBadge(state) {
  if (state === 'correct') return 'mdi-check'
  if (state === 'wrong') return 'mdi-close'
  return ''
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
  return { icon: 'mdi-circle-outline', color: 'secondary' }
}

/**
 * Presentational: LJK bubble modifier for an option letter, derived from the
 * same rules as optionClass.
 * @param {ExplanationItem} question
 * @param {ExplanationOption} option
 * @returns {string}
 */
function optionBubble(question, option) {
  return (
    {
      'option-correct': 'app-bubble--correct',
      'option-wrong': 'app-bubble--wrong',
      'option-selected': 'app-bubble--filled'
    }[optionClass(question, option)] || ''
  )
}

/** @param {number} score */
const formatScore = (score) => (Number.isInteger(score) ? String(score) : score.toFixed(2))

/** @param {number} index */
function go(index) {
  if (index >= 0 && index < props.questions.length) activeIndex.value = index
}
</script>

<template>
  <!-- Below ~880px of available width the navigator sits above the review card
       (original order); wider, it becomes a sticky column on the right. -->
  <div class="review">
    <div class="review-layout">
      <v-card class="review-nav pa-4 pa-md-5">
        <h2 id="review-nav-title" class="text-title-small mb-4">Daftar soal</h2>
        <nav class="nav-grid mb-5" aria-labelledby="review-nav-title">
          <button
            v-for="(q, i) in questions"
            :key="q.id"
            type="button"
            class="app-bubble nav-bubble"
            :class="[STATE_BUBBLE[reviewState(q)], { 'app-bubble--current': i === activeIndex }]"
            :aria-label="`Soal ${q.number}: ${STATE_META[reviewState(q)].label}`"
            :aria-current="i === activeIndex ? 'step' : undefined"
            @click="go(i)"
          >
            {{ q.number }}
            <v-icon
              v-if="stateBadge(reviewState(q))"
              :icon="stateBadge(reviewState(q))"
              :color="STATE_META[reviewState(q)].color"
              size="12"
              class="nav-bubble__badge"
              aria-hidden="true"
            />
          </button>
        </nav>
        <v-divider class="mb-4" />
        <ul class="nav-legend d-flex flex-wrap gc-4 gr-2 text-body-small text-medium-emphasis">
          <li v-for="(meta, key) in STATE_META" :key="key" class="d-inline-flex align-center ga-2">
            <span class="app-bubble app-bubble--sm" :class="STATE_BUBBLE[key]" aria-hidden="true" />
            {{ meta.label }}
          </li>
          <li class="d-inline-flex align-center ga-2">
            <span class="app-bubble app-bubble--sm app-bubble--current" aria-hidden="true" />
            Sedang dibuka
          </li>
        </ul>
      </v-card>

      <v-card v-if="active" class="review-card pa-5 pa-md-6">
        <div class="d-flex align-center flex-wrap ga-3 mb-5">
          <h2 class="d-flex align-center ga-2 text-title-large mb-0">
            <span>Soal</span>
            <span class="app-bubble app-bubble--lg app-bubble--current">{{ active.number }}</span>
          </h2>
          <v-chip size="small" variant="tonal" color="secondary">{{ active.type }}</v-chip>
          <v-chip
            size="small"
            variant="flat"
            :color="STATE_META[reviewState(active)].color"
            :prepend-icon="STATE_ICON[reviewState(active)]"
            class="ms-auto"
          >
            {{ STATE_META[reviewState(active)].label }}<template v-if="selectedOption(active)">, skor {{ formatScore(selectedOption(active).score) }}</template>
          </v-chip>
        </div>

        <p class="app-reading pre-line mb-6">{{ active.question }}</p>
        <SignedImage
          v-if="active.question_image_url"
          :src="active.question_image_url"
          :alt="`Gambar soal ${active.number}`"
          class="mb-6"
          @refresh="emit('refresh')"
        />

        <div class="d-flex flex-column ga-3 mb-5">
          <div
            v-for="opt in active.options"
            :key="opt.id"
            class="option-row rounded-lg pa-3 pa-sm-4"
            :class="optionClass(active, opt)"
          >
            <div class="d-flex align-start ga-3">
              <span class="app-bubble" :class="optionBubble(active, opt)" aria-hidden="true">{{ opt.code }}</span>
              <div class="option-body flex-grow-1 text-body-large">
                <span class="d-sr-only">Pilihan {{ opt.code }}: </span>{{ opt.text }}
                <SignedImage
                  v-if="opt.image_url"
                  :src="opt.image_url"
                  :alt="`Gambar pilihan ${opt.code}`"
                  :max-height="200"
                  class="mt-2"
                  @refresh="emit('refresh')"
                />
                <div v-if="opt.is_selected || (hasCorrectAnswer(active) && opt.is_correct)" class="d-flex flex-wrap ga-2 mt-2">
                  <v-chip
                    v-if="opt.is_selected"
                    size="small"
                    variant="flat"
                    :color="optionIcon(active, opt).color"
                    prepend-icon="mdi-account-outline"
                  >
                    Jawabanmu
                  </v-chip>
                  <v-chip
                    v-if="hasCorrectAnswer(active) && opt.is_correct"
                    size="small"
                    variant="flat"
                    color="success"
                    prepend-icon="mdi-check"
                  >
                    Jawaban benar
                  </v-chip>
                </div>
              </div>
              <v-icon v-bind="optionIcon(active, opt)" class="option-state-icon mt-1" />
              <span class="score" :aria-label="`Skor ${formatScore(opt.score)}`">
                <span class="d-block app-figure text-title-medium">{{ formatScore(opt.score) }}</span>
                <span class="d-block text-body-small text-medium-emphasis" aria-hidden="true">skor</span>
              </span>
            </div>
          </div>
        </div>

        <v-alert v-if="!selectedOption(active)" type="info" variant="tonal" density="compact" class="mb-5">
          Kamu tidak menjawab soal ini, jadi skornya 0.
        </v-alert>

        <v-divider class="mb-5" />
        <h3 class="d-flex align-center ga-2 text-title-medium mb-3">
          <v-icon icon="mdi-lightbulb-on-outline" color="primary" size="20" aria-hidden="true" />
          Pembahasan
        </h3>

        <template v-if="showExplanation">
          <p class="app-reading pre-line mb-4">{{ active.explanation || 'Belum ada pembahasan untuk soal ini.' }}</p>
          <SignedImage
            v-if="active.explanation_image_url"
            :src="active.explanation_image_url"
            :alt="`Gambar pembahasan soal ${active.number}`"
            @refresh="emit('refresh')"
          />
        </template>
        <PremiumNotice
          v-else
          title="Pembahasan khusus Premium"
          message="Jawabanmu, jawaban yang benar, dan skor setiap pilihan sudah tampil di atas. Upgrade ke Premium untuk membaca pembahasan setiap soal."
        />

        <div class="d-flex justify-space-between flex-wrap ga-3 mt-6">
          <v-btn
            variant="tonal"
            color="primary"
            :disabled="activeIndex === 0"
            prepend-icon="mdi-chevron-left"
            @click="go(activeIndex - 1)"
          >
            Sebelumnya
          </v-btn>
          <v-btn
            variant="tonal"
            color="primary"
            :disabled="activeIndex === questions.length - 1"
            append-icon="mdi-chevron-right"
            @click="go(activeIndex + 1)"
          >
            Berikutnya
          </v-btn>
        </div>
      </v-card>
    </div>
  </div>
</template>

<style scoped>
.review {
  container-type: inline-size;
}

.review-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
}

@container (min-width: 880px) {
  .review-layout {
    grid-template-columns: minmax(0, 1fr) 300px;
    column-gap: 24px;
    align-items: start;
  }
  .review-card {
    grid-column: 1;
    grid-row: 1;
  }
  /* Sticks under the 72px app bar and scrolls on its own if it is taller
     than the viewport. */
  .review-nav {
    grid-column: 2;
    grid-row: 1;
    position: sticky;
    top: 96px;
    max-height: calc(100vh - 120px);
    overflow-y: auto;
  }
}

.nav-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  gap: 8px;
  justify-items: center;
}

/* Native button rendered as an LJK bubble. Only properties the bubble
   modifiers do not set are styled here. */
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

.pre-line {
  white-space: pre-line;
}

/* Review option row: border + tint + bubble + icon + chip label. */
.option-row {
  border: 1px solid rgb(var(--app-line));
}
.option-correct {
  border-color: rgb(var(--v-theme-success));
  background-color: rgba(var(--v-theme-success), 0.07);
  box-shadow: inset 0 0 0 1px rgb(var(--v-theme-success));
}
.option-wrong {
  border-color: rgb(var(--v-theme-error));
  background-color: rgba(var(--v-theme-error), 0.06);
  box-shadow: inset 0 0 0 1px rgb(var(--v-theme-error));
}
.option-selected {
  border-color: rgb(var(--v-theme-info));
  background-color: rgba(var(--v-theme-info), 0.07);
  box-shadow: inset 0 0 0 1px rgb(var(--v-theme-info));
}

.option-body {
  min-width: 0;
  padding-top: 3px;
  overflow-wrap: anywhere;
}

/* The plain circle on options that are neither chosen nor correct is quiet. */
.option-row:not(.option-correct):not(.option-wrong):not(.option-selected) .option-state-icon {
  opacity: 0.4;
}

.score {
  min-width: 2.5rem;
  padding-top: 4px;
  text-align: end;
}
</style>
