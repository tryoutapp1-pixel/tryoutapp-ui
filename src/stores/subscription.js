// Subscription and payment store.
//
// Owns the Premium offer, the subscription status reported by the backend, the
// user's transaction history, and the Midtrans payment-creation workflow. The
// frontend never changes subscription status itself; it reflects what
// GET /users/subscription returns after the backend webhook activates Premium.
import { defineStore } from 'pinia'
import userService from '../services/userService'

/** @typedef {import('../types/api').Plan} Plan */
/** @typedef {import('../types/api').Subscription} Subscription */
/** @typedef {import('../types/api').Transaction} Transaction */
/** @typedef {import('../types/api').Invoice} Invoice */
/** @typedef {import('../types/api').Pagination} Pagination */

/** Transaction statuses that mean the order will never be paid. */
export const FAILED_TX_STATUSES = ['FAILED', 'CANCELLED', 'EXPIRED']

export const useSubscriptionStore = defineStore('subscription', {
  state: () => ({
    /** @type {Plan[]} */
    offer: [],
    offerLoading: false,
    offerError: '',

    /** @type {Subscription|null} */
    subscription: null,
    subscriptionLoading: false,
    subscriptionError: '',

    /** @type {Transaction[]} */
    transactions: [],
    /** @type {Pagination} */
    transactionsPagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    transactionsLoading: false,
    transactionsError: '',

    // Guards against duplicate payment creation from repeated clicks.
    creatingPayment: false,

    /**
     * The invoice being prepared or paid. Kept in the store (not the URL) so
     * the invoice, payment, and outcome pages read the same order.
     * @type {Invoice|null}
     */
    activeInvoice: null
  }),

  getters: {
    /** @returns {Plan|null} */
    premiumPlan: (state) => state.offer.find((plan) => plan.name === 'Premium') || null,
    /** @returns {Plan|null} */
    freePlan: (state) => state.offer.find((plan) => plan.name === 'Free') || null,
    /** Effective status is computed by the backend; the UI mirrors it. */
    isPremium: (state) => Boolean(state.subscription && state.subscription.status === 'PREMIUM'),
    /**
     * The history row matching the active invoice, if it has been loaded.
     * @returns {Transaction|null}
     */
    activeTransaction: (state) =>
      state.activeInvoice
        ? state.transactions.find((t) => t.order_id === state.activeInvoice.order_id) || null
        : null
  },

  actions: {
    async fetchOffer() {
      this.offerLoading = true
      this.offerError = ''
      try {
        this.offer = (await userService.getOffer()) || []
      } catch (error) {
        this.offerError = error.message
      } finally {
        this.offerLoading = false
      }
    },

    async fetchSubscription() {
      this.subscriptionLoading = true
      this.subscriptionError = ''
      try {
        this.subscription = await userService.getSubscription()
      } catch (error) {
        this.subscriptionError = error.message
      } finally {
        this.subscriptionLoading = false
      }
    },

    /**
     * Loads the subscription once and reuses it afterwards. Pass
     * `{ force: true }` to refresh, e.g. after a payment.
     * @param {{ force?: boolean }} [options]
     * @returns {Promise<Subscription|null>}
     */
    async ensureSubscription({ force = false } = {}) {
      if (force || !this.subscription) await this.fetchSubscription()
      return this.subscription
    },

    /** @param {import('../types/api').PageQuery} [query] */
    async fetchTransactions({ page = 1, limit = 20 } = {}) {
      this.transactionsLoading = true
      this.transactionsError = ''
      try {
        const data = await userService.listTransactions({ page, limit })
        this.transactions = data.items || []
        this.transactionsPagination = data.pagination || this.transactionsPagination
      } catch (error) {
        this.transactionsError = error.message
      } finally {
        this.transactionsLoading = false
      }
    },

    /**
     * Creates (or reuses) a PENDING transaction and stores it as the active
     * invoice. Throws on failure; returns null while a request is in flight.
     * @returns {Promise<Invoice|null>}
     */
    async createPayment() {
      if (this.creatingPayment) return null
      this.creatingPayment = true
      try {
        const invoice = await userService.createPayment()
        if (invoice) this.activeInvoice = invoice
        return invoice
      } finally {
        this.creatingPayment = false
      }
    },

    /**
     * Reuses the in-memory invoice when it has a Snap token.
     * @returns {Promise<Invoice|null>}
     */
    async ensureInvoice() {
      if (this.activeInvoice && this.activeInvoice.snap_token) return this.activeInvoice
      return this.createPayment()
    },

    clearActiveInvoice() {
      this.activeInvoice = null
    },

    /**
     * Rebuilds the active invoice from a transaction history row. Used when the
     * user lands on an outcome page after a full page load (e.g. the Midtrans
     * Finish Redirect URL), where the in-memory invoice is gone. The Snap token
     * is not part of the history row, so it is left empty.
     * @param {Transaction} tx
     * @param {number} [transactionId]
     */
    adoptTransaction(tx, transactionId = 0) {
      this.activeInvoice = {
        order_id: tx.order_id,
        transaction_id: transactionId,
        snap_token: '',
        amount: Number(tx.amount),
        currency: 'IDR',
        status: tx.status
      }
    },

    /**
     * Finds an order in the transaction history (newest first). There is no
     * single-transaction endpoint, so this scans up to `maxPages` pages. Page 1
     * is also stored so the Transactions view stays current.
     * @param {string} orderId
     * @param {{ maxPages?: number, limit?: number }} [options]
     * @returns {Promise<Transaction|null>}
     */
    async findTransactionByOrderId(orderId, { maxPages = 5, limit = 20 } = {}) {
      if (!orderId) return null
      for (let page = 1; page <= maxPages; page += 1) {
        const data = await userService.listTransactions({ page, limit })
        const items = data.items || []
        if (page === 1) {
          this.transactions = items
          this.transactionsPagination = data.pagination || this.transactionsPagination
        }
        const match = items.find((t) => t.order_id === orderId)
        if (match) return match
        const totalPages = (data.pagination && data.pagination.totalPages) || 1
        if (page >= totalPages) break
      }
      return null
    },

    /**
     * The webhook is authoritative, so after a Snap interaction we re-read the
     * subscription and transactions. The status may still be PENDING.
     */
    async refreshAfterPayment() {
      await Promise.all([
        this.fetchSubscription(),
        this.fetchTransactions({ page: 1, limit: this.transactionsPagination.limit })
      ])
    }
  }
})
