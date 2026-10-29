<script setup>
// FA8/FA9/FA11/FA24 - materials list + upload + release/unrelease + delete.
// Upload: PDF only (backend enforces), + title, optional description, access_type.
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

const router = useRouter()
const store = useAdminMaterialsStore()
const uiStore = useUiStore()
const { items, pagination, loading, uploading, error } = storeToRefs(store)

const MAX_BYTES = 25 * 1024 * 1024
const showUpload = ref(false)
const file = ref(null)
const accessType = ref('FREE')
const fileError = ref('')

const { handleSubmit, resetForm, values } = useForm({
  initialValues: { title: '', description: '' }
})

function load(page = 1) {
  store.fetchList({ page, limit: pagination.value.limit })
}

function openUpload() {
  resetForm()
  file.value = null
  accessType.value = 'FREE'
  fileError.value = ''
  showUpload.value = true
}

const onUpload = handleSubmit(async (formValues) => {
  const picked = Array.isArray(file.value) ? file.value[0] : file.value
  fileError.value = ''
  if (!picked) {
    fileError.value = 'A PDF file is required.'
    return
  }
  if (picked.size > MAX_BYTES) {
    fileError.value = 'PDF exceeds the 25 MB limit.'
    return
  }
  try {
    await store.upload({
      title: formValues.title,
      description: formValues.description,
      access_type: accessType.value,
      file: picked
    })
    uiStore.success('Material uploaded.')
    showUpload.value = false
  } catch (e) {
    uiStore.error(e.message)
  }
})

async function toggleRelease(item) {
  try {
    const next = !isReleased(item.is_released)
    await store.setReleased(item.id, next)
    uiStore.success(next ? 'Material released.' : 'Material unreleased.')
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
              <th>Access</th>
              <th>Status</th>
              <th>Created</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in items" :key="m.id">
              <td class="font-weight-medium">{{ m.title }}</td>
              <td><StatusChip :value="m.access_type" /></td>
              <td><StatusChip :value="isReleased(m.is_released) ? 'RELEASED' : 'UNRELEASED'" /></td>
              <td>{{ formatDate(m.created_at) }}</td>
              <td class="text-right">
                <v-btn size="small" variant="text" icon="mdi-eye-outline" @click="router.push(`/admin/materials/${m.id}`)" />
                <v-btn
                  size="small"
                  variant="text"
                  :icon="isReleased(m.is_released) ? 'mdi-eye-off-outline' : 'mdi-check-circle-outline'"
                  :color="isReleased(m.is_released) ? 'warning' : 'success'"
                  :title="isReleased(m.is_released) ? 'Unrelease' : 'Release'"
                  @click="toggleRelease(m)"
                />
                <v-btn size="small" variant="text" color="error" icon="mdi-delete-outline" @click="askDelete(m)" />
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

    <!-- Upload dialog -->
    <v-dialog v-model="showUpload" max-width="560">
      <v-card class="pa-2">
        <v-card-title class="text-h6">Upload material</v-card-title>
        <v-card-text>
          <form novalidate @submit.prevent="onUpload">
            <AppTextField
              name="title"
              label="Title"
              :rules="compose(required('Title'), maxLength(255, 'Title'))"
            />
            <AppTextField name="description" label="Description (optional)" :rules="maxLength(65535, 'Description')" />
            <v-select
              v-model="accessType"
              :items="['FREE', 'PREMIUM']"
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
