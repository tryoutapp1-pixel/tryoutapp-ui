<script setup>
// Upload a question package from Excel.
// Flow:
//  1. The admin downloads the fixed-format template.
//  2. The admin fills it: one row per option, rows grouped by question_no.
//  3. The admin uploads it; the browser parses the Excel file into JSON here.
//  4. Preview, then POST /api/admin/question-packages { assessment_id, questions }.
//
// Business rules enforced by the backend: one package per assessment; the
// assessment must be unreleased; types are TWK/TIU/TKP; 1 to 5 options per
// question.
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
/**
 * @type {import('vue').Ref<{
 *   id: number,
 *   is_released?: number|boolean,
 *   question_package: object|null
 * }|null>}
 */
const assessment = ref(null)

/** @type {import('vue').Ref<File|File[]|null>} */
const file = ref(null)
const parsing = ref(false)
const parseError = ref('')
/**
 * Parsed workbook: { questions, questionCount, optionCount }.
 * @type {import('vue').Ref<Awaited<ReturnType<typeof parseWorkbook>>|null>}
 */
const parsed = ref(null)
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
    uiStore.error('Template belum bisa dibuat. Coba lagi.')
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
    uiStore.success(`${parsed.value.questionCount} soal berhasil dibaca.`)
  } catch (e) {
    parseError.value = e.message || 'File Excel belum bisa dibaca. Periksa isinya lalu coba lagi.'
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
    uiStore.success('Soal berhasil disimpan ke paket soal.')
    router.push(`/admin/assessments/${assessmentId}`)
  } catch (e) {
    // Includes backend 409s: already has a package / must unrelease first.
    uiStore.error(e.message)
  } finally {
    submitting.value = false
  }
}

/** Display letter for an option by position; the backend derives option_code the same way. */
const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E']

onMounted(load)
</script>

