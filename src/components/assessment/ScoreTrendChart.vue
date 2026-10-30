<script setup>
// Lightweight SVG line chart for Try Out total-score history (FU16). No chart
// library dependency — the data set is small (one point per completed attempt)
// and a simple inline SVG keeps the bundle lean, matching the project's
// "avoid unnecessary dependencies" rule.
import { computed } from 'vue'

const props = defineProps({
  // Ordered oldest -> newest: [{ label, value }]
  points: { type: Array, default: () => [] },
  height: { type: Number, default: 220 },
  color: { type: String, default: '#1867C0' }
})

const width = 640
const padding = { top: 20, right: 20, bottom: 36, left: 40 }

const geom = computed(() => {
  const data = props.points
  if (data.length === 0) return null
  const innerW = width - padding.left - padding.right
  const innerH = props.height - padding.top - padding.bottom
  const values = data.map((d) => Number(d.value) || 0)
  const maxV = Math.max(...values, 1)
  const minV = Math.min(...values, 0)
  const span = maxV - minV || 1
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0

  const coords = data.map((d, i) => {
    const x = padding.left + (data.length > 1 ? i * stepX : innerW / 2)
    const y = padding.top + innerH - ((Number(d.value) - minV) / span) * innerH
    return { x, y, label: d.label, value: d.value }
  })
  const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x},${c.y}`).join(' ')
  return { coords, line, maxV, minV, innerH }
})
</script>

<template>
  <svg v-if="geom" :viewBox="`0 0 ${width} ${height}`" class="trend-chart" role="img" aria-label="Score trend">
    <!-- baseline -->
    <line
      :x1="padding.left"
      :y1="height - padding.bottom"
      :x2="width - padding.right"
      :y2="height - padding.bottom"
      stroke="rgba(0,0,0,0.15)"
      stroke-width="1"
    />
    <!-- max/min labels -->
    <text :x="8" :y="padding.top + 4" font-size="11" fill="rgba(0,0,0,0.5)">{{ geom.maxV }}</text>
    <text :x="8" :y="height - padding.bottom" font-size="11" fill="rgba(0,0,0,0.5)">{{ geom.minV }}</text>
    <!-- line -->
    <path :d="geom.line" fill="none" :stroke="color" stroke-width="2.5" />
    <!-- points -->
    <g v-for="(c, i) in geom.coords" :key="i">
      <circle :cx="c.x" :cy="c.y" r="4" :fill="color" />
      <text :x="c.x" :y="c.y - 10" font-size="11" text-anchor="middle" fill="rgba(0,0,0,0.7)">
        {{ c.value }}
      </text>
    </g>
  </svg>
</template>

<style scoped>
.trend-chart {
  width: 100%;
  height: auto;
  display: block;
}
</style>
