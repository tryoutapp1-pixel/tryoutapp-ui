<script setup>
// FA10 - material detail. Backend GET /admin/materials/:id returns the material
// plus file metadata with a signed URL (60s). The PDF is embedded inline at the
// bottom of this page (no separate "open file" step). Because signed URLs are
// short-lived, we mint a fresh one on load and offer a reload if it expires.
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminMaterialsStore } from '../../stores/adminMaterials'
import { useUiStore } from '../../stores/ui'
import PageHeader from '../../components/PageHeader.vue'
import StatePanel from '../../components/StatePanel.vue'
import StatusChip from '../../components/StatusChip.vue'
import { formatBytes, formatDate, isReleased } from '../../lib/format'

const route = useRoute()
const router = useRouter()
const store = useAdminMaterialsStore()
const uiStore = useUiStore()

const material = ref(null)
const loading = ref(false)
const error = ref('')

const fileUrl = ref('')
const refreshingFile = ref(false)

const isPdf = (m) => Boolean(m && m.file && m.file.mime_type === 'application/pdf')

async function load() {
  loading.value = true
  error.value = ''
  fileUrl.value = ''
  try {
    material.value = await store.fetchDetail(route.params.id)
    // The detail response already includes a signed URL; use it for the inline view.
    if (material.value.file && material.value.file.url) {
      fileUrl.value = material.value.file.url
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

// Signed URLs expire in 60s. Mint a fresh one when the embedded view goes stale.
async function reloadFile() {
  refreshingFile.value = true
  try {
    fileUrl.value = await store.refreshFileUrl(route.params.id)
  } catch (e) {
    uiStore.error(e.message)
  } finally {
    refreshingFile.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <PageHeader title="Material detail">
      <template #actions>
        <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="router.push('/admin/materials')">Back</v-btn>
      </template>
    </PageHeader>

    <StatePanel :loading="loading" :error="error" @retry="load">
      <v-card v-if="material" class="pa-6" max-width="900">
        <div class="d-flex align-center justify-space-between mb-4">
          <h2 class="text-h6 font-weight-bold mb-0">{{ material.title }}</h2>
          <StatusChip :value="isReleased(material.is_released) ? 'RELEASED' : 'UNRELEASED'" />
        </div>

        <p class="text-body-2 text-medium-emphasis mb-4">
          {{ material.description || 'No description.' }}
        </p>

        <v-row class="mb-1">
          <v-col cols="4" class="text-medium-emphasis">Access</v-col>
          <v-col cols="8"><StatusChip :value="material.access_type" /></v-col>
        </v-row>
        <v-divider class="my-2" />
        <v-row class="mb-1">
          <v-col cols="4" class="text-medium-emphasis">Created</v-col>
          <v-col cols="8">{{ formatDate(material.created_at) }}</v-col>
        </v-row>

        <v-divider class="my-4" />

        <div class="d-flex align-center justify-space-between mb-3">
          <div>
            <h3 class="text-subtitle-1 font-weight-bold mb-0">File</h3>
            <div v-if="material.file" class="text-caption text-medium-emphasis">
              {{ material.file.original_filename }} · {{ material.file.mime_type }} ·
              {{ formatBytes(material.file.size) }}
            </div>
          </div>
          <v-btn
            v-if="material.file"
            variant="text"
            prepend-icon="mdi-refresh"
            :loading="refreshingFile"
            @click="reloadFile"
          >
            Reload file
          </v-btn>
        </div>

        <!-- Inline PDF preview -->
        <template v-if="material.file">
          <div v-if="isPdf(material) && fileUrl" class="pdf-frame">
            <iframe :src="fileUrl" title="Material PDF" width="100%" height="100%" />
          </div>
          <v-alert v-else-if="isPdf(material)" type="warning" variant="tonal" density="comfortable">
            Preview link is unavailable. Click "Reload file" to generate a fresh link.
          </v-alert>
          <v-alert v-else type="info" variant="tonal" density="comfortable">
            Inline preview is only available for PDF files.
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
