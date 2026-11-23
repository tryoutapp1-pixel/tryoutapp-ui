<script setup>
// Admin feedback list. Learners leave one rating per assessment after
// finishing it. Filters run on the server; the summary covers every row that
// matches the filters, not just the current page.
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAdminFeedbackStore } from '../../stores/adminFeedback'
import adminService from '../../services/adminService'
import PageHeader from '../../components/PageHeader.vue'
import StatePanel from '../../components/StatePanel.vue'
import StatusChip from '../../components/StatusChip.vue'
import { formatDate } from '../../lib/format'

/** @typedef {import('../../types/api').FeedbackFilters} FeedbackFilters */

const store = useAdminFeedbackStore()
const { items, pagination, summary, filters, loading, error } = storeToRefs(store)

/** @type {import('vue').Ref<{ title: string, value: number }[]>} */
const assessmentOptions = ref([])

const typeOptions = [
  { title: 'Try Out', value: 'TRYOUT' },
  { title: 'Latihan', value: 'LATIHAN' }
]
const ratingOptions = [5, 4, 3, 2, 1].map((value) => ({ title: `${value} bintang`, value }))
const difficultyOptions = [
  { title: 'Mudah', value: 'EASY' },
  { title: 'Sedang', value: 'MEDIUM' },
  { title: 'Sulit', value: 'HARD' }
]
/** @type {Record<string, string>} */
const DIFFICULTY_COLORS = { EASY: 'success', MEDIUM: 'warning', HARD: 'error' }

const hasFilters = computed(() => Object.values(filters.value).some((value) => value !== null && value !== undefined))

/**
 * @param {keyof FeedbackFilters} key
 * @param {unknown} value
 */
function setFilter(key, value) {
  store.applyFilters({ [key]: value ?? null })
}

/** Assessment names for the filter. The first 100 cover the current catalog. */
async function loadAssessmentOptions() {
  try {
    const data = await adminService.listAssessments({ page: 1, limit: 100 })
    assessmentOptions.value = (data.items || []).map((a) => ({
      title: `${a.title} (${a.type === 'TRYOUT' ? 'Try Out' : 'Latihan'})`,
      value: a.id
    }))
  } catch {
    // The filter is optional; the list still works without it.
    assessmentOptions.value = []
  }
}

onMounted(() => {
  store.fetchList(1)
  loadAssessmentOptions()
})
</script>

