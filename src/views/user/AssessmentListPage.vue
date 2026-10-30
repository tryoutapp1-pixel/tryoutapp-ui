<script setup>
// FU10 (Latihan list) / FU17 (Try Out list). One page, parameterized by the
// route meta `kind` ('latihan' | 'tryout'). The backend returns released,
// access-appropriate assessments with a question_count (and duration_minutes
// for Try Out). Cards link to the detail page.
import { computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAssessmentsStore } from '../../stores/assessments'
import PageHeader from '../../components/PageHeader.vue'
import StatePanel from '../../components/StatePanel.vue'
import StatusChip from '../../components/StatusChip.vue'

const route = useRoute()
const store = useAssessmentsStore()

const kind = computed(() => route.meta.kind || 'latihan')
const isTryout = computed(() => kind.value === 'tryout')
const slice = computed(() => store[kind.value])

const heading = computed(() => (isTryout.value ? 'Try Out' : 'Latihan'))
const subtitle = computed(() =>
  isTryout.value ? 'Timed assessment packages.' : 'Untimed practice packages.'
)

function load(page = 1) {
  store.fetchList(kind.value, { page, limit: slice.value.pagination.limit })
}

onMounted(() => load(1))
watch(kind, () => load(1))
</script>

<template>
  <div>
    <PageHeader :title="heading" :subtitle="subtitle" />

    <StatePanel
      :loading="slice.loading"
      :error="slice.error"
      :empty="!slice.loading && !slice.error && slice.items.length === 0"
      :empty-text="`No ${heading} packages are available yet.`"
      empty-icon="mdi-clipboard-text-outline"
      @retry="load(slice.pagination.page)"
    >
      <v-row>
        <v-col v-for="a in slice.items" :key="a.id" cols="12" sm="6" md="4">
          <v-card
            :to="`/app/${kind}/${a.id}`"
            variant="outlined"
            class="pa-5 h-100 d-flex flex-column"
            hover
          >
            <div class="d-flex align-center justify-space-between mb-2">
              <StatusChip :value="a.type" />
              <StatusChip :value="a.access_type" />
            </div>
            <h3 class="text-subtitle-1 font-weight-bold mb-1">{{ a.title }}</h3>
            <p class="text-body-2 text-medium-emphasis mb-3 flex-grow-1">
              {{ a.description || 'No description.' }}
            </p>
            <div class="d-flex align-center ga-4 text-caption text-medium-emphasis">
              <span class="d-flex align-center ga-1">
                <v-icon icon="mdi-help-circle-outline" size="16" />
                {{ a.question_count }} questions
              </span>
              <span v-if="isTryout && a.duration_minutes" class="d-flex align-center ga-1">
                <v-icon icon="mdi-timer-outline" size="16" />
                {{ a.duration_minutes }} min
              </span>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <div v-if="slice.pagination.totalPages > 1" class="d-flex justify-center mt-4">
        <v-pagination
          :model-value="slice.pagination.page"
          :length="slice.pagination.totalPages"
          :total-visible="7"
          @update:model-value="load"
        />
      </div>
    </StatePanel>
  </div>
</template>
