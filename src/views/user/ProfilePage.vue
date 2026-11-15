<script setup>
// Profile view and edit (FU3 / FU4). Reads from the profile store, which is
// shared across pages, and updates through its action. That action also
// refreshes the auth store user so the nav menu never shows a stale name.
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useForm } from 'vee-validate'
import { useProfileStore } from '../../stores/profile'
import { useUiStore } from '../../stores/ui'
import { compose, required, maxLength } from '../../lib/validators'
import PageHeader from '../../components/PageHeader.vue'
import StatePanel from '../../components/StatePanel.vue'
import AppTextField from '../../components/form/AppTextField.vue'

const profileStore = useProfileStore()
const uiStore = useUiStore()
const { profile, loading, saving } = storeToRefs(profileStore)

const loadError = ref('')
const editing = ref(false)
/** @type {import('vue').Ref<import('../../lib/apiError').FieldErrors>} */
const fieldErrors = ref({})

const { handleSubmit, setFieldValue } = useForm({ initialValues: { name: '' } })

async function load() {
  loadError.value = ''
  try {
    await profileStore.loadProfile(true)
    setFieldValue('name', profile.value ? profile.value.name : '')
  } catch (error) {
    loadError.value = error.message
  }
}

function startEdit() {
  setFieldValue('name', profile.value ? profile.value.name : '')
  fieldErrors.value = {}
  editing.value = true
}

function cancelEdit() {
  editing.value = false
}

const onSubmit = handleSubmit(async (values) => {
  fieldErrors.value = {}
  try {
    await profileStore.updateProfile({ name: values.name })
    uiStore.success('Profil berhasil diperbarui.')
    editing.value = false
  } catch (error) {
    fieldErrors.value = error.fieldErrors || {}
    if (!Object.keys(fieldErrors.value).length) uiStore.error(error.message)
  }
})

onMounted(load)
</script>

<template>
  <div>
    <PageHeader title="Profil" subtitle="Lihat dan perbarui data akunmu." />

    <StatePanel :loading="loading && !profile" :error="loadError" @retry="load">
      <v-card class="pa-5 pa-md-6" max-width="640">
        <div v-if="!editing">
          <div class="d-flex align-center ga-3 mb-4">
            <v-avatar color="surface-light" rounded="lg" size="44">
              <v-icon icon="mdi-account-circle-outline" color="primary" />
            </v-avatar>
            <div>
              <h2 class="text-title-large mb-0">Data akun</h2>
              <p class="text-body-small text-medium-emphasis mb-0">Nama dan email yang terdaftar.</p>
            </div>
          </div>

          <v-row class="align-center" dense>
            <v-col cols="12" sm="4" class="text-body-medium text-medium-emphasis">Nama</v-col>
            <v-col cols="12" sm="8" class="text-title-medium text-break">{{ profile?.name }}</v-col>
          </v-row>
          <v-divider class="my-3" />
          <v-row class="align-center" dense>
            <v-col cols="12" sm="4" class="text-body-medium text-medium-emphasis">Email</v-col>
            <v-col cols="12" sm="8" class="text-title-medium text-break">{{ profile?.email }}</v-col>
          </v-row>

          <h3 class="text-title-medium mt-8 mb-3">Status akun</h3>
          <v-row class="align-center" dense>
            <v-col cols="12" sm="4" class="text-body-medium text-medium-emphasis">Peran</v-col>
            <v-col cols="12" sm="8">
              <v-chip size="small" color="primary" variant="tonal">{{ profile?.role }}</v-chip>
            </v-col>
          </v-row>
          <v-divider class="my-3" />
          <v-row class="align-center" dense>
            <v-col cols="12" sm="4" class="text-body-medium text-medium-emphasis">Status</v-col>
            <v-col cols="12" sm="8">
              <v-chip size="small" :color="profile?.status === 'ACTIVE' ? 'success' : 'warning'" variant="tonal">
                {{ profile?.status }}
              </v-chip>
            </v-col>
          </v-row>

          <div class="d-flex justify-end mt-8">
            <v-btn color="primary" variant="flat" prepend-icon="mdi-pencil-outline" @click="startEdit">
              Ubah profil
            </v-btn>
          </div>
        </div>

        <form v-else novalidate @submit.prevent="onSubmit">
          <div class="d-flex align-center ga-3 mb-6">
            <v-avatar color="surface-light" rounded="lg" size="44">
              <v-icon icon="mdi-pencil-outline" color="primary" />
            </v-avatar>
            <div>
              <h2 class="text-title-large mb-0">Ubah profil</h2>
              <p class="text-body-small text-medium-emphasis mb-0">Email tidak bisa diubah di sini.</p>
            </div>
          </div>
          <AppTextField
            name="name"
            label="Nama"
            autocomplete="name"
            :rules="compose(required('Name'), maxLength(100, 'Name'))"
            :server-error="fieldErrors.name"
          />
          <v-text-field :model-value="profile?.email" label="Email" disabled />
          <div class="d-flex justify-end flex-wrap ga-2 mt-2">
            <v-btn variant="text" :disabled="saving" @click="cancelEdit">Batal</v-btn>
            <v-btn type="submit" color="primary" variant="flat" :loading="saving">Simpan perubahan</v-btn>
          </div>
        </form>
      </v-card>
    </StatePanel>
  </div>
</template>
