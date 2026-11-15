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
 * @property {boolean} [premium] - Changes the review button label
 */

/** @type {AttemptHistoryListProps} */
const props = defineProps({
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  premium: { type: Boolean, default: false }
})

/**
 * @typedef {Object} AttemptHistoryListEmits
 * @property {() => void} retry
 * @property {(attempt: AttemptHistoryEntry) => void} review
 * @property {(attempt: AttemptHistoryEntry) => void} continue
 */
const emit = defineEmits(['retry', 'review', 'continue'])
</script>

<template>
  <StatePanel
    :loading="props.loading"
    :error="props.error"
    :empty="!props.loading && !props.error && props.items.length === 0"
    empty-text="Kamu belum menyelesaikan paket soal ini. Kerjakan sampai selesai, lalu skormu akan muncul di sini."
    empty-icon="mdi-history"
    loading-text="Memuat riwayat pengerjaanmu..."
    @retry="emit('retry')"
  >
    <div class="d-flex flex-column ga-3">
      <AttemptHistoryItem
        v-for="(a, i) in props.items"
        :key="a.attempt_id"
        :attempt="a"
        :index="props.items.length - i"
        :premium="props.premium"
        @review="emit('review', $event)"
        @continue="emit('continue', $event)"
      />
    </div>
  </StatePanel>
</template>
