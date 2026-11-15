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
    uiStore.success(next ? 'Paket soal diterbitkan.' : 'Paket soal batal diterbitkan.')
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
    <PageHeader title="Paket soal" subtitle="Kelola paket soal Latihan dan Try Out beserta status terbitnya.">
      <template #actions>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="router.push('/admin/assessments/new')">
          Tambah paket soal
        </v-btn>
      </template>
    </PageHeader>

    <StatePanel
      :loading="loading"
      :error="error"
      :empty="!loading && !error && items.length === 0"
      empty-text="Belum ada paket soal. Tambahkan paket soal pertama untuk mulai menyusun Latihan atau Try Out."
      empty-icon="mdi-clipboard-text-off-outline"
      @retry="load(pagination.page)"
    >
      <v-card variant="flat">
        <v-table hover>
          <thead>
            <tr>
              <th>Judul</th>
              <th>Jenis</th>
              <th>Akses</th>
              <th class="text-center">Soal</th>
              <th>Status</th>
              <th>Dibuat</th>
              <th class="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in items" :key="a.id">
              <td class="font-weight-medium assessments-list__title">{{ a.title }}</td>
              <td class="text-no-wrap"><StatusChip :value="a.type" /></td>
              <td class="text-no-wrap"><StatusChip :value="a.access_type" /></td>
              <td class="text-center">{{ a.question_count || 0 }}</td>
              <td class="text-no-wrap"><StatusChip :value="isReleased(a.is_released) ? 'RELEASED' : 'UNRELEASED'" /></td>
              <td class="text-no-wrap text-medium-emphasis">{{ formatDate(a.created_at) }}</td>
              <td class="text-right text-no-wrap">
                <v-tooltip text="Lihat detail">
                  <template #activator="{ props: tip }">
                    <v-btn
                      v-bind="tip"
                      size="small"
                      variant="text"
                      color="primary"
                      icon="mdi-eye-outline"
                      :aria-label="`Lihat detail ${a.title}`"
                      @click="router.push(`/admin/assessments/${a.id}`)"
                    />
                  </template>
                </v-tooltip>
                <v-tooltip text="Ubah">
                  <template #activator="{ props: tip }">
                    <v-btn
                      v-bind="tip"
                      size="small"
                      variant="text"
                      icon="mdi-pencil-outline"
                      :aria-label="`Ubah ${a.title}`"
                      @click="router.push(`/admin/assessments/${a.id}/edit`)"
                    />
                  </template>
                </v-tooltip>
                <v-tooltip :text="isReleased(a.is_released) ? 'Batalkan terbit' : 'Terbitkan'">
                  <template #activator="{ props: tip }">
                    <v-btn
                      v-bind="tip"
                      size="small"
                      variant="text"
                      :loading="togglingId === a.id"
                      :icon="isReleased(a.is_released) ? 'mdi-publish-off' : 'mdi-publish'"
                      :color="isReleased(a.is_released) ? 'warning' : 'success'"
                      :aria-label="`${isReleased(a.is_released) ? 'Batalkan terbit' : 'Terbitkan'} ${a.title}`"
                      @click="toggleRelease(a)"
                    />
                  </template>
                </v-tooltip>
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

<style scoped>
/* Keep long titles readable; the table scrolls sideways on narrow screens. */
.assessments-list__title {
  min-width: 220px;
}
</style>
