// Small display formatters shared by views.

export function formatDate(value) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString()
}

export function formatBytes(bytes) {
  const n = Number(bytes)
  if (!n || Number.isNaN(n)) return '-'
  const units = ['B', 'KB', 'MB', 'GB']
  let value = n
  let i = 0
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i += 1
  }
  return `${value.toFixed(value < 10 && i > 0 ? 1 : 0)} ${units[i]}`
}

export function isReleased(value) {
  return value === true || value === 1 || value === '1'
}

// Format an integer amount (IDR has no decimal subunit) as Indonesian Rupiah.
export function formatCurrency(value, currency = 'IDR') {
  const n = Number(value)
  if (Number.isNaN(n)) return '-'
  try {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(n)
  } catch {
    return `Rp${n.toLocaleString('id-ID')}`
  }
}

// Date only (no time), for display in lists and cards.
export function formatDateOnly(value) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Seconds -> "MM:SS" or "HH:MM:SS" for the assessment timer.
export function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(Number(totalSeconds) || 0))
  const hours = Math.floor(s / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  const seconds = s % 60
  const pad = (n) => String(n).padStart(2, '0')
  return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`
}
