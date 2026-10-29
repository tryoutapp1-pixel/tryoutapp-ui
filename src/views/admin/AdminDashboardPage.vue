<script setup>
// Admin dashboard: entry points to the admin modules.
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../../stores/auth'
import PageHeader from '../../components/PageHeader.vue'

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const cards = [
  { title: 'Users', text: 'Browse registered accounts.', to: '/admin/users', icon: 'mdi-account-group-outline' },
  { title: 'Images', text: 'Upload and manage image files.', to: '/admin/images', icon: 'mdi-image-multiple-outline' },
  { title: 'Materials', text: 'Manage and release learning materials.', to: '/admin/materials', icon: 'mdi-book-open-page-variant-outline' },
  { title: 'Assessments', text: 'Create assessments and upload questions.', to: '/admin/assessments', icon: 'mdi-clipboard-text-outline' }
]
</script>

<template>
  <div>
    <PageHeader :title="`Welcome, ${user ? user.name : 'Admin'}`" subtitle="Administration dashboard." />
    <v-row>
      <v-col v-for="card in cards" :key="card.to" cols="12" sm="6" md="3">
        <v-card :to="card.to" class="pa-5 h-100" hover>
          <v-icon :icon="card.icon" color="primary" size="32" class="mb-3" />
          <h3 class="text-subtitle-1 font-weight-bold mb-1">{{ card.title }}</h3>
          <p class="text-body-2 text-medium-emphasis mb-0">{{ card.text }}</p>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
