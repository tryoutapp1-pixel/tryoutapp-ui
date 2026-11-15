<script setup>
// Admin materials: list, upload, release/unrelease, and delete.
// Upload takes a PDF (validated by the backend), a title, a required section
// type (TWK/TIU/TKP), an optional description, and the access type.
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { useAdminMaterialsStore } from '../../stores/adminMaterials'
import { useUiStore } from '../../stores/ui'
import PageHeader from '../../components/PageHeader.vue'
import StatePanel from '../../components/StatePanel.vue'
import StatusChip from '../../components/StatusChip.vue'
import ConfirmDialog from '../../components/ConfirmDialog.vue'
import AppTextField from '../../components/form/AppTextField.vue'
import { compose, required, maxLength } from '../../lib/validators'
import { formatDate, isReleased } from '../../lib/format'
import { ACCESS_TYPE_OPTIONS, SECTION_TYPE_OPTIONS } from '../../lib/options'

/** @typedef {import('../../types/api').Material} Material */
/** @typedef {import('../../types/api').SectionType} SectionType */

const MAX_BYTES = 25 * 1024 * 1024

const router = useRouter()
const store = useAdminMaterialsStore()
const uiStore = useUiStore()
const { items, pagination, loading, uploading, error } = storeToRefs(store)

const showUpload = ref(false)
/** @type {import('vue').Ref<File|File[]|null>} */
const file = ref(null)
/** @type {import('vue').Ref<SectionType|null>} */
const sectionType = ref(null)
const accessType = ref('FREE')
const fileError = ref('')
const typeError = ref('')

const { handleSubmit, resetForm } = useForm({
  initialValues: { title: '', description: '' }
})

/** @param {number} [page=1] */
function load(page = 1) {
  store.fetchList({ page, limit: pagination.value.limit })
}

function openUpload() {
  resetForm()
  file.value = null
  sectionType.value = null
  accessType.value = 'FREE'
  fileError.value = ''
  typeError.value = ''
  showUpload.value = true
}

const onUpload = handleSubmit(async (formValues) => {
  const picked = Array.isArray(file.value) ? file.value[0] : file.value
  fileError.value = ''
  typeError.value = sectionType.value ? '' : 'Pilih TWK, TIU, atau TKP.'
  if (!picked) fileError.value = 'Pilih file PDF.'
  else if (picked.size > MAX_BYTES) fileError.value = 'Ukuran PDF lebih dari 25 MB. Pilih file yang lebih kecil.'
  if (fileError.value || typeError.value) return

  try {
    await store.upload({
      title: formValues.title,
      description: formValues.description,
      type: /** @type {SectionType} */ (sectionType.value),
      access_type: accessType.value,
      file: picked
    })
    uiStore.success('Materi diunggah.')
    showUpload.value = false
  } catch (e) {
    uiStore.error(e.message)
  }
})

/** @param {Material} item */
async function toggleRelease(item) {
  try {
    const next = !isReleased(item.is_released)
    await store.setReleased(item.id, next)
    uiStore.success(next ? 'Materi diterbitkan.' : 'Terbit materi dibatalkan.')
  } catch (e) {
    uiStore.error(e.message)
  }
}

const confirmOpen = ref(false)
const deleting = ref(false)
/** @type {import('vue').Ref<Material|null>} */
const target = ref(null)

/** @param {Material} item */
function askDelete(item) {
  target.value = item
  confirmOpen.value = true
}

