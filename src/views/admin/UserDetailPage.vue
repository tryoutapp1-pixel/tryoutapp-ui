<script setup>
// FA2 - user detail with suspend and reactivate (new requirement).
// Backend: GET /admin/users/:id, PATCH /admin/users/:id/suspend|reactivate.
// Only USER accounts can be suspended; an account that is not yet verified
// cannot.
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminUsersStore } from '../../stores/adminUsers'
import { useUiStore } from '../../stores/ui'
import PageHeader from '../../components/PageHeader.vue'
import StatePanel from '../../components/StatePanel.vue'
import StatusChip from '../../components/StatusChip.vue'
import ConfirmDialog from '../../components/ConfirmDialog.vue'
import { formatDate } from '../../lib/format'

/**
 * @typedef {Object} AdminUser
 * @property {number} id
 * @property {'USER'|'ADMIN'} role
 * @property {string} name
 * @property {string} email
 * @property {'PENDING_VERIFICATION'|'ACTIVE'|'SUSPENDED'} status
 * @property {string|null} email_verified_at
 * @property {string} created_at
 * @property {import('../../types/api').AccessType} subscription_status
 * @property {string|null} subscription_started_at
 * @property {string|null} subscription_expired_at
 */

const route = useRoute()
const router = useRouter()
const store = useAdminUsersStore()
const uiStore = useUiStore()

/** @type {import('vue').Ref<AdminUser|null>} */
const user = ref(null)
const loading = ref(false)
const error = ref('')

/** @type {import('vue').ComputedRef<boolean|null>} */
const isSuspended = computed(() => user.value && user.value.status === 'SUSPENDED')
// Suspend/reactivate only applies to verified USER accounts.
/** @type {import('vue').ComputedRef<boolean|null>} */
const canToggle = computed(
  () => user.value && user.value.role === 'USER' && user.value.status !== 'PENDING_VERIFICATION'
)

