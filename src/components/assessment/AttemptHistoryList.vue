<script setup>
// Attempt-history list shared by Latihan and Try Out. Wraps the loading, empty,
// and error states around the AttemptHistoryItem rows (newest first).
import StatePanel from '../StatePanel.vue'
import AttemptHistoryItem from './AttemptHistoryItem.vue'

/** @typedef {import('../../types/api').AttemptHistoryEntry} AttemptHistoryEntry */

/**
 * @typedef {Object} AttemptHistoryListProps
 * @property {AttemptHistoryEntry[]} items - Newest first
 * @property {boolean} [loading]
 * @property {string} [error]
 */

/** @type {AttemptHistoryListProps} */
const props = defineProps({
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' }
})

/**
 * @typedef {Object} AttemptHistoryListEmits
 * @property {() => void} retry
 * @property {(attempt: AttemptHistoryEntry) => void} view
 */
const emit = defineEmits(['retry', 'view'])
</script>

<template>
  <StatePanel
    :loading="props.loading"
    :error="props.error"
    :empty="!props.loading && !props.error && props.items.length === 0"
    empty-text="You have not finished this assessment yet."
    empty-icon="mdi-history"
    loading-text="Loading your attempts..."
    @retry="emit('retry')"
  >
    <div class="d-flex flex-column ga-3">
      <AttemptHistoryItem
        v-for="(a, i) in props.items"
        :key="a.attempt_id"
        :attempt="a"
        :index="props.items.length - i"
        @view="emit('view', $event)"
      />
    </div>
  </StatePanel>
</template>