<template>
  <div>
    <PageHeader title="Unggah soal" subtitle="Isi template Excel, lalu unggah file untuk mengisi soal paket ini.">
      <template #actions>
        <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="router.push(`/admin/assessments/${assessmentId}`)">Kembali</v-btn>
      </template>
    </PageHeader>

    <StatePanel :loading="loading" :error="loadError" @retry="load">
      <template v-if="assessment">
        <v-alert
          v-if="assessment.question_package"
          type="warning"
          variant="tonal"
          class="mb-5"
        >
          Paket soal ini sudah punya soal, jadi server akan menolak unggahan kedua.
          Untuk mengganti soal, batalkan terbit lalu buat paket soal baru.
        </v-alert>
        <v-alert
          v-else-if="isReleased(assessment.is_released)"
          type="warning"
          variant="tonal"
          class="mb-5"
        >
          Paket soal ini sudah terbit. Batalkan terbit dulu sebelum mengunggah soal.
        </v-alert>

        <!-- Step 1: template -->
        <v-card variant="flat" class="pa-5 pa-md-6 mb-5">
          <div class="d-flex flex-wrap align-center justify-space-between ga-4">
            <div class="d-flex align-start ga-4 upload-step__text">
              <span class="app-bubble app-bubble--filled" aria-hidden="true">1</span>
              <div class="upload-step__text">
                <h2 class="text-title-medium mb-1">Unduh template</h2>
                <p class="text-body-medium text-medium-emphasis mb-0">
                  Satu baris berisi satu pilihan jawaban. Kelompokkan baris dengan <code>question_no</code> yang sama.
                  Jenis soal: TWK, TIU, atau TKP.
                </p>
              </div>
            </div>
            <v-btn color="secondary" variant="tonal" prepend-icon="mdi-file-excel-outline" @click="onDownloadTemplate">
              Unduh template
            </v-btn>
          </div>
        </v-card>

        <!-- Step 2: select or drop the filled file -->
        <v-card class="pa-5 pa-md-6 mb-5">
          <div class="d-flex align-start ga-4 mb-4">
            <span class="app-bubble app-bubble--filled" aria-hidden="true">2</span>
            <div class="upload-step__text">
              <h2 class="text-title-medium mb-1">Unggah file yang sudah diisi</h2>
              <p class="text-body-medium text-medium-emphasis mb-0">
                Kolom opsional <code>*_id</code> diisi dengan ID gambar dari menu Gambar.
              </p>
            </div>
          </div>

          <div class="border border-dashed rounded-lg bg-surface-light pa-4 pa-md-6">
            <div class="d-flex align-center ga-3 mb-4">
              <v-avatar color="surface" rounded="lg" size="44">
                <v-icon icon="mdi-microsoft-excel" color="primary" />
              </v-avatar>
              <div class="upload-step__text">
                <p class="text-title-small mb-0">Pilih file Excel (.xlsx atau .xls)</p>
                <p class="text-body-small text-medium-emphasis mb-0">
                  Klik kolom di bawah atau seret file ke kolom itu. Isi file langsung dibaca untuk pratinjau.
                </p>
              </div>
            </div>
            <v-file-input
              v-model="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              label="File Excel (.xlsx)"
              prepend-icon=""
              prepend-inner-icon="mdi-paperclip"
              :loading="parsing"
              :error-messages="parseError ? [parseError] : []"
              @update:model-value="onFileSelected"
            />
          </div>
        </v-card>

        <!-- Step 3: preview + submit -->
        <v-card v-if="parsed" class="pa-5 pa-md-6">
          <div class="d-flex flex-wrap align-center justify-space-between ga-4 mb-5">
            <div class="d-flex align-start ga-4 upload-step__text">
              <span class="app-bubble app-bubble--filled" aria-hidden="true">3</span>
              <div class="upload-step__text">
                <h2 class="text-title-medium mb-1">Periksa lalu simpan</h2>
                <p class="text-body-medium text-medium-emphasis mb-0">
                  {{ parsed.questionCount }} soal dan {{ parsed.optionCount }} pilihan jawaban berhasil dibaca.
                  Periksa skor tiap pilihan sebelum menyimpan.
                </p>
              </div>
            </div>
            <v-btn
              color="primary"
              prepend-icon="mdi-cloud-upload-outline"
              :loading="submitting"
              :disabled="Boolean(assessment.question_package)"
              @click="onSubmit"
            >
              Simpan soal
            </v-btn>
          </div>

          <v-row dense class="mb-4">
            <v-col cols="6" sm="4">
              <div class="bg-surface-light rounded-lg pa-3 h-100">
                <div class="app-figure text-headline-small">{{ parsed.questionCount }}</div>
                <div class="text-body-small text-medium-emphasis mt-1">Soal</div>
              </div>
            </v-col>
            <v-col cols="6" sm="4">
              <div class="bg-surface-light rounded-lg pa-3 h-100">
                <div class="app-figure text-headline-small">{{ parsed.optionCount }}</div>
                <div class="text-body-small text-medium-emphasis mt-1">Pilihan jawaban</div>
              </div>
            </v-col>
          </v-row>

          <v-expansion-panels variant="accordion" flat rounded="lg" class="border rounded-lg">
            <v-expansion-panel v-for="(q, i) in parsed.questions" :key="i">
              <v-expansion-panel-title>
                <div class="d-flex align-center ga-3 upload-preview__summary">
                  <span class="app-bubble">{{ i + 1 }}</span>
                  <StatusChip :value="q.question_type" />
                  <span class="text-truncate text-body-medium upload-preview__summary-text">{{ q.question_text }}</span>
                </div>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <h3 class="text-title-small mb-1">Pilihan jawaban</h3>
                <v-list density="compact" class="pa-0 bg-transparent">
                  <v-list-item v-for="(o, oi) in q.options" :key="oi" class="px-0 py-2">
                    <template #prepend>
                      <span class="app-bubble app-bubble--sm me-3">{{ OPTION_LETTERS[oi] }}</span>
                    </template>
                    <v-list-item-title class="text-body-medium text-wrap">{{ o.option_text }}</v-list-item-title>
                    <template #append>
                      <span class="text-body-small text-medium-emphasis text-no-wrap ms-2">Skor: {{ o.score }}</span>
                    </template>
                  </v-list-item>
                </v-list>
                <v-alert
                  v-if="q.explanation"
                  type="info"
                  variant="tonal"
                  density="compact"
                  icon="mdi-lightbulb-on-outline"
                  title="Pembahasan"
                  class="mt-2"
                >
                  <div class="text-body-medium text-pre-wrap">{{ q.explanation }}</div>
                </v-alert>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card>
      </template>
    </StatePanel>
  </div>
</template>

<style scoped>
.upload-step__text,
.upload-preview__summary,
.upload-preview__summary-text {
  min-width: 0;
}
</style>
