<script setup>
// FU13 / FU20 - assessment feedback form. Shown only when the submit response
// indicates feedback has not yet been given (is_feedback === false). Mirrors the
// backend validation: rating 1-5 (required), difficulty EASY|MEDIUM|HARD
// (required), optional comment up to 5000 chars. A user may submit feedback only
// once per assessment; the backend enforces this (409 on duplicate), and we
// surface that message and close.
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  submitting: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue', 'submit'])

const rating = ref(0)
const difficulty = ref(null)
const comment = ref('')
const touched = ref(false)

const difficultyOptions = [
  { title: 'Easy', value: 'EASY' },
  { title: 'Medium', value: 'MEDIUM' },
  { title: 'Hard', value: 'HARD' }
]

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      rating.value = 0
      difficulty.value = null
      comment.value = ''
      touched.value = false
    }
  }
)

const valid = () => rating.value >= 1 && rating.value <= 5 && Boolean(difficulty.value)

function onSubmit() {
  touched.value = true
  if (!valid()) return
  emit('submit', {
    rating: rating.value,
    difficulty: difficulty.value,
    comment: comment.value ? comment.value.trim() : undefined
  })
}

function close() {
  if (!props.submitting) emit('update:modelValue', false)
}
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="520" persistent>
    <v-card class="pa-2">
      <v-card-title class="text-h6">Share your feedback</v-card-title>
      <v-card-text>
        <p class="text-body-2 text-medium-emphasis mb-4">
          Help us improve this assessment. You can submit feedback once.
        </p>

        <div class="mb-4">
          <label class="text-subtitle-2 d-block mb-1">Rating</label>
          <v-rating
            v-model="rating"
            length="5"
            color="amber"
            active-color="amber"
            hover
          />
          <div v-if="touched && !(rating >= 1)" class="text-caption text-error">
            Please select a rating.
          </div>
        </div>

        <v-select
          v-model="difficulty"
          :items="difficultyOptions"
          label="Difficulty"
          variant="outlined"
          density="comfortable"
          :error-messages="touched && !difficulty ? ['Please select a difficulty.'] : []"
        />

        <v-textarea
          v-model="comment"
          label="Comment (optional)"
          variant="outlined"
          rows="3"
          counter="5000"
          :rules="[(v) => !v || v.length <= 5000 || 'Comment is too long']"
        />
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn variant="text" :disabled="submitting" @click="close">Skip</v-btn>
        <v-btn color="primary" variant="flat" :loading="submitting" @click="onSubmit">
          Submit feedback
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