async function doDelete() {
  if (!target.value) return
  deleting.value = true
  try {
    await store.remove(target.value.id)
    uiStore.success('Materi dihapus.')
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
    <PageHeader title="Materi" subtitle="Materi belajar dalam format PDF. Terbitkan materi agar bisa dilihat pengguna.">
      <template #actions>
        <v-btn color="primary" prepend-icon="mdi-upload" @click="openUpload">Unggah materi</v-btn>
      </template>
    </PageHeader>

    <StatePanel
      :loading="loading"
      :error="error"
      :empty="!loading && !error && items.length === 0"
      empty-text="Belum ada materi. Unggah materi pertama lewat tombol Unggah materi."
      empty-icon="mdi-book-off-outline"
      @retry="load(pagination.page)"
    >
      <v-card variant="flat">
        <v-table hover>
          <thead>
            <tr>
              <th>Judul</th>
              <th>Jenis</th>
              <th>Akses</th>
              <th>Status</th>
              <th>Dibuat</th>
              <th class="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in items" :key="m.id">
              <td class="font-weight-medium">{{ m.title }}</td>
              <td><StatusChip :value="m.type" /></td>
              <td><StatusChip :value="m.access_type" /></td>
              <td class="text-no-wrap"><StatusChip :value="isReleased(m.is_released) ? 'RELEASED' : 'UNRELEASED'" /></td>
              <td class="text-no-wrap">{{ formatDate(m.created_at) }}</td>
              <td class="text-right text-no-wrap">
                <v-tooltip text="Buka materi">
                  <template #activator="{ props: tip }">
                    <v-btn
                      v-bind="tip"
                      size="small"
                      variant="text"
                      color="primary"
                      icon="mdi-eye-outline"
                      aria-label="Buka materi"
                      @click="router.push(`/admin/materials/${m.id}`)"
                    />
                  </template>
                </v-tooltip>
                <v-tooltip :text="isReleased(m.is_released) ? 'Batalkan terbit' : 'Terbitkan'">
                  <template #activator="{ props: tip }">
                    <v-btn
                      v-bind="tip"
                      size="small"
                      variant="text"
                      :icon="isReleased(m.is_released) ? 'mdi-eye-off-outline' : 'mdi-check-circle-outline'"
                      :color="isReleased(m.is_released) ? 'warning' : 'success'"
                      :aria-label="isReleased(m.is_released) ? 'Batalkan terbit materi' : 'Terbitkan materi'"
                      @click="toggleRelease(m)"
                    />
                  </template>
                </v-tooltip>
                <v-tooltip text="Hapus materi">
                  <template #activator="{ props: tip }">
                    <v-btn
                      v-bind="tip"
                      size="small"
                      variant="text"
                      color="error"
                      icon="mdi-delete-outline"
                      aria-label="Hapus materi"
                      @click="askDelete(m)"
                    />
                  </template>
                </v-tooltip>
              </td>
            </tr>
          </tbody>
        </v-table>

        <div v-if="pagination.totalPages > 1" class="d-flex justify-center py-4">
          <v-pagination
            :model-value="pagination.page"
            :length="pagination.totalPages"
            :total-visible="7"
            @update:model-value="load"
          />
        </div>
      </v-card>
    </StatePanel>

    <v-dialog v-model="showUpload" max-width="560">
      <v-card class="pa-3">
        <v-card-title class="text-title-large text-wrap">Unggah materi</v-card-title>
        <v-card-text>
          <form novalidate @submit.prevent="onUpload">
            <section aria-labelledby="material-upload-details">
              <h3 id="material-upload-details" class="text-title-small mb-3">Detail materi</h3>
              <AppTextField name="title" label="Judul" :rules="compose(required('Title'), maxLength(255, 'Title'))" />
              <AppTextField name="description" label="Deskripsi (opsional)" :rules="maxLength(65535, 'Description')" />
            </section>

            <section aria-labelledby="material-upload-settings" class="mt-2">
              <h3 id="material-upload-settings" class="text-title-small mb-3">Pengaturan</h3>
              <v-select
                v-model="sectionType"
                :items="SECTION_TYPE_OPTIONS"
                label="Jenis"
                :error-messages="typeError ? [typeError] : []"
                @update:model-value="typeError = ''"
              />
              <v-select
                v-model="accessType"
                :items="ACCESS_TYPE_OPTIONS"
                label="Akses"
              />
            </section>

            <section aria-labelledby="material-upload-file" class="mt-2">
              <h3 id="material-upload-file" class="text-title-small mb-3">File</h3>
              <v-file-input
                v-model="file"
                accept="application/pdf"
                label="File PDF (maks. 25 MB)"
                prepend-icon=""
                prepend-inner-icon="mdi-file-pdf-box"
                :error-messages="fileError ? [fileError] : []"
              />
            </section>

            <div class="d-flex justify-end ga-2 mt-2">
              <v-btn variant="text" :disabled="uploading" @click="showUpload = false">Batal</v-btn>
              <v-btn type="submit" color="primary" variant="flat" prepend-icon="mdi-upload" :loading="uploading">
                Unggah
              </v-btn>
            </div>
          </form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <ConfirmDialog
      v-model="confirmOpen"
      title="Hapus materi?"
      :message="`Materi${target ? ' \u201C' + target.title + '\u201D' : ''} beserta filenya akan dihapus permanen.`"
      confirm-text="Hapus"
      :loading="deleting"
      @confirm="doDelete"
    />
  </div>
</template>
