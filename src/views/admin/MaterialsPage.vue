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
  typeError.value = sectionType.value ? '' : 'Select TWK, TIU, or TKP.'
  if (!picked) fileError.value = 'Choose a PDF file.'
  else if (picked.size > MAX_BYTES) fileError.value = 'The PDF is larger than 25 MB.'
  if (fileError.value || typeError.value) return

  try {
    await store.upload({
      title: formValues.title,
      description: formValues.description,
      type: /** @type {SectionType} */ (sectionType.value),
      access_type: accessType.value,
      file: picked
    })
    uiStore.success('Material uploaded.')
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
    uiStore.success(next ? 'Material released.' : 'Material unreleased.')
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
    uiStore.success('Material deleted.')
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
    <PageHeader title="Materials" subtitle="Learning materials (PDF). Release to make them visible to learners.">
      <template #actions>
        <v-btn color="primary" prepend-icon="mdi-upload" @click="openUpload">Upload material</v-btn>
      </template>
    </PageHeader>

    <StatePanel
      :loading="loading"
      :error="error"
      :empty="!loading && !error && items.length === 0"
      empty-text="No materials yet."
      empty-icon="mdi-book-off-outline"
      @retry="load(pagination.page)"
    >
      <v-card>
        <v-table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Access</th>
              <th>Status</th>
              <th>Created</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in items" :key="m.id">
              <td class="font-weight-medium">{{ m.title }}</td>
              <td><StatusChip :value="m.type" /></td>
              <td><StatusChip :value="m.access_type" /></td>
              <td><StatusChip :value="isReleased(m.is_released) ? 'RELEASED' : 'UNRELEASED'" /></td>
              <td>{{ formatDate(m.created_at) }}</td>
              <td class="text-right">
                <v-btn
                  size="small"
                  variant="text"
                  icon="mdi-eye-outline"
                  aria-label="Open material"
                  @click="router.push(`/admin/materials/${m.id}`)"
                />
                <v-btn
                  size="small"
                  variant="text"
                  :icon="isReleased(m.is_released) ? 'mdi-eye-off-outline' : 'mdi-check-circle-outline'"
                  :color="isReleased(m.is_released) ? 'warning' : 'success'"
                  :title="isReleased(m.is_released) ? 'Unrelease' : 'Release'"
                  :aria-label="isReleased(m.is_released) ? 'Unrelease material' : 'Release material'"
                  @click="toggleRelease(m)"
                />
                <v-btn
                  size="small"
                  variant="text"
                  color="error"
                  icon="mdi-delete-outline"
                  aria-label="Delete material"
                  @click="askDelete(m)"
                />
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
      <v-card class="pa-2">
        <v-card-title class="text-h6">Upload material</v-card-title>
        <v-card-text>
          <form novalidate @submit.prevent="onUpload">
            <AppTextField name="title" label="Title" :rules="compose(required('Title'), maxLength(255, 'Title'))" />
            <AppTextField name="description" label="Description (optional)" :rules="maxLength(65535, 'Description')" />
            <v-select
              v-model="sectionType"
              :items="SECTION_TYPE_OPTIONS"
              label="Type"
              variant="outlined"
              density="comfortable"
              :error-messages="typeError ? [typeError] : []"
              @update:model-value="typeError = ''"
            />
            <v-select
              v-model="accessType"
              :items="ACCESS_TYPE_OPTIONS"
              label="Access type"
              variant="outlined"
              density="comfortable"
            />
            <v-file-input
              v-model="file"
              accept="application/pdf"
              label="PDF file (max 25 MB)"
              prepend-icon="mdi-file-pdf-box"
              :error-messages="fileError ? [fileError] : []"
            />
            <div class="d-flex justify-end ga-2">
              <v-btn variant="text" :disabled="uploading" @click="showUpload = false">Cancel</v-btn>
              <v-btn type="submit" color="primary" variant="flat" :loading="uploading">Upload</v-btn>
            </div>
          </form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <ConfirmDialog
      v-model="confirmOpen"
      title="Delete material?"
      :message="`This permanently deletes the material${target ? ' \u201C' + target.title + '\u201D' : ''} and its file.`"
      confirm-text="Delete"
      :loading="deleting"
      @confirm="doDelete"
    />
  </div>
</template>
