<template>
  <v-card class="state-panel" variant="flat">
    <v-progress-circular v-if="loading" indeterminate color="primary" aria-label="Memuat" />
    <template v-else>
      <v-icon v-if="icon" :icon="icon" size="32" color="primary" aria-hidden="true" />
      <h2>{{ title }}</h2>
      <p>{{ description }}</p>
      <v-btn v-if="actionLabel" color="primary" variant="tonal" @click="$emit('action')">{{ actionLabel }}</v-btn>
    </template>
  </v-card>
</template>

<script setup>
defineProps({
  title: { type: String, default: 'Belum ada data' },
  description: { type: String, default: 'Informasi akan tampil di sini.' },
  icon: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  actionLabel: { type: String, default: '' },
})
defineEmits(['action'])
</script>
