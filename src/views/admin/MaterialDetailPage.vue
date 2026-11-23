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
  if (!title) return 'Masukkan judul materi.'
  if (title.length > 255) return 'Judul maksimal 255 karakter.'
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
    uiStore.success('Detail materi disimpan.')
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
    <PageHeader title="Detail materi" subtitle="Informasi materi dan pratinjau file PDF.">
      <template #actions>
        <v-btn v-if="material" variant="tonal" color="primary" prepend-icon="mdi-pencil-outline" @click="openEdit">
          Ubah detail
        </v-btn>
        <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="router.push('/admin/materials')">Kembali</v-btn>
      </template>
    </PageHeader>

    <StatePanel :loading="loading" :error="error" @retry="load">
      <v-card v-if="material" class="pa-5 pa-md-6" max-width="960">
        <div class="d-flex align-start justify-space-between ga-3 mb-2">
          <h2 class="text-title-large text-break material-detail__title">{{ material.title }}</h2>
          <StatusChip :value="isReleased(material.is_released) ? 'RELEASED' : 'UNRELEASED'" />
        </div>

        <p class="text-body-medium text-medium-emphasis mb-4">
          {{ material.description || 'Belum ada deskripsi.' }}
        </p>

        <v-row no-gutters align="center" class="py-3">
          <v-col cols="5" sm="3" class="text-body-medium text-medium-emphasis">Jenis</v-col>
          <v-col cols="7" sm="9"><StatusChip :value="material.type" /></v-col>
        </v-row>
        <v-divider />
        <v-row no-gutters align="center" class="py-3">
          <v-col cols="5" sm="3" class="text-body-medium text-medium-emphasis">Akses</v-col>
          <v-col cols="7" sm="9"><StatusChip :value="material.access_type" /></v-col>
        </v-row>
        <v-divider />
        <v-row no-gutters align="center" class="py-3">
          <v-col cols="5" sm="3" class="text-body-medium text-medium-emphasis">Dibuat</v-col>
          <v-col cols="7" sm="9" class="text-body-medium">{{ formatDate(material.created_at) }}</v-col>
        </v-row>

        <v-divider class="mt-1 mb-5" />

        <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-4">
          <div class="d-flex align-center ga-3 material-detail__file">
            <v-avatar color="surface-light" rounded="lg" size="44">
              <v-icon icon="mdi-file-pdf-box" color="primary" />
            </v-avatar>
            <div class="material-detail__file">
              <h3 class="text-title-medium">File</h3>
              <div v-if="material.file" class="d-flex flex-wrap gc-3 text-body-small text-medium-emphasis">
                <span class="text-break">{{ material.file.original_filename }}</span>
                <span>{{ material.file.mime_type }}</span>
                <span>{{ formatBytes(material.file.size) }}</span>
              </div>
            </div>
          </div>
          <v-btn
            v-if="material.file"
            variant="text"
            color="primary"
            prepend-icon="mdi-refresh"
            :loading="refreshingFile"
            @click="reloadFile"
          >
            Muat ulang file
          </v-btn>
        </div>

        <template v-if="material.file">
          <div v-if="isPdf(material) && fileUrl" class="pdf-frame border rounded-lg">
            <iframe :src="fileUrl" title="PDF materi" width="100%" height="100%" />
          </div>
          <v-alert v-else-if="isPdf(material)" type="warning" variant="tonal" density="comfortable">
            Tautan pratinjau sudah tidak berlaku. Pilih "Muat ulang file" untuk membuat tautan baru.
          </v-alert>
          <v-alert v-else type="info" variant="tonal" density="comfortable">
            Pratinjau langsung hanya tersedia untuk file PDF.
          </v-alert>
        </template>
        <p v-else class="text-body-medium text-medium-emphasis mb-0">Belum ada file terlampir.</p>
      </v-card>
    </StatePanel>

    <v-dialog v-model="editOpen" max-width="560" :persistent="saving">
      <v-card class="pa-3">
        <v-card-title class="text-title-large text-wrap">Ubah detail materi</v-card-title>
        <v-card-text>
          <form novalidate @submit.prevent="saveEdit">
            <section aria-labelledby="material-edit-details">
              <h3 id="material-edit-details" class="text-title-small mb-3">Detail materi</h3>
              <v-text-field
                v-model="editForm.title"
                label="Judul"
                :error-messages="titleError ? [titleError] : []"
                counter="255"
              />
              <v-textarea v-model="editForm.description" label="Deskripsi (opsional)" rows="3" />
            </section>

            <section aria-labelledby="material-edit-settings" class="mt-2">
              <h3 id="material-edit-settings" class="text-title-small mb-3">Pengaturan</h3>
              <v-select
                v-model="editForm.type"
                :items="SECTION_TYPE_OPTIONS"
                label="Jenis"
              />
              <v-select
                v-model="editForm.access_type"
                :items="ACCESS_TYPE_OPTIONS"
                label="Akses"
              />
            </section>

            <div class="d-flex justify-end ga-2 mt-2">
              <v-btn variant="text" :disabled="saving" @click="editOpen = false">Batal</v-btn>
              <v-btn type="submit" color="primary" variant="flat" :loading="saving" :disabled="Boolean(titleError)">
                Simpan perubahan
              </v-btn>
            </div>
          </form>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.material-detail__title,
.material-detail__file {
  min-width: 0;
}
.pdf-frame {
  width: 100%;
  height: 80vh;
  min-height: 480px;
  overflow: hidden;
}
.pdf-frame iframe {
  border: 0;
  display: block;
}
</style>
