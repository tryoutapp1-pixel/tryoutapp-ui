<script setup>
// FU12 / FU19 - the assessment engine driver. Shared by Latihan (untimed) and
// Try Out (timed); the only difference is the timer, which is enabled when the
// loaded attempt carries an expired_at.
//
// Responsibilities wired to the attempt store:
//  - FU12a/19a: question navigator (number grid + legend)
//  - FU12b/19b: question + options display and selection
//  - FU12c/19c: progress; Try Out timer sourced from the backend deadline
//  - FU12d/19d: per-answer persistence with save status + retry
//  - FU12e/19e: submit with confirmation + unanswered warning
//
// Edge cases:
//  - Direct load / refresh: we load the attempt fresh from the backend, so the
//    timer and answers are restored from server state.
//  - Attempt already finalized (409 on load, or status not IN_PROGRESS):
//    redirect to the result page.
//  - Try Out deadline reached: auto-submit via the same submit flow.
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

const kind = computed(() => route.meta.kind || 'latihan')
const assessmentId = computed(() => route.params.id)
const attemptId = computed(() => route.params.attemptId)

const confirmOpen = ref(false)
const submitted = ref(false) // suppresses the "leave?" guard after submit
const submittingLocal = ref(false) // guards doSubmit against double entry

// Explicit closure so the timer isn't coupled to Pinia's action binding.
const remaining = () => store.remainingSeconds()

async function load() {
  try {
    await store.loadAttempt(attemptId.value, { kind: kind.value })
    // If the attempt is already finalized, go straight to the result.
    if (status.value && status.value !== 'IN_PROGRESS') {
      goToResult()
    }
  } catch (e) {
    // 409 = already finalized: send the user to the result page.
    if (e && e.status === 409) {
      goToResult()
    }
    // other errors are surfaced by StatePanel via store.error
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

// Exit back to the assessment detail without finalizing. The onBeforeRouteLeave
// guard below still prompts and the attempt store is left intact, so saved
// answers and the server-tracked timer are preserved for later continuation.
function exitAttempt() {
  router.push({ name: `user-${kind.value}-detail`, params: { id: assessmentId.value } })
}

async function onSelect(optionId) {
  const q = activeQuestion.value
  if (!q) return
  try {
    await store.selectAnswer(q.id, optionId)
  } catch {
    uiStore.error('Could not save your answer. Tap Retry on the question to try again.')
  }
}

async function onRetry() {
  const q = activeQuestion.value
  if (!q) return
  try {
    await store.retrySave(q.id)
  } catch {
    uiStore.error('Still could not save. Check your connection and retry.')
  }
}

// Refresh signed image URLs by reloading the attempt (mints fresh URLs).
async function onRefreshImages() {
  await store.loadAttempt(attemptId.value, { kind: kind.value })
}

function askSubmit() {
  confirmOpen.value = true
}

async function doSubmit(auto = false) {
  if (submittingLocal.value) return
  submittingLocal.value = true
  confirmOpen.value = false
  try {
    const data = await store.submit()
    submitted.value = true
    if (auto) {
      uiStore.notify('Time is up. Your attempt was submitted.', 'info')
    } else {
      uiStore.success('Your attempt was submitted.')
    }
    // Carry the feedback flag + just-known answers to the result page via store.
    router.replace(resultRoute())
    void data
  } catch (e) {
    if (e && e.status === 409) {
      // Already finalized elsewhere; just show the result.
      goToResult()
      return
    }
    uiStore.error(e.message)
    // Allow another attempt only when we did not navigate away.
    submittingLocal.value = false
  }
}

function onExpired() {
  if (status.value === 'IN_PROGRESS' && !submittingLocal.value) {
    doSubmit(true)
  }
}

const confirmMessage = computed(() => {
  const missing = unansweredNumbers.value
  if (missing.length === 0) return 'Submit your attempt? You will not be able to change answers afterwards.'
  return `You have ${missing.length} unanswered question(s): ${missing.join(', ')}. Submit anyway?`
})

// Warn before leaving an in-progress attempt (answers are saved, but the user
// may not intend to abandon the session).
onBeforeRouteLeave(() => {
  if (!submitted.value && status.value === 'IN_PROGRESS') {
    return window.confirm('Leave this attempt? Your saved answers are kept and you can continue later.')
  }
  return true
})

// NOTE: we intentionally do NOT reset the attempt store on unmount. The result
// page reads the just-produced result + is_feedback flag + the user's answers
// from the store (the backend only returns is_feedback from submit and never
// returns a finalized attempt's answers). The store clears itself when a
// different attempt is later loaded, so there is no stale-state risk.
onMounted(load)
</script>

<template>
  <div>
    <StatePanel :loading="loading" :error="error" @retry="load">
      <div v-if="status === 'IN_PROGRESS'">
        <!-- Top bar: exit + title area + timer -->
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
          <!-- Main question column -->
          <v-col cols="12" md="8">
            <QuestionCard
              v-if="activeQuestion"
              :question="activeQuestion"
              :selected-option-id="answers[activeQuestion.id] || null"
              :save-status="saveStatus[activeQuestion.id] || 'idle'"
              :disabled="submitting"
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

          <!-- Side column: progress + navigator + submit -->
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
      @confirm="doSubmit(false)"
    />
  </div>
</template>
