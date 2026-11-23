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

/**
 * Callbacks accepted by `window.snap.pay`. Only the ones this module uses.
 * @typedef {Object} SnapPayOptions
 * @property {(payload: unknown) => void} onSuccess
 * @property {(payload: unknown) => void} onPending
 * @property {(payload: unknown) => void} onError
 * @property {() => void} onClose
 */

/**
 * The subset of the global Snap.js object this module uses.
 * @typedef {Object} Snap
 * @property {(snapToken: string, options: SnapPayOptions) => void} pay
 */

/** @typedef {'success'|'pending'|'error'|'close'} SnapOutcome */

/**
 * @typedef {Object} SnapResult
 * @property {SnapOutcome} outcome - 'close' means the user dismissed the popup
 * @property {unknown} payload - Raw Midtrans callback payload; null on close
 */

const SANDBOX_URL = 'https://app.sandbox.midtrans.com/snap/snap.js'
const PRODUCTION_URL = 'https://app.midtrans.com/snap/snap.js'

/** @type {Promise<Snap>|null} */
let loadPromise = null

/** @returns {string} */
function clientKey() {
  return (import.meta.env.VITE_MIDTRANS_CLIENT_KEY || '').trim()
}

/** @returns {boolean} */
function isProduction() {
  return String(import.meta.env.VITE_MIDTRANS_IS_PRODUCTION || 'false').trim() === 'true'
}

/** @returns {boolean} True when a Midtrans client key is set */
export function isSnapConfigured() {
  return Boolean(clientKey())
}

/**
 * Injects snap.js once and resolves when window.snap is available.
 * @returns {Promise<Snap>}
 */
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

/**
 * Opens the Snap popup for a token and resolves with a normalized outcome.
 * The promise settles once, on the first callback Snap fires.
 * @param {string} snapToken
 * @returns {Promise<SnapResult>}
 */
export async function payWithSnap(snapToken) {
  const snap = await loadSnap()
  return new Promise((resolve) => {
    let settled = false
    /**
     * @param {SnapOutcome} outcome
     * @param {unknown} payload
     */
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
