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
    <PageHeader title="Materi" subtitle="Materi TWK, TIU, dan TKP per topik. Baca dulu sebelum mengerjakan Latihan." />

    <StatePanel
      :loading="loading"
      :error="error"
      :empty="!loading && !error && items.length === 0"
      empty-text="Belum ada materi yang bisa dibaca. Sambil menunggu, coba kerjakan Latihan dulu."
      empty-icon="mdi-book-open-page-variant-outline"
      @retry="load(pagination.page)"
    >
      <v-row>
        <v-col v-for="m in items" :key="m.id" cols="12" sm="6" md="4">
          <v-card
            class="pa-5 h-100 d-flex flex-column"
            :class="{ 'card-locked': isLocked(m) }"
            :aria-label="isLocked(m) ? `${m.title}, khusus Premium` : m.title"
            link
            hover
            @click="open(m)"
            @keydown.enter="open(m)"
          >
            <div class="d-flex align-start justify-space-between ga-3 mb-4">
              <v-avatar color="surface-light" rounded="lg" size="44">
                <v-icon icon="mdi-book-open-page-variant-outline" color="primary" />
              </v-avatar>
              <div class="d-flex flex-wrap justify-end ga-2">
                <StatusChip :value="m.type" />
                <StatusChip :value="m.access_type" />
              </div>
            </div>
            <h2 class="text-title-medium mb-1">{{ m.title }}</h2>
            <p class="text-body-medium text-medium-emphasis mb-4 flex-grow-1">
              {{ m.description || 'Belum ada deskripsi.' }}
            </p>
            <div class="d-flex flex-wrap align-center ga-2 pt-3 border-t text-body-small text-medium-emphasis">
              <span>Ditambahkan {{ formatDateOnly(m.created_at) }}</span>
              <span v-if="isLocked(m)" class="d-flex align-center ga-1 ms-auto text-premium-ink font-weight-bold">
                <v-icon icon="mdi-lock-outline" size="16" />
                Terkunci
              </span>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <div v-if="pagination.totalPages > 1" class="d-flex justify-center mt-6">
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
      title="Materi ini khusus Premium"
      message="Upgrade ke Premium untuk membuka semua materi TWK, TIU, dan TKP."
    />
  </div>
</template>

<style scoped>
/* Locked (Premium) modules sit on a faint blue fill so they read as
   unavailable without lowering text contrast. */
.card-locked {
  background-color: rgba(var(--v-theme-surface-light), 0.55);
}
</style>
