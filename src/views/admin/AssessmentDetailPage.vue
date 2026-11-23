<script setup>
// Admin assessment detail plus its question package, if any.
// - With no package, offer the upload (Excel) page.
// - With a package, show its questions and options; each question and option
//   can be edited in a dialog. Business rule: a released assessment must be
//   unreleased before a new package is uploaded. This page never re-uploads.
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import adminService from '../../services/adminService'
import PageHeader from '../../components/PageHeader.vue'
import StatePanel from '../../components/StatePanel.vue'
import StatusChip from '../../components/StatusChip.vue'
import QuestionEditDialog from '../../components/admin/QuestionEditDialog.vue'
import OptionEditDialog from '../../components/admin/OptionEditDialog.vue'
import SignedImage from '../../components/assessment/SignedImage.vue'
import { formatDate, isReleased } from '../../lib/format'

/**
 * @typedef {import('../../types/api').AssessmentDetail & {
 *   is_released?: number|boolean,
 *   question_package: { question_count: number, created_at: string }|null
 * }} AdminAssessment
 */

/**
 * @typedef {Object} AdminOption
 * @property {number} id
 * @property {string} option_code
 * @property {string} option_text
 * @property {string|null} option_image_url
 * @property {number} score
 */

/**
 * @typedef {Object} AdminQuestion
 * @property {number} id
 * @property {number} question_number
 * @property {import('../../types/api').SectionType} question_type
 * @property {string} question_text
 * @property {string|null} question_image_url
 * @property {string|null} explanation
 * @property {string|null} explanation_file_url
 * @property {AdminOption[]} options
 */

/** @typedef {{ questions: AdminQuestion[] }} QuestionPackage */

const route = useRoute()
const router = useRouter()

