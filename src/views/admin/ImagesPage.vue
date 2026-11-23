<script setup>
// FA3/FA4/FA5/FA7 - images library.
// - The list shows signed-URL thumbnails. URLs expire after 60 seconds; the
//   refresh button signs a new one.
// - Upload accepts JPEG/PNG/WEBP/GIF. The backend checks type, magic bytes,
//   and size.
// - Each card shows the attachment ID to copy into the question Excel template.
// - Delete asks for confirmation; the backend returns 409 if the image is
//   still referenced.
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAdminFilesStore } from '../../stores/adminFiles'
import { useUiStore } from '../../stores/ui'
import PageHeader from '../../components/PageHeader.vue'
import StatePanel from '../../components/StatePanel.vue'
import ConfirmDialog from '../../components/ConfirmDialog.vue'
import { formatBytes, formatDate } from '../../lib/format'

/** @typedef {import('../../types/api').FileInfo} FileInfo */

const store = useAdminFilesStore()
const uiStore = useUiStore()
const { items, pagination, loading, uploading, error } = storeToRefs(store)

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'
const MAX_BYTES = 5 * 1024 * 1024
/** @type {import('vue').Ref<File|File[]|null>} */
const selectedFile = ref(null)

/** @param {number} [page=1] */
function load(page = 1) {
  store.fetchList({ page, limit: pagination.value.limit })
}

async function onUpload() {
  const file = Array.isArray(selectedFile.value) ? selectedFile.value[0] : selectedFile.value
  if (!file) return
  if (file.size > MAX_BYTES) {
    uiStore.error('Ukuran gambar melebihi batas 5 MB. Pilih gambar yang lebih kecil.')
    return
  }
  try {
    const created = await store.upload(file)
    selectedFile.value = null
    uiStore.success(`Gambar diunggah. ID lampiran: ${created.id}`)
  } catch (e) {
    uiStore.error(e.message)
  }
}

/**
 * Copies the attachment ID; falls back to showing it when the clipboard is unavailable.
 * @param {number} id
 */
async function copyId(id) {
  try {
    await navigator.clipboard.writeText(String(id))
    uiStore.success(`ID ${id} disalin.`)
  } catch {
    uiStore.notify(`ID lampiran: ${id}`, 'info')
  }
}

/** @param {FileInfo} item - Updated in place with the fresh signed URL */
async function onRefreshUrl(item) {
  try {
    item.url = await store.refreshUrl(item.id)
    uiStore.success('URL gambar diperbarui.')
  } catch (e) {
    uiStore.error(e.message)
  }
}

// Delete confirmation
const confirmOpen = ref(false)
const deleting = ref(false)
/** @type {import('vue').Ref<FileInfo|null>} */
const target = ref(null)

/** @param {FileInfo} item */
function askDelete(item) {
  target.value = item
  confirmOpen.value = true
}

async function doDelete() {
  deleting.value = true
  try {
    await store.remove(target.value.id)
    uiStore.success('Gambar dihapus.')
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
    <PageHeader title="Gambar" subtitle="Unggah gambar, lalu pakai ID-nya saat menyusun paket soal." />

    <v-card variant="flat" class="pa-4 pa-md-5 mb-6">
      <div class="d-flex flex-wrap align-center ga-3">
        <v-file-input
          v-model="selectedFile"
          :accept="ACCEPT"
          label="Pilih gambar"
          density="comfortable"
          prepend-icon=""
          prepend-inner-icon="mdi-image-outline"
          hide-details
          class="flex-grow-1 images-upload__input"
        />
        <v-btn
          color="primary"
          prepend-icon="mdi-upload"
          :loading="uploading"
          :disabled="!selectedFile"
          @click="onUpload"
        >
          Unggah
        </v-btn>
      </div>
      <p class="text-body-small text-medium-emphasis mt-2 mb-0">JPEG, PNG, WEBP, atau GIF. Maksimal 5 MB.</p>
    </v-card>

    <StatePanel
      :loading="loading"
      :error="error"
      :empty="!loading && !error && items.length === 0"
      empty-text="Belum ada gambar. Unggah gambar pertama lewat kolom di atas."
      empty-icon="mdi-image-off-outline"
      @retry="load(pagination.page)"
    >
      <v-row>
        <v-col v-for="img in items" :key="img.id" cols="12" sm="6" md="4" lg="3">
          <v-card variant="flat" class="h-100 d-flex flex-column">
            <v-img :src="img.url" height="160" cover class="bg-surface-light">
              <template #error>
                <div class="d-flex flex-column align-center justify-center fill-height text-medium-emphasis">
                  <v-icon icon="mdi-image-broken-variant" />
                  <span class="text-body-small mt-1">URL kedaluwarsa</span>
                </div>
              </template>
            </v-img>
            <v-card-text class="pb-1 flex-grow-1">
              <div class="d-flex align-center justify-space-between ga-2">
                <span class="text-label-medium text-medium-emphasis">ID lampiran</span>
                <v-chip size="small" color="secondary" variant="tonal">{{ img.id }}</v-chip>
              </div>
              <div class="text-body-medium font-weight-medium text-truncate mt-2" :title="img.original_filename">
                {{ img.original_filename }}
              </div>
              <div class="d-flex flex-wrap gc-3 text-body-small text-medium-emphasis">
                <span>{{ formatBytes(img.size) }}</span>
                <span>{{ formatDate(img.created_at) }}</span>
              </div>
            </v-card-text>
            <v-card-actions class="px-2">
              <v-btn size="small" variant="text" color="primary" prepend-icon="mdi-content-copy" @click="copyId(img.id)">
                Salin ID
              </v-btn>
              <v-tooltip text="Perbarui URL">
                <template #activator="{ props: tip }">
                  <v-btn
                    v-bind="tip"
                    size="small"
                    variant="text"
                    icon="mdi-refresh"
                    :aria-label="`Perbarui URL gambar ${img.id}`"
                    @click="onRefreshUrl(img)"
                  />
                </template>
              </v-tooltip>
              <v-spacer />
              <v-tooltip text="Hapus gambar">
                <template #activator="{ props: tip }">
                  <v-btn
                    v-bind="tip"
                    size="small"
                    variant="text"
                    color="error"
                    icon="mdi-delete-outline"
                    :aria-label="`Hapus gambar ${img.id}`"
                    @click="askDelete(img)"
                  />
                </template>
              </v-tooltip>
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
      title="Hapus gambar?"
      :message="`Gambar${target ? ' (ID ' + target.id + ')' : ''} akan dihapus permanen. Jika gambar masih dipakai di soal, pilihan jawaban, pembahasan, atau materi, server akan menolak penghapusan.`"
      confirm-text="Hapus"
      :loading="deleting"
      @confirm="doDelete"
    />
  </div>
</template>

<style scoped>
.images-upload__input {
  min-width: 220px;
}
</style>
