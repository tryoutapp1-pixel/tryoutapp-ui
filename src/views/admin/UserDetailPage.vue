<script setup>
// FA2 - user detail + suspend/reactivate (FR baru).
// Backend: GET /admin/users/:id, PATCH /admin/users/:id/suspend|reactivate.
// Only USER accounts can be suspended; a not-yet-verified account cannot.
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminUsersStore } from '../../stores/adminUsers'
import { useUiStore } from '../../stores/ui'
import PageHeader from '../../components/PageHeader.vue'
import StatePanel from '../../components/StatePanel.vue'
import StatusChip from '../../components/StatusChip.vue'
import ConfirmDialog from '../../components/ConfirmDialog.vue'
import { formatDate } from '../../lib/format'

const route = useRoute()
const router = useRouter()
const store = useAdminUsersStore()
const uiStore = useUiStore()

const user = ref(null)
const loading = ref(false)
const error = ref('')

const isSuspended = computed(() => user.value && user.value.status === 'SUSPENDED')
// Suspend/reactivate only applies to verified USER accounts.
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
    uiStore.success(suspend ? 'User suspended.' : 'User reactivated.')
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
    <PageHeader title="User detail">
      <template #actions>
        <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="router.push('/admin/users')">
          Back
        </v-btn>
        <v-btn
          v-if="canToggle"
          :color="isSuspended ? 'success' : 'error'"
          variant="flat"
          :prepend-icon="isSuspended ? 'mdi-account-check-outline' : 'mdi-account-cancel-outline'"
          @click="askToggle"
        >
          {{ isSuspended ? 'Reactivate' : 'Suspend' }}
        </v-btn>
      </template>
    </PageHeader>

    <StatePanel :loading="loading" :error="error" @retry="load">
      <v-card v-if="user" class="pa-6" max-width="640">
        <v-row class="mb-2"><v-col cols="4" class="text-medium-emphasis">ID</v-col><v-col cols="8">{{ user.id }}</v-col></v-row>
        <v-divider class="my-2" />
        <v-row class="mb-2"><v-col cols="4" class="text-medium-emphasis">Role</v-col><v-col cols="8"><StatusChip :value="user.role" /></v-col></v-row>
        <v-divider class="my-2" />
        <v-row class="mb-2"><v-col cols="4" class="text-medium-emphasis">Name</v-col><v-col cols="8" class="font-weight-medium">{{ user.name }}</v-col></v-row>
        <v-divider class="my-2" />
        <v-row class="mb-2"><v-col cols="4" class="text-medium-emphasis">Email</v-col><v-col cols="8">{{ user.email }}</v-col></v-row>
        <v-divider class="my-2" />
        <v-row class="mb-2"><v-col cols="4" class="text-medium-emphasis">Status</v-col><v-col cols="8"><StatusChip :value="user.status" /></v-col></v-row>
        <v-divider class="my-2" />
        <v-row class="mb-2"><v-col cols="4" class="text-medium-emphasis">Email verified</v-col><v-col cols="8">{{ formatDate(user.email_verified_at) }}</v-col></v-row>
        <v-divider class="my-2" />
        <v-row class="mb-2"><v-col cols="4" class="text-medium-emphasis">Created</v-col><v-col cols="8">{{ formatDate(user.created_at) }}</v-col></v-row>
        <v-divider class="my-2" />
        <v-row class="mb-2"><v-col cols="4" class="text-medium-emphasis">Subscription</v-col><v-col cols="8"><StatusChip :value="user.subscription_status" /></v-col></v-row>
        <v-divider class="my-2" />
        <v-row class="mb-2"><v-col cols="4" class="text-medium-emphasis">Start Date</v-col><v-col cols="8">{{ formatDate(user.subscription_started_at) }}</v-col></v-row>
        <v-divider class="my-2" />
        <v-row class="mb-2"><v-col cols="4" class="text-medium-emphasis">Expired Date</v-col><v-col cols="8">{{ formatDate(user.subscription_expired_at) }}</v-col></v-row>
      </v-card>
    </StatePanel>

    <ConfirmDialog
      v-model="confirmOpen"
      :title="isSuspended ? 'Reactivate user?' : 'Suspend user?'"
      :message="isSuspended
        ? 'This restores the account to ACTIVE and allows the user to sign in and use the app again.'
        : 'This sets the account to SUSPENDED. The user is blocked from all user endpoints immediately and cannot sign in until reactivated.'"
      :confirm-text="isSuspended ? 'Reactivate' : 'Suspend'"
      :confirm-color="isSuspended ? 'success' : 'error'"
      :loading="working"
      @confirm="doToggle"
    />
  </div>
</template>
