<script setup>
// Reset password page (FUA3, reset step).
//
// The reset email links to {FRONTEND_URL}/reset-password?token=...
// The token is a required integration callback: it is read from the query,
// used only for this request, and never written to browser storage. The new
// password is posted through the API (@submit.prevent) and never enters the URL.
import { ref, onMounted } from 'vue'
import { useForm } from 'vee-validate'
import { useRoute, useRouter } from 'vue-router'
import authService from '../../services/authService'
import { useUiStore } from '../../stores/ui'
import { compose, required, password as passwordRule, matches } from '../../lib/validators'
import AppPasswordField from '../../components/form/AppPasswordField.vue'

const route = useRoute()
const router = useRouter()
const uiStore = useUiStore()

const token = ref('')
const missingToken = ref(false)
const submitting = ref(false)
const formError = ref('')

const { handleSubmit, values } = useForm({
  initialValues: { newPassword: '', confirmPassword: '' }
})

onMounted(() => {
  const t = route.query.token
  if (typeof t === 'string' && t) token.value = t
  else missingToken.value = true
})

const onSubmit = handleSubmit(async (formValues) => {
  formError.value = ''
  submitting.value = true
  try {
    await authService.resetPassword({ token: token.value, newPassword: formValues.newPassword })
    uiStore.success('Password reset successful. Please log in.')
    router.replace('/login')
  } catch (error) {
    // Backend returns 400 for invalid / used / expired tokens.
    formError.value = error.message
  } finally {
    submitting.value = false
  }
})
</script>

<template>
  <v-container class="py-12" style="max-width: 460px">
    <v-card class="pa-6">
      <h1 class="text-h5 font-weight-bold mb-1">Reset password</h1>
      <p class="text-body-2 text-medium-emphasis mb-6">Choose a new password for your account.</p>

      <v-alert v-if="missingToken" type="warning" variant="tonal" density="comfortable" class="mb-4">
        This reset link is missing its token. Request a new link from the
        <RouterLink to="/forgot-password" class="text-primary">forgot password</RouterLink> page.
      </v-alert>

      <v-alert v-else-if="formError" type="error" variant="tonal" density="comfortable" class="mb-4">
        {{ formError }}
      </v-alert>

      <form v-if="!missingToken" novalidate @submit.prevent="onSubmit">
        <AppPasswordField
          name="newPassword"
          label="New password"
          autocomplete="new-password"
          :rules="compose(required('New password'), passwordRule)"
        />
        <AppPasswordField
          name="confirmPassword"
          label="Confirm new password"
          autocomplete="new-password"
          :rules="compose(required('Confirm password'), matches(() => values.newPassword, 'Passwords do not match'))"
        />
        <v-btn type="submit" color="primary" size="large" block :loading="submitting" class="mt-2">
          Reset password
        </v-btn>
      </form>

      <v-divider class="my-5" />
      <p class="text-body-2 text-center mb-0">
        <RouterLink to="/login" class="text-primary text-decoration-none">Back to login</RouterLink>
      </p>
    </v-card>
  </v-container>
</template>
