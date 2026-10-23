<script setup>
// Admin dashboard placeholder. Admin feature screens are out of scope for this
// stage; the shell + routing + guards are in place so ADMIN login lands here.
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../../stores/auth'
import PageHeader from '../../components/PageHeader.vue'

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
</script>

<template>
  <div>
    <PageHeader :title="`Welcome, ${user ? user.name : 'Admin'}`" subtitle="Administration dashboard." />
    <v-card class="pa-10 text-center text-medium-emphasis">
      <v-icon icon="mdi-shield-account-outline" size="48" class="mb-3" />
      <p class="text-body-1 mb-0">
        Admin feature screens (users, files, materials, assessments) are planned
        for a later stage. Profile and account settings are available from the
        account menu.
      </p>
    </v-card>
  </div>
</template>
