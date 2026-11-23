<script setup>
// FU11 (Latihan detail) / FU18 (Try Out detail). Parameterized by route meta
// `kind`. Shows title, description, question count, duration (Try Out), and
// passing scores. "Start / Continue" calls POST /:kind/:id/attempts, which the
// backend makes idempotent (it reuses an IN_PROGRESS attempt), then routes to
// the distraction-free attempt engine. A 403 means Premium is required.
//
// A single "Start / Continue" action covers both the new-attempt and resume
// cases (the backend resolves which attempt to use). "View attempt history"
// opens GET /users/:kind/:assessmentId/attempts for Latihan and Try Out.
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

/** @type {import('vue').ComputedRef<import('../../types/api').AssessmentKind>} */
const kind = computed(() => route.meta.kind || 'latihan')
const isTryout = computed(() => kind.value === 'tryout')

/** @type {import('vue').Ref<import('../../types/api').AssessmentDetail|null>} */
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
          Kembali ke {{ isTryout ? 'Try Out' : 'Latihan' }}
        </v-btn>
      </template>
    </PageHeader>

    <v-card
      v-if="forbidden"
      variant="flat"
      color="surface-light"
      class="pa-8 pa-md-10 text-center rounded-xl"
      max-width="760"
    >
      <v-avatar color="surface" size="64" class="mb-4">
        <v-icon icon="mdi-crown" color="premium-ink" size="32" />
      </v-avatar>
      <h2 class="text-title-large mb-2">Paket soal ini khusus Premium</h2>
      <p class="text-body-medium text-medium-emphasis mb-6 mx-auto premium-panel__text">
        Upgrade ke Premium untuk mengerjakan {{ isTryout ? 'Try Out' : 'Latihan' }} ini dan membaca
        pembahasan lengkap tiap soal.
      </p>
      <v-btn color="primary" variant="flat" to="/app/subscription" prepend-icon="mdi-crown">
        Lihat paket Premium
      </v-btn>
    </v-card>

    <StatePanel v-else :loading="loading" :error="error" @retry="load">
      <v-card v-if="assessment" class="pa-5 pa-md-8 rounded-xl" max-width="760">
        <!-- Title block -->
        <div class="d-flex flex-wrap ga-2 mb-3">
          <StatusChip :value="assessment.type" />
          <StatusChip :value="assessment.access_type" />
        </div>
        <h2 class="text-headline-small mb-3">{{ assessment.title }}</h2>

        <p class="text-body-large text-medium-emphasis mb-6" style="white-space: pre-line">
          {{ assessment.description || 'Belum ada deskripsi.' }}
        </p>

        <!-- Key facts -->
        <v-row dense class="mb-4">
          <v-col :cols="isTryout ? 6 : 12" :sm="isTryout ? 3 : 4">
            <div class="bg-surface-light rounded-lg pa-4 h-100">
              <div class="d-flex align-center ga-2 mb-2">
                <v-icon icon="mdi-help-circle-outline" color="primary" size="18" />
                <span class="text-body-small text-medium-emphasis">Soal</span>
              </div>
              <div class="app-figure text-headline-small">{{ assessment.question_count }}</div>
            </div>
          </v-col>
          <v-col v-if="isTryout" cols="6" sm="3">
            <div class="bg-surface-light rounded-lg pa-4 h-100">
              <div class="d-flex align-center ga-2 mb-2">
                <v-icon icon="mdi-timer-outline" color="primary" size="18" />
                <span class="text-body-small text-medium-emphasis">Durasi (menit)</span>
              </div>
              <div class="app-figure text-headline-small">{{ assessment.duration_minutes }}</div>
            </div>
          </v-col>
          <v-col cols="12" :sm="isTryout ? 6 : 8">
            <div class="bg-surface-light rounded-lg pa-4 h-100">
              <div class="d-flex align-center ga-2 mb-2">
                <v-icon icon="mdi-flag-checkered" color="primary" size="18" />
                <span class="text-body-small text-medium-emphasis">Nilai ambang batas</span>
              </div>
              <div class="d-flex ga-6">
                <div>
                  <div class="text-label-medium text-medium-emphasis">TWK</div>
                  <div class="app-figure text-title-large">{{ assessment.passing_score_twk }}</div>
                </div>
                <div>
                  <div class="text-label-medium text-medium-emphasis">TIU</div>
                  <div class="app-figure text-title-large">{{ assessment.passing_score_tiu }}</div>
                </div>
                <div>
                  <div class="text-label-medium text-medium-emphasis">TKP</div>
                  <div class="app-figure text-title-large">{{ assessment.passing_score_tkp }}</div>
                </div>
              </div>
            </div>
          </v-col>
        </v-row>

        <v-alert
          v-if="isTryout"
          type="info"
          variant="tonal"
          density="comfortable"
          class="mb-6"
        >
          Try Out ini berwaktu. Waktu mulai berjalan saat kamu mulai mengerjakan dan dihitung
          oleh server, jadi tetap berjalan walaupun halaman ini kamu tutup.
        </v-alert>

        <!-- Primary action -->
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
          Mulai {{ isTryout ? 'Try Out' : 'Latihan' }}
        </v-btn>
        <p class="text-body-small text-medium-emphasis text-center mt-2 mb-0">
          Kalau ada pengerjaan yang belum selesai, kamu akan melanjutkannya.
        </p>

        <!-- History -->
        <div class="d-flex flex-wrap align-center ga-4 mt-6 pt-6 border-t">
          <v-avatar color="surface-light" rounded="lg" size="44">
            <v-icon icon="mdi-history" color="primary" />
          </v-avatar>
          <div class="flex-grow-1 history-row__text">
            <p class="text-title-medium mb-0">Riwayat pengerjaan</p>
            <p class="text-body-medium text-medium-emphasis mb-0">
              Lihat skor dan jawaban dari pengerjaanmu sebelumnya.
            </p>
          </div>
          <v-btn
            variant="tonal"
            color="primary"
            prepend-icon="mdi-history"
            :to="{ name: `user-${kind}-history`, params: { id: route.params.id } }"
          >
            Lihat riwayat
          </v-btn>
        </div>
      </v-card>
    </StatePanel>
  </div>
</template>

<style scoped>
.premium-panel__text {
  max-width: 48ch;
}

/* Lets the text shrink so the button wraps below it on narrow screens. */
.history-row__text {
  min-width: 12rem;
}
</style>
