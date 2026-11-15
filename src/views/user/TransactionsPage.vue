<script setup>
// FU7 - transaction history. Lists the signed-in user's transactions with
// amount, order ID, payment method, status, and date. Paginated through the
// backend's page/limit. Read-only; statuses come straight from the backend.
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSubscriptionStore } from '../../stores/subscription'
import PageHeader from '../../components/PageHeader.vue'
import StatePanel from '../../components/StatePanel.vue'
import StatusChip from '../../components/StatusChip.vue'
import { formatCurrency, formatDate } from '../../lib/format'

/**
 * @typedef {Object} TableHeader
 * @property {string} title - Column label
 * @property {keyof import('../../types/api').Transaction} key - Transaction field shown in the column
 * @property {boolean} sortable
 * @property {'start'|'center'|'end'} [align] - Column alignment (amounts align right)
 */

const store = useSubscriptionStore()
const { transactions, transactionsPagination, transactionsLoading, transactionsError } =
  storeToRefs(store)

/** @type {TableHeader[]} */
const headers = [
  { title: 'ID pesanan', key: 'order_id', sortable: false },
  { title: 'Jumlah', key: 'amount', sortable: false, align: 'end' },
  { title: 'Metode', key: 'payment_method', sortable: false },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Tanggal', key: 'created_at', sortable: false }
]

/** @param {number} [page=1] */
function load(page = 1) {
  store.fetchTransactions({ page, limit: transactionsPagination.value.limit })
}

onMounted(() => load(1))
</script>

<template>
  <div>
    <PageHeader title="Transaksi" subtitle="Riwayat pembayaranmu." />

    <StatePanel
      :loading="transactionsLoading"
      :error="transactionsError"
      :empty="!transactionsLoading && !transactionsError && transactions.length === 0"
      empty-text="Belum ada transaksi. Pembayaran yang kamu lakukan akan muncul di sini."
      empty-icon="mdi-receipt-text-outline"
      @retry="load(transactionsPagination.page)"
    >
      <v-card variant="flat" class="overflow-hidden">
        <v-data-table
          :headers="headers"
          :items="transactions"
          :items-per-page="transactionsPagination.limit"
          hide-default-footer
        >
          <template #[`item.order_id`]="{ item }">
            <span class="font-mono text-body-medium text-no-wrap">{{ item.order_id }}</span>
          </template>
          <template #[`item.amount`]="{ item }">
            <span class="tx-amount text-title-small text-no-wrap">{{ formatCurrency(item.amount) }}</span>
          </template>
          <template #[`item.payment_method`]="{ item }">
            <span class="text-body-medium">{{ item.payment_method || '-' }}</span>
          </template>
          <template #[`item.status`]="{ item }">
            <StatusChip :value="item.status" />
          </template>
          <template #[`item.created_at`]="{ item }">
            <span class="tx-date text-body-medium text-medium-emphasis text-no-wrap">{{ formatDate(item.created_at) }}</span>
          </template>
        </v-data-table>
      </v-card>

      <div v-if="transactionsPagination.totalPages > 1" class="d-flex justify-center mt-4">
        <v-pagination
          :model-value="transactionsPagination.page"
          :length="transactionsPagination.totalPages"
          :total-visible="7"
          @update:model-value="load"
        />
      </div>
    </StatePanel>
  </div>
</template>

<style scoped>
.font-mono {
  font-family: ui-monospace, 'Cascadia Mono', Consolas, monospace;
}

.tx-amount,
.tx-date {
  font-variant-numeric: tabular-nums;
}
</style>
