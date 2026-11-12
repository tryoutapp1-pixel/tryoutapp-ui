<script setup>
// Admin assessments list. Shows type, access, question count, release state.
// Release is blocked by the backend (409) until a question package exists.
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useAdminAssessmentsStore } from '../../stores/adminAssessments'
import { useUiStore } from '../../stores/ui'
import PageHeader from '../../components/PageHeader.vue'
import StatePanel from '../../components/StatePanel.vue'
import StatusChip from '../../components/StatusChip.vue'
import { formatDate, isReleased } from '../../lib/format'

/**
 * @typedef {import('../../types/api').AssessmentSummary & {
 *   is_released?: number|boolean,
 *   created_at: string
 * }} AdminAssessmentRow
 */

const router = useRouter()
const store = useAdminAssessmentsStore()
const uiStore = useUiStore()
const { items, pagination, loading, error } = storeToRefs(store)

/**
 * Id of the row whose release toggle is in flight.
 * @type {import('vue').Ref<number|null>}
 */
const togglingId = ref(null)

/** @param {number} [page=1] */
function load(page = 1) {
  store.fetchList({ page, limit: pagination.value.limit })
}

/** @param {AdminAssessmentRow} item */
async function toggleRelease(item) {
  togglingId.value = item.id
  try {
    const next = !isReleased(item.is_released)
    await store.setReleased(item.id, next)
    uiStore.success(next ? 'Assessment released.' : 'Assessment unreleased.')
  } catch (e) {
    // Common case: releasing without a question package -> backend 409.
    uiStore.error(e.message)
  } finally {
    togglingId.value = null
  }
}

onMounted(() => load(1))
</script>

<template>
  <div>
    <PageHeader title="Assessments" subtitle="Latihan and Try Out assessments.">
      <template #actions>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="router.push('/admin/assessments/new')">
          New assessment
        </v-btn>
      </template>
    </PageHeader>

    <StatePanel
      :loading="loading"
      :error="error"
      :empty="!loading && !error && items.length === 0"
      empty-text="No assessments yet."
      empty-icon="mdi-clipboard-text-off-outline"
      @retry="load(pagination.page)"
    >
      <v-card>
        <v-table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Access</th>
              <th class="text-center">Questions</th>
              <th>Status</th>
              <th>Created</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in items" :key="a.id">
              <td class="font-weight-medium">{{ a.title }}</td>
              <td><StatusChip :value="a.type" /></td>
              <td><StatusChip :value="a.access_type" /></td>
              <td class="text-center">{{ a.question_count || 0 }}</td>
              <td><StatusChip :value="isReleased(a.is_released) ? 'RELEASED' : 'UNRELEASED'" /></td>
              <td>{{ formatDate(a.created_at) }}</td>
              <td class="text-right">
                <v-btn size="small" variant="text" icon="mdi-eye-outline" title="View" @click="router.push(`/admin/assessments/${a.id}`)" />
                <v-btn size="small" variant="text" icon="mdi-pencil-outline" title="Edit" @click="router.push(`/admin/assessments/${a.id}/edit`)" />
                <v-btn
                  size="small"
                  variant="text"
                  :loading="togglingId === a.id"
                  :icon="isReleased(a.is_released) ? 'mdi-eye-off-outline' : 'mdi-check-circle-outline'"
                  :color="isReleased(a.is_released) ? 'warning' : 'success'"
                  :title="isReleased(a.is_released) ? 'Unrelease' : 'Release'"
                  @click="toggleRelease(a)"
                />
              </td>
            </tr>
          </tbody>
        </v-table>

        <div v-if="pagination.totalPages > 1" class="d-flex justify-center py-4">
          <v-pagination
            :model-value="pagination.page"
            :length="pagination.totalPages"
            :total-visible="7"
            @update:model-value="load"
          />
        </div>
      </v-card>
    </StatePanel>
  </div>
</template>
