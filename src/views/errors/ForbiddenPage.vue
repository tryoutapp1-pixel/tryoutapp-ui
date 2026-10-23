<script setup>
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../../stores/auth'
const authStore = useAuthStore()
const { homeRoute } = storeToRefs(authStore)
</script>

<template>
  <v-container class="py-16 text-center" style="max-width: 520px">
    <v-icon icon="mdi-lock-outline" color="error" size="64" class="mb-4" />
    <h1 class="text-h4 font-weight-bold mb-2">Access denied</h1>
    <p class="text-body-1 text-medium-emphasis mb-6">
      You don't have permission to view this page.
    </p>
    <v-btn :to="homeRoute" color="primary" variant="flat">Go to dashboard</v-btn>
  </v-container>
</template>
