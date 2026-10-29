<script setup>
// Upload a question package via Excel.
// Flow:
//  1. Admin downloads the fixed-format template.
//  2. Fills it (one row per option, rows grouped by question_no).
//  3. Uploads; the browser parses Excel -> JSON here.
//  4. Preview, then POST /api/admin/question-packages { assessment_id, questions }.
//
// Business rules enforced by backend: one package per assessment; the
// assessment must be unreleased; types TWK/TIU/TKP; 1..5 options per question.
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import adminService from '../../services/adminService'
import { useUiStore } from '../../stores/ui'
import { downloadTemplate, parseWorkbook } from '../../lib/questionExcel'
import PageHeader from '../../components/PageHeader.vue'
import StatePanel from '../../components/StatePanel.vue'
import StatusChip from '../../components/StatusChip.vue'
import { isReleased } from '../../lib/format'

const route = useRoute()
const router = useRouter()
const uiStore = useUiStore()

const assessmentId = route.params.id

const loading = ref(false)
const loadError = ref('')
const assessment = ref(null)

const file = ref(null)
const parsing = ref(false)
const parseError = ref('')
const parsed = ref(null) // { questions, questionCount, optionCount }
const submitting = ref(false)

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    assessment.value = await adminService.getAssessment(assessmentId)
  } catch (e) {
    loadError.value = e.message
  } finally {
    loading.value = false
  }
}

function onDownloadTemplate() {
  try {
    downloadTemplate()
  } catch (e) {
    uiStore.error('Could not generate the template file.')
  }
}

async function onFileSelected() {
  parseError.value = ''
  parsed.value = null
  const picked = Array.isArray(file.value) ? file.value[0] : file.value
  if (!picked) return
  parsing.value = true
  try {
    const buffer = await picked.arrayBuffer()
    parsed.value = await parseWorkbook(buffer)
    uiStore.success(`Parsed ${parsed.value.questionCount} question(s).`)
  } catch (e) {
    parseError.value = e.message || 'Could not read the Excel file.'
  } finally {
    parsing.value = false
  }
}

async function onSubmit() {
  if (!parsed.value) return
  submitting.value = true
  try {
    await adminService.createQuestionPackage({
      assessment_id: Number(assessmentId),
      questions: parsed.value.questions
    })
    uiStore.success('Question package created.')
    router.push(`/admin/assessments/${assessmentId}`)
  } catch (e) {
    // Includes backend 409s: already has a package / must unrelease first.
    uiStore.error(e.message)
  } finally {
    submitting.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <PageHeader title="Upload questions" subtitle="Fill the Excel template, then upload to create the question package.">
      <template #actions>
        <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="router.push(`/admin/assessments/${assessmentId}`)">Back</v-btn>
      </template>
    </PageHeader>

    <StatePanel :loading="loading" :error="loadError" @retry="load">
      <template v-if="assessment">
        <v-alert
          v-if="assessment.question_package"
          type="warning"
          variant="tonal"
          class="mb-4"
        >
          This assessment already has a question package. The server will reject a second upload.
          To replace it, the business rule is to unrelease and create a new assessment.
        </v-alert>
        <v-alert
          v-else-if="isReleased(assessment.is_released)"
          type="warning"
          variant="tonal"
          class="mb-4"
        >
          This assessment is released. Unrelease it before uploading a question package.
        </v-alert>

        <v-card class="pa-6 mb-6">
          <div class="d-flex align-center justify-space-between flex-wrap ga-3">
            <div>
              <h3 class="text-subtitle-1 font-weight-bold mb-1">Step 1 — Download the template</h3>
              <p class="text-body-2 text-medium-emphasis mb-0">
                One row per answer option. Group rows by <code>question_no</code>. Types: TWK, TIU, TKP.
              </p>
            </div>
            <v-btn color="secondary" variant="tonal" prepend-icon="mdi-file-excel-outline" @click="onDownloadTemplate">
              Download template
            </v-btn>
          </div>
        </v-card>

        <v-card class="pa-6 mb-6">
          <h3 class="text-subtitle-1 font-weight-bold mb-1">Step 2 — Upload the filled file</h3>
          <p class="text-body-2 text-medium-emphasis mb-3">
            Reference image IDs from the Images menu in the optional <code>*_id</code> columns.
          </p>
          <v-file-input
            v-model="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            label="Excel file (.xlsx)"
            prepend-icon="mdi-microsoft-excel"
            :loading="parsing"
            :error-messages="parseError ? [parseError] : []"
            @update:model-value="onFileSelected"
          />
        </v-card>

        <!-- Step 3: preview + submit -->
        <v-card v-if="parsed" class="pa-6">
          <div class="d-flex align-center justify-space-between mb-4">
            <div>
              <h3 class="text-subtitle-1 font-weight-bold mb-1">Step 3 — Review and submit</h3>
              <p class="text-body-2 text-medium-emphasis mb-0">
                {{ parsed.questionCount }} question(s), {{ parsed.optionCount }} option(s) parsed.
              </p>
            </div>
            <v-btn
              color="primary"
              prepend-icon="mdi-cloud-upload-outline"
              :loading="submitting"
              :disabled="Boolean(assessment.question_package)"
              @click="onSubmit"
            >
              Create package
            </v-btn>
          </div>

          <v-expansion-panels variant="accordion">
            <v-expansion-panel v-for="(q, i) in parsed.questions" :key="i">
              <v-expansion-panel-title>
                <div class="d-flex align-center ga-3">
                  <v-chip size="x-small" label>{{ i + 1 }}</v-chip>
                  <StatusChip :value="q.question_type" />
                  <span class="text-truncate" style="max-width: 420px">{{ q.question_text }}</span>
                </div>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-list density="compact">
                  <v-list-item v-for="(o, oi) in q.options" :key="oi">
                    <v-list-item-title class="text-body-2">{{ o.option_text }}</v-list-item-title>
                    <template #append>
                      <span class="text-caption text-medium-emphasis">score: {{ o.score }}</span>
                    </template>
                  </v-list-item>
                </v-list>
                <v-alert v-if="q.explanation" type="info" variant="tonal" density="compact" class="mt-2">
                  {{ q.explanation }}
                </v-alert>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card>
      </template>
    </StatePanel>
  </div>
</template>
