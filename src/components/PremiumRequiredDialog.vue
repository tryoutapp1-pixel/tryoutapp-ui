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
  title: { type: String, default: 'This content is for Premium members' },
  message: {
    type: String,
    default: 'Upgrade to Premium to open every material, Latihan, and Try Out, and to read the full explanation for each question.'
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
    <v-card class="pa-2">
      <v-card-item>
        <template #prepend>
          <v-avatar color="amber-lighten-4" size="44">
            <v-icon icon="mdi-crown-outline" color="amber-darken-3" />
          </v-avatar>
        </template>
        <v-card-title class="text-h6 text-wrap">{{ props.title }}</v-card-title>
      </v-card-item>
      <v-card-text class="text-body-2">{{ props.message }}</v-card-text>
      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="close">Not now</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-crown" @click="goToSubscription">
          See Premium plans
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
