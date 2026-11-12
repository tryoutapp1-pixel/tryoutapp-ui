<script setup>
// Edit a single question (covers "edit soal" + "edit penjelasan").
// Backend: PATCH /admin/questions/:id with any of:
//   question_text, question_type, explanation,
//   image_attachment_id, explanation_attachment_id
// Attachment ids reference the Images library (null clears). Business rule:
// admins may correct a single question after release (typo fixes); this maps to
// that endpoint. Only changed fields are sent.
import { ref, watch, computed } from 'vue'
import adminService from '../../services/adminService'
import { useUiStore } from '../../stores/ui'
import { QUESTION_TYPES } from '../../lib/questionExcel'

/** @typedef {import('../../types/api').SectionType} SectionType */

/**
 * Admin view of a question, as returned by the admin question endpoints.
 * @typedef {Object} AdminQuestion
 * @property {number} id
 * @property {string} [question_text]
 * @property {SectionType} [question_type]
 * @property {string|null} [explanation]
 * @property {number|null} [image_attachment_id]
 * @property {number|null} [explanation_attachment_id]
 */

/**
 * Editable form state. Inputs keep ids as strings.
 * @typedef {Object} QuestionForm
 * @property {string} question_text
 * @property {SectionType} question_type
 * @property {string} explanation
 * @property {string} image_attachment_id - Empty string means no image
 * @property {string} explanation_attachment_id - Empty string means no file
 */

/**
 * PATCH body with only the changed fields.
 * @typedef {Object} QuestionPatch
 * @property {string} [question_text]
 * @property {SectionType} [question_type]
 * @property {string|null} [explanation]
 * @property {number|null} [image_attachment_id] - NaN when the input is invalid
 * @property {number|null} [explanation_attachment_id] - NaN when the input is invalid
 */

/**
 * @typedef {Object} QuestionEditDialogProps
 * @property {boolean} modelValue - Dialog visibility (v-model)
 * @property {AdminQuestion|null} [question] - Question being edited
 */

/** @type {QuestionEditDialogProps} */
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  question: { type: Object, default: null }
})

/**
 * @typedef {Object} QuestionEditDialogEmits
 * @property {(value: boolean) => void} update:modelValue
 * @property {(question: AdminQuestion) => void} saved - The updated question from the backend
 */
const emit = defineEmits(['update:modelValue', 'saved'])

const uiStore = useUiStore()
const saving = ref(false)
const formError = ref('')

// Local editable copy. We keep ids as strings in the inputs and normalize later.
/** @type {import('vue').Ref<QuestionForm>} */
const form = ref({
  question_text: '',
  question_type: 'TWK',
  explanation: '',
  image_attachment_id: '',
  explanation_attachment_id: ''
})

/** @type {import('vue').Ref<QuestionForm|null>} */
const original = ref(null)

watch(
  () => props.modelValue,
  (open) => {
    if (open && props.question) {
      const q = props.question
      form.value = {
        question_text: q.question_text ?? '',
        question_type: q.question_type ?? 'TWK',
        explanation: q.explanation ?? '',
        image_attachment_id: q.image_attachment_id == null ? '' : String(q.image_attachment_id),
        explanation_attachment_id: q.explanation_attachment_id == null ? '' : String(q.explanation_attachment_id)
      }
      original.value = { ...form.value }
      formError.value = ''
    }
  }
)

function close() {
  emit('update:modelValue', false)
}

/**
 * Normalizes an attachment id input.
 * @param {string|number|null|undefined} v - Raw input value
 * @returns {number|null} The id, null when empty, or NaN when not a positive integer
 */
function idOrNull(v) {
  if (v === '' || v === null || v === undefined) return null
  const n = Number(v)
  return Number.isInteger(n) && n >= 1 ? n : NaN
}

// Build a payload containing only fields the admin actually changed.
/** @type {import('vue').ComputedRef<QuestionPatch>} */
const changedPayload = computed(() => {
  /** @type {QuestionPatch} */
  const payload = {}
  const o = original.value || {}
  if (form.value.question_text !== o.question_text) payload.question_text = form.value.question_text.trim()
  if (form.value.question_type !== o.question_type) payload.question_type = form.value.question_type
  if (form.value.explanation !== o.explanation) payload.explanation = form.value.explanation.trim() || null
  if (form.value.image_attachment_id !== o.image_attachment_id) payload.image_attachment_id = idOrNull(form.value.image_attachment_id)
  if (form.value.explanation_attachment_id !== o.explanation_attachment_id) {
    payload.explanation_attachment_id = idOrNull(form.value.explanation_attachment_id)
  }
  return payload
})

/** @returns {Promise<void>} */
async function save() {
  formError.value = ''
  const payload = changedPayload.value
  if (!Object.keys(payload).length) {
    formError.value = 'No changes to save.'
    return
  }
  if (payload.image_attachment_id !== undefined && Number.isNaN(payload.image_attachment_id)) {
    formError.value = 'Question image ID must be a positive integer or empty.'
    return
  }
  if (payload.explanation_attachment_id !== undefined && Number.isNaN(payload.explanation_attachment_id)) {
    formError.value = 'Explanation file ID must be a positive integer or empty.'
    return
  }
  if (payload.question_text !== undefined && !payload.question_text) {
    formError.value = 'Question text cannot be empty.'
    return
  }

  saving.value = true
  try {
    const updated = await adminService.updateQuestion(props.question.id, payload)
    uiStore.success('Question updated.')
    emit('saved', updated)
    close()
  } catch (e) {
    formError.value = e.message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="640" @update:model-value="emit('update:modelValue', $event)">
    <v-card class="pa-2">
      <v-card-title class="text-h6">Edit question</v-card-title>
      <v-card-text>
        <v-alert v-if="formError" type="error" variant="tonal" density="comfortable" class="mb-4">
          {{ formError }}
        </v-alert>

        <v-textarea v-model="form.question_text" label="Question text" variant="outlined" rows="3" auto-grow />
        <v-select
          v-model="form.question_type"
          :items="QUESTION_TYPES"
          label="Question type"
          variant="outlined"
          density="comfortable"
        />
        <v-textarea v-model="form.explanation" label="Explanation (optional)" variant="outlined" rows="3" auto-grow />
        <div class="d-flex flex-wrap ga-4">
          <v-text-field
            v-model="form.image_attachment_id"
            label="Question image ID (optional)"
            type="number"
            variant="outlined"
            density="comfortable"
            hint="Attachment ID from the Images menu. Leave empty for none."
            persistent-hint
            class="flex-grow-1"
            style="min-width: 220px"
          />
          <v-text-field
            v-model="form.explanation_attachment_id"
            label="Explanation file ID (optional)"
            type="number"
            variant="outlined"
            density="comfortable"
            hint="Attachment ID for the explanation file. Leave empty for none."
            persistent-hint
            class="flex-grow-1"
            style="min-width: 220px"
          />
        </div>
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn variant="text" :disabled="saving" @click="close">Cancel</v-btn>
        <v-btn color="primary" variant="flat" :loading="saving" @click="save">Save changes</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
