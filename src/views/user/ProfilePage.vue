<script setup>
// Profile view + edit (FU3 / FU4). Reads from the profile store (shared across
// pages) and updates via its action, which also refreshes the auth store user
// so the nav menu never shows a stale name.
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
    uiStore.success('Profile updated.')
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
    <PageHeader title="Profile" subtitle="View and update your account details." />

    <StatePanel :loading="loading && !profile" :error="loadError" @retry="load">
      <v-card class="pa-6" max-width="640">
        <div v-if="!editing">
          <v-row>
            <v-col cols="12" sm="4" class="text-medium-emphasis">Name</v-col>
            <v-col cols="12" sm="8" class="font-weight-medium">{{ profile?.name }}</v-col>
          </v-row>
          <v-divider class="my-3" />
          <v-row>
            <v-col cols="12" sm="4" class="text-medium-emphasis">Email</v-col>
            <v-col cols="12" sm="8" class="font-weight-medium">{{ profile?.email }}</v-col>
          </v-row>
          <v-divider class="my-3" />
          <v-row>
            <v-col cols="12" sm="4" class="text-medium-emphasis">Role</v-col>
            <v-col cols="12" sm="8">
              <v-chip size="small" color="primary" variant="tonal">{{ profile?.role }}</v-chip>
            </v-col>
          </v-row>
          <v-divider class="my-3" />
          <v-row>
            <v-col cols="12" sm="4" class="text-medium-emphasis">Status</v-col>
            <v-col cols="12" sm="8">
              <v-chip size="small" :color="profile?.status === 'ACTIVE' ? 'success' : 'warning'" variant="tonal">
                {{ profile?.status }}
              </v-chip>
            </v-col>
          </v-row>

          <div class="d-flex justify-end mt-6">
            <v-btn color="primary" variant="flat" prepend-icon="mdi-pencil-outline" @click="startEdit">
              Edit profile
            </v-btn>
          </div>
        </div>

        <form v-else novalidate @submit.prevent="onSubmit">
          <AppTextField
            name="name"
            label="Name"
            autocomplete="name"
            :rules="compose(required('Name'), maxLength(100, 'Name'))"
            :server-error="fieldErrors.name"
          />
          <v-text-field :model-value="profile?.email" label="Email" disabled />
          <div class="d-flex justify-end ga-2 mt-2">
            <v-btn variant="text" :disabled="saving" @click="cancelEdit">Cancel</v-btn>
            <v-btn type="submit" color="primary" variant="flat" :loading="saving">Save changes</v-btn>
          </div>
        </form>
      </v-card>
    </StatePanel>
  </div>
</template>
