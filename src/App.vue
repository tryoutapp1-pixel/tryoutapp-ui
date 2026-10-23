<template>
  <v-app>
    <RouterView />
    <v-snackbar v-model="notice.open" :color="notice.color" timeout="4000" role="status">
      {{ notice.message }}
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { reactive, onMounted, onUnmounted } from 'vue'
import { RouterView } from 'vue-router'

const notice = reactive({ open: false, color: 'success', message: '' })
function showNotice(event) {
  notice.message = event.detail?.message || 'Terjadi kesalahan. Silakan coba lagi.'
  notice.color = event.detail?.color || 'error'
  notice.open = true
}
onMounted(() => window.addEventListener('app:notice', showNotice))
onUnmounted(() => window.removeEventListener('app:notice', showNotice))
</script>
