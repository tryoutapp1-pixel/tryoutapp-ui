<script setup>
// Admin material detail. GET /admin/materials/:id returns the material and its
// file with a signed URL (60 seconds). The PDF is embedded inline; "Reload
// file" mints a fresh URL. "Edit details" updates title, description, type,
// and access type; the file itself cannot be replaced.
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminMaterialsStore } from '../../stores/adminMaterials'
import { useUiStore } from '../../stores/ui'
import PageHeader from '../../components/PageHeader.vue'
import StatePanel from '../../components/StatePanel.vue'
import StatusChip from '../../components/StatusChip.vue'
import { formatBytes, formatDate, isReleased } from '../../lib/format'
import { ACCESS_TYPE_OPTIONS, SECTION_TYPE_OPTIONS } from '../../lib/options'

/** @typedef {import('../../types/api').Material} Material */

const route = useRoute()
const router = useRouter()
const store = useAdminMaterialsStore()
const uiStore = useUiStore()

/** @type {import('vue').Ref<Material|null>} */
const material = ref(null)
const loading = ref(false)
const error = ref('')

const fileUrl = ref('')
const refreshingFile = ref(false)

const editOpen = ref(false)
const saving = ref(false)
const editForm = ref({ title: '', description: '', type: 'TWK', access_type: 'FREE' })
const titleError = computed(() => {
  const title = editForm.value.title.trim()
  if (!title) return 'Enter a title.'
  if (title.length > 255) return 'Keep the title under 255 characters.'
  return ''
})

/**
 * @param {Material|null} m
 * @returns {boolean}
 */
const isPdf = (m) => Boolean(m && m.file && m.file.mime_type === 'application/pdf')

async function load() {
  loading.value = true
  error.value = ''
  fileUrl.value = ''
  try {
    material.value = await store.fetchDetail(route.params.id)
    if (material.value.file && material.value.file.url) fileUrl.value = material.value.file.url
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

/** Signed URLs expire after 60 seconds; mint a fresh one when the preview goes stale. */
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

function openEdit() {
  if (!material.value) return
  editForm.value = {
    title: material.value.title,
    description: material.value.description || '',
    type: material.value.type,
    access_type: material.value.access_type
  }
  editOpen.value = true
}

async function saveEdit() {
  if (titleError.value || !material.value) return
  saving.value = true
  try {
    const updated = await store.update(material.value.id, {
      title: editForm.value.title.trim(),
      description: editForm.value.description.trim() || null,
      type: editForm.value.type,
      access_type: editForm.value.access_type
    })
    material.value = updated
    if (updated.file && updated.file.url) fileUrl.value = updated.file.url
    editOpen.value = false
    uiStore.success('Material details saved.')
  } catch (e) {
    uiStore.error(e.message)
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <PageHeader title="Material detail">
      <template #actions>
        <v-btn v-if="material" variant="tonal" prepend-icon="mdi-pencil-outline" @click="openEdit">Edit details</v-btn>
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
          <v-col cols="4" class="text-medium-emphasis">Type</v-col>
          <v-col cols="8"><StatusChip :value="material.type" /></v-col>
        </v-row>
        <v-divider class="my-2" />
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

        <template v-if="material.file">
          <div v-if="isPdf(material) && fileUrl" class="pdf-frame">
            <iframe :src="fileUrl" title="Material PDF" width="100%" height="100%" />
          </div>
          <v-alert v-else-if="isPdf(material)" type="warning" variant="tonal" density="comfortable">
            Preview link is unavailable. Select "Reload file" to generate a fresh link.
          </v-alert>
          <v-alert v-else type="info" variant="tonal" density="comfortable">
            Inline preview is only available for PDF files.
          </v-alert>
        </template>
        <p v-else class="text-body-2 text-medium-emphasis mb-0">No file attached.</p>
      </v-card>
    </StatePanel>

    <v-dialog v-model="editOpen" max-width="560" :persistent="saving">
      <v-card class="pa-2">
        <v-card-title class="text-h6">Edit material details</v-card-title>
        <v-card-text>
          <form novalidate @submit.prevent="saveEdit">
            <v-text-field
              v-model="editForm.title"
              label="Title"
              :error-messages="titleError ? [titleError] : []"
              counter="255"
            />
            <v-textarea v-model="editForm.description" label="Description (optional)" variant="outlined" rows="3" />
            <v-select
              v-model="editForm.type"
              :items="SECTION_TYPE_OPTIONS"
              label="Type"
              variant="outlined"
              density="comfortable"
            />
            <v-select
              v-model="editForm.access_type"
              :items="ACCESS_TYPE_OPTIONS"
              label="Access type"
              variant="outlined"
              density="comfortable"
            />
            <div class="d-flex justify-end ga-2">
              <v-btn variant="text" :disabled="saving" @click="editOpen = false">Cancel</v-btn>
              <v-btn type="submit" color="primary" variant="flat" :loading="saving" :disabled="Boolean(titleError)">
                Save details
              </v-btn>
            </div>
          </form>
        </v-card-text>
      </v-card>
    </v-dialog>
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
