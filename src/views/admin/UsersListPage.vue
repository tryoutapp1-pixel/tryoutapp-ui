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
    <PageHeader title="Users" subtitle="All registered accounts." />

    <StatePanel
      :loading="loading"
      :error="error"
      :empty="!loading && !error && items.length === 0"
      empty-text="No users found."
      @retry="load(pagination.page)"
    >
      <v-card>
        <v-table>
          <thead>
            <tr>
              <th>Role</th>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <!-- <th>Registered</th> -->
              <th>Subscription</th>
              <!-- <th>Start Date</th>
              <th>Expired Date</th> -->
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in items" :key="u.id">
              <td><StatusChip :value="u.role" /></td>
              <td class="font-weight-medium">{{ u.name }}</td>
              <td>{{ u.email }}</td>
              <td><StatusChip :value="u.status" /></td>
              <!-- <td>{{ formatDate(u.created_at) }}</td> -->
              <td><StatusChip :value="u.subscription_status" /></td>
              <!-- <td>{{ formatDate(u.subscription_started_at) }}</td>
              <td>{{ formatDate(u.subscription_expired_at) }}</td> -->
              <td class="text-right">
                <v-btn
                  size="small"
                  variant="text"
                  icon="mdi-eye-outline"
                  @click="router.push(`/admin/users/${u.id}`)"
                />
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
