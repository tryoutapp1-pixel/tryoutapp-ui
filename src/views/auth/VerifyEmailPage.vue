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
    message.value = (res && res.message) || 'Email kamu sudah terverifikasi. Sekarang kamu bisa masuk.'
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
    resendMessage.value = (res && res.message) || 'Jika akun ini masih menunggu verifikasi, email verifikasi baru sudah dikirim.'
  } catch (error) {
    resendMessage.value = error.message
  } finally {
    resending.value = false
  }
})
</script>

<template>
  <div class="app-content px-4 pt-6 pt-md-16 pb-12 pb-md-16">
    <v-card class="auth-card rounded-xl pa-6 pa-sm-10 mx-auto">
      <div v-if="status === 'verifying'" class="text-center py-8" role="status" aria-live="polite">
        <v-progress-circular indeterminate color="primary" size="40" width="3" class="mb-4" />
        <p class="text-body-large text-medium-emphasis mb-0">Memverifikasi email kamu...</p>
      </div>

      <div v-else-if="status === 'success'" class="text-center">
        <v-avatar color="success" variant="tonal" size="64" class="mb-5">
          <v-icon icon="mdi-check-circle-outline" size="32" />
        </v-avatar>
        <h1 class="text-headline-medium mb-2">Email terverifikasi</h1>
        <p class="text-body-large text-medium-emphasis mb-8">{{ message }}</p>
        <v-btn to="/login" color="primary" variant="flat" size="large" block>Masuk sekarang</v-btn>
      </div>

      <div v-else>
        <template v-if="status === 'failed'">
          <div class="text-center mb-8">
            <v-avatar color="error" variant="tonal" size="64" class="mb-5">
              <v-icon icon="mdi-alert-circle-outline" size="32" />
            </v-avatar>
            <h1 class="text-headline-medium mb-2">Verifikasi gagal</h1>
            <p class="text-body-large text-medium-emphasis mb-0">{{ message }}</p>
          </div>
        </template>
        <template v-else>
          <h1 class="text-headline-medium mb-2">Kirim ulang verifikasi</h1>
          <p class="text-body-large text-medium-emphasis mb-8">
            Masukkan email kamu untuk menerima tautan verifikasi baru.
          </p>
        </template>

        <v-alert v-if="resendMessage" type="info" variant="tonal" density="comfortable" class="mb-6">
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
          <v-btn type="submit" color="primary" size="large" block :loading="resending" class="mt-2">
            Kirim ulang email verifikasi
          </v-btn>
        </form>

        <p class="text-body-medium text-center mt-8 mb-0">
          <RouterLink to="/login" class="app-link">Kembali ke halaman masuk</RouterLink>
        </p>
      </div>
    </v-card>
  </div>
</template>

<style scoped>
.auth-card {
  width: 100%;
  max-width: 460px;
}
</style>
