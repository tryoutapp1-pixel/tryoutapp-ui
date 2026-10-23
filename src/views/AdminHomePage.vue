<template>
  <section>
    <div class="page-eyebrow">RUANG ADMIN</div>
    <h1 class="page-title">Selamat datang, {{ auth.user?.name || 'Admin' }}</h1>
    <p class="page-lead">Dasar pengelolaan Tryout App siap. Alat pengelolaan konten akan ditambahkan pada tahap berikutnya.</p>
    <div class="mt-8"><StatePanel title="Belum ada alat pengelolaan" description="Manajemen pengguna, materi, dan assessment akan tersedia di sini." icon="mdi-view-dashboard-outline" /></div>
  </section>
</template>

<script setup>
import { useAuthStore } from '../stores/auth'
import StatePanel from '../components/StatePanel.vue'
const auth = useAuthStore()
</script>
