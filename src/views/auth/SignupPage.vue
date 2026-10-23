<script setup>
// Signup page (FU1).
//
// Signup does NOT authenticate. Backend creates a PENDING_VERIFICATION account
// and emails a verification link. If the request fails, we keep the safe form
// values (name/email) so the user can retry; passwords are cleared and never
// persisted. @submit.prevent prevents any credential from entering the URL.
import { ref } from 'vue'
import { useForm } from 'vee-validate'
import authService from '../../services/authService'
import { compose, required, email as emailRule, password as passwordRule, maxLength } from '../../lib/validators'
import AppTextField from '../../components/form/AppTextField.vue'
import AppPasswordField from '../../components/form/AppPasswordField.vue'

const submitting = ref(false)
const formError = ref('')
const done = ref(false)
const submittedEmail = ref('')
const fieldErrors = ref({})

const { handleSubmit, resetField } = useForm({
  initialValues: { name: '', email: '', password: '' }
})

const onSubmit = handleSubmit(async (values) => {
  formError.value = ''
  fieldErrors.value = {}
  submitting.value = true
  try {
    await authService.signup({
      name: values.name,
      email: values.email,
      password: values.password
    })
    submittedEmail.value = values.email
    done.value = true
  } catch (error) {
    formError.value = error.message
    fieldErrors.value = error.fieldErrors || {}
    // Keep name/email; only clear the password for safety.
    resetField('password', { value: '' })
  } finally {
    submitting.value = false
  }
})
</script>

<template>
  <v-container class="py-12" style="max-width: 460px">
    <v-card class="pa-6">
      <template v-if="done">
        <div class="text-center">
          <v-icon icon="mdi-email-check-outline" color="success" size="48" class="mb-3" />
          <h1 class="text-h5 font-weight-bold mb-2">Check your email</h1>
          <p class="text-body-2 text-medium-emphasis mb-6">
            We sent a verification link to <strong>{{ submittedEmail }}</strong>.
            Verify your account, then log in.
          </p>
          <v-btn to="/login" color="primary" variant="flat" block>Go to login</v-btn>
          <v-btn to="/verify-email" variant="text" block class="mt-2">Resend verification</v-btn>
        </div>
      </template>

      <template v-else>
        <h1 class="text-h5 font-weight-bold mb-1">Create your account</h1>
        <p class="text-body-2 text-medium-emphasis mb-6">Start practicing in minutes.</p>

        <v-alert v-if="formError" type="error" variant="tonal" density="comfortable" class="mb-4">
          {{ formError }}
        </v-alert>

        <form novalidate @submit.prevent="onSubmit">
          <AppTextField
            name="name"
            label="Name"
            autocomplete="name"
            :rules="compose(required('Name'), maxLength(100, 'Name'))"
            :server-error="fieldErrors.name"
          />
          <AppTextField
            name="email"
            label="Email"
            type="email"
            autocomplete="email"
            :rules="compose(required('Email'), emailRule)"
            :server-error="fieldErrors.email"
          />
          <AppPasswordField
            name="password"
            label="Password"
            autocomplete="new-password"
            :rules="compose(required('Password'), passwordRule)"
            :server-error="fieldErrors.password"
          />

          <v-btn type="submit" color="primary" size="large" block :loading="submitting" class="mt-2">
            Sign up
          </v-btn>
        </form>

        <v-divider class="my-5" />
        <p class="text-body-2 text-center mb-0">
          Already have an account?
          <RouterLink to="/login" class="text-primary text-decoration-none">Log in</RouterLink>
        </p>
      </template>
    </v-card>
  </v-container>
</template>
