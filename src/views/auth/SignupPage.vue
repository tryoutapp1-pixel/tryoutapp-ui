<script setup>
// Signup page (FU1).
//
// Signup does NOT authenticate. The backend creates a PENDING_VERIFICATION
// account and emails a verification link. If the request fails, the safe form
// values (name, email) are kept so the user can retry; the password is cleared
// and never persisted. @submit.prevent keeps credentials out of the URL.
import { ref } from 'vue'
import { useForm } from 'vee-validate'
import authService from '../../services/authService'
import { compose, required, email as emailRule, password as passwordRule, maxLength } from '../../lib/validators'
import AppTextField from '../../components/form/AppTextField.vue'
import AppPasswordField from '../../components/form/AppPasswordField.vue'

const submitting = ref(false)
const formError = ref('')
const done = ref(false)
const submittedEmail = ref('')
/** @type {import('vue').Ref<import('../../lib/apiError').FieldErrors>} */
const fieldErrors = ref({})

const { handleSubmit, resetField } = useForm({
  initialValues: { name: '', email: '', password: '' }
})

const onSubmit = handleSubmit(async (values) => {
  formError.value = ''
  fieldErrors.value = {}
  submitting.value = true
  try {
    await authService.signup({
      name: values.name,
      email: values.email,
      password: values.password
    })
    submittedEmail.value = values.email
    done.value = true
  } catch (error) {
    formError.value = error.message
    fieldErrors.value = error.fieldErrors || {}
    // Keep name/email; only clear the password for safety.
    resetField('password', { value: '' })
  } finally {
    submitting.value = false
  }
})
</script>

<template>
  <div class="app-content px-4 pt-6 pt-md-16 pb-12 pb-md-16">
    <v-row justify="center" align="center">
      <!-- What a new account opens; only features that exist. Desktop only. -->
      <v-col cols="12" md="6" lg="5" class="d-none d-md-block pe-md-12">
        <p class="text-headline-large mb-8 auth-aside__title">Belajar dan berlatih dari satu akun.</p>
        <ul class="auth-aside__list">
          <li class="d-flex align-center ga-4">
            <v-avatar color="surface-light" rounded="lg" size="44">
              <v-icon icon="mdi-book-open-page-variant-outline" color="primary" />
            </v-avatar>
            <span class="text-body-large">Baca Materi lalu kerjakan Latihan untuk tiap topik</span>
          </li>
          <li class="d-flex align-center ga-4">
            <v-avatar color="surface-light" rounded="lg" size="44">
              <v-icon icon="mdi-timer-outline" color="primary" />
            </v-avatar>
            <span class="text-body-large">Uji kesiapanmu dengan Try Out berwaktu</span>
          </li>
          <li class="d-flex align-center ga-4">
            <v-avatar color="surface-light" rounded="lg" size="44">
              <v-icon icon="mdi-chart-line" color="primary" />
            </v-avatar>
            <span class="text-body-large">Pantau skor Try Out di Progres Saya dengan Premium</span>
          </li>
        </ul>
      </v-col>

      <v-col cols="12" md="6" lg="5">
        <v-card class="auth-card rounded-xl pa-6 pa-sm-10 mx-auto">
          <template v-if="done">
            <div class="text-center">
              <v-avatar color="success" variant="tonal" size="64" class="mb-5">
                <v-icon icon="mdi-email-check-outline" size="32" />
              </v-avatar>
              <h1 class="text-headline-medium mb-2">Cek email kamu</h1>
              <p class="text-body-large text-medium-emphasis mb-8 auth-break">
                Kami sudah mengirim tautan verifikasi ke <strong>{{ submittedEmail }}</strong>.
                Verifikasi akunmu, lalu masuk.
              </p>
              <v-btn to="/login" color="primary" variant="flat" size="large" block>Ke halaman masuk</v-btn>
              <v-btn to="/verify-email" variant="text" color="primary" block class="mt-3">Kirim ulang email verifikasi</v-btn>
            </div>
          </template>

          <template v-else>
            <h1 class="text-headline-medium mb-2">Daftar</h1>
            <p class="text-body-large text-medium-emphasis mb-8">Buat akun Gratis dan mulai berlatih.</p>

            <v-alert v-if="formError" type="error" variant="tonal" density="comfortable" class="mb-6">
              {{ formError }}
            </v-alert>

            <form novalidate @submit.prevent="onSubmit">
              <AppTextField
                name="name"
                label="Nama"
                autocomplete="name"
                :rules="compose(required('Name'), maxLength(100, 'Name'))"
                :server-error="fieldErrors.name"
              />
              <AppTextField
                name="email"
                label="Email"
                type="email"
                autocomplete="email"
                :rules="compose(required('Email'), emailRule)"
                :server-error="fieldErrors.email"
              />
              <AppPasswordField
                name="password"
                label="Kata sandi"
                autocomplete="new-password"
                :rules="compose(required('Password'), passwordRule)"
                :server-error="fieldErrors.password"
              />

              <v-btn type="submit" color="primary" size="large" block :loading="submitting" class="mt-2">
                Buat akun
              </v-btn>
            </form>

            <p class="text-body-medium text-medium-emphasis text-center mt-8 mb-0">
              Sudah punya akun?
              <RouterLink to="/login" class="app-link">Masuk</RouterLink>
            </p>
          </template>
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

.auth-break {
  overflow-wrap: anywhere;
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
