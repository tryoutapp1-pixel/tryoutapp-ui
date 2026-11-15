<script setup>
// FA1 - read-only user list. Backend: GET /admin/users?page=&limit=
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useAdminUsersStore } from '../../stores/adminUsers'
import PageHeader from '../../components/PageHeader.vue'
import StatePanel from '../../components/StatePanel.vue'
import StatusChip from '../../components/StatusChip.vue'
import { formatDate } from '../../lib/format'

const router = useRouter()
const store = useAdminUsersStore()
const { items, pagination, loading, error } = storeToRefs(store)

/** @param {number} [page=1] */
function load(page = 1) {
  store.fetchList({ page, limit: pagination.value.limit })
}

onMounted(() => load(1))
</script>

<template>
  <div>
    <PageHeader title="Pengguna" subtitle="Semua akun yang terdaftar di aplikasi." />

    <StatePanel
      :loading="loading"
      :error="error"
      :empty="!loading && !error && items.length === 0"
      empty-text="Belum ada pengguna yang terdaftar."
      empty-icon="mdi-account-off-outline"
      @retry="load(pagination.page)"
    >
      <v-card variant="flat">
        <v-table hover>
          <thead>
            <tr>
              <th>Peran</th>
              <th>Nama</th>
              <th>Email</th>
              <th>Status</th>
              <!-- <th>Registered</th> -->
              <th>Langganan</th>
              <!-- <th>Start Date</th>
              <th>Expired Date</th> -->
              <th class="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in items" :key="u.id">
              <td><StatusChip :value="u.role" /></td>
              <td class="font-weight-medium">{{ u.name }}</td>
              <td>{{ u.email }}</td>
              <td class="text-no-wrap"><StatusChip :value="u.status" /></td>
              <!-- <td>{{ formatDate(u.created_at) }}</td> -->
              <td><StatusChip :value="u.subscription_status" /></td>
              <!-- <td>{{ formatDate(u.subscription_started_at) }}</td>
              <td>{{ formatDate(u.subscription_expired_at) }}</td> -->
              <td class="text-right">
                <v-tooltip text="Lihat detail">
                  <template #activator="{ props: tip }">
                    <v-btn
                      v-bind="tip"
                      size="small"
                      variant="text"
                      color="primary"
                      icon="mdi-eye-outline"
                      :aria-label="`Lihat detail ${u.name}`"
                      @click="router.push(`/admin/users/${u.id}`)"
                    />
                  </template>
                </v-tooltip>
              </td>
            </tr>
          </tbody>
        </v-table>

        <div v-if="pagination.totalPages > 1" class="d-flex justify-center py-4">
          <v-pagination
            :model-value="pagination.page"
            :length="pagination.totalPages"
            :total-visible="7"
            @update:model-value="load"
          />
        </div>
      </v-card>
    </StatePanel>
  </div>
</template>
