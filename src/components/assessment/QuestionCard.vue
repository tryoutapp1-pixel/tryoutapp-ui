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
  saving: { icon: 'mdi-loading mdi-spin', color: 'info', text: 'Saving...' },
  saved: { icon: 'mdi-check-circle-outline', color: 'success', text: 'Saved' },
  error: { icon: 'mdi-alert-circle-outline', color: 'error', text: 'Save failed' }
}
</script>

<template>
  <v-card variant="outlined" class="pa-6">
    <div class="d-flex align-center justify-space-between mb-3">
      <div class="d-flex align-center ga-2">
        <span class="text-subtitle-1 font-weight-bold">Question {{ question.number }}</span>
        <v-chip size="x-small" variant="tonal" color="secondary">{{ question.type }}</v-chip>
      </div>
      <div v-if="statusMeta[saveStatus]" class="d-flex align-center ga-1">
        <v-icon :icon="statusMeta[saveStatus].icon" :color="statusMeta[saveStatus].color" size="18" />
        <span class="text-caption" :class="`text-${statusMeta[saveStatus].color}`">
          {{ statusMeta[saveStatus].text }}
        </span>
        <v-btn
          v-if="saveStatus === 'error'"
          size="x-small"
          variant="text"
          color="error"
          @click="emit('retry')"
        >
          Retry
        </v-btn>
      </div>
    </div>

    <p class="text-body-1 mb-4" style="white-space: pre-line">{{ question.text }}</p>

    <SignedImage
      v-if="question.attachment && question.attachment.url"
      :src="question.attachment.url"
      :alt="`Question ${question.number} image`"
      class="mb-4"
      @refresh="emit('refresh')"
    />

    <v-radio-group
      :model-value="selectedOptionId"
      hide-details
      :disabled="disabled"
      @update:model-value="emit('select', $event)"
    >
      <v-card
        v-for="opt in question.options"
        :key="opt.id"
        variant="outlined"
        class="option-card mb-3 pa-3"
        :class="{ 'option-selected': selectedOptionId === opt.id }"
        @click="!disabled && emit('select', opt.id)"
      >
        <div class="d-flex align-start ga-2">
          <v-radio :value="opt.id" class="flex-grow-0" />
          <div class="flex-grow-1">
            <span class="font-weight-medium me-1">{{ opt.code }}.</span>
            <span>{{ opt.text }}</span>
            <SignedImage
              v-if="opt.attachment && opt.attachment.url"
              :src="opt.attachment.url"
              :alt="`Option ${opt.code} image`"
              :max-height="200"
              class="mt-2"
              @refresh="emit('refresh')"
            />
          </div>
        </div>
      </v-card>
    </v-radio-group>
  </v-card>
</template>

<style scoped>
.option-card {
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}
.option-card:hover {
  border-color: rgb(var(--v-theme-primary));
}
.option-selected {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.06);
}
</style>
