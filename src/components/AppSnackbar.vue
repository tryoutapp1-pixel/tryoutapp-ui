<script setup>
// Global snackbar bound to the UI store. Mount once in the root layout chain.
import { storeToRefs } from 'pinia'
import { useUiStore } from '../stores/ui'

const uiStore = useUiStore()
const { snackbar } = storeToRefs(uiStore)
</script>

<template>
  <v-snackbar
    v-model="snackbar.show"
    :color="snackbar.color"
    :timeout="snackbar.timeout"
    location="top right"
  >
    {{ snackbar.message }}
    <template #actions>
      <v-btn variant="text" @click="uiStore.dismiss()">Tutup</v-btn>
    </template>
  </v-snackbar>
</template>
