<script setup>
// Root component. The matched layout renders via <RouterView> (each top-level
// route provides its layout), and the global snackbar is mounted once here.
import AppSnackbar from './components/AppSnackbar.vue'
</script>

<template>
  <RouterView />
  <AppSnackbar />
</template>
