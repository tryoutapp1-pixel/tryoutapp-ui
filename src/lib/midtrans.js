// Loads the Midtrans Snap.js SDK on demand and opens the Snap popup.
//
// The backend creates the transaction and returns a snap_token; the client only
// needs the Snap.js script + the client key to render the payment popup. The
// script URL differs for sandbox vs production. We never treat the Snap
// callback as authoritative — the backend webhook activates Premium. These
// callbacks only tell us when to re-read subscription/transaction state.
//
// Config comes from Vite env:
//   VITE_MIDTRANS_CLIENT_KEY  (required to open Snap)
//   VITE_MIDTRANS_IS_PRODUCTION ('true' | 'false', default sandbox)

const SANDBOX_URL = 'https://app.sandbox.midtrans.com/snap/snap.js'
const PRODUCTION_URL = 'https://app.midtrans.com/snap/snap.js'

let loadPromise = null

function clientKey() {
  return (import.meta.env.VITE_MIDTRANS_CLIENT_KEY || '').trim()
}
function isProduction() {
  return String(import.meta.env.VITE_MIDTRANS_IS_PRODUCTION || 'false').trim() === 'true'
}

export function isSnapConfigured() {
  return Boolean(clientKey())
}

// Injects snap.js once and resolves when window.snap is available.
export function loadSnap() {
  if (typeof window !== 'undefined' && window.snap) return Promise.resolve(window.snap)
  if (loadPromise) return loadPromise

  const key = clientKey()
  if (!key) {
    return Promise.reject(
      new Error('Online payment is not configured. Please contact support.')
    )
  }

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = isProduction() ? PRODUCTION_URL : SANDBOX_URL
    script.setAttribute('data-client-key', key)
    script.async = true
    script.onload = () => {
      if (window.snap) resolve(window.snap)
      else reject(new Error('Payment module failed to initialize.'))
    }
    script.onerror = () => {
      loadPromise = null
      reject(new Error('Could not load the payment module. Check your connection.'))
    }
    document.head.appendChild(script)
  })
  return loadPromise
}

// Opens the Snap popup for a token. Resolves with a normalized outcome:
//   { outcome: 'success'|'pending'|'error'|'close', payload }
// 'close' means the user dismissed the popup without a terminal result.
export async function payWithSnap(snapToken) {
  const snap = await loadSnap()
  return new Promise((resolve) => {
    let settled = false
    const done = (outcome, payload) => {
      if (settled) return
      settled = true
      resolve({ outcome, payload })
    }
    snap.pay(snapToken, {
      onSuccess: (payload) => done('success', payload),
      onPending: (payload) => done('pending', payload),
      onError: (payload) => done('error', payload),
      onClose: () => done('close', null)
    })
  })
}
