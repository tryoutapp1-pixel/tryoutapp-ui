<script setup>
// Admin layout: navigation drawer, app bar, and content outlet. Same shell as
// the learner layout so both sides share one visual language.
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useProfileStore } from '../stores/profile'
import AppBrand from '../components/AppBrand.vue'

/**
 * @typedef {Object} NavItem
 * @property {string} title
 * @property {string} to
 * @property {string} icon
 */

const router = useRouter()
const authStore = useAuthStore()
const profileStore = useProfileStore()
const { user } = storeToRefs(authStore)

// null lets Vuetify open the drawer on desktop and keep it closed on mobile.
const drawer = ref(null)

/** Initials for the account avatar. */
const initials = computed(() => {
  const name = user.value?.name?.trim() || ''
  const parts = name.split(/\s+/).filter(Boolean)
  return (parts[0]?.[0] || '?').toUpperCase() + (parts[1]?.[0] || '').toUpperCase()
})

/** @type {NavItem[]} */
const navItems = [
  { title: 'Dasbor', to: '/admin', icon: 'mdi-view-dashboard-outline' },
  { title: 'Pengguna', to: '/admin/users', icon: 'mdi-account-group-outline' },
  { title: 'Gambar', to: '/admin/images', icon: 'mdi-image-multiple-outline' },
  { title: 'Materi', to: '/admin/materials', icon: 'mdi-book-open-page-variant-outline' },
  { title: 'Paket soal', to: '/admin/assessments', icon: 'mdi-clipboard-text-outline' },
  { title: 'Masukan', to: '/admin/feedback', icon: 'mdi-message-star-outline' },
  { title: 'Profil', to: '/admin/profile', icon: 'mdi-account-circle-outline' }
]

async function onLogout() {
  await authStore.logout()
  profileStore.reset()
  router.replace('/')
}
</script>

<template>
  <v-app>
    <v-navigation-drawer v-model="drawer" color="surface" width="268">
      <div class="px-5 pt-5 pb-4">
        <RouterLink to="/admin" class="text-decoration-none" aria-label="Dasbor admin">
          <AppBrand tag="Admin" />
        </RouterLink>
      </div>

      <v-list nav density="comfortable" class="px-3">
        <v-list-subheader>Kelola</v-list-subheader>
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

    <v-app-bar color="background" height="72">
      <div class="app-content app-content--wide d-flex align-center ga-2 px-2 px-md-6">
        <v-app-bar-nav-icon aria-label="Buka atau tutup menu" @click="drawer = !drawer" />
        <v-spacer />
        <v-menu location="bottom end">
          <template #activator="{ props }">
            <v-btn v-bind="props" variant="text" class="px-2" height="48">
              <v-avatar color="navy" size="34" class="me-2">
                <span class="text-label-large">{{ initials }}</span>
              </v-avatar>
              <span class="d-none d-sm-inline text-truncate app-account-btn__name">
                {{ user ? user.name : 'Akun' }}
              </span>
              <v-icon icon="mdi-chevron-down" size="18" class="ms-1" />
            </v-btn>
          </template>
          <v-list min-width="220">
            <v-list-item to="/admin/profile" prepend-icon="mdi-account-outline" title="Profil" />
            <v-list-item to="/admin/account" prepend-icon="mdi-lock-outline" title="Ubah kata sandi" />
            <v-divider class="my-1" />
            <v-list-item prepend-icon="mdi-logout" title="Keluar" base-color="error" @click="onLogout" />
          </v-list>
        </v-menu>
      </div>
    </v-app-bar>

    <v-main>
      <div class="app-content app-content--wide px-4 px-md-8 pt-2 pb-12">
        <RouterView />
      </div>
    </v-main>
  </v-app>
</template>

<style scoped>
.app-account-btn__name {
  max-width: 180px;
}

/* Admin tables need more room than learner pages. */
.app-content--wide {
  max-width: 1280px;
}
</style>