/** @type {import('vue').Ref<AdminAssessment|null>} */
const assessment = ref(null)
/** @type {import('vue').Ref<QuestionPackage|null>} */
const pkg = ref(null)
const loading = ref(false)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  pkg.value = null
  try {
    assessment.value = await adminService.getAssessment(route.params.id)
    if (assessment.value.question_package) {
      // Package param is the assessment id on this endpoint.
      pkg.value = await adminService.getQuestionPackage(route.params.id)
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

// Re-fetch the package after an edit so text, type, scores, and re-signed image
// URLs are all fresh.
async function reloadPackage() {
  try {
    pkg.value = await adminService.getQuestionPackage(route.params.id)
  } catch {
    // Non-fatal: the edit succeeded; a manual retry/refresh will reconcile.
  }
}

// Question edit dialog
const questionDialog = ref(false)
/** @type {import('vue').Ref<AdminQuestion|null>} */
const editingQuestion = ref(null)

/** @param {AdminQuestion} q */
function openQuestionEdit(q) {
  editingQuestion.value = q
  questionDialog.value = true
}

// Option edit dialog
const optionDialog = ref(false)
/** @type {import('vue').Ref<AdminOption|null>} */
const editingOption = ref(null)
/** @type {import('vue').Ref<number|null>} */
const editingOptionQuestionId = ref(null)

/**
 * @param {AdminQuestion} question - The question that owns the option
 * @param {AdminOption} option
 */
function openOptionEdit(question, option) {
  editingOptionQuestionId.value = question.id
  editingOption.value = option
  optionDialog.value = true
}

onMounted(load)
</script>

<template>
  <div>
    <PageHeader title="Detail paket soal" subtitle="Ringkasan pengaturan paket soal dan daftar soalnya.">
      <template #actions>
        <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="router.push('/admin/assessments')">Kembali</v-btn>
        <v-btn
          v-if="assessment"
          variant="tonal"
          color="primary"
          prepend-icon="mdi-pencil-outline"
          @click="router.push(`/admin/assessments/${assessment.id}/edit`)"
        >
          Ubah paket soal
        </v-btn>
      </template>
    </PageHeader>

    <StatePanel :loading="loading" :error="error" @retry="load">
      <template v-if="assessment">
        <!-- Facts summary -->
        <v-card class="pa-5 pa-md-6 mb-6">
          <h2 class="text-title-large text-break mb-1">{{ assessment.title }}</h2>
          <p class="text-body-medium text-medium-emphasis mb-5">{{ assessment.description || 'Belum ada deskripsi.' }}</p>

          <v-row dense>
            <v-col cols="6" md="3">
              <div class="bg-surface-light rounded-lg pa-3 h-100">
                <div class="text-body-small text-medium-emphasis mb-1">Jenis</div>
                <StatusChip :value="assessment.type" />
              </div>
            </v-col>
            <v-col cols="6" md="3">
              <div class="bg-surface-light rounded-lg pa-3 h-100">
                <div class="text-body-small text-medium-emphasis mb-1">Akses</div>
                <StatusChip :value="assessment.access_type" />
              </div>
            </v-col>
            <v-col cols="6" md="3">
              <div class="bg-surface-light rounded-lg pa-3 h-100">
                <div class="text-body-small text-medium-emphasis mb-1">Durasi</div>
                <div class="text-title-medium">
                  {{ assessment.duration_minutes != null ? assessment.duration_minutes + ' menit' : 'Tanpa timer' }}
                </div>
              </div>
            </v-col>
            <v-col cols="6" md="3">
              <div class="bg-surface-light rounded-lg pa-3 h-100">
                <div class="text-body-small text-medium-emphasis mb-1">Status terbit</div>
                <StatusChip :value="isReleased(assessment.is_released) ? 'RELEASED' : 'UNRELEASED'" />
              </div>
            </v-col>
          </v-row>

          <h3 class="text-title-small mt-5 mb-2">Nilai ambang batas</h3>
          <v-row dense>
            <v-col cols="4">
              <div class="border rounded-lg pa-3 h-100">
                <div class="text-body-small text-medium-emphasis mb-1">TWK</div>
                <div class="app-figure text-title-large">{{ assessment.passing_score_twk }}</div>
              </div>
            </v-col>
            <v-col cols="4">
              <div class="border rounded-lg pa-3 h-100">
                <div class="text-body-small text-medium-emphasis mb-1">TIU</div>
                <div class="app-figure text-title-large">{{ assessment.passing_score_tiu }}</div>
              </div>
            </v-col>
            <v-col cols="4">
              <div class="border rounded-lg pa-3 h-100">
                <div class="text-body-small text-medium-emphasis mb-1">TKP</div>
                <div class="app-figure text-title-large">{{ assessment.passing_score_tkp }}</div>
              </div>
            </v-col>
          </v-row>
        </v-card>

        <!-- Question list -->
        <v-card class="pa-5 pa-md-6">
          <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-4">
            <h2 class="text-title-large mb-0">Daftar soal</h2>
            <v-btn
              v-if="!assessment.question_package"
              color="primary"
              prepend-icon="mdi-upload"
              @click="router.push(`/admin/assessments/${assessment.id}/questions`)"
            >
              Unggah soal (Excel)
            </v-btn>
          </div>

          <div
            v-if="!assessment.question_package"
            class="d-flex flex-column align-center text-center py-10 px-4 border border-dashed rounded-lg"
          >
            <v-avatar color="surface-light" size="56" class="mb-4">
              <v-icon icon="mdi-file-question-outline" color="primary" size="28" />
            </v-avatar>
            <p class="text-body-large text-medium-emphasis mb-0 assessment-detail__empty">
              Belum ada soal. Unggah file Excel berisi soal agar paket soal ini bisa diterbitkan.
            </p>
          </div>

          <div v-else>
            <p class="text-body-medium mb-1">
              {{ pkg ? pkg.questions.length : assessment.question_package.question_count }} soal, dibuat
              {{ formatDate(assessment.question_package.created_at) }}.
            </p>
            <p class="d-flex align-start ga-2 text-body-small text-medium-emphasis mb-4">
              <v-icon icon="mdi-information-outline" size="16" />
              <span>Paket soal yang sudah terbit harus dibatalkan terbitnya sebelum soalnya diganti.</span>
            </p>

            <v-expansion-panels v-if="pkg" variant="accordion" flat rounded="lg" class="border rounded-lg">
              <v-expansion-panel v-for="q in pkg.questions" :key="q.id">
                <v-expansion-panel-title>
                  <div class="d-flex align-center ga-3 assessment-detail__summary">
                    <span class="app-bubble">{{ q.question_number }}</span>
                    <StatusChip :value="q.question_type" />
                    <span class="text-truncate text-body-medium assessment-detail__summary-text">{{ q.question_text }}</span>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <div class="d-flex flex-wrap align-start justify-space-between ga-3 mb-4">
                    <p class="app-reading text-pre-wrap mb-0 assessment-detail__stem">{{ q.question_text }}</p>
                    <v-btn
                      size="small"
                      variant="tonal"
                      color="primary"
                      prepend-icon="mdi-pencil-outline"
                      @click="openQuestionEdit(q)"
                    >
                      Ubah soal dan pembahasan
                    </v-btn>
                  </div>

                  <SignedImage
                    v-if="q.question_image_url"
                    :src="q.question_image_url"
                    :alt="`Gambar soal ${q.question_number}`"
                    class="mb-4"
                    @refresh="reloadPackage"
                  />

                  <h3 class="text-title-small mb-1">Pilihan jawaban</h3>
                  <v-list density="compact" class="pa-0 bg-transparent">
                    <v-list-item v-for="o in q.options" :key="o.id" class="px-0 py-2">
                      <template #prepend>
                        <span class="app-bubble app-bubble--sm me-3">{{ o.option_code }}</span>
                      </template>
                      <v-list-item-title class="text-body-medium text-wrap">
                        {{ o.option_text }}
                      </v-list-item-title>
                      <v-list-item-media v-if="o.option_image_url" class="mt-2">
                        <SignedImage
                          v-if="o.option_image_url"
                          :src="o.option_image_url"
                          :alt="`Gambar pilihan jawaban ${o.option_code}`"
                          @refresh="reloadPackage"
                        />
                      </v-list-item-media>
                      <template #append>
                        <div class="d-flex align-center ga-1 ms-2">
                          <span class="text-body-small text-medium-emphasis text-no-wrap">Skor: {{ o.score }}</span>
                          <v-tooltip text="Ubah pilihan jawaban">
                            <template #activator="{ props: tip }">
                              <v-btn
                                v-bind="tip"
                                size="small"
                                variant="text"
                                icon="mdi-pencil-outline"
                                :aria-label="`Ubah pilihan jawaban ${o.option_code} soal ${q.question_number}`"
                                @click="openOptionEdit(q, o)"
                              />
                            </template>
                          </v-tooltip>
                        </div>
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
                    class="mt-3"
                  >
                    <div class="text-body-medium text-pre-wrap">{{ q.explanation }}</div>
                  </v-alert>
                  <div v-if="q.explanation_file_url" class="mt-2">
                    <SignedImage
                      v-if="q.explanation_file_url"
                      :src="q.explanation_file_url"
                      :alt="`Gambar pembahasan soal ${q.question_number}`"
                      @refresh="reloadPackage"
                    />
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </div>
        </v-card>
      </template>
    </StatePanel>

    <QuestionEditDialog
      v-model="questionDialog"
      :question="editingQuestion"
      @saved="reloadPackage"
    />
    <OptionEditDialog
      v-model="optionDialog"
      :question-id="editingOptionQuestionId"
      :option="editingOption"
      @saved="reloadPackage"
    />
  </div>
</template>

<style scoped>
.assessment-detail__empty {
  max-width: 48ch;
}
/* Let the question summary shrink so long stems truncate instead of
   pushing the expand icon off screen. */
.assessment-detail__summary,
.assessment-detail__summary-text {
  min-width: 0;
}
.assessment-detail__stem {
  flex: 1 1 320px;
  min-width: 0;
}
</style>
