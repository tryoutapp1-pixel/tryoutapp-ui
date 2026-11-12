<script setup>
// Create or edit an assessment.
// Business rules (api/src/services/adminService.validateAssessmentValues):
//  - Type TRYOUT requires a positive duration_minutes.
//  - Type LATIHAN requires duration_minutes = null.
//  - Passing scores are decimals >= 0 with up to 2 decimal places.
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { useAdminAssessmentsStore } from '../../stores/adminAssessments'
import { useUiStore } from '../../stores/ui'
import PageHeader from '../../components/PageHeader.vue'
import StatePanel from '../../components/StatePanel.vue'
import AppTextField from '../../components/form/AppTextField.vue'
import { compose, required, maxLength } from '../../lib/validators'

const route = useRoute()
const router = useRouter()
const store = useAdminAssessmentsStore()
const uiStore = useUiStore()

const editId = computed(() => route.params.id || null)
const isEdit = computed(() => Boolean(editId.value))

const loading = ref(false)
const loadError = ref('')
const submitting = ref(false)
const formError = ref('')
/** @type {import('vue').Ref<import('../../lib/apiError').FieldErrors>} */
const fieldErrors = ref({})

// Type and access are plain selects, not vee-validate fields.
/** @type {import('vue').Ref<import('../../types/api').AssessmentType>} */
const type = ref('LATIHAN')
/** @type {import('vue').Ref<import('../../types/api').AccessType>} */
const accessType = ref('FREE')

const { handleSubmit, setValues, values } = useForm({
  initialValues: {
    title: '',
    description: '',
    duration_minutes: '',
    passing_score_twk: '0',
    passing_score_tiu: '0',
    passing_score_tkp: '0'
  }
})

const isTryout = computed(() => type.value === 'TRYOUT')

/**
 * Converts a form value to a number; empty or non-numeric input becomes null.
 * @param {unknown} v
 * @returns {number|null}
 */
function numberOrNull(v) {
  if (v === '' || v === null || v === undefined) return null
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}

async function loadForEdit() {
  if (!isEdit.value) return
  loading.value = true
  loadError.value = ''
  try {
    const a = await store.fetchDetail(editId.value)
    type.value = a.type
    accessType.value = a.access_type
    setValues({
      title: a.title || '',
      description: a.description || '',
      duration_minutes: a.duration_minutes == null ? '' : String(a.duration_minutes),
      passing_score_twk: String(a.passing_score_twk ?? 0),
      passing_score_tiu: String(a.passing_score_tiu ?? 0),
      passing_score_tkp: String(a.passing_score_tkp ?? 0)
    })
  } catch (e) {
    loadError.value = e.message
  } finally {
    loading.value = false
  }
}

/**
 * Field rule for duration_minutes; only enforced for TRYOUT.
 * @param {string} v
 * @returns {true|string} True when valid, otherwise the error message
 */
function durationRule(v) {
  if (!isTryout.value) return true
  const n = Number(v)
  if (!v || !Number.isInteger(n) || n <= 0) return 'TRYOUT requires a positive duration (minutes)'
  return true
}

/**
 * Field rule for passing scores: empty, or a number >= 0 with up to 2 decimals.
 * @param {string|null} v
 * @returns {true|string} True when valid, otherwise the error message
 */
function scoreRule(v) {
  if (v === '' || v === null) return true
  const n = Number(v)
  if (Number.isNaN(n) || n < 0) return 'Must be a number >= 0'
  if (!/^\d+(?:\.\d{1,2})?$/.test(String(v))) return 'Up to 2 decimal places'
  return true
}

const onSubmit = handleSubmit(async (v) => {
  formError.value = ''
  fieldErrors.value = {}
  // Enforce the type/duration rule client-side before sending.
  if (isTryout.value && !numberOrNull(v.duration_minutes)) {
    formError.value = 'TRYOUT requires a positive duration.'
    return
  }

  const payload = {
    title: v.title,
    description: v.description || null,
    type: type.value,
    access_type: accessType.value,
    duration_minutes: isTryout.value ? numberOrNull(v.duration_minutes) : null,
    passing_score_twk: numberOrNull(v.passing_score_twk) ?? 0,
    passing_score_tiu: numberOrNull(v.passing_score_tiu) ?? 0,
    passing_score_tkp: numberOrNull(v.passing_score_tkp) ?? 0
  }

  submitting.value = true
  try {
    if (isEdit.value) {
      await store.update(editId.value, payload)
      uiStore.success('Assessment updated.')
      router.push(`/admin/assessments/${editId.value}`)
    } else {
      const created = await store.create(payload)
      uiStore.success('Assessment created.')
      router.push(`/admin/assessments/${created.id}`)
    }
  } catch (e) {
    fieldErrors.value = e.fieldErrors || {}
    formError.value = e.message
  } finally {
    submitting.value = false
  }
})

onMounted(loadForEdit)
</script>

<template>
  <div>
    <PageHeader :title="isEdit ? 'Edit assessment' : 'New assessment'">
      <template #actions>
        <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="router.back()">Back</v-btn>
      </template>
    </PageHeader>

    <StatePanel :loading="loading" :error="loadError" @retry="loadForEdit">
      <v-card class="pa-6" max-width="720">
        <v-alert v-if="formError" type="error" variant="tonal" density="comfortable" class="mb-4">
          {{ formError }}
        </v-alert>

        <form novalidate @submit.prevent="onSubmit">
          <AppTextField
            name="title"
            label="Title"
            :rules="compose(required('Title'), maxLength(255, 'Title'))"
            :server-error="fieldErrors.title"
          />
          <AppTextField name="description" label="Description (optional)" :rules="maxLength(65535, 'Description')" />

          <div class="d-flex flex-wrap ga-4">
            <v-select
              v-model="type"
              :items="['LATIHAN', 'TRYOUT']"
              label="Type"
              variant="outlined"
              density="comfortable"
              class="flex-grow-1"
              style="min-width: 180px"
            />
            <v-select
              v-model="accessType"
              :items="['FREE', 'PREMIUM']"
              label="Access type"
              variant="outlined"
              density="comfortable"
              class="flex-grow-1"
              style="min-width: 180px"
            />
          </div>

          <AppTextField
            v-if="isTryout"
            name="duration_minutes"
            label="Duration (minutes)"
            type="number"
            :rules="durationRule"
            :server-error="fieldErrors.duration_minutes"
          />
          <p v-else class="text-caption text-medium-emphasis mb-4">
            LATIHAN has no timer; duration is not applicable.
          </p>

          <h3 class="text-subtitle-2 font-weight-bold mb-2">Passing scores</h3>
          <div class="d-flex flex-wrap ga-4">
            <AppTextField name="passing_score_twk" label="TWK" type="number" :rules="scoreRule" class="flex-grow-1" style="min-width: 140px" />
            <AppTextField name="passing_score_tiu" label="TIU" type="number" :rules="scoreRule" class="flex-grow-1" style="min-width: 140px" />
            <AppTextField name="passing_score_tkp" label="TKP" type="number" :rules="scoreRule" class="flex-grow-1" style="min-width: 140px" />
          </div>

          <div class="d-flex justify-end ga-2 mt-4">
            <v-btn variant="text" :disabled="submitting" @click="router.back()">Cancel</v-btn>
            <v-btn type="submit" color="primary" variant="flat" :loading="submitting">
              {{ isEdit ? 'Save changes' : 'Create assessment' }}
            </v-btn>
          </div>
        </form>
      </v-card>
    </StatePanel>
  </div>
</template>
