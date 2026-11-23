// Opens Midtrans Snap for an order and reports how it ended.
//
// Shared by the payment page (new or resumed order) and the pending page
// (re-opening Snap so the user can see the VA number / QRIS again). After the
// popup resolves, the transaction for that order is re-read from the backend;
// its status, not the Snap callback, decides whether the order is settled.
import { ref } from 'vue'
import { useSubscriptionStore, FAILED_TX_STATUSES } from '../stores/subscription'
import { payWithSnap } from '../lib/midtrans'

/** @typedef {import('../types/api').Invoice} Invoice */
/** @typedef {import('../lib/midtrans').SnapOutcome} SnapOutcome */

/**
 * @typedef {Object} SnapPaymentResult
 * @property {SnapOutcome} outcome - How the popup ended
 * @property {string|null} txStatus - Backend status of the order; null if not found
 * @property {import('vue-router').RouteLocationRaw|null} settledRoute - Success/failed page when the order is settled, else null
 */

/**
 * @typedef {Object} SnapPayment
 * @property {import('vue').Ref<boolean>} paying - True while an order is prepared or Snap is open
 * @property {(getInvoice: () => Promise<Invoice|null>) => Promise<SnapPaymentResult|null>} openSnap
 *   Prepares the invoice, opens Snap, then re-reads the order. Resolves null when
 *   a payment is already in flight or `getInvoice` returns null. Throws when the
 *   invoice has no Snap token or a request fails.
 */

/**
 * Maps a backend transaction status to its outcome page, if it is settled.
 * @param {string|null} txStatus
 * @returns {import('vue-router').RouteLocationRaw|null}
 */
export function settledRouteFor(txStatus) {
  if (txStatus === 'PAID') return { name: 'user-payment-success' }
  if (txStatus && FAILED_TX_STATUSES.includes(txStatus)) return { name: 'user-payment-failed' }
  return null
}

/** @returns {SnapPayment} */
export function useSnapPayment() {
  const store = useSubscriptionStore()
  /** @type {import('vue').Ref<boolean>} */
  const paying = ref(false)

  /**
   * @param {() => Promise<Invoice|null>} getInvoice
   * @returns {Promise<SnapPaymentResult|null>}
   */
  async function openSnap(getInvoice) {
    if (paying.value) return null
    paying.value = true
    try {
      const invoice = await getInvoice()
      if (!invoice) return null
      if (!invoice.snap_token) throw new Error('Tagihan belum bisa disiapkan. Coba lagi.')

      const { outcome } = await payWithSnap(invoice.snap_token)

      await store.refreshAfterPayment()
      const tx = await store.findTransactionByOrderId(invoice.order_id)
      const txStatus = tx ? tx.status : null
      return { outcome, txStatus, settledRoute: settledRouteFor(txStatus) }
    } finally {
      paying.value = false
    }
  }

  return { paying, openSnap }
}
