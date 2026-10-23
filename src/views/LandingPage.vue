<script setup>
// Public landing page (FUA4).
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const { isAuthenticated, homeRoute } = storeToRefs(authStore)
</script>

<template>
  <v-container class="py-16">
    <v-row align="center" justify="center">
      <v-col cols="12" md="7">
        <h1 class="text-h3 font-weight-bold mb-4">
          Practice smarter for your Tryout.
        </h1>
        <p class="text-body-1 text-medium-emphasis mb-8">
          Work through Latihan and timed Try Out assessments, review explanations,
          and track your progress. Go Premium to unlock the full material library.
        </p>
        <div class="d-flex flex-wrap ga-3">
          <template v-if="isAuthenticated">
            <v-btn :to="homeRoute" color="primary" size="large" variant="flat">
              Go to dashboard
            </v-btn>
          </template>
          <template v-else>
            <v-btn to="/signup" color="primary" size="large" variant="flat">
              Get started
            </v-btn>
            <v-btn to="/login" size="large" variant="tonal">I already have an account</v-btn>
          </template>
        </div>
      </v-col>
      <v-col cols="12" md="5" class="d-none d-md-flex justify-center">
        <v-icon icon="mdi-school-outline" size="220" color="primary" class="opacity-50" />
      </v-col>
    </v-row>
  </v-container>
</template>
