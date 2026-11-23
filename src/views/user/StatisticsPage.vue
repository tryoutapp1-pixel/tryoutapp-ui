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
    title: 'Selesai',
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
  { label: 'Pengerjaan', value: summary.value?.count, color: undefined },
  { label: 'Skor total terbaik', value: summary.value?.best, color: 'success' },
  { label: 'Skor total terakhir', value: summary.value?.latest, color: 'primary' },
  { label: 'Rata-rata skor total', value: summary.value?.average, color: undefined }
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
    <PageHeader title="Progres Saya" subtitle="Riwayat skor Try Out kamu." />

    <v-card v-if="locked" class="rounded-xl pa-6 pa-md-10 text-center mx-auto" max-width="560">
      <v-avatar color="premium" size="64" class="mb-5">
        <v-icon icon="mdi-crown-outline" color="navy" size="32" />
      </v-avatar>
      <h2 class="text-title-large mb-2">Progres Saya khusus Premium</h2>
      <p class="text-body-medium text-medium-emphasis mx-auto mb-6 stats-locked__text">
        Premium mencatat setiap Try Out yang kamu selesaikan dan menunjukkan perubahan skor TWK, TIU, dan TKP dari waktu ke waktu.
      </p>
      <v-btn color="primary" variant="flat" prepend-icon="mdi-crown" @click="goToSubscription">
        Lihat paket Premium
      </v-btn>
    </v-card>

    <StatePanel
      v-else
      :loading="loading"
      :error="error"
      :empty="!loading && !error && rows.length === 0"
      empty-text="Selesaikan satu Try Out untuk mulai memantau progresmu."
      empty-icon="mdi-chart-line"
      @retry="load"
    >
      <v-row class="mb-2">
        <v-col v-for="card in summaryCards" :key="card.label" cols="6" md="3">
          <div class="stats-tile h-100">
            <v-card variant="text" :color="card.color" class="pa-4 pa-md-5 h-100">
              <div class="text-body-medium text-medium-emphasis">{{ card.label }}</div>
              <div class="app-figure text-headline-large mt-3">{{ card.value }}</div>
            </v-card>
          </div>
        </v-col>
      </v-row>

      <v-card class="pa-5 pa-md-6 mb-4">
        <h3 class="text-title-medium mb-4">Tren skor total</h3>
        <ScoreTrendChart :points="points" />
      </v-card>

      <v-card variant="flat" class="overflow-hidden stats-table">
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
      <p class="text-body-small text-medium-emphasis mt-2">Pilih judul kolom untuk mengurutkan naik atau turun.</p>
    </StatePanel>
  </div>
</template>

<style scoped>
.stats-locked__text {
  max-width: 44ch;
}

/* White tile around each summary figure; the inner text-variant card only
   tints the number. */
.stats-tile {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--app-line));
  border-radius: var(--app-r-card);
  box-shadow: var(--app-shadow-card);
}

.stats-table :deep(td) {
  font-variant-numeric: tabular-nums;
}
</style>
