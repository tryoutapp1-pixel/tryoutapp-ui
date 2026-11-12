<script setup>
// Assessment feedback form. Shown when the submit response says feedback has
// not been given yet (is_feedback === false). Feedback is required: the dialog
// is persistent and has no Skip action; it closes once the parent stores the
// feedback. Mirrors the backend rules: rating 1-5 and difficulty
// EASY|MEDIUM|HARD are required, the comment is optional (max 5000 chars). The
// backend allows one feedback per assessment and answers 409 for a duplicate.
import { ref, watch } from 'vue'

/** @typedef {import('../../types/api').Difficulty} Difficulty */

/**
 * @typedef {Object} FeedbackDialogProps
 * @property {boolean} modelValue - Dialog visibility; the parent closes it after saving
 * @property {boolean} [submitting] - Disables the form while saving
 */

/** @type {FeedbackDialogProps} */
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  submitting: { type: Boolean, default: false }
})

/**
 * @typedef {Object} FeedbackDialogEmits
 * @property {(payload: import('../../types/api').FeedbackPayload) => void} submit
 */
const emit = defineEmits(['submit'])

const MAX_COMMENT = 5000

/** @type {import('vue').Ref<number>} */
const rating = ref(0)
/** @type {import('vue').Ref<Difficulty|null>} */
const difficulty = ref(null)
/** @type {import('vue').Ref<string>} */
const comment = ref('')
const touched = ref(false)

/** @type {{ title: string, value: Difficulty }[]} */
const difficultyOptions = [
  { title: 'Easy', value: 'EASY' },
  { title: 'Medium', value: 'MEDIUM' },
  { title: 'Hard', value: 'HARD' }
]

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    rating.value = 0
    difficulty.value = null
    comment.value = ''
    touched.value = false
  }
)

/** @returns {boolean} */
function isValid() {
  return rating.value >= 1 && rating.value <= 5 && Boolean(difficulty.value) && comment.value.length <= MAX_COMMENT
}

function onSubmit() {
  touched.value = true
  if (!isValid()) return
  const text = comment.value.trim()
  emit('submit', {
    rating: rating.value,
    difficulty: /** @type {Difficulty} */ (difficulty.value),
    comment: text || undefined
  })
}
</script>

<template>
  <v-dialog :model-value="props.modelValue" max-width="520" persistent>
    <v-card class="pa-2">
      <v-card-title class="text-h6">Share your feedback</v-card-title>
      <v-card-text>
        <p class="text-body-2 text-medium-emphasis mb-4">
          Rate this assessment to continue. You only need to do this once per assessment.
        </p>

        <div class="mb-4">
          <label id="feedback-rating-label" class="text-subtitle-2 d-block mb-1">Rating</label>
          <v-rating
            v-model="rating"
            aria-labelledby="feedback-rating-label"
            length="5"
            color="amber"
            active-color="amber"
            hover
            :disabled="props.submitting"
          />
          <div v-if="touched && rating < 1" class="text-caption text-error">Select a rating from 1 to 5.</div>
        </div>

        <v-select
          v-model="difficulty"
          :items="difficultyOptions"
          label="Difficulty"
          variant="outlined"
          density="comfortable"
          :disabled="props.submitting"
          :error-messages="touched && !difficulty ? ['Select how difficult it felt.'] : []"
        />

        <v-textarea
          v-model="comment"
          label="Comment (optional)"
          variant="outlined"
          rows="3"
          :counter="MAX_COMMENT"
          :disabled="props.submitting"
          :rules="[(v) => !v || v.length <= MAX_COMMENT || `Keep the comment under ${MAX_COMMENT} characters.`]"
        />
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn color="primary" variant="flat" :loading="props.submitting" @click="onSubmit">
          Submit feedback
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
