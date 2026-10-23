<template>
  <section class="login-wrap">
    <v-card class="login-card" variant="flat">
      <div class="login-kicker">Selamat datang kembali</div>
      <h1>Masuk ke akunmu</h1>
      <p class="login-intro">Lanjutkan persiapan belajarmu hari ini.</p>
      <div class="login-links">
        <RouterLink to="/forgot-password">Lupa kata sandi?</RouterLink>
        <RouterLink to="/verify-email?resend=1">Belum menerima email verifikasi?</RouterLink>
      </div>
      <Form as="div" v-slot="{ handleSubmit, setErrors }">
        <v-form @submit.prevent="handleSubmit($event, (values) => submit(values, setErrors))">
        <label class="field-label" for="email">Email</label>
        <Field name="email" :rules="emailRule" v-slot="{ componentField, errorMessage }">
          <v-text-field id="email" v-bind="componentField" type="email" autocomplete="email" placeholder="nama@email.com" :error-messages="errorMessage" aria-label="Email" />
        </Field>
        <label class="field-label" for="password">Kata sandi</label>
        <Field name="password" :rules="requiredRule" v-slot="{ componentField, errorMessage }">
          <v-text-field id="password" v-bind="componentField" type="password" autocomplete="current-password" placeholder="Masukkan kata sandi" :error-messages="errorMessage" aria-label="Kata sandi" />
        </Field>
        <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
        <v-btn type="submit" color="primary" size="large" block :loading="auth.loading" :disabled="auth.loading" class="login-submit">Masuk</v-btn>
        </v-form>
      </Form>
      <p class="login-footnote">Akun harus sudah terverifikasi untuk dapat masuk.</p>
    </v-card>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { Field, Form } from 'vee-validate'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { safeInternalPath } from '../lib/navigation'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const formError = ref('')
const requiredRule = (value) => value ? true : 'Kolom ini wajib diisi.'
const emailRule = (value) => {
  if (!value) return 'Email wajib diisi.'
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Masukkan alamat email yang valid.'
}

async function submit(values, setErrors) {
  formError.value = ''
  try {
    const user = await auth.login({ email: values.email.trim(), password: values.password })
    const redirect = safeInternalPath(route.query.redirect)
    if (redirect && redirect !== '/login' && redirect !== '/forbidden') {
      await router.replace(redirect)
    } else {
      await router.replace(user.role === 'ADMIN' ? { name: 'admin-home' } : { name: 'user-home' })
    }
  } catch (error) {
    if (error.validationErrors?.length) {
      setErrors(Object.fromEntries(error.validationErrors.filter((item) => item.field).map((item) => [item.field, item.message])))
    }
    formError.value = error.status === 401
      ? 'Email atau kata sandi tidak sesuai, atau akun belum aktif. Jika akunmu belum diverifikasi, gunakan tautan verifikasi.'
      : error.message || 'Tidak dapat masuk. Periksa kembali informasi akunmu.'
  }
}
</script>
