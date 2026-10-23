<template>
  <StatePanel title="Halaman tidak ditemukan" description="Alamat yang kamu buka mungkin sudah berubah atau tidak tersedia." icon="mdi-map-marker-question-outline" action-label="Kembali ke beranda" @action="$router.replace({ name: 'landing' })" />
</template>

<script setup>
import StatePanel from '../components/StatePanel.vue'
</script>
