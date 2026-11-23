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
      'Jika ada akun aktif dengan email ini, tautan untuk membuat kata sandi baru sudah dikirim.'
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
  <div class="app-content px-4 pt-6 pt-md-16 pb-12 pb-md-16">
    <v-card class="auth-card rounded-xl pa-6 pa-sm-10 mx-auto">
      <h1 class="text-headline-medium mb-2">Lupa kata sandi</h1>
      <p class="text-body-large text-medium-emphasis mb-8">
        Kami akan mengirim tautan untuk membuat kata sandi baru ke email kamu.
      </p>

      <v-alert v-if="sent" type="info" variant="tonal" density="comfortable" class="mb-6">
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
        <v-btn type="submit" color="primary" size="large" block :loading="submitting" class="mt-2">
          Kirim tautan
        </v-btn>
      </form>

      <p class="text-body-medium text-center mt-8 mb-0">
        <RouterLink to="/login" class="app-link">Kembali ke halaman masuk</RouterLink>
      </p>
    </v-card>
  </div>
</template>

<style scoped>
.auth-card {
  width: 100%;
  max-width: 460px;
}
</style>
