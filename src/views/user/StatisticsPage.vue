<script setup>
// My Progress: Try Out score history. Premium only. The backend answers 403
// for Free users; the menu entry stays visible, and this page tells Free users
// that My Progress needs Premium, with a button to Subscription.
//
// Premium users get a score trend and a table that sorts on every column in
// the browser (the endpoint returns all rows, so no server paging is needed).
// All scores come from the backend; the frontend does not compute them.
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSubscriptionStore } from '../../stores/subscription'
import userService from '../../services/userService'
import PageHeader from '../../components/PageHeader.vue'
import StatePanel from '../../components/StatePanel.vue'
import ScoreTrendChart from '../../components/assessment/ScoreTrendChart.vue'
import { formatDate } from '../../lib/format'

/** @typedef {import('../../types/api').StatisticsRow} StatisticsRow */

const router = useRouter()
const subscriptionStore = useSubscriptionStore()

/** @type {import('vue').Ref<StatisticsRow[]>} */
const rows = ref([])
const loading = ref(false)
const error = ref('')
const locked = ref(false)

const headers = [
  { title: 'Try Out', key: 'assessment_title', sortable: true },
  { title: 'TWK', key: 'twk_score', sortable: true, align: 'end' },
  { title: 'TIU', key: 'tiu_score', sortable: true, align: 'end' },
  { title: 'TKP', key: 'tkp_score', sortable: true, align: 'end' },
  { title: 'Total', key: 'total_score', sortable: true, align: 'end' },
  {
    title: 'Completed',
    key: 'completed_at',
    sortable: true,
    /** @param {string} a @param {string} b */
    sort: (a, b) => new Date(a).getTime() - new Date(b).getTime()
  }
]

/** Newest first by default; any header click changes it. */
const sortBy = ref([{ key: 'completed_at', order: /** @type {'asc'|'desc'} */ ('desc') }])

// The chart follows attempt order (oldest first), independent of table sorting.
const points = computed(() => rows.value.map((r, i) => ({ label: `#${i + 1}`, value: r.total_score })))

const summary = computed(() => {
  if (rows.value.length === 0) return null
  const totals = rows.value.map((r) => r.total_score)
  return {
    count: rows.value.length,
    best: Math.max(...totals),
    latest: totals[totals.length - 1],
    average: Math.round(totals.reduce((a, b) => a + b, 0) / totals.length)
  }
})

const summaryCards = computed(() => [
  { label: 'Attempts', value: summary.value?.count, color: undefined },
  { label: 'Best total', value: summary.value?.best, color: 'success' },
  { label: 'Latest total', value: summary.value?.latest, color: 'primary' },
  { label: 'Average total', value: summary.value?.average, color: undefined }
])

function goToSubscription() {
  router.push({ name: 'user-subscription' })
}

function showLocked() {
  locked.value = true
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const subscription = await subscriptionStore.ensureSubscription({ force: true })
    if (subscription && subscription.status !== 'PREMIUM') {
      showLocked()
      return
    }
    rows.value = (await userService.getTryoutStatistics()) || []
  } catch (e) {
    if (e.status === 403) showLocked()
    else error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <PageHeader title="My Progress" subtitle="Your Try Out score history." />

    <v-card v-if="locked" variant="outlined" class="pa-8 text-center mx-auto" max-width="560">
      <v-icon icon="mdi-crown-outline" color="amber-darken-2" size="48" class="mb-3" />
      <h2 class="text-h6 font-weight-bold mb-2">My Progress is a Premium feature</h2>
      <p class="text-body-2 text-medium-emphasis mb-4">
        Premium tracks every Try Out you finish and shows how your TWK, TIU, and TKP scores change over time.
      </p>
      <v-btn color="primary" variant="flat" prepend-icon="mdi-crown" @click="goToSubscription">
        Go to Subscription
      </v-btn>
    </v-card>

    <StatePanel
      v-else
      :loading="loading"
      :error="error"
      :empty="!loading && !error && rows.length === 0"
      empty-text="Complete a Try Out to start tracking your progress."
      empty-icon="mdi-chart-line"
      @retry="load"
    >
      <v-row class="mb-2">
        <v-col v-for="card in summaryCards" :key="card.label" cols="6" sm="3">
          <v-card variant="tonal" :color="card.color" class="pa-4 text-center">
            <div class="text-caption text-medium-emphasis">{{ card.label }}</div>
            <div class="text-h5 font-weight-bold">{{ card.value }}</div>
          </v-card>
        </v-col>
      </v-row>

      <v-card variant="outlined" class="pa-5 mb-4">
        <h3 class="text-subtitle-1 font-weight-bold mb-3">Total score trend</h3>
        <ScoreTrendChart :points="points" />
      </v-card>

      <v-card variant="outlined">
        <v-data-table
          v-model:sort-by="sortBy"
          :headers="headers"
          :items="rows"
          item-value="attempt_id"
          must-sort
          hide-default-footer
          :items-per-page="-1"
        >
          <template #[`item.completed_at`]="{ item }">
            {{ formatDate(item.completed_at) }}
          </template>
        </v-data-table>
      </v-card>
      <p class="text-caption text-medium-emphasis mt-2">Select a column header to sort ascending or descending.</p>
    </StatePanel>
  </div>
</template>
