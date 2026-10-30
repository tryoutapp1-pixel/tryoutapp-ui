<script setup>
// Assessment detail + its question package (if any).
// - If no package exists, offer the upload/builder page.
// - If a package exists, show questions/options read-only. Business rule: a
//   released assessment must be unreleased before uploading a NEW package; this
//   page does not try to re-upload, it only displays and links to edit.
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import adminService from '../../services/adminService'
import PageHeader from '../../components/PageHeader.vue'
import StatePanel from '../../components/StatePanel.vue'
import StatusChip from '../../components/StatusChip.vue'
import QuestionEditDialog from '../../components/admin/QuestionEditDialog.vue'
import OptionEditDialog from '../../components/admin/OptionEditDialog.vue'
import { formatDate, isReleased } from '../../lib/format'

const route = useRoute()
const router = useRouter()

const assessment = ref(null)
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
const editingQuestion = ref(null)
function openQuestionEdit(q) {
  editingQuestion.value = q
  questionDialog.value = true
}

// Option edit dialog
const optionDialog = ref(false)
const editingOption = ref(null)
const editingOptionQuestionId = ref(null)
function openOptionEdit(question, option) {
  editingOptionQuestionId.value = question.id
  editingOption.value = option
  optionDialog.value = true
}

onMounted(load)
</script>

<template>
  <div>
    <PageHeader title="Assessment detail">
      <template #actions>
        <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="router.push('/admin/assessments')">Back</v-btn>
        <v-btn
          v-if="assessment"
          variant="tonal"
          prepend-icon="mdi-pencil-outline"
          @click="router.push(`/admin/assessments/${assessment.id}/edit`)"
        >
          Edit
        </v-btn>
      </template>
    </PageHeader>

    <StatePanel :loading="loading" :error="error" @retry="load">
      <template v-if="assessment">
        <v-card class="pa-6 mb-6">
          <div class="d-flex align-center justify-space-between mb-3">
            <h2 class="text-h6 font-weight-bold mb-0">{{ assessment.title }}</h2>
            <div class="d-flex ga-2">
              <StatusChip :value="assessment.type" />
              <StatusChip :value="assessment.access_type" />
              <StatusChip :value="isReleased(assessment.is_released) ? 'RELEASED' : 'UNRELEASED'" />
            </div>
          </div>
          <p class="text-body-2 text-medium-emphasis mb-4">{{ assessment.description || 'No description.' }}</p>

          <v-row>
            <v-col cols="6" sm="3">
              <div class="text-caption text-medium-emphasis">Duration</div>
              <div>{{ assessment.duration_minutes != null ? assessment.duration_minutes + ' min' : '— (no timer)' }}</div>
            </v-col>
            <v-col cols="6" sm="3">
              <div class="text-caption text-medium-emphasis">Pass TWK</div>
              <div>{{ assessment.passing_score_twk }}</div>
            </v-col>
            <v-col cols="6" sm="3">
              <div class="text-caption text-medium-emphasis">Pass TIU</div>
              <div>{{ assessment.passing_score_tiu }}</div>
            </v-col>
            <v-col cols="6" sm="3">
              <div class="text-caption text-medium-emphasis">Pass TKP</div>
              <div>{{ assessment.passing_score_tkp }}</div>
            </v-col>
          </v-row>
        </v-card>

        <!-- Question package -->
        <v-card class="pa-6">
          <div class="d-flex align-center justify-space-between mb-4">
            <h3 class="text-subtitle-1 font-weight-bold mb-0">Question package</h3>
            <v-btn
              v-if="!assessment.question_package"
              color="primary"
              prepend-icon="mdi-upload"
              @click="router.push(`/admin/assessments/${assessment.id}/questions`)"
            >
              Upload questions (Excel)
            </v-btn>
          </div>

          <div v-if="!assessment.question_package" class="text-center text-medium-emphasis py-8">
            <v-icon icon="mdi-file-question-outline" size="40" class="mb-2" />
            <p class="mb-0">No question package yet. Upload one to enable release.</p>
          </div>

          <div v-else>
            <p class="text-body-2 text-medium-emphasis mb-4">
              {{ pkg ? pkg.questions.length : assessment.question_package.question_count }} question(s) ·
              created {{ formatDate(assessment.question_package.created_at) }}.
              A released assessment must be unreleased before replacing its package.
            </p>

            <v-expansion-panels v-if="pkg" variant="accordion">
              <v-expansion-panel v-for="q in pkg.questions" :key="q.id">
                <v-expansion-panel-title>
                  <div class="d-flex align-center ga-3">
                    <v-chip size="x-small" label>{{ q.question_number }}</v-chip>
                    <StatusChip :value="q.question_type" />
                    <span class="text-truncate" style="max-width: 420px">{{ q.question_text }}</span>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <div class="d-flex justify-end mb-2">
                    <v-btn
                      size="small"
                      variant="tonal"
                      prepend-icon="mdi-pencil-outline"
                      @click="openQuestionEdit(q)"
                    >
                      Edit question / explanation
                    </v-btn>
                  </div>

                  <v-img v-if="q.question_image_url" :src="q.question_image_url" max-width="320" class="mb-3 rounded" />
                  <v-list density="compact">
                    <v-list-item v-for="o in q.options" :key="o.id">
                      <template #prepend>
                        <v-chip size="x-small" label class="me-2">{{ o.option_code }}</v-chip>
                      </template>
                      <v-list-item-title class="text-body-2">
                        {{ o.option_text }}
                      </v-list-item-title>
                      <v-list-item-media v-if="o.option_image_url">
                        <v-img :src="o.option_image_url" max-width="320" class="mb-3 align-start rounded" />
                      </v-list-item-media>
                      <template #append>
                        <div class="d-flex align-center ga-2">
                          <span class="text-caption text-medium-emphasis">score: {{ o.score }}</span>
                          <v-btn
                            size="x-small"
                            variant="text"
                            icon="mdi-pencil-outline"
                            title="Edit option"
                            @click="openOptionEdit(q, o)"
                          />
                        </div>
                      </template>
                    </v-list-item>
                  </v-list>
                  <v-alert v-if="q.explanation" type="info" variant="tonal" density="compact" class="mt-3">
                    {{ q.explanation }}
                  </v-alert>
                  <div v-if="q.explanation_file_url" class="mt-2">
                    <v-img v-if="q.explanation_file_url" :src="q.explanation_file_url" max-width="320" class="mb-3 rounded" />
                    <!-- <a :href="q.explanation_file_url" target="_blank" rel="noopener" class="text-primary text-body-2">
                      <v-icon icon="mdi-paperclip" size="small" /> Explanation file
                    </a> -->
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
