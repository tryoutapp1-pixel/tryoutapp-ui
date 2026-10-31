<script setup>
// Attempt history for a single assessment (Feature 1: Latihan, Feature 2:
// Try Out). Parameterized by route meta `kind`. Reuses AttemptHistoryList so
// both kinds share one presentation.
//
// Data source (verified against the backend):
//  - Try Out: GET /users/tryout/statistics, filtered to this assessment_id.
//    These are finalized attempts only; the backend does not expose
//    IN_PROGRESS attempts in a list.
//  - Latihan: no list endpoint exists, so the store returns supported:false and
//    the list shows an honest "not available yet" notice. (Backend dependency
//    documented in the implementation report.)
//
// Each row navigates to that specific attempt's result page using the correct
// attempt_id — never the assessment id.
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAssessmentsStore } from '../../stores/assessments'
import PageHeader from '../../components/PageHeader.vue'
import AttemptHistoryList from '../../components/assessment/AttemptHistoryList.vue'

const route = useRoute()
const router = useRouter()
const store = useAssessmentsStore()

const kind = computed(() => route.meta.kind || 'latihan')
const assessmentId = computed(() => route.params.id)
const isTryout = computed(() => kind.value === 'tryout')

const items = ref([])
const supported = ref(true)
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
    items.value = history.items
    supported.value = history.supported
    title.value = (detail && detail.title) || (items.value[0] && items.value[0].assessment_title) || ''
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function viewAttempt(attempt) {
  router.push({
    name: `user-${kind.value}-result`,
    params: { id: assessmentId.value, attemptId: attempt.attempt_id }
  })
}

onMounted(load)
</script>

<template>
  <div>
    <PageHeader
      :title="`${isTryout ? 'Try Out' : 'Latihan'} attempt history`"
      :subtitle="title"
    >
      <template #actions>
        <v-btn
          variant="text"
          prepend-icon="mdi-arrow-left"
          :to="{ name: `user-${kind}-detail`, params: { id: assessmentId } }"
        >
          Back to detail
        </v-btn>
      </template>
    </PageHeader>

    <AttemptHistoryList
      :items="items"
      :loading="loading"
      :error="error"
      :supported="supported"
      :unsupported-text="'Latihan keeps your attempts on the server, but there is no list endpoint yet, so previous Latihan attempts cannot be shown here. Start a new attempt from the detail page; the backend reuses an in-progress attempt automatically.'"
      @retry="load"
      @view="viewAttempt"
    />
  </div>
</template>
