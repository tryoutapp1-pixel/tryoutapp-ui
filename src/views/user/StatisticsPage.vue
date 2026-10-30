<script setup>
// FU16 - Try Out development statistics. The backend returns one row per
// completed/expired Try Out attempt, ordered oldest -> newest, with the total
// and per-category scores. We visualize the total-score trend and show the best
// / latest / average as summary, plus a per-attempt table. All figures come
// from the backend; the frontend does no score computation.
import { computed, onMounted, ref } from 'vue'
import userService from '../../services/userService'
import PageHeader from '../../components/PageHeader.vue'
import StatePanel from '../../components/StatePanel.vue'
import ScoreTrendChart from '../../components/assessment/ScoreTrendChart.vue'
import { formatDate } from '../../lib/format'

const rows = ref([])
const loading = ref(false)
const error = ref('')

const headers = [
  { title: 'Try Out', key: 'assessment_title', sortable: false },
  { title: 'TWK', key: 'twk_score', sortable: false },
  { title: 'TIU', key: 'tiu_score', sortable: false },
  { title: 'TKP', key: 'tkp_score', sortable: false },
  { title: 'Total', key: 'total_score', sortable: false },
  { title: 'Completed', key: 'completed_at', sortable: false }
]

const points = computed(() =>
  rows.value.map((r, i) => ({ label: `#${i + 1}`, value: Number(r.total_score) }))
)

const summary = computed(() => {
  if (rows.value.length === 0) return null
  const totals = rows.value.map((r) => Number(r.total_score))
  const best = Math.max(...totals)
  const latest = totals[totals.length - 1]
  const avg = Math.round(totals.reduce((a, b) => a + b, 0) / totals.length)
  return { best, latest, avg, count: rows.value.length }
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    rows.value = (await userService.getTryoutStatistics()) || []
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <PageHeader title="My Progress" subtitle="Your Try Out score history." />

    <StatePanel
      :loading="loading"
      :error="error"
      :empty="!loading && !error && rows.length === 0"
      empty-text="Complete a Try Out to start tracking your progress."
      empty-icon="mdi-chart-line"
      @retry="load"
    >
      <v-row class="mb-2">
        <v-col cols="6" sm="3">
          <v-card variant="tonal" class="pa-4 text-center">
            <div class="text-overline text-medium-emphasis">Attempts</div>
            <div class="text-h5 font-weight-bold">{{ summary?.count }}</div>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card variant="tonal" color="success" class="pa-4 text-center">
            <div class="text-overline">Best</div>
            <div class="text-h5 font-weight-bold">{{ summary?.best }}</div>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card variant="tonal" color="primary" class="pa-4 text-center">
            <div class="text-overline">Latest</div>
            <div class="text-h5 font-weight-bold">{{ summary?.latest }}</div>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card variant="tonal" class="pa-4 text-center">
            <div class="text-overline text-medium-emphasis">Average</div>
            <div class="text-h5 font-weight-bold">{{ summary?.avg }}</div>
          </v-card>
        </v-col>
      </v-row>

      <v-card variant="outlined" class="pa-5 mb-4">
        <h3 class="text-subtitle-1 font-weight-bold mb-3">Total score trend</h3>
        <ScoreTrendChart :points="points" />
      </v-card>

      <v-card variant="outlined">
        <v-data-table :headers="headers" :items="rows" hide-default-footer :items-per-page="-1">
          <template #[`item.completed_at`]="{ item }">
            {{ formatDate(item.completed_at) }}
          </template>
        </v-data-table>
      </v-card>
    </StatePanel>
  </div>
</template>
