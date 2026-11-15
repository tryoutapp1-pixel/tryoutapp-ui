<script setup>
// Attempt history for one assessment, for Latihan and Try Out alike. Data comes
// from GET /users/:kind/:assessmentId/attempts: the learner's finalized
// attempts with their backend-calculated results, newest first, available to
// Free and Premium users. Each row opens that attempt's answer review by
// attempt_id (never the assessment id). Back returns to the assessment detail.
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAssessmentsStore } from '../../stores/assessments'
import { useSubscriptionStore } from '../../stores/subscription'
import PageHeader from '../../components/PageHeader.vue'
import AttemptHistoryList from '../../components/assessment/AttemptHistoryList.vue'

/** @typedef {import('../../types/api').AttemptHistoryEntry} AttemptHistoryEntry */

const route = useRoute()
const router = useRouter()
const store = useAssessmentsStore()
const subscriptionStore = useSubscriptionStore()
const { isPremium } = storeToRefs(subscriptionStore)

/** @type {import('vue').ComputedRef<import('../../types/api').AssessmentKind>} */
const kind = computed(() => route.meta.kind || 'latihan')
const assessmentId = computed(() => route.params.id)
const isTryout = computed(() => kind.value === 'tryout')

/** @type {import('vue').Ref<AttemptHistoryEntry[]>} */
const items = ref([])
const loading = ref(false)
const error = ref('')
const title = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [history, detail] = await Promise.all([
      store.fetchAttemptHistory(kind.value, assessmentId.value),
      store.fetchDetail(kind.value, assessmentId.value).catch(() => null)
    ])
    items.value = history
    title.value = (detail && detail.title) || (history[0] && history[0].assessment_title) || ''
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

/** @param {AttemptHistoryEntry} attempt */
function reviewAttempt(attempt) {
  router.push({
    name: `user-${kind.value}-explanations`,
    params: { id: assessmentId.value },
    query: { attempt: String(attempt.attempt_id) }
  })
}

/** @param {AttemptHistoryEntry} attempt */
function continueAttempt(attempt) {
  router.push({
    name: `user-${kind.value}-attempt`,
    params: { id: assessmentId.value, attemptId: attempt.attempt_id }
  })
}

onMounted(() => {
  load()
  // Keeps the review button label accurate.
  subscriptionStore.fetchSubscription()
})
</script>

<template>
  <div>
    <PageHeader :title="`Riwayat pengerjaan ${isTryout ? 'Try Out' : 'Latihan'}`" :subtitle="title">
      <template #actions>
        <v-btn variant="text" prepend-icon="mdi-arrow-left" :to="{ name: `user-${kind}-detail`, params: { id: assessmentId } }">
          Kembali ke paket soal
        </v-btn>
      </template>
    </PageHeader>

    <AttemptHistoryList
      :items="items"
      :loading="loading"
      :error="error"
      :premium="isPremium"
      @retry="load"
      @review="reviewAttempt"
      @continue="continueAttempt"
    />
  </div>
</template>
