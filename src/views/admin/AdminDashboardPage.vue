<script setup>
// Admin dashboard: entry points to the admin modules.
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../../stores/auth'
import PageHeader from '../../components/PageHeader.vue'

/**
 * @typedef {Object} DashboardCard
 * @property {string} title
 * @property {string} text
 * @property {string} to
 * @property {string} icon
 */

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

/** @type {DashboardCard[]} */
const cards = [
  { title: 'Pengguna', text: 'Lihat akun terdaftar dan statusnya.', to: '/admin/users', icon: 'mdi-account-group-outline' },
  { title: 'Gambar', text: 'Unggah dan kelola file gambar.', to: '/admin/images', icon: 'mdi-image-multiple-outline' },
  { title: 'Materi', text: 'Kelola dan terbitkan materi belajar.', to: '/admin/materials', icon: 'mdi-book-open-page-variant-outline' },
  { title: 'Paket soal', text: 'Buat paket soal dan unggah soalnya.', to: '/admin/assessments', icon: 'mdi-clipboard-text-outline' },
  { title: 'Masukan', text: 'Baca rating dan komentar dari pengguna.', to: '/admin/feedback', icon: 'mdi-message-star-outline' }
]
</script>

<template>
  <div>
    <PageHeader
      :title="`Halo, ${user ? user.name : 'Admin'}`"
      subtitle="Kelola pengguna, konten belajar, dan masukan dari satu tempat."
    />
    <v-row>
      <!-- Paket soal is the most used module, so its tile is wider and raised;
           the other tiles stay flat. -->
      <v-col
        v-for="card in cards"
        :key="card.to"
        cols="12"
        sm="6"
        :md="card.to === '/admin/assessments' ? 8 : 4"
      >
        <v-card
          :to="card.to"
          :variant="card.to === '/admin/assessments' ? 'elevated' : 'flat'"
          class="d-flex align-center ga-4 pa-5 h-100"
          hover
        >
          <v-avatar
            :color="card.to === '/admin/assessments' ? 'primary' : 'surface-light'"
            rounded="lg"
            :size="card.to === '/admin/assessments' ? 52 : 44"
          >
            <v-icon
              :icon="card.icon"
              :color="card.to === '/admin/assessments' ? undefined : 'primary'"
              :size="card.to === '/admin/assessments' ? 28 : 24"
            />
          </v-avatar>
          <div class="flex-grow-1 dashboard-tile__text">
            <h2
              :class="card.to === '/admin/assessments' ? 'text-title-large' : 'text-title-medium'"
              class="mb-1"
            >
              {{ card.title }}
            </h2>
            <p class="text-body-medium text-medium-emphasis mb-0">{{ card.text }}</p>
          </div>
          <v-icon icon="mdi-chevron-right" class="text-medium-emphasis" aria-hidden="true" />
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.dashboard-tile__text {
  min-width: 0;
}
</style>
