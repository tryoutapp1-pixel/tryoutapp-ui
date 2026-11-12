<script setup>
// The assessment engine page, shared by Latihan (untimed) and Try Out (timed).
// The timer is enabled when the loaded attempt has an expired_at deadline.
//
//  - Question navigator, question card, and per-answer save status with retry
//  - Progress, and the Try Out timer driven by the backend deadline
//  - Submit at any time; a confirmation lists unanswered questions
//  - Try Out deadline: a persistent "Time is up" dialog whose only action is
//    Submit. Answering is disabled while it is open.
//
// Edge cases:
//  - Direct load or refresh reloads the attempt from the backend, so the timer
//    and answers come from server state. A Try Out whose deadline has already
//    passed opens the "Time is up" dialog straight away.
//  - An attempt that is already finalized (409, or status not IN_PROGRESS)
//    redirects to the result page.
import { computed, onMounted, ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAttemptStore } from '../../stores/attempt'
import { useUiStore } from '../../stores/ui'
import StatePanel from '../../components/StatePanel.vue'
import QuestionNavigator from '../../components/assessment/QuestionNavigator.vue'
import QuestionCard from '../../components/assessment/QuestionCard.vue'
import AttemptProgress from '../../components/assessment/AttemptProgress.vue'
import AttemptTimer from '../../components/assessment/AttemptTimer.vue'
import TimeUpDialog from '../../components/assessment/TimeUpDialog.vue'
import ConfirmDialog from '../../components/ConfirmDialog.vue'

const route = useRoute()
const router = useRouter()
const store = useAttemptStore()
const uiStore = useUiStore()

const {
  questions,
  answers,
  saveStatus,
  activeIndex,
  activeQuestion,
  timed,
  status,
  loading,
  error,
  submitting,
  answeredCount,
  totalQuestions,
  unansweredNumbers
} = storeToRefs(store)

/** @type {import('vue').ComputedRef<import('../../types/api').AssessmentKind>} */
const kind = computed(() => route.meta.kind || 'latihan')
const assessmentId = computed(() => route.params.id)
const attemptId = computed(() => route.params.attemptId)

const confirmOpen = ref(false)
const timeUpOpen = ref(false)
const timeUpError = ref('')
/** Suppresses the "leave?" prompt once the attempt is submitted. */
const submitted = ref(false)
/** Guards doSubmit against double entry. */
const submittingLocal = ref(false)

const answeringLocked = computed(() => submitting.value || timeUpOpen.value)

/** Explicit closure so the timer is not coupled to Pinia's action binding. */
const remaining = () => store.remainingSeconds()

async function load() {
  try {
    await store.loadAttempt(attemptId.value, { kind: kind.value })
    if (status.value && status.value !== 'IN_PROGRESS') goToResult()
  } catch (e) {
    // 409 means the attempt is already finalized. Other errors are shown by StatePanel.
    if (e && e.status === 409) goToResult()
  }
}

function resultRoute() {
  return {
    name: `user-${kind.value}-result`,
    params: { id: assessmentId.value, attemptId: attemptId.value }
  }
}

function goToResult() {
  submitted.value = true
  router.replace(resultRoute())
}

/**
 * Back to the assessment detail without submitting. Saved answers and the
 * server-side timer are kept, so the learner can continue later.
 */
function exitAttempt() {
  router.push({ name: `user-${kind.value}-detail`, params: { id: assessmentId.value } })
}

/** @param {number} optionId */
async function onSelect(optionId) {
  const question = activeQuestion.value
  if (!question || answeringLocked.value) return
  try {
    await store.selectAnswer(question.id, optionId)
  } catch {
    uiStore.error('Could not save your answer. Select Retry on the question to try again.')
  }
}

async function onRetry() {
  const question = activeQuestion.value
  if (!question) return
  try {
    await store.retrySave(question.id)
  } catch {
    uiStore.error('Still could not save. Check your connection and retry.')
  }
}

/** Reloading the attempt mints fresh signed image URLs. */
async function onRefreshImages() {
  await store.loadAttempt(attemptId.value, { kind: kind.value })
}

function askSubmit() {
  confirmOpen.value = true
}

async function doSubmit() {
  if (submittingLocal.value) return
  submittingLocal.value = true
  confirmOpen.value = false
  timeUpError.value = ''
  try {
    await store.submit()
    submitted.value = true
    uiStore.success('Your attempt was submitted.')
    router.replace(resultRoute())
  } catch (e) {
    if (e && e.status === 409) {
      // Already finalized elsewhere; show the result.
      goToResult()
      return
    }
    if (timeUpOpen.value) timeUpError.value = e.message
    else uiStore.error(e.message)
    submittingLocal.value = false
  }
}

