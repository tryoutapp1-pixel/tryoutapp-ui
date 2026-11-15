<script setup>
// Reset password page (FUA3, reset step).
//
// The reset email links to {FRONTEND_URL}/reset-password?token=...
// The token is a required integration callback: it is read from the query,
// used only for this request, and never written to browser storage. The new
// password is posted through the API (@submit.prevent) and never enters the URL.
import { ref, onMounted } from 'vue'
import { useForm } from 'vee-validate'
import { useRoute, useRouter } from 'vue-router'
import authService from '../../services/authService'
import { useUiStore } from '../../stores/ui'
import { compose, required, password as passwordRule, matches } from '../../lib/validators'
import AppPasswordField from '../../components/form/AppPasswordField.vue'

const route = useRoute()
const router = useRouter()
const uiStore = useUiStore()

const token = ref('')
const missingToken = ref(false)
const submitting = ref(false)
const formError = ref('')

const { handleSubmit, values } = useForm({
  initialValues: { newPassword: '', confirmPassword: '' }
})

onMounted(() => {
  const t = route.query.token
  if (typeof t === 'string' && t) token.value = t
  else missingToken.value = true
})

const onSubmit = handleSubmit(async (formValues) => {
  formError.value = ''
  submitting.value = true
  try {
    await authService.resetPassword({ token: token.value, newPassword: formValues.newPassword })
    uiStore.success('Kata sandi berhasil diganti. Silakan masuk dengan kata sandi baru.')
    router.replace('/login')
  } catch (error) {
    // Backend returns 400 for invalid / used / expired tokens.
    formError.value = error.message
  } finally {
    submitting.value = false
  }
})
</script>

<template>
  <div class="app-content px-4 pt-6 pt-md-16 pb-12 pb-md-16">
    <v-card class="auth-card rounded-xl pa-6 pa-sm-10 mx-auto">
      <h1 class="text-headline-medium mb-2">Buat kata sandi baru</h1>
      <p class="text-body-large text-medium-emphasis mb-8">Pilih kata sandi baru untuk akunmu.</p>

      <v-alert v-if="missingToken" type="warning" variant="tonal" density="comfortable" class="mb-6">
        Tautan ini tidak lengkap. Minta tautan baru di halaman
        <RouterLink to="/forgot-password" class="app-link">lupa kata sandi</RouterLink>.
      </v-alert>

      <v-alert v-else-if="formError" type="error" variant="tonal" density="comfortable" class="mb-6">
        {{ formError }}
      </v-alert>

      <form v-if="!missingToken" novalidate @submit.prevent="onSubmit">
        <AppPasswordField
          name="newPassword"
          label="Kata sandi baru"
          autocomplete="new-password"
          :rules="compose(required('New password'), passwordRule)"
        />
        <AppPasswordField
          name="confirmPassword"
          label="Ulangi kata sandi baru"
          autocomplete="new-password"
          :rules="compose(required('Confirm password'), matches(() => values.newPassword, 'Passwords do not match'))"
        />
        <v-btn type="submit" color="primary" size="large" block :loading="submitting" class="mt-2">
          Simpan kata sandi baru
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
