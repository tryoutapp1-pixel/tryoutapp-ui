<script setup>
// FA3/FA4/FA5/FA7 - images library.
// - List shows signed-URL thumbnails (URLs expire in 60s; "refresh" re-signs).
// - Upload accepts JPEG/PNG/WEBP/GIF (backend enforces type + magic bytes + size).
// - Each card shows the attachment ID to copy into the question Excel template.
// - Delete is confirmed; backend returns 409 if the image is still referenced.
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAdminFilesStore } from '../../stores/adminFiles'
import { useUiStore } from '../../stores/ui'
import PageHeader from '../../components/PageHeader.vue'
import StatePanel from '../../components/StatePanel.vue'
import ConfirmDialog from '../../components/ConfirmDialog.vue'
import { formatBytes, formatDate } from '../../lib/format'

const store = useAdminFilesStore()
const uiStore = useUiStore()
const { items, pagination, loading, uploading, error } = storeToRefs(store)

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'
const MAX_BYTES = 5 * 1024 * 1024
const selectedFile = ref(null)

function load(page = 1) {
  store.fetchList({ page, limit: pagination.value.limit })
}

async function onUpload() {
  const file = Array.isArray(selectedFile.value) ? selectedFile.value[0] : selectedFile.value
  if (!file) return
  if (file.size > MAX_BYTES) {
    uiStore.error('Image exceeds the 5 MB limit.')
    return
  }
  try {
    const created = await store.upload(file)
    selectedFile.value = null
    uiStore.success(`Uploaded. Attachment ID: ${created.id}`)
  } catch (e) {
    uiStore.error(e.message)
  }
}

async function copyId(id) {
  try {
    await navigator.clipboard.writeText(String(id))
    uiStore.success(`Copied ID ${id}`)
  } catch {
    uiStore.notify(`Attachment ID: ${id}`, 'info')
  }
}

async function onRefreshUrl(item) {
  try {
    item.url = await store.refreshUrl(item.id)
    uiStore.success('Refreshed image URL.')
  } catch (e) {
    uiStore.error(e.message)
  }
}

// Delete confirmation
const confirmOpen = ref(false)
const deleting = ref(false)
const target = ref(null)

function askDelete(item) {
  target.value = item
  confirmOpen.value = true
}

async function doDelete() {
  deleting.value = true
  try {
    await store.remove(target.value.id)
    uiStore.success('Image deleted.')
    confirmOpen.value = false
  } catch (e) {
    uiStore.error(e.message)
  } finally {
    deleting.value = false
  }
}

onMounted(() => load(1))
</script>

<template>
  <div>
    <PageHeader title="Images" subtitle="Upload images and reference their ID when building question packages." />

    <v-card class="pa-4 mb-6">
      <div class="d-flex flex-wrap align-center ga-3">
        <v-file-input
          v-model="selectedFile"
          :accept="ACCEPT"
          label="Choose image (JPEG/PNG/WEBP/GIF, max 5 MB)"
          density="comfortable"
          prepend-icon="mdi-image-outline"
          hide-details
          class="flex-grow-1"
          style="min-width: 260px"
        />
        <v-btn color="primary" :loading="uploading" :disabled="!selectedFile" @click="onUpload">
          Upload
        </v-btn>
      </div>
    </v-card>

    <StatePanel
      :loading="loading"
      :error="error"
      :empty="!loading && !error && items.length === 0"
      empty-text="No images uploaded yet."
      empty-icon="mdi-image-off-outline"
      @retry="load(pagination.page)"
    >
      <v-row>
        <v-col v-for="img in items" :key="img.id" cols="12" sm="6" md="4" lg="3">
          <v-card>
            <v-img :src="img.url" height="160" cover class="bg-grey-lighten-3">
              <template #error>
                <div class="d-flex flex-column align-center justify-center fill-height text-medium-emphasis">
                  <v-icon icon="mdi-image-broken-variant" />
                  <span class="text-caption mt-1">URL expired</span>
                </div>
              </template>
            </v-img>
            <v-card-text class="pb-1">
              <div class="d-flex align-center justify-space-between">
                <span class="text-caption text-medium-emphasis">ID</span>
                <v-chip size="x-small" label>{{ img.id }}</v-chip>
              </div>
              <div class="text-body-2 text-truncate mt-1" :title="img.original_filename">
                {{ img.original_filename }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ formatBytes(img.size) }} · {{ formatDate(img.created_at) }}
              </div>
            </v-card-text>
            <v-card-actions>
              <v-btn size="small" variant="text" prepend-icon="mdi-content-copy" @click="copyId(img.id)">ID</v-btn>
              <v-btn size="small" variant="text" icon="mdi-refresh" @click="onRefreshUrl(img)" />
              <v-spacer />
              <v-btn size="small" variant="text" color="error" icon="mdi-delete-outline" @click="askDelete(img)" />
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>

      <div v-if="pagination.totalPages > 1" class="d-flex justify-center py-4">
        <v-pagination
          :model-value="pagination.page"
          :length="pagination.totalPages"
          :total-visible="7"
          @update:model-value="load"
        />
      </div>
    </StatePanel>

    <ConfirmDialog
      v-model="confirmOpen"
      title="Delete image?"
      :message="`This permanently deletes the image${target ? ' (ID ' + target.id + ')' : ''}. If it is used by a question, option, explanation, or material, the server will refuse.`"
      confirm-text="Delete"
      :loading="deleting"
      @confirm="doDelete"
    />
  </div>
</template>
