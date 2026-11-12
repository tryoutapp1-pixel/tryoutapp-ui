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
const ratingOptions = [5, 4, 3, 2, 1].map((value) => ({ title: `${value} star${value === 1 ? '' : 's'}`, value }))
const difficultyOptions = [
  { title: 'Easy', value: 'EASY' },
  { title: 'Medium', value: 'MEDIUM' },
  { title: 'Hard', value: 'HARD' }
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
    <PageHeader title="Feedback" subtitle="Ratings and comments learners left after finishing an assessment." />

    <v-card variant="outlined" class="pa-4 mb-4">
      <v-row dense>
        <v-col cols="12" md="4">
          <v-autocomplete
            :model-value="filters.assessment_id"
            :items="assessmentOptions"
            label="Assessment"
            variant="outlined"
            density="comfortable"
            clearable
            hide-details
            @update:model-value="setFilter('assessment_id', $event)"
          />
        </v-col>
        <v-col cols="12" sm="4" md="2">
          <v-select
            :model-value="filters.assessment_type"
            :items="typeOptions"
            label="Type"
            variant="outlined"
            density="comfortable"
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
            variant="outlined"
            density="comfortable"
            clearable
            hide-details
            @update:model-value="setFilter('rating', $event)"
          />
        </v-col>
        <v-col cols="12" sm="4" md="2">
          <v-select
            :model-value="filters.difficulty"
            :items="difficultyOptions"
            label="Difficulty"
            variant="outlined"
            density="comfortable"
            clearable
            hide-details
            @update:model-value="setFilter('difficulty', $event)"
          />
        </v-col>
        <v-col cols="12" md="2" class="d-flex align-center">
          <v-btn variant="text" block :disabled="!hasFilters || loading" @click="store.resetFilters()">Clear filters</v-btn>
        </v-col>
      </v-row>
    </v-card>

    <div class="d-flex align-center flex-wrap ga-6 mb-4">
      <div>
        <div class="text-caption text-medium-emphasis">Feedback</div>
        <div class="text-h6 font-weight-bold">{{ summary.total }}</div>
      </div>
      <div>
        <div class="text-caption text-medium-emphasis">Average rating</div>
        <div class="d-flex align-center ga-2">
          <span class="text-h6 font-weight-bold">{{ summary.average_rating ?? '-' }}</span>
          <v-rating
            v-if="summary.average_rating !== null"
            :model-value="summary.average_rating"
            half-increments
            readonly
            density="compact"
            size="small"
            color="amber"
            active-color="amber"
            :aria-label="`Average rating ${summary.average_rating} out of 5`"
          />
        </div>
      </div>
    </div>

    <StatePanel
      :loading="loading"
      :error="error"
      :empty="!loading && !error && items.length === 0"
      :empty-text="hasFilters ? 'No feedback matches these filters.' : 'No feedback yet.'"
      empty-icon="mdi-message-outline"
      @retry="store.fetchList(pagination.page)"
    >
      <v-card>
        <v-table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Assessment</th>
              <th>Learner</th>
              <th>Rating</th>
              <th>Difficulty</th>
              <th>Comment</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="f in items" :key="f.id">
              <td class="text-no-wrap">{{ formatDate(f.created_at) }}</td>
              <td>
                <div class="font-weight-medium">{{ f.assessment_title }}</div>
                <StatusChip :value="f.assessment_type" class="mt-1" />
              </td>
              <td>
                <div>{{ f.user_name }}</div>
                <div class="text-caption text-medium-emphasis">{{ f.user_email }}</div>
              </td>
              <td class="text-no-wrap">
                <v-rating
                  :model-value="f.rating"
                  readonly
                  density="compact"
                  size="x-small"
                  color="amber"
                  active-color="amber"
                  :aria-label="`${f.rating} out of 5`"
                />
              </td>
              <td>
                <v-chip size="small" variant="tonal" :color="DIFFICULTY_COLORS[f.difficulty]">
                  {{ f.difficulty.charAt(0) + f.difficulty.slice(1).toLowerCase() }}
                </v-chip>
              </td>
              <td class="comment-cell">
                <span v-if="f.comment" class="pre-line">{{ f.comment }}</span>
                <span v-else class="text-medium-emphasis">No comment</span>
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
