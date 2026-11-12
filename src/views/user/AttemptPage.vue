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
//    redirects to the answer review of that attempt.
//
// After a successful submit:
//  - When the backend reports is_feedback === false, the required feedback
//    dialog opens here. Once feedback is saved (or the backend answers 409
//    because it already exists) the learner goes to the answer review.
//  - Otherwise the learner goes straight to the answer review.
import { computed, onMounted, ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAttemptStore } from '../../stores/attempt'
import { useUiStore } from '../../stores/ui'
import userService from '../../services/userService'
import StatePanel from '../../components/StatePanel.vue'
import FeedbackDialog from '../../components/assessment/FeedbackDialog.vue'
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

const feedbackOpen = ref(false)
const feedbackSubmitting = ref(false)

async function load() {
  try {
    await store.loadAttempt(attemptId.value, { kind: kind.value })
    if (status.value && status.value !== 'IN_PROGRESS') goToExplanations()
  } catch (e) {
    // 409 means the attempt is already finalized. Other errors are shown by StatePanel.
    if (e && e.status === 409) goToExplanations()
  }
}

/** Replaces the attempt page with the answer review of this attempt. */
function goToExplanations() {
  submitted.value = true
  router.replace({
    name: `user-${kind.value}-explanations`,
    params: { id: assessmentId.value },
    query: { attempt: String(attemptId.value) }
  })
}

/**
 * Saves feedback. The dialog closes and the learner moves on to the answer
 * review on success, or on 409 when feedback for this assessment already
 * exists. Any other error keeps the dialog open for a retry.
 * @param {import('../../types/api').FeedbackPayload} payload
 */
async function submitFeedback(payload) {
  if (feedbackSubmitting.value) return
  feedbackSubmitting.value = true
  try {
    await userService.submitFeedback(assessmentId.value, payload)
    store.isFeedback = true
    feedbackOpen.value = false
    uiStore.success('Thanks for your feedback.')
    goToExplanations()
  } catch (e) {
    if (e && e.status === 409) {
      store.isFeedback = true
      feedbackOpen.value = false
      uiStore.notify('You have already sent feedback for this assessment.', 'info')
      goToExplanations()
    } else {
      uiStore.error(e.message)
    }
  } finally {
    feedbackSubmitting.value = false
  }
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
    const data = await store.submit()
    submitted.value = true
    timeUpOpen.value = false
    uiStore.success('Your attempt was submitted.')
    if (data && data.is_feedback === false) {
      // Feedback is required before moving on to the answer review.
      feedbackOpen.value = true
      return
    }
    goToExplanations()
  } catch (e) {
    if (e && e.status === 409) {
      // Already finalized elsewhere; show its answer review.
      goToExplanations()
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

// The attempt store resets itself when a different attempt is loaded.
onMounted(load)
</script>

<template>
  <div>
    <StatePanel :loading="loading" :error="error" @retry="load">
      <div v-if="status === 'IN_PROGRESS'">
        <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
          <div>
            <h1 class="text-h6 font-weight-bold mb-0">
              {{ kind === 'tryout' ? 'Try Out' : 'Latihan' }}
            </h1>
            <span class="text-caption text-medium-emphasis">Attempt #{{ attemptId }}</span>
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
      <v-card v-else-if="feedbackOpen" variant="outlined" class="pa-8 text-center">
        <v-icon icon="mdi-check-circle-outline" color="success" size="48" class="mb-3" />
        <div class="text-h6 font-weight-bold">Attempt submitted</div>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Share your feedback to continue to the answer review.
        </p>
      </v-card>
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

    <FeedbackDialog :model-value="feedbackOpen" :submitting="feedbackSubmitting" @submit="submitFeedback" />
  </div>
</template>
