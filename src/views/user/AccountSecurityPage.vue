<script setup>
// Change password (FU5). Requires the current password (backend validates it).
// Stateless flow: calls authService directly, no shared state needed. Passwords
// live only in the form and are cleared after submit. @submit.prevent keeps
// them out of the URL.
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
    uiStore.success('Password changed successfully.')
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
    <PageHeader title="Change password" subtitle="Update your account password." />

    <v-card class="pa-6" max-width="560">
      <v-alert v-if="formError" type="error" variant="tonal" density="comfortable" class="mb-4">
        {{ formError }}
      </v-alert>

      <form novalidate @submit.prevent="onSubmit">
        <AppPasswordField
          name="currentPassword"
          label="Current password"
          autocomplete="current-password"
          :rules="required('Current password')"
          :server-error="fieldErrors.currentPassword"
        />
        <AppPasswordField
          name="newPassword"
          label="New password"
          autocomplete="new-password"
          :rules="compose(required('New password'), passwordRule)"
          :server-error="fieldErrors.newPassword"
        />
        <AppPasswordField
          name="confirmPassword"
          label="Confirm new password"
          autocomplete="new-password"
          :rules="compose(required('Confirm password'), matches(() => values.newPassword, 'Passwords do not match'))"
        />
        <div class="d-flex justify-end mt-2">
          <v-btn type="submit" color="primary" variant="flat" :loading="submitting">
            Update password
          </v-btn>
        </div>
      </form>
    </v-card>
  </div>
</template>
