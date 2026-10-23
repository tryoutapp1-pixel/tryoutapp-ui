<script setup>
// Public layout: top bar with brand + auth links, content outlet, footer.
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const { isAuthenticated, homeRoute } = storeToRefs(authStore)
</script>

<template>
  <v-app>
    <v-app-bar flat color="surface" border>
      <v-container class="d-flex align-center py-0">
        <RouterLink to="/" class="text-decoration-none d-flex align-center text-primary">
          <v-icon icon="mdi-school-outline" class="me-2" />
          <span class="text-h6 font-weight-bold">Tryout App</span>
        </RouterLink>
        <v-spacer />
        <template v-if="isAuthenticated">
          <v-btn :to="homeRoute" color="primary" variant="flat">Dashboard</v-btn>
        </template>
        <template v-else>
          <v-btn to="/login" variant="text">Login</v-btn>
          <v-btn to="/signup" color="primary" variant="flat" class="ms-2">Sign up</v-btn>
        </template>
      </v-container>
    </v-app-bar>

    <v-main>
      <RouterView />
    </v-main>

    <v-footer color="surface" border class="justify-center text-medium-emphasis">
      <span class="text-caption">&copy; {{ new Date().getFullYear() }} Tryout App</span>
    </v-footer>
  </v-app>
</template>
