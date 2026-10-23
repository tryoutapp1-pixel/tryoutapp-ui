<template>
  <section class="login-wrap">
    <v-card class="login-card" variant="flat">
      <div class="login-kicker">Mulai persiapanmu</div>
      <h1>Buat akun</h1>
      <p class="login-intro">Daftar untuk mengakses materi, latihan, dan Try Out yang tersedia.</p>
      <Form as="div" v-slot="{ handleSubmit, setErrors, isSubmitting, values }">
        <v-form @submit.prevent="handleSubmit($event, (values) => submit(values, setErrors))">
          <label class="field-label" for="name">Nama</label>
          <Field name="name" :rules="nameRule" v-slot="{ componentField, errorMessage }">
            <v-text-field id="name" v-bind="componentField" autocomplete="name" placeholder="Nama lengkap" :error-messages="errorMessage" aria-label="Nama" />
          </Field>
          <label class="field-label" for="signup-email">Email</label>
          <Field name="email" :rules="emailRule" v-slot="{ componentField, errorMessage }">
            <v-text-field id="signup-email" v-bind="componentField" type="email" autocomplete="email" placeholder="nama@email.com" :error-messages="errorMessage" aria-label="Email" />
          </Field>
          <label class="field-label" for="signup-password">Kata sandi</label>
          <Field name="password" :rules="passwordRule" v-slot="{ componentField, errorMessage }">
            <v-text-field id="signup-password" v-bind="componentField" type="password" autocomplete="new-password" placeholder="Minimal 8 karakter" :error-messages="errorMessage" aria-label="Kata sandi" />
          </Field>
          <label class="field-label" for="password-confirmation">Konfirmasi kata sandi</label>
          <Field name="passwordConfirmation" :rules="(value) => value === values.password || 'Konfirmasi kata sandi belum sama.'" v-slot="{ componentField, errorMessage }">
            <v-text-field id="password-confirmation" v-bind="componentField" type="password" autocomplete="new-password" placeholder="Ulangi kata sandi" :error-messages="errorMessage" aria-label="Konfirmasi kata sandi" />
          </Field>
          <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
          <v-btn type="submit" color="primary" size="large" block :loading="isSubmitting" :disabled="isSubmitting" class="login-submit">Daftar</v-btn>
        </v-form>
      </Form>
      <p class="login-footnote">Sudah punya akun? <RouterLink to="/login">Masuk</RouterLink></p>
    </v-card>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { Field, Form } from 'vee-validate'
import { RouterLink, useRouter } from 'vue-router'
import { signUp } from '../lib/authApi'

const router = useRouter()
const formError = ref('')
const nameRule = (value) => {
  if (!value?.trim()) return 'Nama wajib diisi.'
  return value.trim().length <= 100 || 'Nama maksimal 100 karakter.'
}
const emailRule = (value) => {
  if (!value?.trim()) return 'Email wajib diisi.'
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) || 'Masukkan alamat email yang valid.'
}
const passwordRule = (value) => {
  if (!value) return 'Kata sandi wajib diisi.'
  return value.length >= 8 || 'Kata sandi minimal 8 karakter.'
}

async function submit(values, setErrors) {
  formError.value = ''
  try {
    await signUp({ name: values.name.trim(), email: values.email.trim(), password: values.password })
    await router.replace({ name: 'verify-email', query: { pending: '1', email: values.email.trim() } })
  } catch (error) {
    if (error.validationErrors?.length) {
      const fields = Object.fromEntries(error.validationErrors.filter((item) => item.field).map((item) => [item.field, item.message]))
      setErrors(fields)
      if (Object.keys(fields).length) return
    }
    formError.value = error.message || 'Pendaftaran belum berhasil. Silakan coba lagi.'
  }
}
</script>
