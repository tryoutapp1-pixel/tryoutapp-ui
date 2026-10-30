<script setup>
// Renders an image from a short-lived (~60s) signed URL. If the image fails to
// load (commonly an expired signed URL), it shows a lightweight "reload" action
// and asks the parent to refetch the owning resource for a fresh URL rather
// than reusing the stale one.
import { ref, watch } from 'vue'

const props = defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
  maxHeight: { type: [Number, String], default: 320 }
})
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
      class="rounded"
      @error="failed = true"
    />
    <v-alert
      v-else
      type="warning"
      variant="tonal"
      density="comfortable"
      class="d-flex align-center"
    >
      <span class="me-2">Image could not be loaded (the link may have expired).</span>
      <v-btn size="small" variant="text" prepend-icon="mdi-refresh" @click="emit('refresh')">
        Reload
      </v-btn>
    </v-alert>
  </div>
</template>
