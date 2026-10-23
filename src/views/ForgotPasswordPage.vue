<template>
  <section class="login-wrap">
    <v-card class="login-card" variant="flat">
      <div class="login-kicker">Bantuan akun</div>
      <h1>Lupa kata sandi?</h1>
      <p class="login-intro">Masukkan email akunmu. Jika akun aktif ditemukan, instruksi reset akan dikirim.</p>
      <p v-if="sentMessage" class="feedback-message" role="status">{{ sentMessage }}</p>
      <Form as="div" v-slot="{ handleSubmit, isSubmitting }">
        <v-form @submit.prevent="handleSubmit(submit)">
          <label class="field-label" for="forgot-email">Email</label>
          <Field name="email" :rules="emailRule" v-slot="{ componentField, errorMessage }">
            <v-text-field id="forgot-email" v-bind="componentField" type="email" autocomplete="email" placeholder="nama@email.com" :error-messages="errorMessage" aria-label="Email" />
          </Field>
          <v-btn type="submit" color="primary" size="large" block :loading="isSubmitting" :disabled="isSubmitting" class="login-submit">Kirim instruksi reset</v-btn>
        </v-form>
      </Form>
      <p class="login-footnote"><RouterLink to="/login">Kembali ke masuk</RouterLink></p>
    </v-card>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { Field, Form } from 'vee-validate'
import { RouterLink } from 'vue-router'
import { requestPasswordReset } from '../lib/authApi'
import { notify } from '../lib/apiError'

const sentMessage = ref('')
const emailRule = (value) => {
  if (!value?.trim()) return 'Email wajib diisi.'
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) || 'Masukkan alamat email yang valid.'
}

async function submit(values) {
  sentMessage.value = ''
  try {
    sentMessage.value = await requestPasswordReset(values.email.trim())
    notify(sentMessage.value, 'success')
  } catch (error) {
    sentMessage.value = error.message || 'Permintaan belum dapat diproses. Silakan coba lagi.'
  }
}
</script>
