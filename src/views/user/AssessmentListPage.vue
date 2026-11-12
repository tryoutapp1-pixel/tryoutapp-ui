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
const subtitle = computed(() => (isTryout.value ? 'Timed assessment packages.' : 'Untimed practice packages.'))

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
      :empty-text="`No ${heading} packages are available yet.`"
      empty-icon="mdi-clipboard-text-outline"
      @retry="load(slice.pagination.page)"
    >
      <v-row>
        <v-col v-for="a in slice.items" :key="a.id" cols="12" sm="6" md="4">
          <v-card
            variant="outlined"
            class="pa-5 h-100 d-flex flex-column"
            :class="{ 'card-locked': isLocked(a) }"
            :aria-label="isLocked(a) ? `${a.title}, Premium only` : a.title"
            link
            hover
            @click="open(a)"
            @keydown.enter="open(a)"
          >
            <div class="d-flex align-center justify-space-between mb-2">
              <StatusChip :value="a.type" />
              <StatusChip :value="a.access_type" />
            </div>
            <h3 class="text-subtitle-1 font-weight-bold mb-1">{{ a.title }}</h3>
            <p class="text-body-2 text-medium-emphasis mb-3 flex-grow-1">
              {{ a.description || 'No description.' }}
            </p>
            <div class="d-flex align-center ga-4 text-caption text-medium-emphasis">
              <span class="d-flex align-center ga-1">
                <v-icon icon="mdi-help-circle-outline" size="16" />
                {{ a.question_count }} questions
              </span>
              <span v-if="isTryout && a.duration_minutes" class="d-flex align-center ga-1">
                <v-icon icon="mdi-timer-outline" size="16" />
                {{ a.duration_minutes }} min
              </span>
              <span v-if="isLocked(a)" class="d-flex align-center ga-1 ms-auto text-amber-darken-3">
                <v-icon icon="mdi-lock-outline" size="16" />
                Premium
              </span>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <div v-if="slice.pagination.totalPages > 1" class="d-flex justify-center mt-4">
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
      :title="`This ${heading} is for Premium members`"
      :message="`Upgrade to Premium to work on every ${heading} package and to read the full explanation for each question.`"
    />
  </div>
</template>

<style scoped>
.card-locked {
  background-color: rgba(var(--v-theme-on-surface), 0.02);
}
</style>
