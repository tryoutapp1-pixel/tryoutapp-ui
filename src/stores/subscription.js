// Subscription & payment store (FU2, FU6, FU7).
//
// Owns: the Premium offer, the authoritative subscription status from the
// backend, the user's transaction history, and the Midtrans payment-creation
// workflow. The frontend never changes subscription status itself; it only
// reflects what GET /users/subscription returns after the backend webhook
// activates Premium.
import { defineStore } from 'pinia'
import userService from '../services/userService'

export const useSubscriptionStore = defineStore('subscription', {
  state: () => ({
    offer: [],
    offerLoading: false,
    offerError: '',

    subscription: null, // { status, started_at, expired_at }
    subscriptionLoading: false,
    subscriptionError: '',

    transactions: [],
    transactionsPagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    transactionsLoading: false,
    transactionsError: '',

    // Guards against duplicate payment creation from repeated clicks.
    creatingPayment: false,

    // The invoice currently being prepared / paid. Produced by createPayment()
    // (POST /users/premium/payment) which the backend makes idempotent per user
    // (it reuses the latest PENDING transaction). Shape:
    //   { order_id, transaction_id, snap_token, amount, currency, status }
    // Kept in the store (not the URL) so the invoice, payment, and outcome pages
    // can all read the same order without leaking it into query params.
    activeInvoice: null
  }),

  getters: {
    premiumPlan: (state) => state.offer.find((p) => p.name === 'Premium') || null,
    freePlan: (state) => state.offer.find((p) => p.name === 'Free') || null,
    // Effective status is computed by the backend; mirror it here for the UI.
    isPremium: (state) => Boolean(state.subscription && state.subscription.status === 'PREMIUM'),
    // The transaction row (from the history list) that matches the active
    // invoice's order_id, if it has been loaded. Lets the payment/outcome pages
    // show the authoritative status without a dedicated single-transaction API.
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

    // Creates (or reuses) a PENDING transaction and returns the Midtrans Snap
    // token. Throws on failure so the caller can surface the error. The
    // creatingPayment flag prevents duplicate concurrent requests. The result is
    // also stored as the activeInvoice so the dedicated payment / outcome pages
    // can read it without round-tripping the backend again.
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

    // Ensure an invoice is ready before showing the invoice/payment pages.
    // Reuses the one already in memory if present (idempotent navigation); the
    // backend itself is idempotent, so a re-call simply returns the same order.
    async ensureInvoice() {
      if (this.activeInvoice && this.activeInvoice.snap_token) return this.activeInvoice
      return this.createPayment()
    },

    clearActiveInvoice() {
      this.activeInvoice = null
    },

    // Resolve the current status of an order from the transaction history.
    // There is no single-transaction endpoint, so we scan pages (newest first)
    // until the order is found or the pages are exhausted. Returns the matching
    // transaction row or null. Also refreshes the first page into the store so
    // the Transactions view and activeTransaction getter stay current.
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

    // Called after a Snap interaction resolves: the backend webhook is
    // authoritative, so we re-read subscription + transactions to reflect the
    // true state (which may still be PENDING if the webhook hasn't arrived).
    async refreshAfterPayment() {
      await Promise.all([
        this.fetchSubscription(),
        this.fetchTransactions({ page: 1, limit: this.transactionsPagination.limit })
      ])
    }
  }
})
