import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSubscriptionStore } from '../stores/subscription'

/**
 * @typedef {Object} PremiumGate
 * @property {import('vue').ComputedRef<boolean>} isPremium - From the backend subscription status
 * @property {import('vue').Ref<boolean>} dialogOpen - Bind to PremiumRequiredDialog v-model
 * @property {(item: { access_type?: string }) => boolean} isLocked - True for PREMIUM items when the user is Free
 * @property {(item: { access_type?: string }) => Promise<boolean>} guard - Opens the dialog and resolves false when the item is locked
 */

/**
 * Premium prompt for list pages that show both FREE and PREMIUM items. It
 * refreshes the subscription on mount so a recent upgrade is reflected. This is
 * presentation only; the backend still answers 403 for locked content.
 *
 * @returns {PremiumGate}
 */
export function usePremiumGate() {
  const subscriptionStore = useSubscriptionStore()
  const { subscription } = storeToRefs(subscriptionStore)

  /** @type {import('vue').Ref<boolean>} */
  const dialogOpen = ref(false)
  const isPremium = computed(() => subscriptionStore.isPremium)

  /** @param {{ access_type?: string }} item */
  function isLocked(item) {
    return item.access_type === 'PREMIUM' && !isPremium.value
  }

  /** @param {{ access_type?: string }} item */
  async function guard(item) {
    if (item.access_type !== 'PREMIUM') return true
    // The status may still be loading on a fast click; wait for it once.
    if (!subscription.value) await subscriptionStore.ensureSubscription()
    if (isPremium.value) return true
    dialogOpen.value = true
    return false
  }

  onMounted(() => {
    subscriptionStore.fetchSubscription()
  })

  return { isPremium, dialogOpen, isLocked, guard }
}
