<script setup>
// Learner materials list. The backend returns every released material, FREE
// and PREMIUM. A Free user who opens a PREMIUM card gets the Premium dialog
// instead of the material page.
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useMaterialsStore } from '../../stores/materials'
import { usePremiumGate } from '../../composables/usePremiumGate'
import PageHeader from '../../components/PageHeader.vue'
import StatePanel from '../../components/StatePanel.vue'
import StatusChip from '../../components/StatusChip.vue'
import PremiumRequiredDialog from '../../components/PremiumRequiredDialog.vue'
import { formatDateOnly } from '../../lib/format'

const router = useRouter()
const store = useMaterialsStore()
const { items, pagination, loading, error } = storeToRefs(store)
const { dialogOpen, isLocked, guard } = usePremiumGate()

/** @param {number} [page=1] */
function load(page = 1) {
  store.fetchList({ page, limit: pagination.value.limit })
}

/** @param {import('../../types/api').Material} material */
async function open(material) {
  if (await guard(material)) router.push(`/app/materials/${material.id}`)
}

onMounted(() => load(1))
</script>

<template>
  <div>
    <PageHeader title="Materials" subtitle="Learning materials for TWK, TIU, and TKP." />

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
            variant="outlined"
            class="pa-5 h-100 d-flex flex-column"
            :class="{ 'card-locked': isLocked(m) }"
            :aria-label="isLocked(m) ? `${m.title}, Premium only` : m.title"
            link
            hover
            @click="open(m)"
            @keydown.enter="open(m)"
          >
            <div class="d-flex align-center justify-space-between mb-2">
              <StatusChip :value="m.type" />
              <StatusChip :value="m.access_type" />
            </div>
            <h3 class="text-subtitle-1 font-weight-bold mb-1">{{ m.title }}</h3>
            <p class="text-body-2 text-medium-emphasis mb-3 flex-grow-1">
              {{ m.description || 'No description.' }}
            </p>
            <div class="d-flex align-center text-caption text-medium-emphasis">
              <span>Added {{ formatDateOnly(m.created_at) }}</span>
              <span v-if="isLocked(m)" class="d-flex align-center ga-1 ms-auto text-amber-darken-3">
                <v-icon icon="mdi-lock-outline" size="16" />
                Premium
              </span>
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

    <PremiumRequiredDialog
      v-model="dialogOpen"
      title="This material is for Premium members"
      message="Upgrade to Premium to open every TWK, TIU, and TKP material."
    />
  </div>
</template>

<style scoped>
.card-locked {
  background-color: rgba(var(--v-theme-on-surface), 0.02);
}
</style>
