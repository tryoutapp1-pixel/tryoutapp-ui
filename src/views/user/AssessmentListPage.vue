<script setup>
// Latihan list / Try Out list. One page, parameterized by route meta `kind`
// ('latihan' | 'tryout'). The backend returns every released assessment,
// FREE and PREMIUM. A Free user who opens a PREMIUM card gets the Premium
// dialog instead of the detail page.
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAssessmentsStore } from '../../stores/assessments'
import { usePremiumGate } from '../../composables/usePremiumGate'
import PageHeader from '../../components/PageHeader.vue'
import StatePanel from '../../components/StatePanel.vue'
import StatusChip from '../../components/StatusChip.vue'
import PremiumRequiredDialog from '../../components/PremiumRequiredDialog.vue'

/** @typedef {import('../../types/api').AssessmentSummary} AssessmentSummary */

const route = useRoute()
const router = useRouter()
const store = useAssessmentsStore()
const { dialogOpen, isLocked, guard } = usePremiumGate()

/** @type {import('vue').ComputedRef<import('../../types/api').AssessmentKind>} */
const kind = computed(() => route.meta.kind || 'latihan')
const isTryout = computed(() => kind.value === 'tryout')
const slice = computed(() => store[kind.value])

const heading = computed(() => (isTryout.value ? 'Try Out' : 'Latihan'))
const subtitle = computed(() => (isTryout.value ? 'Paket soal berwaktu untuk menguji kesiapanmu seperti di hari ujian.' : 'Paket soal tanpa batas waktu. Kerjakan pelan-pelan dan ulangi kapan saja.'))

/** @param {number} [page=1] */
function load(page = 1) {
  store.fetchList(kind.value, { page, limit: slice.value.pagination.limit })
}

/** @param {AssessmentSummary} assessment */
async function open(assessment) {
  if (await guard(assessment)) router.push(`/app/${kind.value}/${assessment.id}`)
}

onMounted(() => load(1))
watch(kind, () => load(1))
</script>

<template>
  <div>
    <PageHeader :title="heading" :subtitle="subtitle" />

    <StatePanel
      :loading="slice.loading"
      :error="slice.error"
      :empty="!slice.loading && !slice.error && slice.items.length === 0"
      :empty-text="`Belum ada paket ${heading} yang bisa dikerjakan. Sambil menunggu, baca Materi dulu.`"
      empty-icon="mdi-clipboard-text-outline"
      @retry="load(slice.pagination.page)"
    >
      <v-row>
        <v-col v-for="a in slice.items" :key="a.id" cols="12" sm="6" md="4">
          <v-card
            class="pa-5 h-100 d-flex flex-column"
            :class="{ 'card-locked': isLocked(a) }"
            :aria-label="isLocked(a) ? `${a.title}, khusus Premium` : a.title"
            link
            hover
            @click="open(a)"
            @keydown.enter="open(a)"
          >
            <div class="d-flex align-start justify-space-between ga-3 mb-4">
              <v-avatar color="surface-light" rounded="lg" size="44">
                <v-icon :icon="isTryout ? 'mdi-timer-outline' : 'mdi-pencil-outline'" color="primary" />
              </v-avatar>
              <div class="d-flex flex-wrap justify-end ga-2">
                <StatusChip :value="a.type" />
                <StatusChip :value="a.access_type" />
              </div>
            </div>
            <h2 class="text-title-medium mb-1">{{ a.title }}</h2>
            <p class="text-body-medium text-medium-emphasis mb-4 flex-grow-1">
              {{ a.description || 'Belum ada deskripsi.' }}
            </p>
            <div class="d-flex flex-wrap align-center gc-4 gr-1 pt-3 border-t text-body-small text-medium-emphasis">
              <span class="d-flex align-center ga-1">
                <v-icon icon="mdi-help-circle-outline" size="16" />
                {{ a.question_count }} soal
              </span>
              <span v-if="isTryout && a.duration_minutes" class="d-flex align-center ga-1">
                <v-icon icon="mdi-timer-outline" size="16" />
                {{ a.duration_minutes }} menit
              </span>
              <span v-if="isLocked(a)" class="d-flex align-center ga-1 ms-auto text-premium-ink font-weight-bold">
                <v-icon icon="mdi-lock-outline" size="16" />
                Terkunci
              </span>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <div v-if="slice.pagination.totalPages > 1" class="d-flex justify-center mt-6">
        <v-pagination
          :model-value="slice.pagination.page"
          :length="slice.pagination.totalPages"
          :total-visible="7"
          @update:model-value="load"
        />
      </div>
    </StatePanel>

    <PremiumRequiredDialog
      v-model="dialogOpen"
      :title="`${heading} ini khusus Premium`"
      :message="`Upgrade ke Premium untuk mengerjakan semua paket ${heading} dan membaca pembahasan lengkap tiap soal.`"
    />
  </div>
</template>

<style scoped>
/* Locked (Premium) packages sit on a faint blue fill so they read as
   unavailable without lowering text contrast. */
.card-locked {
  background-color: rgba(var(--v-theme-surface-light), 0.55);
}
</style>
