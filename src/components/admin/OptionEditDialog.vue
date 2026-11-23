<script setup>
// Edit a single answer option ("edit jawaban").
// Backend: PATCH /admin/questions/:questionId/options/:optionId with any of:
//   option_text, score, image_attachment_id, option_order
// Only changed fields are sent. option_order is 1..5 and the backend re-derives
// option_code from it; reordering may 409 if the target order is taken.
import { ref, watch, computed } from 'vue'
import adminService from '../../services/adminService'
import { useUiStore } from '../../stores/ui'

/**
 * Admin view of an answer option, as returned by the admin question endpoints.
 * @typedef {Object} AdminOption
 * @property {number} id
 * @property {string} [option_text]
 * @property {number|string} [score]
 * @property {number|null} [image_attachment_id]
 * @property {number} [option_order] - 1..5, maps to option code A..E
 */

/**
 * Editable form state. Inputs keep ids and scores as strings.
 * @typedef {Object} OptionForm
 * @property {string} option_text
 * @property {string} score
 * @property {string} image_attachment_id - Empty string means no image
 * @property {number} option_order
 */

/**
 * PATCH body with only the changed fields.
 * @typedef {Object} OptionPatch
 * @property {string} [option_text]
 * @property {number} [score]
 * @property {number|null} [image_attachment_id] - NaN when the input is invalid
 * @property {number} [option_order]
 */

/**
 * @typedef {Object} OptionEditDialogProps
 * @property {boolean} modelValue - Dialog visibility (v-model)
 * @property {number|string|null} [questionId] - Question that owns the option
 * @property {AdminOption|null} [option] - Option being edited
 */

/** @type {OptionEditDialogProps} */
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  questionId: { type: [Number, String], default: null },
  option: { type: Object, default: null }
})

/**
 * @typedef {Object} OptionEditDialogEmits
 * @property {(value: boolean) => void} update:modelValue
 * @property {(option: AdminOption) => void} saved - The updated option from the backend
 */
const emit = defineEmits(['update:modelValue', 'saved'])

const uiStore = useUiStore()
const saving = ref(false)
const formError = ref('')

/** @type {import('vue').Ref<OptionForm>} */
const form = ref({ option_text: '', score: '0', image_attachment_id: '', option_order: 1 })
/** @type {import('vue').Ref<OptionForm|null>} */
const original = ref(null)

watch(
  () => props.modelValue,
  (open) => {
    if (open && props.option) {
      const o = props.option
      form.value = {
        option_text: o.option_text ?? '',
        score: String(o.score ?? 0),
        image_attachment_id: o.image_attachment_id == null ? '' : String(o.image_attachment_id),
        option_order: Number(o.option_order ?? 1)
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

/** @type {import('vue').ComputedRef<OptionPatch>} */
const changedPayload = computed(() => {
  /** @type {OptionPatch} */
  const payload = {}
  const o = original.value || {}
  if (form.value.option_text !== o.option_text) payload.option_text = form.value.option_text.trim()
  if (form.value.score !== o.score) payload.score = Number(form.value.score)
  if (form.value.image_attachment_id !== o.image_attachment_id) payload.image_attachment_id = idOrNull(form.value.image_attachment_id)
  if (Number(form.value.option_order) !== Number(o.option_order)) payload.option_order = Number(form.value.option_order)
  return payload
})

/** @returns {Promise<void>} */
async function save() {
  formError.value = ''
  const payload = changedPayload.value
  if (!Object.keys(payload).length) {
    formError.value = 'Belum ada perubahan untuk disimpan.'
    return
  }
  if (payload.option_text !== undefined && !payload.option_text) {
    formError.value = 'Teks pilihan jawaban tidak boleh kosong.'
    return
  }
  // Number('') is 0, so an emptied field would silently save a score of 0.
  if (payload.score !== undefined && String(form.value.score ?? '').trim() === '') {
    formError.value = 'Isi skor. Gunakan 0 bila pilihan ini tidak mendapat skor.'
    return
  }
  if (payload.score !== undefined && (Number.isNaN(payload.score) || payload.score < 0)) {
    formError.value = 'Skor harus berupa angka 0 atau lebih.'
    return
  }
  if (payload.image_attachment_id !== undefined && Number.isNaN(payload.image_attachment_id)) {
    formError.value = 'ID gambar pilihan jawaban harus bilangan bulat positif, atau kosongkan kolomnya.'
    return
  }

  saving.value = true
  try {
    const updated = await adminService.updateOption(props.questionId, props.option.id, payload)
    uiStore.success('Perubahan pilihan jawaban disimpan.')
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
  <v-dialog :model-value="modelValue" max-width="560" scrollable @update:model-value="emit('update:modelValue', $event)">
    <v-card class="pa-3">
      <v-card-title class="text-title-large text-wrap">Ubah pilihan jawaban</v-card-title>
      <v-card-text>
        <v-alert v-if="formError" type="error" variant="tonal" density="comfortable" class="mb-4">
          {{ formError }}
        </v-alert>

        <v-textarea v-model="form.option_text" label="Teks pilihan jawaban" rows="2" auto-grow />
        <div class="d-flex flex-wrap ga-4">
          <v-text-field
            v-model="form.score"
            label="Skor"
            type="number"
            class="flex-grow-1 option-edit__field"
          />
          <v-select
            v-model="form.option_order"
            :items="[
              { title: 'A (urutan 1)', value: 1 },
              { title: 'B (urutan 2)', value: 2 },
              { title: 'C (urutan 3)', value: 3 },
              { title: 'D (urutan 4)', value: 4 },
              { title: 'E (urutan 5)', value: 5 }
            ]"
            label="Huruf pilihan"
            hint="Mengganti huruf juga memindahkan urutan pilihan ini."
            persistent-hint
            class="flex-grow-1 option-edit__field"
          />
        </div>
        <v-text-field
          v-model="form.image_attachment_id"
          label="ID gambar pilihan jawaban (opsional)"
          type="number"
          hint="ID lampiran dari menu Gambar. Kosongkan bila tidak ada."
          persistent-hint
          class="mt-2"
        />
      </v-card-text>
      <v-card-actions class="justify-end ga-2">
        <v-btn variant="text" :disabled="saving" @click="close">Batal</v-btn>
        <v-btn color="primary" variant="flat" :loading="saving" @click="save">Simpan perubahan</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.option-edit__field {
  min-width: 150px;
}
</style>
