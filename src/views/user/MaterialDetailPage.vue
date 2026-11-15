<script setup>
// Material content. The detail response embeds a signed file URL that expires
// in about 60 seconds. The PDF is shown inline with a download button; "Reload"
// refetches the detail for a fresh URL. A 403 means the material is Premium and
// the user is Free (e.g. opened by direct URL), so we point them to Premium.
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMaterialsStore } from '../../stores/materials'
import { useUiStore } from '../../stores/ui'
import PageHeader from '../../components/PageHeader.vue'
import StatePanel from '../../components/StatePanel.vue'
import StatusChip from '../../components/StatusChip.vue'
import { formatBytes, formatDate } from '../../lib/format'

const route = useRoute()
const router = useRouter()
const store = useMaterialsStore()
const uiStore = useUiStore()

/** @type {import('vue').Ref<import('../../types/api').Material|null>} */
const material = ref(null)
const loading = ref(false)
const error = ref('')
const forbidden = ref(false)
const refreshing = ref(false)

/**
 * @param {import('../../types/api').Material|null} m
 * @returns {boolean}
 */
const isPdf = (m) => Boolean(m && m.file && m.file.mime_type === 'application/pdf')

async function load() {
  loading.value = true
  error.value = ''
  forbidden.value = false
  try {
    material.value = await store.fetchDetail(route.params.id)
  } catch (e) {
    if (e.status === 403) {
      forbidden.value = true
    } else {
      error.value = e.message
    }
  } finally {
    loading.value = false
  }
}

// Refetch the detail to obtain a fresh signed URL when the current one expires.
async function reloadFile() {
  refreshing.value = true
  try {
    material.value = await store.fetchDetail(route.params.id)
  } catch (e) {
    uiStore.error(e.message)
  } finally {
    refreshing.value = false
  }
}

function download() {
  if (material.value && material.value.file && material.value.file.url) {
    window.open(material.value.file.url, '_blank', 'noopener')
  }
}

onMounted(load)
</script>

<template>
  <div>
    <PageHeader title="Materi">
      <template #actions>
        <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="router.push('/app/materials')">
          Kembali ke Materi
        </v-btn>
      </template>
    </PageHeader>

    <!-- Premium-gated content -->
    <v-card
      v-if="forbidden"
      variant="flat"
      color="surface-light"
      class="pa-8 pa-md-10 text-center rounded-xl"
    >
      <v-avatar color="surface" size="64" class="mb-4">
        <v-icon icon="mdi-crown" color="premium-ink" size="32" />
      </v-avatar>
      <h2 class="text-title-large mb-2">Materi ini khusus Premium</h2>
      <p class="text-body-medium text-medium-emphasis mb-6 mx-auto premium-panel__text">
        Upgrade ke Premium untuk membaca materi ini dan semua materi Premium lainnya.
      </p>
      <v-btn color="primary" variant="flat" to="/app/subscription" prepend-icon="mdi-crown">
        Lihat paket Premium
      </v-btn>
    </v-card>

    <StatePanel v-else :loading="loading" :error="error" @retry="load">
      <v-card v-if="material" class="pa-5 pa-md-8 rounded-xl">
        <!-- Title block -->
        <div class="d-flex flex-wrap ga-2 mb-3">
          <StatusChip :value="material.type" />
          <StatusChip :value="material.access_type" />
        </div>
        <h2 class="text-headline-small mb-3">{{ material.title }}</h2>
        <p class="app-reading mb-0">
          {{ material.description || 'Belum ada deskripsi.' }}
        </p>

        <v-divider class="my-6" />

        <!-- File info and actions -->
        <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
          <div v-if="material.file" class="d-flex flex-wrap align-center gc-4 gr-1 text-body-small text-medium-emphasis file-meta">
            <span class="d-inline-flex align-center ga-1 file-meta__name">
              <v-icon icon="mdi-file-document-outline" size="16" />
              <span class="text-truncate">{{ material.file.original_filename }}</span>
            </span>
            <span>{{ formatBytes(material.file.size) }}</span>
            <span>Ditambahkan {{ formatDate(material.created_at) }}</span>
          </div>
          <div class="d-flex flex-wrap ga-2">
            <v-btn
              v-if="material.file"
              variant="text"
              prepend-icon="mdi-refresh"
              :loading="refreshing"
              @click="reloadFile"
            >
              Muat ulang
            </v-btn>
            <v-btn
              v-if="material.file && material.file.url"
              variant="tonal"
              color="primary"
              prepend-icon="mdi-download"
              @click="download"
            >
              Unduh
            </v-btn>
          </div>
        </div>

        <template v-if="material.file">
          <div v-if="isPdf(material) && material.file.url" class="pdf-frame">
            <iframe :src="material.file.url" title="PDF materi" width="100%" height="100%" />
          </div>
          <v-alert v-else-if="isPdf(material)" type="warning" variant="tonal" density="comfortable">
            Tautan pratinjau tidak tersedia. Tekan "Muat ulang" untuk membuat tautan baru.
          </v-alert>
          <v-alert v-else type="info" variant="tonal" density="comfortable">
            Pratinjau hanya tersedia untuk file PDF. Tekan "Unduh" untuk membuka file ini.
          </v-alert>
        </template>
        <p v-else class="text-body-medium text-medium-emphasis mb-0">
          Materi ini belum punya file. Coba buka lagi nanti.
        </p>
      </v-card>
    </StatePanel>
  </div>
</template>

<style scoped>
.premium-panel__text {
  max-width: 48ch;
}

/* Long file names truncate instead of widening the card on mobile. */
.file-meta {
  min-width: 0;
  max-width: 100%;
}
.file-meta__name {
  max-width: 100%;
  min-width: 0;
}

.pdf-frame {
  width: 100%;
  height: 80vh;
  min-height: 480px;
  border: 1px solid rgb(var(--app-line));
  border-radius: 12px;
  overflow: hidden;
  background: rgb(var(--v-theme-surface-light));
}
.pdf-frame iframe {
  border: 0;
  display: block;
}
</style>
