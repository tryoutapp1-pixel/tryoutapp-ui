<script setup>
// FU9 - material content. The backend detail response embeds a short-lived
// (~60s) signed URL for the file (private R2 object). We show the PDF inline and
// offer a download; if the link expires, "Reload" refetches the detail to mint a
// fresh signed URL rather than reusing the stale one. A 403 means the material
// is Premium-only and the user is on Free -> we point them to the upgrade page.
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

const material = ref(null)
const loading = ref(false)
const error = ref('')
const forbidden = ref(false)
const refreshing = ref(false)

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
    <PageHeader title="Material">
      <template #actions>
        <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="router.push('/app/materials')">
          Back
        </v-btn>
      </template>
    </PageHeader>

    <!-- Premium-gated content -->
    <v-card v-if="forbidden" class="pa-8 text-center" variant="outlined">
      <v-icon icon="mdi-crown-outline" color="amber" size="48" class="mb-3" />
      <h3 class="text-h6 font-weight-bold mb-2">This material is Premium</h3>
      <p class="text-body-2 text-medium-emphasis mb-4">
        Upgrade to Premium to access this material.
      </p>
      <v-btn color="primary" variant="flat" to="/app/subscription" prepend-icon="mdi-crown">
        Go Premium
      </v-btn>
    </v-card>

    <StatePanel v-else :loading="loading" :error="error" @retry="load">
      <v-card v-if="material" variant="outlined" class="pa-6">
        <div class="d-flex align-center justify-space-between mb-3">
          <h2 class="text-h6 font-weight-bold mb-0">{{ material.title }}</h2>
          <StatusChip :value="material.access_type" />
        </div>
        <p class="text-body-2 text-medium-emphasis mb-4">
          {{ material.description || 'No description.' }}
        </p>

        <div class="d-flex align-center justify-space-between mb-3 flex-wrap ga-2">
          <div v-if="material.file" class="text-caption text-medium-emphasis">
            {{ material.file.original_filename }} · {{ formatBytes(material.file.size) }} ·
            Added {{ formatDate(material.created_at) }}
          </div>
          <div class="d-flex ga-2">
            <v-btn
              v-if="material.file"
              variant="text"
              prepend-icon="mdi-refresh"
              :loading="refreshing"
              @click="reloadFile"
            >
              Reload
            </v-btn>
            <v-btn
              v-if="material.file && material.file.url"
              variant="tonal"
              color="primary"
              prepend-icon="mdi-download"
              @click="download"
            >
              Download
            </v-btn>
          </div>
        </div>

        <template v-if="material.file">
          <div v-if="isPdf(material) && material.file.url" class="pdf-frame">
            <iframe :src="material.file.url" title="Material PDF" width="100%" height="100%" />
          </div>
          <v-alert v-else-if="isPdf(material)" type="warning" variant="tonal" density="comfortable">
            Preview link is unavailable. Click "Reload" to generate a fresh link.
          </v-alert>
          <v-alert v-else type="info" variant="tonal" density="comfortable">
            Inline preview is only available for PDF files. Use "Download" to open this file.
          </v-alert>
        </template>
        <p v-else class="text-body-2 text-medium-emphasis mb-0">No file attached.</p>
      </v-card>
    </StatePanel>
  </div>
</template>

<style scoped>
.pdf-frame {
  width: 100%;
  height: 80vh;
  min-height: 480px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  overflow: hidden;
}
.pdf-frame iframe {
  border: 0;
  display: block;
}
</style>
