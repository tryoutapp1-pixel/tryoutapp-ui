<script setup>
// Forgot password page (FUA3, request step).
// Posts the email through the API (@submit.prevent). The backend returns a
// generic message that does not reveal whether the account exists.
import { ref } from 'vue'
import { useForm } from 'vee-validate'
import authService from '../../services/authService'
import { compose, required, email as emailRule } from '../../lib/validators'
import AppTextField from '../../components/form/AppTextField.vue'

const submitting = ref(false)
const sent = ref(false)
const message = ref('')

const { handleSubmit } = useForm({ initialValues: { email: '' } })

const onSubmit = handleSubmit(async (values) => {
  submitting.value = true
  try {
    const res = await authService.forgotPassword(values.email)
    message.value = (res && res.message) ||
      'If an active account exists for this email, a reset link has been sent.'
    sent.value = true
  } catch (error) {
    message.value = error.message
    sent.value = true
  } finally {
    submitting.value = false
  }
})
</script>

<template>
  <v-container class="py-12" style="max-width: 460px">
    <v-card class="pa-6">
      <h1 class="text-h5 font-weight-bold mb-1">Forgot password</h1>
      <p class="text-body-2 text-medium-emphasis mb-6">
        We'll email you a link to reset your password.
      </p>

      <v-alert v-if="sent" type="info" variant="tonal" density="comfortable" class="mb-4">
        {{ message }}
      </v-alert>

      <form novalidate @submit.prevent="onSubmit">
        <AppTextField
          name="email"
          label="Email"
          type="email"
          autocomplete="email"
          :rules="compose(required('Email'), emailRule)"
        />
        <v-btn type="submit" color="primary" size="large" block :loading="submitting">
          Send reset link
        </v-btn>
      </form>

      <v-divider class="my-5" />
      <p class="text-body-2 text-center mb-0">
        <RouterLink to="/login" class="text-primary text-decoration-none">Back to login</RouterLink>
      </p>
    </v-card>
  </v-container>
</template>
