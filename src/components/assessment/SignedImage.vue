<script setup>
// Renders an image from a short-lived (~60s) signed URL. If the image fails to
// load (commonly an expired signed URL), it shows a lightweight "reload" action
// and asks the parent to refetch the owning resource for a fresh URL rather
// than reusing the stale one.
import { ref, watch } from 'vue'

/**
 * @typedef {Object} SignedImageProps
 * @property {string} [src] - Signed image URL
 * @property {string} [alt]
 * @property {number|string} [maxHeight]
 */

/** @type {SignedImageProps} */
const props = defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
  maxHeight: { type: [Number, String], default: 320 }
})

/**
 * @typedef {Object} SignedImageEmits
 * @property {() => void} refresh - The image failed to load; the parent should refetch a fresh URL
 */
const emit = defineEmits(['refresh'])

const failed = ref(false)

watch(
  () => props.src,
  () => {
    failed.value = false
  }
)
</script>

<template>
  <div class="signed-image">
    <v-img
      v-if="src && !failed"
      :src="src"
      :alt="alt"
      :max-height="maxHeight"
      contain
      class="rounded-lg"
      @error="failed = true"
    />
    <v-alert
      v-else
      type="warning"
      variant="tonal"
      density="comfortable"
      icon="mdi-image-off-outline"
    >
      <div class="d-flex flex-wrap align-center ga-2">
        <span class="text-body-medium">Gambar belum bisa dimuat. Tautannya mungkin sudah kedaluwarsa.</span>
        <v-btn size="small" variant="text" prepend-icon="mdi-refresh" @click="emit('refresh')">
          Muat ulang
        </v-btn>
      </div>
    </v-alert>
  </div>
</template>
