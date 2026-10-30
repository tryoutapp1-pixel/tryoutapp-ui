<script setup>
// FU8 - learner materials list. The backend returns only materials the user may
// access (Free vs Premium) and that are released, so we display what we receive.
// Paginated. Cards link to the material detail/content page.
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useMaterialsStore } from '../../stores/materials'
import PageHeader from '../../components/PageHeader.vue'
import StatePanel from '../../components/StatePanel.vue'
import StatusChip from '../../components/StatusChip.vue'
import { formatDateOnly } from '../../lib/format'

const store = useMaterialsStore()
const { items, pagination, loading, error } = storeToRefs(store)

function load(page = 1) {
  store.fetchList({ page, limit: pagination.value.limit })
}

onMounted(() => load(1))
</script>

<template>
  <div>
    <PageHeader title="Materials" subtitle="Released learning materials for you." />

    <StatePanel
      :loading="loading"
      :error="error"
      :empty="!loading && !error && items.length === 0"
      empty-text="No materials are available yet."
      empty-icon="mdi-book-open-page-variant-outline"
      @retry="load(pagination.page)"
    >
      <v-row>
        <v-col v-for="m in items" :key="m.id" cols="12" sm="6" md="4">
          <v-card
            :to="`/app/materials/${m.id}`"
            variant="outlined"
            class="pa-5 h-100 d-flex flex-column"
            hover
          >
            <div class="d-flex align-center justify-space-between mb-2">
              <v-icon icon="mdi-file-document-outline" color="primary" size="28" />
              <StatusChip :value="m.access_type" />
            </div>
            <h3 class="text-subtitle-1 font-weight-bold mb-1">{{ m.title }}</h3>
            <p class="text-body-2 text-medium-emphasis mb-3 flex-grow-1">
              {{ m.description || 'No description.' }}
            </p>
            <div class="text-caption text-medium-emphasis">
              Added {{ formatDateOnly(m.created_at) }}
            </div>
          </v-card>
        </v-col>
      </v-row>

      <div v-if="pagination.totalPages > 1" class="d-flex justify-center mt-4">
        <v-pagination
          :model-value="pagination.page"
          :length="pagination.totalPages"
          :total-visible="7"
          @update:model-value="load"
        />
      </div>
    </StatePanel>
  </div>
</template>
