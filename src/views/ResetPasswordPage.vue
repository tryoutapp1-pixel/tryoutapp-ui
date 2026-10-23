<template>
  <section class="login-wrap">
    <v-card class="login-card" variant="flat">
      <template v-if="completed">
        <div class="auth-status-icon success-icon"><v-icon icon="mdi-check-circle-outline" size="34" /></div>
        <div class="login-kicker">Kata sandi diperbarui</div>
        <h1>Reset berhasil</h1>
        <p class="login-intro">Kamu sekarang dapat masuk menggunakan kata sandi barumu.</p>
        <v-btn color="primary" to="/login" block class="login-submit">Lanjut ke masuk</v-btn>
      </template>
      <template v-else-if="!token || tokenError">
        <div class="auth-status-icon error-icon"><v-icon icon="mdi-alert-circle-outline" size="34" /></div>
        <div class="login-kicker">Tautan reset</div>
        <h1>{{ tokenExpired ? 'Tautan sudah kedaluwarsa' : 'Tautan tidak valid' }}</h1>
        <p class="login-intro">{{ tokenExpired ? 'Minta instruksi reset kata sandi yang baru.' : 'Tautan reset tidak tersedia atau sudah tidak dapat digunakan.' }}</p>
        <v-btn color="primary" to="/forgot-password" block class="login-submit">Minta tautan baru</v-btn>
      </template>
      <template v-else>
        <div class="login-kicker">Buat kata sandi baru</div>
        <h1>Atur ulang kata sandi</h1>
        <p class="login-intro">Gunakan kata sandi baru dengan minimal 8 karakter.</p>
        <Form as="div" v-slot="{ handleSubmit, setErrors, isSubmitting, values }">
          <v-form @submit.prevent="handleSubmit((formValues) => submit(formValues, setErrors))">
            <label class="field-label" for="new-password">Kata sandi baru</label>
            <Field name="newPassword" :rules="passwordRule" v-slot="{ componentField, errorMessage }">
              <v-text-field id="new-password" v-bind="componentField" type="password" autocomplete="new-password" placeholder="Minimal 8 karakter" :error-messages="errorMessage" aria-label="Kata sandi baru" />
            </Field>
            <label class="field-label" for="confirm-new-password">Konfirmasi kata sandi baru</label>
            <Field name="confirmation" :rules="(value) => value === values.newPassword || 'Konfirmasi kata sandi belum sama.'" v-slot="{ componentField, errorMessage }">
              <v-text-field id="confirm-new-password" v-bind="componentField" type="password" autocomplete="new-password" placeholder="Ulangi kata sandi baru" :error-messages="errorMessage" aria-label="Konfirmasi kata sandi baru" />
            </Field>
            <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
            <v-btn type="submit" color="primary" size="large" block :loading="isSubmitting" :disabled="isSubmitting" class="login-submit">Simpan kata sandi baru</v-btn>
          </v-form>
        </Form>
      </template>
      <p v-if="!completed" class="login-footnote"><RouterLink to="/login">Kembali ke masuk</RouterLink></p>
    </v-card>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { Field, Form } from 'vee-validate'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { resetPassword as sendPasswordReset } from '../lib/authApi'
import { notify } from '../lib/apiError'

const route = useRoute()
const router = useRouter()
const token = typeof route.query.token === 'string' ? route.query.token : ''
const tokenError = ref(false)
const tokenExpired = ref(false)
const completed = ref(false)
const formError = ref('')
const passwordRule = (value) => {
  if (!value) return 'Kata sandi wajib diisi.'
  return value.length >= 8 || 'Kata sandi minimal 8 karakter.'
}

async function submit(values, setErrors) {
  formError.value = ''
  try {
    await sendPasswordReset(token, values.newPassword)
    completed.value = true
    await router.replace({ name: 'reset-password' })
    notify('Kata sandi berhasil diperbarui.', 'success')
  } catch (error) {
    if (error.status === 400) {
      tokenError.value = true
      tokenExpired.value = /expired/i.test(error.message)
      await router.replace({ name: 'reset-password' })
      return
    }
    if (error.validationErrors?.length) {
      setErrors(Object.fromEntries(error.validationErrors.filter((item) => item.field).map((item) => [item.field, item.message])))
    }
    formError.value = error.message || 'Kata sandi belum berhasil diperbarui. Silakan coba lagi.'
  }
}
</script>
