<script setup>
// 403 page. The dashboard button goes to the home route for the current role.
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const { homeRoute } = storeToRefs(authStore)
</script>

<template>
  <div class="app-content px-4 pt-6 pt-md-16 pb-12 pb-md-16">
    <v-card class="status-card rounded-xl pa-8 pa-sm-12 mx-auto text-center">
      <v-avatar color="error" variant="tonal" size="64" class="mb-5">
        <v-icon icon="mdi-lock-outline" size="32" />
      </v-avatar>
      <h1 class="text-headline-medium mb-2">Akses ditolak</h1>
      <p class="text-body-large text-medium-emphasis mb-8">
        Akunmu tidak punya izin untuk membuka halaman ini.
      </p>
      <v-btn :to="homeRoute" :active="false" color="primary" variant="flat" size="large">Kembali ke halaman utama</v-btn>
    </v-card>
  </div>
</template>

<style scoped>
.status-card {
  width: 100%;
  max-width: 520px;
}
</style>
