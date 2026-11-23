<script setup>
// Email verification page.
//
// The verification email links to {FRONTEND_URL}/verify-email?token=...
// The token query param is a required integration callback, not sensitive form
// data, so reading it from the URL is correct. This page calls the backend
// verification endpoint and handles success, invalid, and expired responses.
// When no token is present, it shows the resend-verification form instead.
//
// 'pending' state: SignupPage redirects here when a returning signup uses an
// email that is still PENDING_VERIFICATION. The email arrives through the
// in-memory pendingVerification store. It is copied into this component and
// the store is cleared at once, so the value cannot be reused elsewhere; the
// local copy disappears when the page unmounts. A refresh therefore falls back
// to the normal resend form.
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useForm } from 'vee-validate'
import { useRoute } from 'vue-router'
import authService from '../../services/authService'
import { usePendingVerificationStore } from '../../stores/pendingVerification'
import { compose, required, email as emailRule } from '../../lib/validators'
import AppTextField from '../../components/form/AppTextField.vue'

const route = useRoute()
const pendingVerification = usePendingVerificationStore()

/** @typedef {'idle'|'verifying'|'success'|'failed'|'pending'} VerifyStatus */

const token = ref('')
/** @type {import('vue').Ref<VerifyStatus>} */
const status = ref('idle')
const message = ref('')
/** Email of the pending account, only set in the 'pending' state. */
const pendingEmail = ref('')

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

// Resend verification form (shown when there is no token, after failure, or in the pending state).
const resending = ref(false)
const resendMessage = ref('')
const { handleSubmit, setFieldValue } = useForm({ initialValues: { email: '' } })

onMounted(() => {
  // Consume and clear the handed-over email immediately, whatever the entry path.
  const handedOverEmail = pendingVerification.email
  pendingVerification.clear()

  const t = route.query.token
  if (typeof t === 'string' && t) {
    token.value = t
    verify()
    return
  }
  if (handedOverEmail) {
    pendingEmail.value = handedOverEmail
    setFieldValue('email', handedOverEmail)
    status.value = 'pending'
  }
})

// Safety net: never leave a handed-over email behind when leaving this page.
onBeforeUnmount(() => {
  pendingVerification.clear()
  pendingEmail.value = ''
})

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
        <template v-if="status === 'pending'">
          <div class="text-center mb-8">
            <v-avatar color="warning" variant="tonal" size="64" class="mb-5">
              <v-icon icon="mdi-email-alert-outline" size="32" />
            </v-avatar>
            <h1 class="text-headline-medium mb-2">Email sudah terdaftar</h1>
            <p class="text-body-large text-medium-emphasis mb-0 auth-break">
              Akun dengan email <strong>{{ pendingEmail }}</strong> sudah terdaftar tetapi belum diverifikasi.
              Buka tautan verifikasi yang sudah kami kirim ke email tersebut (cek juga folder spam).
              Jika tautan tidak ditemukan atau sudah kedaluwarsa, kirim ulang di bawah.
            </p>
          </div>
        </template>
        <template v-else-if="status === 'failed'">
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

.auth-break {
  overflow-wrap: anywhere;
}
</style>
