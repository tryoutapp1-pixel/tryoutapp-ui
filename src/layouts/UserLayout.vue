<script setup>
// User (learner) layout: navigation drawer + app bar + content outlet.
// Logout clears auth + profile state and returns to the public landing page.
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useProfileStore } from '../stores/profile'

const router = useRouter()
const authStore = useAuthStore()
const profileStore = useProfileStore()
const { user } = storeToRefs(authStore)

const drawer = ref(true)

const navItems = [
  { title: 'Dashboard', to: '/app', icon: 'mdi-view-dashboard-outline' },
  { title: 'Materials', to: '/app/materials', icon: 'mdi-book-open-page-variant-outline' },
  { title: 'Latihan', to: '/app/latihan', icon: 'mdi-pencil-outline' },
  { title: 'Try Out', to: '/app/tryout', icon: 'mdi-timer-outline' },
  { title: 'My Progress', to: '/app/tryout/statistics', icon: 'mdi-chart-line' },
  { title: 'Subscription', to: '/app/subscription', icon: 'mdi-crown-outline' },
  { title: 'Transactions', to: '/app/transactions', icon: 'mdi-receipt-text-outline' },
  { title: 'Profile', to: '/app/profile', icon: 'mdi-account-circle-outline' }
]

async function onLogout() {
  await authStore.logout()
  profileStore.reset()
  router.replace('/')
}
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
        <v-list-item
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
          exact
        />
      </v-list>
    </v-navigation-drawer>

    <v-app-bar flat border>
      <v-app-bar-nav-icon @click="drawer = !drawer" />
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