/** Try Out deadline reached: block answering and ask the learner to submit. */
function onExpired() {
  if (kind.value !== 'tryout' || status.value !== 'IN_PROGRESS' || submitted.value) return
  confirmOpen.value = false
  timeUpOpen.value = true
}

const confirmMessage = computed(() => {
  const missing = unansweredNumbers.value
  if (missing.length === 0) return 'Submit your attempt? You cannot change your answers afterwards.'
  const noun = missing.length === 1 ? 'question' : 'questions'
  return `You have ${missing.length} unanswered ${noun} (${missing.join(', ')}). Unanswered questions score 0. Submit anyway?`
})

// Warn before leaving an in-progress attempt. Answers are saved, but the
// learner may not intend to leave.
onBeforeRouteLeave(() => {
  if (!submitted.value && status.value === 'IN_PROGRESS') {
    return window.confirm('Leave this attempt? Your saved answers are kept and you can continue later.')
  }
  return true
})

// The attempt store is intentionally not reset on unmount: the result page
// reads the just-produced result and the is_feedback flag from it. The store
// resets itself when a different attempt is loaded.
onMounted(load)
</script>

<template>
  <div>
    <StatePanel :loading="loading" :error="error" @retry="load">
      <div v-if="status === 'IN_PROGRESS'">
        <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
          <div class="d-flex align-center ga-2">
            <v-btn
              variant="text"
              icon="mdi-arrow-left"
              density="comfortable"
              aria-label="Exit attempt"
              @click="exitAttempt"
            />
            <div>
              <h1 class="text-h6 font-weight-bold mb-0">
                {{ kind === 'tryout' ? 'Try Out' : 'Latihan' }}
              </h1>
              <span class="text-caption text-medium-emphasis">Attempt #{{ attemptId }}</span>
            </div>
          </div>
          <AttemptTimer v-if="timed" :remaining="remaining" @expired="onExpired" />
        </div>

        <v-row>
          <v-col cols="12" md="8">
            <QuestionCard
              v-if="activeQuestion"
              :question="activeQuestion"
              :selected-option-id="answers[activeQuestion.id] || null"
              :save-status="saveStatus[activeQuestion.id] || 'idle'"
              :disabled="answeringLocked"
              @select="onSelect"
              @retry="onRetry"
              @refresh="onRefreshImages"
            />

            <div class="d-flex justify-space-between mt-4">
              <v-btn
                variant="tonal"
                prepend-icon="mdi-chevron-left"
                :disabled="activeIndex === 0"
                @click="store.prev()"
              >
                Previous
              </v-btn>
              <v-btn
                v-if="activeIndex < totalQuestions - 1"
                variant="tonal"
                append-icon="mdi-chevron-right"
                @click="store.next()"
              >
                Next
              </v-btn>
              <v-btn
                v-else
                color="primary"
                variant="flat"
                prepend-icon="mdi-check"
                :loading="submitting"
                @click="askSubmit"
              >
                Submit
              </v-btn>
            </div>
          </v-col>

          <v-col cols="12" md="4">
            <v-card variant="outlined" class="pa-4 mb-4">
              <AttemptProgress :answered="answeredCount" :total="totalQuestions" />
            </v-card>

            <QuestionNavigator
              :questions="questions"
              :answers="answers"
              :active-index="activeIndex"
              class="mb-4"
              @navigate="store.goTo($event)"
            />

            <v-btn
              color="primary"
              variant="flat"
              block
              size="large"
              prepend-icon="mdi-check-circle-outline"
              :loading="submitting"
              @click="askSubmit"
            >
              Submit attempt
            </v-btn>
          </v-col>
        </v-row>
      </div>
    </StatePanel>

    <ConfirmDialog
      v-model="confirmOpen"
      title="Submit attempt"
      :message="confirmMessage"
      confirm-text="Submit"
      confirm-color="primary"
      :loading="submitting"
      @confirm="doSubmit"
    />

    <TimeUpDialog
      v-model="timeUpOpen"
      :submitting="submitting"
      :answered="answeredCount"
      :total="totalQuestions"
      :error="timeUpError"
      @submit="doSubmit"
    />
  </div>
</template>
