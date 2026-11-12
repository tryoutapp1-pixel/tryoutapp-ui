<script setup>
// FU19c - Try Out timer. The remaining time is computed from the backend
// deadline (expired_at) adjusted for the server/client clock offset, so a page
// refresh or route re-entry restores the correct countdown and the frontend can
// never extend the deadline. This component only displays and ticks; it reads
// the remaining-seconds function from the parent and emits 'expired' once.
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { formatDuration } from '../../lib/format'

/**
 * @typedef {Object} AttemptTimerProps
 * @property {() => number|null} remaining - Returns remaining seconds (null if untimed).
 *   Provided by the attempt store so the backend deadline stays the single source of truth.
 * @property {number} [warnAtSeconds] - Below this many seconds the chip turns red
 */

/** @type {AttemptTimerProps} */
const props = defineProps({
  remaining: { type: Function, required: true },
  warnAtSeconds: { type: Number, default: 300 }
})

/**
 * @typedef {Object} AttemptTimerEmits
 * @property {() => void} expired - Emitted once when the remaining time reaches 0
 */
const emit = defineEmits(['expired'])

const seconds = ref(props.remaining() ?? 0)
/** @type {ReturnType<typeof setInterval>|null} */
let timer = null
let fired = false

function tick() {
  const value = props.remaining()
  if (value === null || value === undefined) return
  seconds.value = value
  if (value <= 0 && !fired) {
    fired = true
    emit('expired')
  }
}

onMounted(() => {
  tick()
  timer = setInterval(tick, 1000)
})
onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <v-chip
    :color="seconds <= warnAtSeconds ? 'error' : 'primary'"
    variant="flat"
    size="large"
    prepend-icon="mdi-timer-outline"
    class="font-weight-bold"
  >
    {{ formatDuration(seconds) }}
  </v-chip>
</template>
