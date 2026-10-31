<script setup>
// Reusable attempt-history list, shared by Latihan (Feature 1) and Try Out
// (Feature 2). Wraps the common loading / empty / error / unsupported states
// around a chronological list of AttemptHistoryItem rows so neither assessment
// type duplicates the presentation logic.
//
// `supported === false` is used for Latihan, whose attempt history has no
// backend source yet (see the backend-dependency note in the implementation
// report). In that case we show an honest notice rather than an empty list that
// looks like "no attempts".
import StatePanel from '../StatePanel.vue'
import AttemptHistoryItem from './AttemptHistoryItem.vue'

defineProps({
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  supported: { type: Boolean, default: true },
  unsupportedText: {
    type: String,
    default: 'Attempt history is not available for this assessment yet.'
  }
})
defineEmits(['retry', 'view'])
</script>

<template>
  <div>
    <v-alert
      v-if="!loading && !error && !supported"
      type="info"
      variant="tonal"
      density="comfortable"
      icon="mdi-history"
    >
      {{ unsupportedText }}
    </v-alert>

    <StatePanel
      v-else
      :loading="loading"
      :error="error"
      :empty="!loading && !error && items.length === 0"
      empty-text="You have not completed this assessment yet."
      empty-icon="mdi-history"
      loading-text="Loading your attempts..."
      @retry="$emit('retry')"
    >
      <div class="d-flex flex-column ga-3">
        <AttemptHistoryItem
          v-for="(a, i) in items"
          :key="a.attempt_id"
          :attempt="a"
          :index="items.length - i"
          @view="$emit('view', $event)"
        />
      </div>
    </StatePanel>
  </div>
</template>
