<script setup>
// Lightweight SVG line chart for Try Out total-score history (FU16). It uses no
// chart library: the data set is small (one point per completed attempt) and a
// simple inline SVG keeps the bundle lean, matching the project's "avoid
// unnecessary dependencies" rule.
import { computed } from 'vue'

/**
 * @typedef {Object} TrendPoint
 * @property {string} label
 * @property {number|string} value
 */

/**
 * @typedef {Object} ChartCoord
 * @property {number} x
 * @property {number} y
 * @property {string} label
 * @property {number|string} value
 */

/**
 * @typedef {Object} ChartGeometry
 * @property {ChartCoord[]} coords
 * @property {string} line - SVG path data
 * @property {number} maxV
 * @property {number} minV
 * @property {number} innerH
 */

/**
 * @typedef {Object} ScoreTrendChartProps
 * @property {TrendPoint[]} [points] - Ordered oldest to newest
 * @property {number} [height] - SVG viewBox height
 * @property {string} [color] - Line and point color
 */

/** @type {ScoreTrendChartProps} */
const props = defineProps({
  points: { type: Array, default: () => [] },
  height: { type: Number, default: 220 },
  color: { type: String, default: '#0A6CBF' }
})

const width = 640
const padding = { top: 20, right: 20, bottom: 36, left: 40 }

/** @type {import('vue').ComputedRef<ChartGeometry|null>} */
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
  <svg v-if="geom" :viewBox="`0 0 ${width} ${height}`" class="trend-chart" role="img" aria-label="Tren skor">
    <!-- light grid: top (max) and middle lines; decorative only -->
    <line
      :x1="padding.left"
      :y1="padding.top"
      :x2="width - padding.right"
      :y2="padding.top"
      stroke="rgb(217 228 239)"
      stroke-width="1"
      stroke-dasharray="4 4"
    />
    <line
      :x1="padding.left"
      :y1="padding.top + geom.innerH / 2"
      :x2="width - padding.right"
      :y2="padding.top + geom.innerH / 2"
      stroke="rgb(217 228 239)"
      stroke-width="1"
      stroke-dasharray="4 4"
    />
    <!-- baseline -->
    <line
      :x1="padding.left"
      :y1="height - padding.bottom"
      :x2="width - padding.right"
      :y2="height - padding.bottom"
      stroke="rgb(217 228 239)"
      stroke-width="1.5"
    />
    <!-- max/min labels -->
    <text :x="8" :y="padding.top + 4" font-size="12" fill="rgb(11 37 64 / 0.68)">{{ geom.maxV }}</text>
    <text :x="8" :y="height - padding.bottom" font-size="12" fill="rgb(11 37 64 / 0.68)">{{ geom.minV }}</text>
    <!-- line -->
    <path :d="geom.line" fill="none" :stroke="color" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
    <!-- points -->
    <g v-for="(c, i) in geom.coords" :key="i">
      <circle :cx="c.x" :cy="c.y" r="4.5" :fill="color" stroke="#FFFFFF" stroke-width="2" />
      <text :x="c.x" :y="c.y - 10" font-size="12" font-weight="650" text-anchor="middle" fill="rgb(11 37 64)">
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
  font-variant-numeric: tabular-nums;
}
</style>
