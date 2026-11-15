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
 * @property {number} [warnAtSeconds] - At or below this many seconds the timer switches to its low-time look
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
  <div
    class="attempt-timer d-flex align-center ga-3 px-3 py-2 rounded-lg"
    :class="seconds <= warnAtSeconds ? 'attempt-timer--low' : 'bg-surface-light'"
    role="timer"
  >
    <v-icon
      :icon="seconds <= warnAtSeconds ? 'mdi-timer-alert-outline' : 'mdi-timer-outline'"
      :color="seconds <= warnAtSeconds ? 'error' : 'primary'"
      size="28"
    />
    <div class="d-flex flex-column ga-1">
      <span class="text-body-small text-medium-emphasis">
        {{ seconds <= warnAtSeconds ? 'Waktu hampir habis' : 'Sisa waktu' }}
      </span>
      <span class="app-figure text-headline-small" :class="{ 'text-error': seconds <= warnAtSeconds }">
        {{ formatDuration(seconds) }}
      </span>
    </div>
  </div>
</template>

<style scoped>
/* Low time: light coral tint plus a coral outline, so the state is shown by
   the icon, the label and the outline as well as the color. */
.attempt-timer--low {
  background: rgba(var(--v-theme-error), 0.08);
  box-shadow: inset 0 0 0 1.5px rgb(var(--v-theme-error));
}
</style>
