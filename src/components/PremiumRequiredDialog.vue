<script setup>
// Shown when a Free user opens Premium-only content. It only routes the user to
// the Subscription page; it never grants access. The backend stays the
// authority and answers 403 for locked content.
import { useRouter } from 'vue-router'

/**
 * @typedef {Object} PremiumRequiredDialogProps
 * @property {boolean} modelValue - Dialog visibility (v-model)
 * @property {string} [title]
 * @property {string} [message]
 */

/** @type {PremiumRequiredDialogProps} */
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: 'Konten ini khusus Premium' },
  message: {
    type: String,
    default: 'Upgrade ke Premium untuk membuka semua Materi, Latihan, dan Try Out, serta membaca pembahasan lengkap tiap soal.'
  }
})

/**
 * @typedef {Object} PremiumRequiredDialogEmits
 * @property {(value: boolean) => void} update:modelValue
 */
const emit = defineEmits(['update:modelValue'])
const router = useRouter()

function close() {
  emit('update:modelValue', false)
}

function goToSubscription() {
  close()
  router.push({ name: 'user-subscription' })
}
</script>

<template>
  <v-dialog :model-value="props.modelValue" max-width="460" @update:model-value="emit('update:modelValue', $event)">
    <v-card class="pa-3">
      <v-card-item>
        <template #prepend>
          <v-avatar color="premium" size="48">
            <v-icon icon="mdi-crown" color="navy" />
          </v-avatar>
        </template>
        <v-card-title class="text-title-large text-wrap">{{ props.title }}</v-card-title>
      </v-card-item>
      <v-card-text class="text-body-medium text-medium-emphasis">{{ props.message }}</v-card-text>
      <v-card-actions class="justify-end ga-2">
        <v-btn variant="text" @click="close">Nanti saja</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-crown" @click="goToSubscription">
          Lihat paket Premium
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
