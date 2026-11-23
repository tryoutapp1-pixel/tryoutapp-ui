<script setup>
// Login page (FUA1).
//
// CRITICAL: the form uses @submit.prevent and posts via the auth store action.
// No native browser submission, no GET form, so email/password never land in
// the URL. Credentials live in component-local state only until login returns.
import { ref } from 'vue'
import { useForm } from 'vee-validate'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useUiStore } from '../../stores/ui'
import { compose, required, email as emailRule } from '../../lib/validators'
import AppTextField from '../../components/form/AppTextField.vue'
import AppPasswordField from '../../components/form/AppPasswordField.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const uiStore = useUiStore()

const submitting = ref(false)
const formError = ref('')

const { handleSubmit } = useForm({
  initialValues: { email: '', password: '' }
})

/**
 * Accepts only an internal, rooted redirect target to prevent open redirects.
 * @param {unknown} target - Usually `route.query.redirect`
 * @returns {string|null} The target path, or null when it is unsafe
 */
function safeRedirect(target) {
  if (typeof target !== 'string') return null
  if (!target.startsWith('/') || target.startsWith('//') || target.includes('\\')) return null
  return target
}

const onSubmit = handleSubmit(async (values) => {
  formError.value = ''
  submitting.value = true
  try {
    const user = await authStore.login({ email: values.email, password: values.password })
    uiStore.success('Selamat datang kembali!')
    const redirect = safeRedirect(route.query.redirect)
    router.replace(redirect || (user.role === 'ADMIN' ? '/admin' : '/app'))
  } catch (error) {
    formError.value = error.message
  } finally {
    submitting.value = false
  }
})
</script>

<template>
  <div class="app-content px-4 pt-6 pt-md-16 pb-12 pb-md-16">
    <v-row justify="center" align="center">
      <!-- Short reminder of what the account opens; desktop only. -->
      <v-col cols="12" md="6" lg="5" class="d-none d-md-block pe-md-12">
        <p class="text-headline-large mb-8 auth-aside__title">Lanjutkan persiapanmu dari titik terakhir.</p>
        <ul class="auth-aside__list">
          <li class="d-flex align-center ga-4">
            <v-avatar color="surface-light" rounded="lg" size="44">
              <v-icon icon="mdi-book-open-page-variant-outline" color="primary" />
            </v-avatar>
            <span class="text-body-large">Materi per topik dan paket Latihan tanpa batas waktu</span>
          </li>
          <li class="d-flex align-center ga-4">
            <v-avatar color="surface-light" rounded="lg" size="44">
              <v-icon icon="mdi-timer-outline" color="primary" />
            </v-avatar>
            <span class="text-body-large">Try Out berwaktu seperti di hari ujian</span>
          </li>
          <li class="d-flex align-center ga-4">
            <v-avatar color="surface-light" rounded="lg" size="44">
              <v-icon icon="mdi-lightbulb-on-outline" color="primary" />
            </v-avatar>
            <span class="text-body-large">Pembahasan tiap soal setelah kamu selesai mengerjakan</span>
          </li>
        </ul>
      </v-col>

      <v-col cols="12" md="6" lg="5">
        <v-card class="auth-card rounded-xl pa-6 pa-sm-10 mx-auto">
          <h1 class="text-headline-medium mb-2">Masuk</h1>
          <p class="text-body-large text-medium-emphasis mb-8">Masuk ke akunmu untuk lanjut belajar.</p>

          <v-alert v-if="formError" type="error" variant="tonal" density="comfortable" class="mb-6">
            {{ formError }}
          </v-alert>

          <!-- @submit.prevent ensures no native GET/POST that would serialize creds into the URL -->
          <form novalidate @submit.prevent="onSubmit">
            <AppTextField
              name="email"
              label="Email"
              type="email"
              autocomplete="email"
              :rules="compose(required('Email'), emailRule)"
            />
            <AppPasswordField
              name="password"
              label="Kata sandi"
              autocomplete="current-password"
              :rules="required('Password')"
            />

            <div class="d-flex justify-end mb-6 text-body-medium">
              <RouterLink to="/forgot-password" class="app-link">
                Lupa kata sandi?
              </RouterLink>
            </div>

            <v-btn type="submit" color="primary" size="large" block :loading="submitting">
              Masuk
            </v-btn>
          </form>

          <p class="text-body-medium text-medium-emphasis text-center mt-8 mb-0">
            Belum punya akun?
            <RouterLink to="/signup" class="app-link">Daftar gratis</RouterLink>
          </p>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.auth-card {
  width: 100%;
  max-width: 460px;
}

.auth-aside__title {
  max-width: 18ch;
}

.auth-aside__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 20px;
  max-width: 40ch;
}
</style>
