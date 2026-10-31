<script setup>
// FU14 / FU21 - score result, plus the conditional feedback flow (FU13 / FU20).
//
// Two entry paths:
//  1) Right after submit: the attempt store already holds the result and the
//     backend `is_feedback` flag. When is_feedback === false we prompt the
//     feedback form (once-per-assessment rule, enforced by the backend).
//  2) Direct navigation / refresh: we fetch the finalized result from
//     GET /:kind/attempts/:attemptId/result. The `is_feedback` flag is only
//     returned by submit, so on this path we do not auto-open the feedback
//     form; the user can still open it manually (the backend rejects duplicates
//     with a clear 409).
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAttemptStore } from '../../stores/attempt'
import { useSubscriptionStore } from '../../stores/subscription'
import { useUiStore } from '../../stores/ui'
import userService from '../../services/userService'
import PageHeader from '../../components/PageHeader.vue'
import StatePanel from '../../components/StatePanel.vue'
import ResultCard from '../../components/assessment/ResultCard.vue'
import FeedbackDialog from '../../components/assessment/FeedbackDialog.vue'

const route = useRoute()
const router = useRouter()
const store = useAttemptStore()
const subscriptionStore = useSubscriptionStore()
const uiStore = useUiStore()
const { result: storeResult, isFeedback, answers: storeAnswers, assessmentId: storeAssessmentId } =
  storeToRefs(store)
// Premium status drives the explanations-button copy (Feature 3 / Feature 4).
const { isPremium } = storeToRefs(subscriptionStore)

const kind = computed(() => route.meta.kind || 'latihan')
const assessmentId = computed(() => route.params.id)

const result = ref(null)
const loading = ref(false)
const error = ref('')

const feedbackOpen = ref(false)
const feedbackSubmitting = ref(false)
const feedbackDone = ref(false)

async function load() {
  // Prefer the fresh result produced by submit in this session.
  if (storeResult.value && String(storeAssessmentId.value) === String(assessmentId.value)) {
    result.value = storeResult.value
    // Auto-prompt feedback only when the backend said it is missing.
    if (isFeedback.value === false) feedbackOpen.value = true
    return
  }
  loading.value = true
  error.value = ''
  try {
    result.value = await userService.getResult(kind.value, route.params.attemptId)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function submitFeedback(payload) {
  feedbackSubmitting.value = true
  try {
    await userService.submitFeedback(assessmentId.value, payload)
    feedbackDone.value = true
    feedbackOpen.value = false
    uiStore.success('Thanks for your feedback!')
  } catch (e) {
    if (e.status === 409) {
      feedbackDone.value = true
      feedbackOpen.value = false
      uiStore.notify('You have already submitted feedback for this assessment.', 'info')
    } else {
      uiStore.error(e.message)
    }
  } finally {
    feedbackSubmitting.value = false
  }
}

function viewExplanations() {
  router.push({
    name: `user-${kind.value}-explanations`,
    params: { id: assessmentId.value }
  })
}

// Whether to offer the "Give feedback" button: only when we know it's pending
// (fresh submit, is_feedback === false) and it hasn't been submitted yet.
const canGiveFeedback = computed(() => isFeedback.value === false && !feedbackDone.value)

onMounted(() => {
  load()
  // Keep the Premium gate copy accurate.
  subscriptionStore.fetchSubscription().catch(() => {})
})
</script>

<template>
  <div>
    <PageHeader :title="`${kind === 'tryout' ? 'Try Out' : 'Latihan'} result`">
      <template #actions>
        <v-btn variant="text" prepend-icon="mdi-arrow-left" :to="{ name: `user-${kind}` }">
          Back to list
        </v-btn>
      </template>
    </PageHeader>

    <StatePanel :loading="loading" :error="error" @retry="load">
      <div v-if="result" class="result-wrap">
        <ResultCard :result="result" />

        <div class="d-flex flex-wrap ga-3 justify-center mt-6">
          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-book-open-variant"
            @click="viewExplanations"
          >
            {{ isPremium ? 'View explanations' : 'Review answers' }}
          </v-btn>
          <v-btn
            v-if="canGiveFeedback"
            color="secondary"
            variant="tonal"
            prepend-icon="mdi-message-star-outline"
            @click="feedbackOpen = true"
          >
            Give feedback
          </v-btn>
          <v-btn
            variant="text"
            prepend-icon="mdi-view-list-outline"
            :to="{ name: `user-${kind}-detail`, params: { id: assessmentId } }"
          >
            Assessment detail
          </v-btn>
        </div>
      </div>
    </StatePanel>

    <FeedbackDialog
      v-model="feedbackOpen"
      :submitting="feedbackSubmitting"
      @submit="submitFeedback"
    />
  </div>
</template>

<style scoped>
.result-wrap {
  max-width: 720px;
  margin: 0 auto;
}
</style>
