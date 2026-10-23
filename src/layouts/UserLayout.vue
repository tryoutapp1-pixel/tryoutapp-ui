<template>
  <v-layout class="workspace-layout">
    <v-app-bar color="surface" elevation="0" class="app-bar">
      <v-container class="bar-content d-flex align-center">
        <RouterLink class="brand" to="/app"><span class="brand-mark">T</span><span>Tryout App</span></RouterLink>
        <v-spacer />
        <span class="user-greeting">{{ auth.user?.name }}</span>
        <v-btn variant="text" @click="signOut">Keluar</v-btn>
      </v-container>
    </v-app-bar>
    <v-main><v-container class="page-container"><RouterView /></v-container></v-main>
  </v-layout>
</template>

<script setup>
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
async function signOut() {
  await auth.logout()
  await router.replace({ name: 'landing' })
}
</script>
