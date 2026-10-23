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

// Only accept an internal, rooted redirect target to avoid open-redirect abuse.
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
    uiStore.success('Welcome back!')
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
  <v-container class="py-12" style="max-width: 460px">
    <v-card class="pa-6">
      <h1 class="text-h5 font-weight-bold mb-1">Log in</h1>
      <p class="text-body-2 text-medium-emphasis mb-6">Access your Tryout App account.</p>

      <v-alert v-if="formError" type="error" variant="tonal" density="comfortable" class="mb-4">
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
          label="Password"
          autocomplete="current-password"
          :rules="required('Password')"
        />

        <div class="d-flex justify-end mb-4">
          <RouterLink to="/forgot-password" class="text-body-2 text-primary text-decoration-none">
            Forgot password?
          </RouterLink>
        </div>

        <v-btn type="submit" color="primary" size="large" block :loading="submitting">
          Log in
        </v-btn>
      </form>

      <v-divider class="my-5" />
      <p class="text-body-2 text-center mb-0">
        Don't have an account?
        <RouterLink to="/signup" class="text-primary text-decoration-none">Sign up</RouterLink>
      </p>
    </v-card>
  </v-container>
</template>
