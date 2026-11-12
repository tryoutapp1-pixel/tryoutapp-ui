<script setup>
// Email verification page.
//
// The verification email links to {FRONTEND_URL}/verify-email?token=...
// The token query param is a required integration callback, not sensitive form
// data, so reading it from the URL is correct. This page calls the backend
// verification endpoint and handles success, invalid, and expired responses.
// When no token is present, it shows the resend-verification form instead.
import { ref, onMounted } from 'vue'
import { useForm } from 'vee-validate'
import { useRoute } from 'vue-router'
import authService from '../../services/authService'
import { compose, required, email as emailRule } from '../../lib/validators'
import AppTextField from '../../components/form/AppTextField.vue'

const route = useRoute()

/** @typedef {'idle'|'verifying'|'success'|'failed'} VerifyStatus */

const token = ref('')
/** @type {import('vue').Ref<VerifyStatus>} */
const status = ref('idle')
const message = ref('')

async function verify() {
  status.value = 'verifying'
  message.value = ''
  try {
    const res = await authService.verifyEmail(token.value)
    status.value = 'success'
    message.value = (res && res.message) || 'Your email has been verified. You can now log in.'
  } catch (error) {
    // Backend returns 400 for invalid / already-used / expired tokens.
    status.value = 'failed'
    message.value = error.message
  }
}

onMounted(() => {
  const t = route.query.token
  if (typeof t === 'string' && t) {
    token.value = t
    verify()
  }
})

// Resend verification form (shown when there is no token, or after failure).
const resending = ref(false)
const resendMessage = ref('')
const { handleSubmit } = useForm({ initialValues: { email: '' } })

const onResend = handleSubmit(async (values) => {
  resending.value = true
  resendMessage.value = ''
  try {
    const res = await authService.resendVerification(values.email)
    // Enumeration-safe generic message from the backend.
    resendMessage.value = (res && res.message) || 'If the account is pending verification, a new email has been sent.'
  } catch (error) {
    resendMessage.value = error.message
  } finally {
    resending.value = false
  }
})
</script>

<template>
  <v-container class="py-12" style="max-width: 460px">
    <v-card class="pa-6">
      <div v-if="status === 'verifying'" class="text-center py-6">
        <v-progress-circular indeterminate color="primary" size="40" class="mb-3" />
        <p class="text-body-1 mb-0">Verifying your email...</p>
      </div>

      <div v-else-if="status === 'success'" class="text-center">
        <v-icon icon="mdi-check-circle-outline" color="success" size="48" class="mb-3" />
        <h1 class="text-h5 font-weight-bold mb-2">Email verified</h1>
        <p class="text-body-2 text-medium-emphasis mb-6">{{ message }}</p>
        <v-btn to="/login" color="primary" variant="flat" block>Continue to login</v-btn>
      </div>

      <div v-else>
        <template v-if="status === 'failed'">
          <div class="text-center mb-6">
            <v-icon icon="mdi-alert-circle-outline" color="error" size="48" class="mb-3" />
            <h1 class="text-h5 font-weight-bold mb-2">Verification failed</h1>
            <p class="text-body-2 text-medium-emphasis mb-0">{{ message }}</p>
          </div>
        </template>
        <template v-else>
          <h1 class="text-h5 font-weight-bold mb-1">Resend verification</h1>
          <p class="text-body-2 text-medium-emphasis mb-6">
            Enter your email to receive a new verification link.
          </p>
        </template>

        <v-alert v-if="resendMessage" type="info" variant="tonal" density="comfortable" class="mb-4">
          {{ resendMessage }}
        </v-alert>

        <form novalidate @submit.prevent="onResend">
          <AppTextField
            name="email"
            label="Email"
            type="email"
            autocomplete="email"
            :rules="compose(required('Email'), emailRule)"
          />
          <v-btn type="submit" color="primary" size="large" block :loading="resending">
            Resend verification email
          </v-btn>
        </form>

        <v-divider class="my-5" />
        <p class="text-body-2 text-center mb-0">
          <RouterLink to="/login" class="text-primary text-decoration-none">Back to login</RouterLink>
        </p>
      </div>
    </v-card>
  </v-container>
</template>
