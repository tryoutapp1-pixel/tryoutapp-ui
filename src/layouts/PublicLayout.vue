<template>
  <div class="public-layout">
    <header class="public-header">
      <RouterLink class="brand" to="/" aria-label="Tryout App beranda">
        <span class="brand-mark">T</span><span>tryout<span class="brand-accent">app</span></span>
      </RouterLink>
      <div v-if="!auth.isAuthenticated" class="public-nav-actions">
        <v-btn to="/login" variant="text">Masuk</v-btn>
        <v-btn to="/signup" color="primary" variant="flat">Daftar</v-btn>
      </div>
      <v-btn v-else :to="homeTarget" color="primary" variant="flat">Dashboard</v-btn>
    </header>
    <main class="public-main"><RouterView /></main>
    <footer class="site-footer">Belajar terarah, melangkah lebih percaya diri.</footer>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const homeTarget = computed(() => auth.user?.role === 'ADMIN' ? '/admin' : '/app')
</script>
