<script setup>
// FU11 (Latihan detail) / FU18 (Try Out detail). Parameterized by route meta
// `kind`. Shows title, description, question count, duration (Try Out), and
// passing scores. "Start / Continue" calls POST /:kind/:id/attempts, which the
// backend makes idempotent (it reuses an IN_PROGRESS attempt), then routes to
// the distraction-free attempt engine. A 403 means Premium is required.
//
// A single "Start / Continue" action covers both the new-attempt and resume
// cases (the backend resolves which attempt to use). A separate "View attempt
// history" link opens the per-assessment history page (Try Out is backed by
// GET /users/tryout/statistics; Latihan history has no backend list endpoint).
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAssessmentsStore } from '../../stores/assessments'
import { useUiStore } from '../../stores/ui'
import userService from '../../services/userService'
import PageHeader from '../../components/PageHeader.vue'
import StatePanel from '../../components/StatePanel.vue'
import StatusChip from '../../components/StatusChip.vue'

const route = useRoute()
const router = useRouter()
const store = useAssessmentsStore()
const uiStore = useUiStore()

const kind = computed(() => route.meta.kind || 'latihan')
const isTryout = computed(() => kind.value === 'tryout')

const assessment = ref(null)
const loading = ref(false)
const error = ref('')
const forbidden = ref(false)
const starting = ref(false)

async function load() {
  loading.value = true
  error.value = ''
  forbidden.value = false
  try {
    assessment.value = await store.fetchDetail(kind.value, route.params.id)
  } catch (e) {
    if (e.status === 403) forbidden.value = true
    else error.value = e.message
  } finally {
    loading.value = false
  }
}

async function start() {
  if (starting.value) return
  starting.value = true
  try {
    const data = await userService.startAttempt(kind.value, route.params.id)
    // The active attempt runs under the distraction-free AssessmentLayout.
    router.push({
      name: `user-${kind.value}-attempt`,
      params: { id: route.params.id, attemptId: data.attempt_id }
    })
  } catch (e) {
    if (e.status === 403) {
      forbidden.value = true
    } else {
      uiStore.error(e.message)
    }
  } finally {
    starting.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <PageHeader :title="isTryout ? 'Try Out' : 'Latihan'">
      <template #actions>
        <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="router.push(`/app/${kind}`)">
          Back
        </v-btn>
      </template>
    </PageHeader>

    <v-card v-if="forbidden" class="pa-8 text-center" variant="outlined">
      <v-icon icon="mdi-crown-outline" color="amber" size="48" class="mb-3" />
      <h3 class="text-h6 font-weight-bold mb-2">This package is Premium</h3>
      <p class="text-body-2 text-medium-emphasis mb-4">
        Upgrade to Premium to work on this {{ isTryout ? 'Try Out' : 'Latihan' }}.
      </p>
      <v-btn color="primary" variant="flat" to="/app/subscription" prepend-icon="mdi-crown">
        Go Premium
      </v-btn>
    </v-card>

    <StatePanel v-else :loading="loading" :error="error" @retry="load">
      <v-card v-if="assessment" variant="outlined" class="pa-6" max-width="760">
        <div class="d-flex align-center justify-space-between mb-3 flex-wrap ga-2">
          <h2 class="text-h6 font-weight-bold mb-0">{{ assessment.title }}</h2>
          <div class="d-flex ga-2">
            <StatusChip :value="assessment.type" />
            <StatusChip :value="assessment.access_type" />
          </div>
        </div>

        <p class="text-body-2 text-medium-emphasis mb-4" style="white-space: pre-line">
          {{ assessment.description || 'No description.' }}
        </p>

        <v-row class="text-center mb-2">
          <v-col cols="6" :sm="isTryout ? 4 : 6">
            <v-card variant="tonal" class="pa-4">
              <v-icon icon="mdi-help-circle-outline" color="primary" class="mb-1" />
              <div class="text-h6 font-weight-bold">{{ assessment.question_count }}</div>
              <div class="text-caption text-medium-emphasis">Questions</div>
            </v-card>
          </v-col>
          <v-col v-if="isTryout" cols="6" sm="4">
            <v-card variant="tonal" class="pa-4">
              <v-icon icon="mdi-timer-outline" color="primary" class="mb-1" />
              <div class="text-h6 font-weight-bold">{{ assessment.duration_minutes }}</div>
              <div class="text-caption text-medium-emphasis">Minutes</div>
            </v-card>
          </v-col>
          <v-col cols="6" :sm="isTryout ? 4 : 6">
            <v-card variant="tonal" class="pa-4">
              <v-icon icon="mdi-flag-checkered" color="primary" class="mb-1" />
              <div class="text-body-2 font-weight-bold">
                {{ assessment.passing_score_twk }}/{{ assessment.passing_score_tiu }}/{{
                  assessment.passing_score_tkp
                }}
              </div>
              <div class="text-caption text-medium-emphasis">Pass TWK/TIU/TKP</div>
            </v-card>
          </v-col>
        </v-row>

        <v-alert
          v-if="isTryout"
          type="info"
          variant="tonal"
          density="comfortable"
          class="my-4"
        >
          This is a timed assessment. The timer starts when you begin and is
          tracked by the server — it keeps running even if you close the page.
        </v-alert>

        <v-btn
          color="primary"
          variant="flat"
          size="large"
          block
          class="mt-2"
          prepend-icon="mdi-play"
          :loading="starting"
          @click="start"
        >
          Start / Continue
        </v-btn>

        <v-btn
          variant="tonal"
          size="large"
          block
          class="mt-3"
          prepend-icon="mdi-history"
          :to="{ name: `user-${kind}-history`, params: { id: route.params.id } }"
        >
          View attempt history
        </v-btn>
      </v-card>
    </StatePanel>
  </div>
</template>
