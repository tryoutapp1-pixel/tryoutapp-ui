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
    creatingPayment: false
  }),

  getters: {
    premiumPlan: (state) => state.offer.find((p) => p.name === 'Premium') || null,
    freePlan: (state) => state.offer.find((p) => p.name === 'Free') || null,
    // Effective status is computed by the backend; mirror it here for the UI.
    isPremium: (state) => Boolean(state.subscription && state.subscription.status === 'PREMIUM')
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
    // creatingPayment flag prevents duplicate concurrent requests.
    async createPayment() {
      if (this.creatingPayment) return null
      this.creatingPayment = true
      try {
        return await userService.createPayment()
      } finally {
        this.creatingPayment = false
      }
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