<template>
  <div>
    <PageHeader title="Masukan" subtitle="Rating dan komentar yang diberikan pengguna setelah menyelesaikan paket soal." />

    <v-card variant="flat" class="pa-4 mb-6">
      <v-row dense align="center">
        <v-col cols="12" md="4">
          <v-autocomplete
            :model-value="filters.assessment_id"
            :items="assessmentOptions"
            label="Paket soal"
            prepend-inner-icon="mdi-magnify"
            no-data-text="Paket soal tidak ditemukan"
            clearable
            hide-details
            @update:model-value="setFilter('assessment_id', $event)"
          />
        </v-col>
        <v-col cols="12" sm="4" md="2">
          <v-select
            :model-value="filters.assessment_type"
            :items="typeOptions"
            label="Jenis"
            clearable
            hide-details
            @update:model-value="setFilter('assessment_type', $event)"
          />
        </v-col>
        <v-col cols="12" sm="4" md="2">
          <v-select
            :model-value="filters.rating"
            :items="ratingOptions"
            label="Rating"
            clearable
            hide-details
            @update:model-value="setFilter('rating', $event)"
          />
        </v-col>
        <v-col cols="12" sm="4" md="2">
          <v-select
            :model-value="filters.difficulty"
            :items="difficultyOptions"
            label="Kesulitan"
            clearable
            hide-details
            @update:model-value="setFilter('difficulty', $event)"
          />
        </v-col>
        <v-col cols="12" md="2" class="d-flex align-center">
          <v-btn
            variant="text"
            color="primary"
            prepend-icon="mdi-filter-remove-outline"
            block
            :disabled="!hasFilters || loading"
            @click="store.resetFilters()"
          >
            Reset filter
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <v-row dense class="mb-4">
      <v-col cols="12" sm="6" md="4" lg="3">
        <v-card variant="flat" class="d-flex align-center ga-4 pa-4 h-100">
          <v-avatar color="surface-light" rounded="lg" size="44">
            <v-icon icon="mdi-message-text-outline" color="primary" />
          </v-avatar>
          <div>
            <div class="text-label-large text-medium-emphasis mb-1">Jumlah masukan</div>
            <div class="app-figure text-headline-medium">{{ summary.total }}</div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="4" lg="3">
        <v-card variant="flat" class="d-flex align-center ga-4 pa-4 h-100">
          <v-avatar color="surface-light" rounded="lg" size="44">
            <v-icon icon="mdi-star-outline" color="premium-ink" />
          </v-avatar>
          <div>
            <div class="text-label-large text-medium-emphasis mb-1">Rata-rata rating</div>
            <div class="d-flex flex-wrap align-center ga-2">
              <span class="app-figure text-headline-medium">{{ summary.average_rating ?? '-' }}</span>
              <v-rating
                v-if="summary.average_rating !== null"
                :model-value="summary.average_rating"
                half-increments
                readonly
                density="compact"
                size="small"
                color="premium-ink"
                active-color="premium-ink"
                :aria-label="`Rata-rata rating ${summary.average_rating} dari 5`"
              />
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <StatePanel
      :loading="loading"
      :error="error"
      :empty="!loading && !error && items.length === 0"
      :empty-text="hasFilters ? 'Tidak ada masukan yang cocok dengan filter ini. Coba ubah atau reset filter.' : 'Belum ada masukan dari pengguna.'"
      empty-icon="mdi-message-outline"
      @retry="store.fetchList(pagination.page)"
    >
      <v-card variant="flat">
        <v-table hover>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Paket soal</th>
              <th>Pengguna</th>
              <th>Rating</th>
              <th>Kesulitan</th>
              <th>Komentar</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="f in items" :key="f.id">
              <td class="text-no-wrap">{{ formatDate(f.created_at) }}</td>
              <td class="py-2">
                <div class="font-weight-medium">{{ f.assessment_title }}</div>
                <StatusChip :value="f.assessment_type" class="mt-1" />
              </td>
              <td class="py-2">
                <div>{{ f.user_name }}</div>
                <div class="text-body-small text-medium-emphasis">{{ f.user_email }}</div>
              </td>
              <td class="text-no-wrap">
                <v-rating
                  :model-value="f.rating"
                  readonly
                  density="compact"
                  size="x-small"
                  color="premium-ink"
                  active-color="premium-ink"
                  :aria-label="`${f.rating} dari 5`"
                />
              </td>
              <td>
                <v-chip size="small" variant="tonal" :color="DIFFICULTY_COLORS[f.difficulty]">
                  {{ difficultyOptions.find((o) => o.value === f.difficulty)?.title ?? f.difficulty }}
                </v-chip>
              </td>
              <td class="comment-cell py-2">
                <span v-if="f.comment" class="pre-line">{{ f.comment }}</span>
                <span v-else class="text-medium-emphasis">Tanpa komentar</span>
              </td>
            </tr>
          </tbody>
        </v-table>

        <div v-if="pagination.totalPages > 1" class="d-flex justify-center py-4">
          <v-pagination
            :model-value="pagination.page"
            :length="pagination.totalPages"
            :total-visible="7"
            @update:model-value="store.fetchList"
          />
        </div>
      </v-card>
    </StatePanel>
  </div>
</template>

<style scoped>
.comment-cell {
  max-width: 360px;
  min-width: 200px;
}
.pre-line {
  white-space: pre-line;
}
</style>
