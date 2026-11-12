<script setup>
// Score result plus the required feedback step.
//
// Two entry paths:
//  1) Right after submit: the attempt store holds the result and the backend
//     `is_feedback` flag. When is_feedback === false the feedback dialog opens
//     and stays open until feedback is saved (one per assessment).
//  2) Direct navigation or refresh: the result is fetched from
//     GET /:kind/attempts/:attemptId/result. That endpoint does not return
//     `is_feedback`, so the dialog does not open on this path.
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
const { result: storeResult, isFeedback, attemptId: storeAttemptId } = storeToRefs(store)
const { isPremium } = storeToRefs(subscriptionStore)

/** @type {import('vue').ComputedRef<import('../../types/api').AssessmentKind>} */
const kind = computed(() => route.meta.kind || 'latihan')
const assessmentId = computed(() => route.params.id)
const attemptId = computed(() => route.params.attemptId)

/** @type {import('vue').Ref<import('../../types/api').AttemptResult|null>} */
const result = ref(null)
const loading = ref(false)
const error = ref('')

const feedbackOpen = ref(false)
const feedbackSubmitting = ref(false)

async function load() {
  // Prefer the result produced by submit in this session.
  if (storeResult.value && String(storeAttemptId.value) === String(attemptId.value)) {
    result.value = storeResult.value
    if (isFeedback.value === false) feedbackOpen.value = true
    return
  }
  loading.value = true
  error.value = ''
  try {
    result.value = await userService.getResult(kind.value, attemptId.value)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

/**
 * Saves feedback. The dialog closes on success, or on 409 when feedback for
 * this assessment already exists; any other error keeps it open for a retry.
 * @param {import('../../types/api').FeedbackPayload} payload
 */
async function submitFeedback(payload) {
  feedbackSubmitting.value = true
  try {
    await userService.submitFeedback(assessmentId.value, payload)
    isFeedback.value = true
    feedbackOpen.value = false
    uiStore.success('Thanks for your feedback.')
  } catch (e) {
    if (e.status === 409) {
      isFeedback.value = true
      feedbackOpen.value = false
      uiStore.notify('You have already sent feedback for this assessment.', 'info')
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
    params: { id: assessmentId.value },
    query: { attempt: attemptId.value }
  })
}

onMounted(() => {
  load()
  // Keep the explanation button label accurate.
  subscriptionStore.fetchSubscription()
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
          <v-btn color="primary" variant="flat" prepend-icon="mdi-book-open-variant" @click="viewExplanations">
            {{ isPremium ? 'Review answers and explanations' : 'Review answers' }}
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

    <FeedbackDialog :model-value="feedbackOpen" :submitting="feedbackSubmitting" @submit="submitFeedback" />
  </div>
</template>

<style scoped>
.result-wrap {
  max-width: 720px;
  margin: 0 auto;
}
</style>
