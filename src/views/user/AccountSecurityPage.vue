<script setup>
// Change password (FU5). Requires the current password, which the backend
// validates. Stateless flow: calls authService directly with no shared state.
// Passwords live only in the form and are cleared after a successful submit.
// @submit.prevent keeps them out of the URL.
import { ref } from 'vue'
import { useForm } from 'vee-validate'
import authService from '../../services/authService'
import { useUiStore } from '../../stores/ui'
import { compose, required, password as passwordRule, matches } from '../../lib/validators'
import PageHeader from '../../components/PageHeader.vue'
import AppPasswordField from '../../components/form/AppPasswordField.vue'

const uiStore = useUiStore()
const submitting = ref(false)
const formError = ref('')
/** @type {import('vue').Ref<import('../../lib/apiError').FieldErrors>} */
const fieldErrors = ref({})

const { handleSubmit, resetForm, values } = useForm({
  initialValues: { currentPassword: '', newPassword: '', confirmPassword: '' }
})

const onSubmit = handleSubmit(async (formValues) => {
  formError.value = ''
  fieldErrors.value = {}
  submitting.value = true
  try {
    await authService.changePassword({
      currentPassword: formValues.currentPassword,
      newPassword: formValues.newPassword
    })
    uiStore.success('Kata sandi berhasil diubah.')
    resetForm()
  } catch (error) {
    fieldErrors.value = error.fieldErrors || {}
    if (!Object.keys(fieldErrors.value).length) formError.value = error.message
  } finally {
    submitting.value = false
  }
})
</script>

<template>
  <div>
    <PageHeader title="Ubah kata sandi" subtitle="Perbarui kata sandi akunmu." />

    <v-card class="pa-5 pa-md-6" max-width="640">
      <div class="d-flex align-center ga-3 mb-6">
        <v-avatar color="surface-light" rounded="lg" size="44">
          <v-icon icon="mdi-lock-outline" color="primary" />
        </v-avatar>
        <div>
          <h2 class="text-title-large mb-0">Kata sandi</h2>
          <p class="text-body-small text-medium-emphasis mb-0">
            Masukkan kata sandi saat ini, lalu buat kata sandi baru minimal 8 karakter.
          </p>
        </div>
      </div>

      <v-alert v-if="formError" type="error" variant="tonal" density="comfortable" class="mb-4">
        {{ formError }}
      </v-alert>

      <form novalidate @submit.prevent="onSubmit">
        <AppPasswordField
          name="currentPassword"
          label="Kata sandi saat ini"
          autocomplete="current-password"
          :rules="required('Current password')"
          :server-error="fieldErrors.currentPassword"
        />
        <v-divider class="mt-1 mb-6" />
        <AppPasswordField
          name="newPassword"
          label="Kata sandi baru"
          autocomplete="new-password"
          :rules="compose(required('New password'), passwordRule)"
          :server-error="fieldErrors.newPassword"
        />
        <AppPasswordField
          name="confirmPassword"
          label="Ulangi kata sandi baru"
          autocomplete="new-password"
          :rules="compose(required('Confirm password'), matches(() => values.newPassword, 'Passwords do not match'))"
        />
        <div class="d-flex justify-end mt-2">
          <v-btn type="submit" color="primary" variant="flat" :loading="submitting">
            Ubah kata sandi
          </v-btn>
        </div>
      </form>
    </v-card>
  </div>
</template>
