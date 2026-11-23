<script setup>
// Learner layout: navigation drawer, app bar, and content outlet. The drawer
// groups learning pages under "Belajar" and account pages under "Akun".
// Logout clears auth, profile, and subscription state and returns to the
// landing page.
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useProfileStore } from '../stores/profile'
import { useSubscriptionStore } from '../stores/subscription'
import AppBrand from '../components/AppBrand.vue'

/**
 * @typedef {Object} NavItem
 * @property {string} title
 * @property {string} to
 * @property {string} icon
 * @property {boolean} [premium] - Shows a crown for Free users; the page explains the upgrade
 */

/**
 * @typedef {Object} NavGroup
 * @property {string} label
 * @property {NavItem[]} items
 */

const router = useRouter()
const authStore = useAuthStore()
const profileStore = useProfileStore()
const subscriptionStore = useSubscriptionStore()
const { user } = storeToRefs(authStore)
const { isPremium, subscription } = storeToRefs(subscriptionStore)

// null lets Vuetify open the drawer on desktop and keep it closed on mobile.
const drawer = ref(null)

/** Initials for the account avatar. */
const initials = computed(() => {
  const name = user.value?.name?.trim() || ''
  const parts = name.split(/\s+/).filter(Boolean)
  return (parts[0]?.[0] || '?').toUpperCase() + (parts[1]?.[0] || '').toUpperCase()
})

/** @type {NavGroup[]} */
const navGroups = [
  {
    label: 'Belajar',
    items: [
      { title: 'Beranda', to: '/app', icon: 'mdi-home-variant-outline' },
      { title: 'Materi', to: '/app/materials', icon: 'mdi-book-open-page-variant-outline' },
      { title: 'Latihan', to: '/app/latihan', icon: 'mdi-pencil-outline' },
      { title: 'Try Out', to: '/app/tryout', icon: 'mdi-timer-outline' },
      { title: 'Progres Saya', to: '/app/tryout/statistics', icon: 'mdi-chart-line', premium: true }
    ]
  },
  {
    label: 'Akun',
    items: [
      { title: 'Langganan', to: '/app/subscription', icon: 'mdi-crown-outline' },
      { title: 'Transaksi', to: '/app/transactions', icon: 'mdi-receipt-text-outline' },
      { title: 'Profil', to: '/app/profile', icon: 'mdi-account-circle-outline' }
    ]
  }
]

async function onLogout() {
  await authStore.logout()
  profileStore.reset()
  subscriptionStore.$reset()
  router.replace('/')
}

onMounted(() => {
  subscriptionStore.ensureSubscription()
})
</script>

<template>
  <v-app>
    <v-navigation-drawer v-model="drawer" color="surface" width="268" class="app-drawer">
      <div class="px-5 pt-5 pb-4">
        <RouterLink to="/app" class="text-decoration-none" aria-label="Beranda">
          <AppBrand />
        </RouterLink>
      </div>

      <v-list nav density="comfortable" class="px-3">
        <template v-for="(group, index) in navGroups" :key="group.label">
          <v-list-subheader :class="index > 0 ? 'mt-4' : ''">{{ group.label }}</v-list-subheader>
          <v-list-item
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            :prepend-icon="item.icon"
            :title="item.title"
            exact
          >
            <template v-if="item.premium && !isPremium" #append>
              <v-icon icon="mdi-crown-outline" color="premium-ink" size="18" aria-label="Premium" />
            </template>
          </v-list-item>
        </template>
      </v-list>

      <template #append>
        <!-- Plan summary; waits for the subscription so Premium users never see the Free card flash. -->
        <div v-if="subscription" class="pa-4">
          <div v-if="isPremium" class="d-flex align-center ga-3 pa-3 rounded-lg bg-surface-light">
            <v-icon icon="mdi-crown" color="premium-ink" />
            <div>
              <p class="text-title-small mb-0">Premium aktif</p>
              <p class="text-body-small text-medium-emphasis mb-0">Semua konten terbuka.</p>
            </div>
          </div>
          <div v-else class="app-drawer__plan pa-4 rounded-lg">
            <p class="text-title-small mb-1">Kamu di paket Gratis</p>
            <p class="text-body-small mb-3 app-drawer__plan-text">
              Buka semua Materi, Try Out, dan Progres Saya.
            </p>
            <v-btn to="/app/subscription" color="premium" size="small" block prepend-icon="mdi-crown">
              Lihat Premium
            </v-btn>
          </div>
        </div>
      </template>
    </v-navigation-drawer>

    <v-app-bar color="background" height="72">
      <div class="app-content d-flex align-center ga-2 px-2 px-md-6">
        <v-app-bar-nav-icon aria-label="Buka atau tutup menu" @click="drawer = !drawer" />
        <v-spacer />
        <v-menu location="bottom end">
          <template #activator="{ props }">
            <v-btn v-bind="props" variant="text" class="app-account-btn px-2" height="48">
              <v-avatar color="primary" size="34" class="me-2">
                <span class="text-label-large">{{ initials }}</span>
              </v-avatar>
              <span class="d-none d-sm-inline text-truncate app-account-btn__name">
                {{ user ? user.name : 'Akun' }}
              </span>
              <v-icon icon="mdi-chevron-down" size="18" class="ms-1" />
            </v-btn>
          </template>
          <v-list min-width="220">
            <v-list-item to="/app/profile" prepend-icon="mdi-account-outline" title="Profil" />
            <v-list-item to="/app/account" prepend-icon="mdi-lock-outline" title="Ubah kata sandi" />
            <v-divider class="my-1" />
            <v-list-item prepend-icon="mdi-logout" title="Keluar" base-color="error" @click="onLogout" />
          </v-list>
        </v-menu>
      </div>
    </v-app-bar>

    <v-main>
      <div class="app-content px-4 px-md-8 pt-2 pb-12">
        <RouterView />
      </div>
    </v-main>
  </v-app>
</template>

<style scoped>
.app-drawer__plan {
  background: rgb(var(--v-theme-navy));
  color: #fff;
}

.app-drawer__plan-text {
  color: rgb(255 255 255 / 0.78);
}

.app-account-btn__name {
  max-width: 180px;
}
</style>
