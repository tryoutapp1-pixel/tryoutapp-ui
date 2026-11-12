<script setup>
// Learner layout: navigation drawer, app bar, and content outlet. The drawer
// groups learning pages under "Content" and account pages under "Manage".
// Logout clears auth, profile, and subscription state and returns to the
// landing page.
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useProfileStore } from '../stores/profile'
import { useSubscriptionStore } from '../stores/subscription'

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
const { isPremium } = storeToRefs(subscriptionStore)

const drawer = ref(true)

/** @type {NavGroup[]} */
const navGroups = [
  {
    label: 'Content',
    items: [
      { title: 'Dashboard', to: '/app', icon: 'mdi-view-dashboard-outline' },
      { title: 'Materials', to: '/app/materials', icon: 'mdi-book-open-page-variant-outline' },
      { title: 'Latihan', to: '/app/latihan', icon: 'mdi-pencil-outline' },
      { title: 'Try Out', to: '/app/tryout', icon: 'mdi-timer-outline' },
      { title: 'My Progress', to: '/app/tryout/statistics', icon: 'mdi-chart-line', premium: true }
    ]
  },
  {
    label: 'Manage',
    items: [
      { title: 'Subscription', to: '/app/subscription', icon: 'mdi-crown-outline' },
      { title: 'Transactions', to: '/app/transactions', icon: 'mdi-receipt-text-outline' },
      { title: 'Profile', to: '/app/profile', icon: 'mdi-account-circle-outline' }
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
    <v-navigation-drawer v-model="drawer" color="surface" border>
      <div class="pa-4 d-flex align-center text-primary">
        <v-icon icon="mdi-school-outline" class="me-2" />
        <span class="text-h6 font-weight-bold">Tryout App</span>
      </div>
      <v-divider />
      <v-list nav density="comfortable">
        <template v-for="(group, index) in navGroups" :key="group.label">
          <v-divider v-if="index > 0" class="my-2" />
          <v-list-subheader class="nav-group-label">{{ group.label }}</v-list-subheader>
          <v-list-item
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            :prepend-icon="item.icon"
            :title="item.title"
            exact
          >
            <template v-if="item.premium && !isPremium" #append>
              <v-icon icon="mdi-crown-outline" color="amber-darken-2" size="18" aria-label="Premium" />
            </template>
          </v-list-item>
        </template>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar flat border>
      <v-app-bar-nav-icon aria-label="Toggle navigation" @click="drawer = !drawer" />
      <v-toolbar-title class="text-body-1 font-weight-medium">Learner</v-toolbar-title>
      <v-spacer />
      <v-menu>
        <template #activator="{ props }">
          <v-btn v-bind="props" variant="text" prepend-icon="mdi-account-circle-outline">
            {{ user ? user.name : 'Account' }}
          </v-btn>
        </template>
        <v-list>
          <v-list-item to="/app/profile" prepend-icon="mdi-account-outline" title="Profile" />
          <v-list-item to="/app/account" prepend-icon="mdi-lock-outline" title="Change password" />
          <v-divider />
          <v-list-item prepend-icon="mdi-logout" title="Logout" @click="onLogout" />
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-main>
      <v-container>
        <RouterView />
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.nav-group-label {
  font-weight: 600;
  letter-spacing: 0;
}
</style>
