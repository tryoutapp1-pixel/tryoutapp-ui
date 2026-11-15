<script setup>
// Answer review for a finalized attempt. The backend requires a COMPLETED or
// EXPIRED attempt for this assessment (403 otherwise). It returns the learner's
// answers, the correct answers (TWK/TIU), and option scores to every user, and
// the written explanation to Premium users only.
//
// `?attempt=<id>` reviews that attempt (from attempt history, or right after
// submitting); without it
// the backend uses the learner's latest finalized attempt.
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useSubscriptionStore } from '../../stores/subscription'
import userService from '../../services/userService'
import PageHeader from '../../components/PageHeader.vue'
import StatePanel from '../../components/StatePanel.vue'
import ExplanationList from '../../components/assessment/ExplanationList.vue'

const route = useRoute()
const subscriptionStore = useSubscriptionStore()
const { isPremium } = storeToRefs(subscriptionStore)

/** @type {import('vue').ComputedRef<import('../../types/api').AssessmentKind>} */
const kind = computed(() => route.meta.kind || 'latihan')
const assessmentId = computed(() => route.params.id)
const attemptId = computed(() => (typeof route.query.attempt === 'string' ? route.query.attempt : null))

/** @type {import('vue').Ref<import('../../types/api').ExplanationItem[]>} */
const questions = ref([])
const loading = ref(false)
const error = ref('')
const forbidden = ref(false)

/** @param {{ silent?: boolean }} [options] - silent keeps the current view while refreshing image URLs */
async function load({ silent = false } = {}) {
  if (!silent) loading.value = true
  error.value = ''
  forbidden.value = false
  try {
    // The plan may have changed since the last visit; refresh it alongside.
    const [items] = await Promise.all([
      userService.getExplanations(kind.value, assessmentId.value, attemptId.value),
      subscriptionStore.fetchSubscription()
    ])
    questions.value = items
  } catch (e) {
    if (e.status === 403) forbidden.value = true
    else error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(() => load())
</script>

<template>
  <div>
    <PageHeader
      :title="`Pembahasan ${kind === 'tryout' ? 'Try Out' : 'Latihan'}`"
      :subtitle="attemptId ? `Pengerjaan #${attemptId}` : 'Pengerjaan terakhirmu'"
    >
      <template #actions>
        <v-btn variant="text" prepend-icon="mdi-arrow-left" :to="{ name: `user-${kind}-history`, params: { id: assessmentId } }">
          Kembali ke riwayat
        </v-btn>
      </template>
    </PageHeader>

    <v-card v-if="forbidden" class="pa-8 text-center rounded-xl">
      <v-avatar color="warning" variant="tonal" size="64" class="mb-4">
        <v-icon icon="mdi-lock-outline" size="32" />
      </v-avatar>
      <h2 class="text-title-large mb-2">Pembahasan terkunci</h2>
      <p class="text-body-medium text-medium-emphasis mb-0 mx-auto locked-text">
        Selesaikan paket soal ini untuk melihat pembahasan. Paket soal Premium memerlukan langganan Premium.
      </p>
    </v-card>

    <StatePanel
      v-else
      :loading="loading"
      :error="error"
      :empty="!loading && !error && questions.length === 0"
      empty-text="Paket soal ini belum punya soal untuk dibahas."
      @retry="load()"
    >
      <ExplanationList :questions="questions" :show-explanation="isPremium" @refresh="load({ silent: true })" />
    </StatePanel>
  </div>
</template>

<style scoped>
.locked-text {
  max-width: 48ch;
}
</style>
