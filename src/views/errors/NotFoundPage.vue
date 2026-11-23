<script setup>
// 404 page. Rendered without a layout (catch-all route), so it provides its
// own v-app shell and a brand link back to the landing page.
import AppBrand from '../../components/AppBrand.vue'
</script>

<template>
  <v-app>
    <div class="d-flex flex-column flex-grow-1">
      <header class="app-content px-4 pt-6">
        <RouterLink to="/" class="d-inline-flex text-decoration-none" aria-label="Tryout App, halaman utama">
          <AppBrand />
        </RouterLink>
      </header>

      <main class="flex-grow-1 d-flex align-center justify-center px-4 py-12">
        <div class="text-center not-found__body">
          <!-- Decorative: the code written as filled answer bubbles. -->
          <div class="d-flex justify-center ga-3 mb-8" aria-hidden="true">
            <span class="app-bubble app-bubble--filled not-found__bubble">4</span>
            <span class="app-bubble not-found__bubble">0</span>
            <span class="app-bubble app-bubble--filled not-found__bubble">4</span>
          </div>
          <h1 class="text-headline-large mb-3">Halaman tidak ditemukan</h1>
          <p class="text-body-large text-medium-emphasis mb-8">
            Alamat yang kamu buka tidak ada atau sudah dipindahkan. Periksa lagi alamatnya, atau kembali ke halaman utama.
          </p>
          <v-btn to="/" color="primary" variant="flat" size="large">Kembali ke halaman utama</v-btn>
        </div>
      </main>
    </div>
  </v-app>
</template>

<style scoped>
.not-found__body {
  max-width: 34rem;
}

.not-found__bubble {
  --app-bubble-size: 64px;
  font-size: 1.5rem;
  font-weight: 760;
}
</style>
