<template>
  <section>
    <div class="page-eyebrow">AREA BELAJAR</div>
    <h1 class="page-title">Halo, {{ auth.user?.name || 'teman belajar' }} 👋</h1>
    <p class="page-lead">Fondasi ruang belajarmu siap. Fitur latihan dan materi akan hadir di tahap berikutnya.</p>
    <v-row class="mt-8">
      <v-col cols="12" md="7"><StatePanel title="Perjalanan belajarmu dimulai di sini" description="Saat fitur tersedia, materi dan latihan yang bisa kamu akses akan tampil di halaman ini." icon="mdi-book-open-variant" /></v-col>
      <v-col cols="12" md="5"><v-card class="welcome-card" variant="flat"><v-icon icon="mdi-lightbulb-on-outline" color="secondary" size="30" /><h2>Mulai dengan konsisten</h2><p>Luangkan waktu belajar secara rutin dan rayakan setiap kemajuan kecil.</p></v-card></v-col>
    </v-row>
  </section>
</template>

<script setup>
import { useAuthStore } from '../stores/auth'
import StatePanel from '../components/StatePanel.vue'
const auth = useAuthStore()
</script>
