<template>
  <section class="login-wrap">
    <v-card class="login-card" variant="flat">
      <template v-if="status === 'checking'">
        <div class="auth-status-icon"><v-progress-circular indeterminate color="primary" aria-label="Memverifikasi email" /></div>
        <h1>Memverifikasi email</h1>
        <p class="login-intro">Tunggu sebentar selagi tautan diperiksa.</p>
      </template>
      <template v-else-if="status === 'success'">
        <div class="auth-status-icon success-icon"><v-icon icon="mdi-check-circle-outline" size="34" /></div>
        <div class="login-kicker">Email terverifikasi</div>
        <h1>Akunmu siap digunakan</h1>
        <p class="login-intro">Email berhasil diverifikasi. Sekarang kamu dapat masuk ke akunmu.</p>
        <v-btn color="primary" to="/login" block class="login-submit">Lanjut ke masuk</v-btn>
      </template>
      <template v-else-if="status === 'pending' || status === 'resend'">
        <div class="login-kicker">Satu langkah lagi</div>
        <h1>{{ status === 'pending' ? 'Periksa emailmu' : 'Kirim ulang email verifikasi' }}</h1>
        <p class="login-intro">{{ status === 'pending' ? 'Pendaftaran berhasil. Buka tautan verifikasi yang kami kirim sebelum masuk.' : 'Masukkan email yang digunakan saat mendaftar. Jika akun menunggu verifikasi, kami akan mengirim tautan baru.' }}</p>
        <p v-if="feedback" class="feedback-message" role="status">{{ feedback }}</p>
        <Form as="div" :initial-values="{ email: emailFromQuery }" v-slot="{ handleSubmit, isSubmitting }">
          <v-form @submit.prevent="handleSubmit($event, resend)">
            <label class="field-label" for="pending-email">Email</label>
            <Field name="email" :rules="emailRule" v-slot="{ componentField, errorMessage }">
              <v-text-field id="pending-email" v-bind="componentField" type="email" autocomplete="email" placeholder="nama@email.com" :error-messages="errorMessage" aria-label="Email" />
            </Field>
            <v-btn type="submit" color="primary" variant="tonal" block :loading="isSubmitting" :disabled="isSubmitting">Kirim ulang email verifikasi</v-btn>
          </v-form>
        </Form>
      </template>
      <template v-else>
        <div class="auth-status-icon error-icon"><v-icon icon="mdi-alert-circle-outline" size="34" /></div>
        <div class="login-kicker">{{ status === 'error' ? 'Koneksi bermasalah' : 'Tautan tidak dapat digunakan' }}</div>
        <h1>{{ status === 'expired' ? 'Tautan sudah kedaluwarsa' : status === 'error' ? 'Verifikasi belum selesai' : 'Tautan verifikasi tidak valid' }}</h1>
        <p class="login-intro">{{ statusMessage }}</p>
        <p v-if="feedback" class="feedback-message" role="status">{{ feedback }}</p>
        <Form as="div" :initial-values="{ email: emailFromQuery }" v-slot="{ handleSubmit, isSubmitting }">
          <v-form @submit.prevent="handleSubmit($event, resend)">
            <label class="field-label" for="resend-email">Kirim tautan baru ke email</label>
            <Field name="email" :rules="emailRule" v-slot="{ componentField, errorMessage }">
              <v-text-field id="resend-email" v-bind="componentField" type="email" autocomplete="email" placeholder="nama@email.com" :error-messages="errorMessage" aria-label="Email untuk verifikasi ulang" />
            </Field>
            <v-btn type="submit" color="primary" variant="tonal" block :loading="isSubmitting" :disabled="isSubmitting">Kirim ulang email verifikasi</v-btn>
          </v-form>
        </Form>
      </template>
      <p v-if="status !== 'success'" class="login-footnote"><RouterLink to="/login">Kembali ke masuk</RouterLink></p>
    </v-card>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { Field, Form } from 'vee-validate'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { resendVerification, verifyEmail } from '../lib/authApi'
import { notify } from '../lib/apiError'

const route = useRoute()
const router = useRouter()
const token = typeof route.query.token === 'string' ? route.query.token : ''
const emailFromQuery = typeof route.query.email === 'string' ? route.query.email : ''
const status = ref(token ? 'checking' : route.query.pending === '1' ? 'pending' : route.query.resend === '1' ? 'resend' : 'invalid')
const feedback = ref('')
const statusMessage = computed(() => status.value === 'expired'
  ? 'Tautan ini sudah melewati masa berlaku. Kamu dapat meminta email verifikasi baru.'
  : status.value === 'error'
    ? 'Periksa koneksi internetmu lalu coba lagi, atau minta tautan verifikasi baru.'
    : 'Tautan ini tidak valid atau sudah pernah digunakan. Kamu dapat meminta tautan baru.')
const emailRule = (value) => {
  if (!value?.trim()) return 'Email wajib diisi.'
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) || 'Masukkan alamat email yang valid.'
}

onMounted(async () => {
  if (!token) return
  try {
    await verifyEmail(token)
    status.value = 'success'
    notify('Email berhasil diverifikasi.', 'success')
  } catch (error) {
    status.value = error.status === 400 && /expir/i.test(error.message)
      ? 'expired'
      : error.status === null || error.status >= 500
        ? 'error'
        : 'invalid'
  } finally {
    const query = emailFromQuery ? { email: emailFromQuery } : {}
    await router.replace({ path: route.path, query })
  }
})

async function resend(values) {
  feedback.value = ''
  try {
    feedback.value = await resendVerification(values.email.trim())
    notify(feedback.value, 'success')
  } catch (error) {
    feedback.value = error.message || 'Email verifikasi belum dapat dikirim. Silakan coba lagi.'
  }
}
</script>