async function load() {
  loading.value = true
  error.value = ''
  try {
    user.value = await store.fetchUser(route.params.id)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

// Confirmation
const confirmOpen = ref(false)
const working = ref(false)

function askToggle() {
  confirmOpen.value = true
}

async function doToggle() {
  working.value = true
  try {
    const suspend = !isSuspended.value
    const updated = await store.setSuspended(user.value.id, suspend)
    user.value = updated
    uiStore.success(suspend ? 'Akun pengguna ditangguhkan.' : 'Akun pengguna diaktifkan kembali.')
    confirmOpen.value = false
  } catch (e) {
    uiStore.error(e.message)
  } finally {
    working.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <PageHeader title="Detail pengguna" subtitle="Data akun dan status langganan.">
      <template #actions>
        <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="router.push('/admin/users')">
          Kembali
        </v-btn>
        <v-btn
          v-if="canToggle"
          :color="isSuspended ? 'success' : 'error'"
          variant="flat"
          :prepend-icon="isSuspended ? 'mdi-account-check-outline' : 'mdi-account-cancel-outline'"
          @click="askToggle"
        >
          {{ isSuspended ? 'Aktifkan kembali' : 'Tangguhkan' }}
        </v-btn>
      </template>
    </PageHeader>

    <StatePanel :loading="loading" :error="error" @retry="load">
      <v-card v-if="user" class="pa-5 pa-md-6" max-width="720">
        <section aria-labelledby="user-detail-account">
          <div class="d-flex align-center ga-3 mb-2">
            <v-avatar color="surface-light" rounded="lg" size="40">
              <v-icon icon="mdi-account-outline" color="primary" size="22" />
            </v-avatar>
            <h2 id="user-detail-account" class="text-title-medium">Akun</h2>
          </div>
          <v-row no-gutters align="center" class="py-3">
            <v-col cols="5" sm="4" class="text-body-medium text-medium-emphasis">ID</v-col>
            <v-col cols="7" sm="8" class="text-body-medium">{{ user.id }}</v-col>
          </v-row>
          <v-divider />
          <v-row no-gutters align="center" class="py-3">
            <v-col cols="5" sm="4" class="text-body-medium text-medium-emphasis">Peran</v-col>
            <v-col cols="7" sm="8"><StatusChip :value="user.role" /></v-col>
          </v-row>
          <v-divider />
          <v-row no-gutters align="center" class="py-3">
            <v-col cols="5" sm="4" class="text-body-medium text-medium-emphasis">Nama</v-col>
            <v-col cols="7" sm="8" class="text-body-medium font-weight-medium text-break">{{ user.name }}</v-col>
          </v-row>
          <v-divider />
          <v-row no-gutters align="center" class="py-3">
            <v-col cols="5" sm="4" class="text-body-medium text-medium-emphasis">Email</v-col>
            <v-col cols="7" sm="8" class="text-body-medium text-break">{{ user.email }}</v-col>
          </v-row>
          <v-divider />
          <v-row no-gutters align="center" class="py-3">
            <v-col cols="5" sm="4" class="text-body-medium text-medium-emphasis">Status</v-col>
            <v-col cols="7" sm="8"><StatusChip :value="user.status" /></v-col>
          </v-row>
          <v-divider />
          <v-row no-gutters align="center" class="py-3">
            <v-col cols="5" sm="4" class="text-body-medium text-medium-emphasis">Email terverifikasi</v-col>
            <v-col cols="7" sm="8" class="text-body-medium">{{ formatDate(user.email_verified_at) }}</v-col>
          </v-row>
          <v-divider />
          <v-row no-gutters align="center" class="py-3">
            <v-col cols="5" sm="4" class="text-body-medium text-medium-emphasis">Terdaftar</v-col>
            <v-col cols="7" sm="8" class="text-body-medium">{{ formatDate(user.created_at) }}</v-col>
          </v-row>
        </section>

        <section aria-labelledby="user-detail-subscription" class="mt-6">
          <div class="d-flex align-center ga-3 mb-2">
            <v-avatar color="surface-light" rounded="lg" size="40">
              <v-icon icon="mdi-crown-outline" color="premium-ink" size="22" />
            </v-avatar>
            <h2 id="user-detail-subscription" class="text-title-medium">Langganan</h2>
          </div>
          <v-row no-gutters align="center" class="py-3">
            <v-col cols="5" sm="4" class="text-body-medium text-medium-emphasis">Status langganan</v-col>
            <v-col cols="7" sm="8"><StatusChip :value="user.subscription_status" /></v-col>
          </v-row>
          <v-divider />
          <v-row no-gutters align="center" class="py-3">
            <v-col cols="5" sm="4" class="text-body-medium text-medium-emphasis">Tanggal mulai</v-col>
            <v-col cols="7" sm="8" class="text-body-medium">{{ formatDate(user.subscription_started_at) }}</v-col>
          </v-row>
          <v-divider />
          <v-row no-gutters align="center" class="py-3">
            <v-col cols="5" sm="4" class="text-body-medium text-medium-emphasis">Tanggal berakhir</v-col>
            <v-col cols="7" sm="8" class="text-body-medium">{{ formatDate(user.subscription_expired_at) }}</v-col>
          </v-row>
        </section>
      </v-card>
    </StatePanel>

    <ConfirmDialog
      v-model="confirmOpen"
      :title="isSuspended ? 'Aktifkan kembali pengguna ini?' : 'Tangguhkan pengguna ini?'"
      :message="isSuspended
        ? 'Status akun kembali menjadi Aktif. Pengguna bisa masuk dan memakai aplikasi lagi.'
        : 'Status akun menjadi Ditangguhkan. Pengguna langsung diblokir dari semua fitur pengguna dan tidak bisa masuk sampai akunnya diaktifkan kembali.'"
      :confirm-text="isSuspended ? 'Aktifkan kembali' : 'Tangguhkan'"
      :confirm-color="isSuspended ? 'success' : 'error'"
      :loading="working"
      @confirm="doToggle"
    />
  </div>
</template>
