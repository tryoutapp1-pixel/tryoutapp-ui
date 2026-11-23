<script setup>
// Honest placeholder for learner feature areas not yet implemented in this
// stage (materials, latihan, tryout, subscription, transactions). These are
// intentionally not wired to the API yet; see the project report for the
// incremental plan. This avoids faking "done" features with mock data.
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import PageHeader from '../../components/PageHeader.vue'

const route = useRoute()
const title = computed(() => route.meta.title || 'Segera hadir')
</script>

<template>
  <div>
    <PageHeader :title="title" subtitle="Fitur ini direncanakan untuk tahap berikutnya." />
    <v-card variant="flat" class="d-flex flex-column align-center pa-8 pa-md-12 text-center">
      <v-avatar color="surface-light" size="64" class="mb-5">
        <v-icon icon="mdi-progress-wrench" color="primary" size="32" />
      </v-avatar>
      <p class="text-title-medium mb-2">Halaman ini sedang disiapkan</p>
      <p class="text-body-large text-medium-emphasis mb-0 coming-soon__text">
        Layanan untuk bagian ini sudah tersedia di server. Tampilannya akan dibuat
        pada tahap berikutnya, setelah fitur Masuk dan Profil selesai diuji.
      </p>
    </v-card>
  </div>
</template>

<style scoped>
.coming-soon__text {
  max-width: 52ch;
}
</style>
