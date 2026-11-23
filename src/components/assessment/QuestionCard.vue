<script setup>
// FU12b / FU19b - question text + optional image, and multiple-choice options
// (each with optional image). Reused by Latihan and Try Out. Emits the selected
// option id; the parent persists it. A per-question save status is shown so the
// learner knows an answer is saving / saved / failed (never a fake "saved").
import SignedImage from './SignedImage.vue'

/** @typedef {import('../../types/api').AttemptQuestion} AttemptQuestion */
/** @typedef {'idle'|'saving'|'saved'|'error'} SaveStatus */

/**
 * @typedef {Object} QuestionCardProps
 * @property {AttemptQuestion} question - Question with its options and attachments
 * @property {number|null} [selectedOptionId] - The learner's current answer
 * @property {SaveStatus} [saveStatus] - Save state of this question's answer
 * @property {boolean} [disabled] - Blocks answer changes
 */

/** @type {QuestionCardProps} */
const props = defineProps({
  question: { type: Object, required: true },
  selectedOptionId: { type: [Number, null], default: null },
  saveStatus: { type: String, default: 'idle' },
  disabled: { type: Boolean, default: false }
})

/**
 * @typedef {Object} QuestionCardEmits
 * @property {(optionId: number) => void} select - The learner picked an option
 * @property {() => void} retry - Retry a failed save
 * @property {() => void} refresh - A signed image URL expired
 */
const emit = defineEmits(['select', 'retry', 'refresh'])

/** @type {Partial<Record<SaveStatus, { icon: string, color: string, text: string }>>} */
const statusMeta = {
  saving: { icon: 'mdi-loading mdi-spin', color: 'info', text: 'Menyimpan...' },
  saved: { icon: 'mdi-check-circle-outline', color: 'success', text: 'Tersimpan' },
  error: { icon: 'mdi-alert-circle-outline', color: 'error', text: 'Gagal menyimpan' }
}

/**
 * Presentational: accessible name for an option's radio input.
 * @param {{ code: string, text?: string }} opt
 * @returns {string}
 */
function optionLabel(opt) {
  return opt.text ? `Pilihan ${opt.code}: ${opt.text}` : `Pilihan ${opt.code}`
}
</script>

<template>
  <v-card class="pa-5 pa-md-6">
    <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-5">
      <div class="d-flex align-center ga-3">
        <h2 class="d-flex align-center ga-2 text-title-large mb-0">
          <span>Soal</span>
          <span class="app-bubble app-bubble--lg app-bubble--current">{{ question.number }}</span>
        </h2>
        <v-chip size="small" variant="tonal" color="secondary">{{ question.type }}</v-chip>
      </div>
      <div aria-live="polite">
        <div v-if="statusMeta[saveStatus]" class="d-flex align-center ga-1">
          <v-icon :icon="statusMeta[saveStatus].icon" :color="statusMeta[saveStatus].color" size="18" />
          <span class="text-body-small" :class="`text-${statusMeta[saveStatus].color}`">
            {{ statusMeta[saveStatus].text }}
          </span>
          <v-btn
            v-if="saveStatus === 'error'"
            size="small"
            variant="text"
            color="error"
            prepend-icon="mdi-refresh"
            @click="emit('retry')"
          >
            Coba lagi
          </v-btn>
        </div>
      </div>
    </div>

    <p class="app-reading pre-line mb-6">{{ question.text }}</p>

    <SignedImage
      v-if="question.attachment && question.attachment.url"
      :src="question.attachment.url"
      :alt="`Gambar soal ${question.number}`"
      class="mb-6"
      @refresh="emit('refresh')"
    />

    <v-radio-group
      :model-value="selectedOptionId"
      hide-details
      :disabled="disabled"
      aria-label="Pilihan jawaban"
      @update:model-value="emit('select', $event)"
    >
      <v-card
        v-for="opt in question.options"
        :key="opt.id"
        variant="flat"
        class="option-card mb-3 pa-3 pa-sm-4"
        :class="{ 'option-selected': selectedOptionId === opt.id, 'option-card--disabled': disabled }"
        @click="!disabled && emit('select', opt.id)"
      >
        <div class="d-flex align-start ga-3">
          <!-- The radio stays in the DOM for keyboard and screen readers
               (Tab, arrow keys, Space); the bubble is its visible face. -->
          <span class="d-sr-only">
            <v-radio :value="opt.id" class="flex-grow-0" :aria-label="optionLabel(opt)" />
          </span>
          <span
            class="app-bubble"
            :class="{ 'app-bubble--filled': selectedOptionId === opt.id }"
            aria-hidden="true"
          >
            {{ opt.code }}
          </span>
          <div class="option-body flex-grow-1 text-body-large">
            <span>{{ opt.text }}</span>
            <SignedImage
              v-if="opt.attachment && opt.attachment.url"
              :src="opt.attachment.url"
              :alt="`Gambar pilihan ${opt.code}`"
              :max-height="200"
              class="mt-2"
              @refresh="emit('refresh')"
            />
          </div>
          <v-icon
            icon="mdi-check-circle"
            color="primary"
            class="option-check"
            :class="{ 'option-check--on': selectedOptionId === opt.id }"
            aria-hidden="true"
          />
        </div>
      </v-card>
    </v-radio-group>
  </v-card>
</template>

<style scoped>
.pre-line {
  white-space: pre-line;
}

/* Answer option row. Selection shows as a filled bubble, a check icon and a
   heavier primary border (inset shadow, so the row does not shift). The
   bubble fill transition is the only motion here. */
.option-card {
  cursor: pointer;
}
.option-card:not(.option-card--disabled):not(.option-selected):hover {
  border-color: rgb(var(--v-theme-primary));
}
.option-card--disabled {
  cursor: default;
}
.option-selected {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.06);
  box-shadow: inset 0 0 0 1px rgb(var(--v-theme-primary));
}
/* Keyboard focus lands on the visually hidden radio; ring the whole row. */
.option-card:has(input:focus-visible) {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

.option-body {
  min-width: 0;
  padding-top: 3px;
  overflow-wrap: anywhere;
}

.option-check {
  margin-top: 4px;
  opacity: 0;
}
.option-check--on {
  opacity: 1;
}
</style>
