<script setup>
// FU15 / FU22 - explanations. Backend authorization: the user must have a
// COMPLETED/EXPIRED attempt for this assessment (else 403). We fetch the
// explanation set (correct options via option.score, written explanation,
// optional explanation image with a short-lived signed URL).
//
// "Your answer" is only shown when the user's selections are still known from
// the just-completed attempt in this session (the backend does not return a
// user's answers for a finalized attempt). The ExplanationList component makes
// this limitation explicit in the UI.
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAttemptStore } from '../../stores/attempt'
import userService from '../../services/userService'
import PageHeader from '../../components/PageHeader.vue'
import StatePanel from '../../components/StatePanel.vue'
import ExplanationList from '../../components/assessment/ExplanationList.vue'

const route = useRoute()
const router = useRouter()
const attemptStore = useAttemptStore()
const { answers: storeAnswers, assessmentId: storeAssessmentId } = storeToRefs(attemptStore)

const kind = computed(() => route.meta.kind || 'latihan')
const assessmentId = computed(() => route.params.id)

const questions = ref([])
const loading = ref(false)
const error = ref('')
const forbidden = ref(false)

// Pass through the user's answers only if they belong to this assessment and
// are still in memory from this session's attempt.
const userAnswers = computed(() =>
  String(storeAssessmentId.value) === String(assessmentId.value) ? storeAnswers.value : {}
)

async function load() {
  loading.value = true
  error.value = ''
  forbidden.value = false
  try {
    questions.value = await userService.getExplanations(kind.value, assessmentId.value)
  } catch (e) {
    if (e.status === 403) forbidden.value = true
    else error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <PageHeader :title="`${kind === 'tryout' ? 'Try Out' : 'Latihan'} explanations`">
      <template #actions>
        <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="router.push(`/app/${kind}/${assessmentId}`)">
          Back
        </v-btn>
      </template>
    </PageHeader>

    <v-card v-if="forbidden" class="pa-8 text-center" variant="outlined">
      <v-icon icon="mdi-lock-outline" color="warning" size="48" class="mb-3" />
      <h3 class="text-h6 font-weight-bold mb-2">Explanations locked</h3>
      <p class="text-body-2 text-medium-emphasis mb-0">
        Complete this assessment to unlock its explanations.
      </p>
    </v-card>

    <StatePanel
      v-else
      :loading="loading"
      :error="error"
      :empty="!loading && !error && questions.length === 0"
      empty-text="No explanations available."
      @retry="load"
    >
      <ExplanationList :questions="questions" :user-answers="userAnswers" @refresh="load" />
    </StatePanel>
  </div>
</template>
