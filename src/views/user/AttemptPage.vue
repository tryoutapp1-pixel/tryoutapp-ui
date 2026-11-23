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
    uiStore.success('Terima kasih atas masukanmu.')
    goToExplanations()
  } catch (e) {
    if (e && e.status === 409) {
      store.isFeedback = true
      feedbackOpen.value = false
      uiStore.notify('Kamu sudah pernah mengirim masukan untuk paket soal ini.', 'info')
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
    uiStore.error('Jawaban belum tersimpan. Pilih Coba lagi pada soal untuk menyimpannya ulang.')
  }
}

async function onRetry() {
  const question = activeQuestion.value
  if (!question) return
  try {
    await store.retrySave(question.id)
  } catch {
    uiStore.error('Jawaban masih belum tersimpan. Periksa koneksi internetmu, lalu coba lagi.')
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
    uiStore.success('Jawabanmu sudah dikumpulkan.')
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
  if (missing.length === 0) return 'Kumpulkan jawaban sekarang? Jawaban tidak bisa diubah setelah dikumpulkan.'
  // Indonesian does not inflect "soal" for number; both branches read the same.
  const noun = missing.length === 1 ? 'soal' : 'soal'
  return `Masih ada ${missing.length} ${noun} yang belum dijawab (nomor ${missing.join(', ')}). Soal yang tidak dijawab bernilai 0. Tetap kumpulkan jawaban?`
})

// Warn before leaving an in-progress attempt. Answers are saved, but the
// learner may not intend to leave.
onBeforeRouteLeave(() => {
  if (!submitted.value && status.value === 'IN_PROGRESS') {
    return window.confirm('Tinggalkan pengerjaan ini? Jawaban yang sudah tersimpan tetap aman dan kamu bisa melanjutkannya nanti.')
  }
  return true
})

// The attempt store resets itself when a different attempt is loaded.
onMounted(load)
</script>

<template>
  <div>
    <StatePanel :loading="loading" :error="error" @retry="load">
      <!-- Layout: below 960px everything stacks (head, timer/progress, question,
           navigator, submit) and the Try Out timer card sticks under the app
           bar. From 960px the side panel becomes a sticky right column. -->
      <div v-if="status === 'IN_PROGRESS'" class="attempt-layout">
        <div class="attempt-head">
          <h1 class="text-headline-small mb-1">
            {{ kind === 'tryout' ? 'Try Out' : 'Latihan' }}
          </h1>
          <span class="text-body-small text-medium-emphasis">Pengerjaan #{{ attemptId }}</span>
        </div>

        <div class="attempt-main">
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

          <div class="d-flex justify-space-between flex-wrap ga-3 mt-4">
            <v-btn
              variant="tonal"
              color="primary"
              prepend-icon="mdi-chevron-left"
              :disabled="activeIndex === 0"
              @click="store.prev()"
            >
              Sebelumnya
            </v-btn>
            <v-btn
              v-if="activeIndex < totalQuestions - 1"
              variant="tonal"
              color="primary"
              append-icon="mdi-chevron-right"
              @click="store.next()"
            >
              Berikutnya
            </v-btn>
            <v-btn
              v-else
              color="primary"
              variant="flat"
              prepend-icon="mdi-check"
              :loading="submitting"
              @click="askSubmit"
            >
              Kumpulkan jawaban
            </v-btn>
          </div>
        </div>

        <div class="attempt-aside">
          <v-card class="attempt-status pa-4 pa-md-5" :class="{ 'attempt-status--sticky': timed }">
            <div class="d-flex flex-wrap align-center ga-4">
              <AttemptTimer v-if="timed" class="attempt-status__timer" :remaining="remaining" @expired="onExpired" />
              <div class="attempt-status__progress">
                <AttemptProgress :answered="answeredCount" :total="totalQuestions" />
              </div>
            </div>
          </v-card>

          <QuestionNavigator
            :questions="questions"
            :answers="answers"
            :active-index="activeIndex"
            class="attempt-nav"
            @navigate="store.goTo($event)"
          />

          <v-btn
            color="primary"
            variant="flat"
            block
            size="large"
            prepend-icon="mdi-check-circle-outline"
            class="attempt-submit"
            :loading="submitting"
            @click="askSubmit"
          >
            Kumpulkan jawaban
          </v-btn>
        </div>
      </div>
      <v-card v-else-if="feedbackOpen" class="pa-8 text-center rounded-xl">
        <v-avatar color="success" variant="tonal" size="64" class="mb-4">
          <v-icon icon="mdi-check-circle-outline" size="32" />
        </v-avatar>
        <h1 class="text-title-large mb-2">Jawaban sudah dikumpulkan</h1>
        <p class="text-body-medium text-medium-emphasis mb-0">
          Isi masukan singkat untuk lanjut ke pembahasan.
        </p>
      </v-card>
    </StatePanel>

    <ConfirmDialog
      v-model="confirmOpen"
      title="Kumpulkan jawaban?"
      :message="confirmMessage"
      confirm-text="Kumpulkan jawaban"
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

<style scoped>
.attempt-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
}

.attempt-status__timer {
  flex: 1 1 auto;
}

.attempt-status__progress {
  flex: 1 1 120px;
  min-width: 0;
}

/* Stacked: the side panel dissolves so its parts can be ordered around the
   question. */
@media (max-width: 959.98px) {
  .attempt-aside {
    display: contents;
  }
  .attempt-head { order: 0; }
  .attempt-status { order: 1; }
  .attempt-main { order: 2; }
  .attempt-nav { order: 3; }
  .attempt-submit { order: 4; }

  /* Try Out: keep the timer in view under the 64px app bar. */
  .attempt-status--sticky {
    position: sticky;
    top: 72px;
    z-index: 2;
  }
}

/* Two columns: question on the left, sticky panel on the right. The panel
   scrolls on its own when a long navigator does not fit the viewport. */
@media (min-width: 960px) {
  .attempt-layout {
    grid-template-columns: minmax(0, 1fr) 320px;
    grid-template-rows: auto 1fr;
    column-gap: 32px;
    align-items: start;
  }
  .attempt-head {
    grid-column: 1;
    grid-row: 1;
  }
  .attempt-main {
    grid-column: 1;
    grid-row: 2;
  }
  .attempt-aside {
    grid-column: 2;
    grid-row: 1 / span 2;
    position: sticky;
    top: 88px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-height: calc(100vh - 112px);
    overflow-y: auto;
    /* Room for focus rings and card shadows inside the scroll box. */
    padding: 6px;
    margin: -6px;
  }
}
</style>
