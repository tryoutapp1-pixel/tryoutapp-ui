<template>
  <StatePanel title="Halaman tidak dapat diakses" description="Akunmu tidak memiliki peran yang diperlukan untuk membuka halaman ini." icon="mdi-lock-outline" action-label="Kembali ke halaman utama" @action="$router.replace({ name: 'landing' })" />
</template>

<script setup>
import StatePanel from '../components/StatePanel.vue'
</script>
