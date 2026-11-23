<script setup>
// Public layout: floating pill top bar with brand + auth links, content
// outlet, footer. On the landing page the bar also links to page sections.
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import AppBrand from '../components/AppBrand.vue'

const authStore = useAuthStore()
const { isAuthenticated, homeRoute } = storeToRefs(authStore)
const route = useRoute()

/** Section links shown only on the landing page (scroll, no navigation). */
const sections = [
  { id: 'fitur', label: 'Fitur' },
  { id: 'alur', label: 'Alur belajar' },
  { id: 'premium', label: 'Premium' }
]
const onLanding = computed(() => route.name === 'landing')

/** @param {string} id */
function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <v-app>
    <v-app-bar color="background" height="84">
      <div class="app-content px-3 px-sm-4">
        <div class="public-bar d-flex align-center ga-2 bg-surface rounded-pill ps-3 pe-2 ps-sm-5 py-2">
          <RouterLink to="/" class="text-decoration-none" aria-label="Tryout App, halaman utama">
            <AppBrand />
          </RouterLink>

          <v-spacer />
          <nav v-if="onLanding" class="d-none d-md-flex align-center ga-1" aria-label="Bagian halaman">
            <v-btn
              v-for="s in sections"
              :key="s.id"
              variant="text"
              class="text-title-small"
              @click="scrollToSection(s.id)"
            >
              {{ s.label }}
            </v-btn>
          </nav>
          <v-spacer />

          <template v-if="isAuthenticated">
            <v-btn :to="homeRoute" :active="false" color="primary" variant="flat">Buka dasbor</v-btn>
          </template>
          <template v-else>
            <v-btn to="/login" :active="false" variant="text">Masuk</v-btn>
            <v-btn to="/signup" :active="false" color="primary" variant="flat">Daftar</v-btn>
          </template>
        </div>
      </div>
    </v-app-bar>

    <v-main>
      <RouterView />
    </v-main>

    <v-footer color="transparent" class="py-8">
      <div class="app-content px-4 d-flex flex-column flex-sm-row align-sm-center justify-space-between ga-3">
        <AppBrand />
        <p class="text-body-small text-medium-emphasis mb-0">
          &copy; {{ new Date().getFullYear() }} Tryout App. Latihan soal dan Try Out untuk persiapan tes seleksi.
        </p>
      </div>
    </v-footer>
  </v-app>
</template>

<style scoped>
.public-bar {
  min-height: 60px;
  border: 1px solid rgb(var(--app-line));
  box-shadow: var(--app-shadow-card);
}
</style>
