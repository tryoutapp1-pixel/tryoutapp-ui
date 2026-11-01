<script setup>
// FU15 / FU22 - explanations. Renders backend explanation data: the question,
// each option, the correct option (derived from option.score > 0, per the
// backend scoring model), and the written explanation + optional explanation
// image (short-lived signed URL).
//
// The explanations endpoint does NOT return the user's own selected answer, and
// the attempt-detail endpoint stops returning answers once an attempt is
// finalized (it returns 409). So "your answer" is shown only when it is still
// available from the just-completed attempt in this session (userAnswers prop).
// This avoids inventing data the backend does not provide.
import { ref } from 'vue'
import SignedImage from './SignedImage.vue'
import PremiumNotice from './PremiumNotice.vue'

const props = defineProps({
  questions: { type: Array, default: () => [] }, // backend explanation items
  // Optional: questionId -> selectedOptionId, from the current-session attempt.
  userAnswers: { type: Object, default: () => ({}) },
  // Premium gate (Feature 3 / Feature 4). When false, the written explanation
  // and explanation image are hidden and a Premium prompt is shown instead.
  // Question results (options, correct answer, the user's choice) remain
  // visible so Free users still get their results. NOTE: this is presentation
  // only — the backend currently still returns explanation data to Free users,
  // so this is NOT an access-control guarantee (see backend dependency note).
  showExplanation: { type: Boolean, default: true }
})
const emit = defineEmits(['refresh'])

const activeIndex = ref(0)

function isCorrect(opt) {
  return Number(opt.score) > 0
}
function isUserChoice(question, opt) {
  return props.userAnswers[question.id] === opt.id
}
function hasUserAnswers() {
  return Object.keys(props.userAnswers).length > 0
}

function go(i) {
  if (i >= 0 && i < props.questions.length) activeIndex.value = i
}
</script>

<template>
  <div>
    <!-- Question number strip -->
    <div class="nav-grid mb-4">
      <v-btn
        v-for="(q, i) in questions"
        :key="q.id"
        size="small"
        :variant="i === activeIndex ? 'flat' : 'tonal'"
        :color="i === activeIndex ? 'info' : 'grey'"
        class="nav-tile"
        @click="go(i)"
      >
        {{ q.number }}
      </v-btn>
    </div>

    <template v-for="(q, i) in questions" :key="q.id">
      <v-card v-show="i === activeIndex" variant="outlined" class="pa-6">
        <div class="d-flex align-center ga-2 mb-3">
          <span class="text-subtitle-1 font-weight-bold">Question {{ q.number }}</span>
          <v-chip size="x-small" variant="tonal" color="secondary">{{ q.type }}</v-chip>
        </div>

        <p class="text-body-1 mb-4" style="white-space: pre-line">{{ q.question }}</p>
        <SignedImage
          v-if="q.question_image_url"
          :src="q.question_image_url"
          :alt="`Explanation ${q.number} image`"
          @refresh="emit('refresh')"
        />

        <v-list class="mb-4" density="comfortable">
          <v-list-item
            v-for="opt in q.options"
            :key="opt.id"
            :class="{
              'bg-success-subtle': isCorrect(opt),
              'option-wrong-choice': isUserChoice(q, opt) && !isCorrect(opt)
            }"
            class="rounded mb-1"
          >
            <template #prepend>
              <v-icon
                v-if="isCorrect(opt)"
                icon="mdi-check-circle"
                color="success"
              />
              <v-icon
                v-else-if="isUserChoice(q, opt)"
                icon="mdi-close-circle"
                color="error"
              />
              <v-icon v-else icon="mdi-circle-outline" color="grey" />
            </template>
            <v-list-item-title>
              <span class="font-weight-medium me-1">{{ opt.code }}.</span>{{ opt.text }}
            </v-list-item-title>
            <template #append>
              <v-chip v-if="isCorrect(opt)" size="x-small" color="success" variant="flat">
                Correct answer
              </v-chip>
              <v-chip
                v-else-if="isUserChoice(q, opt)"
                size="x-small"
                color="error"
                variant="flat"
              >
                Your answer
              </v-chip>
            </template>

            <SignedImage
              v-if="opt.image_url"
              :src="opt.image_url"
              :alt="`Explanation ${q.number} image`"
              @refresh="emit('refresh')"
            />
          </v-list-item>
        </v-list>

        <v-alert
          v-if="!hasUserAnswers()"
          type="info"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          Your selected answers are only available right after submitting this attempt.
        </v-alert>

        <v-divider class="mb-3" />
        <h4 class="text-subtitle-2 font-weight-bold mb-2">Explanation</h4>

        <template v-if="showExplanation">
          <p class="text-body-2 mb-3" style="white-space: pre-line">
            {{ q.explanation || 'No explanation provided.' }}
          </p>
          <SignedImage
            v-if="q.explanation_image_url"
            :src="q.explanation_image_url"
            :alt="`Explanation ${q.number} image`"
            @refresh="emit('refresh')"
          />
        </template>

        <PremiumNotice
          v-else
          title="Explanations are a Premium feature"
          message="Your results and the correct answers are shown above. Upgrade to Premium to read the full explanation for every question."
        />

        <div class="d-flex justify-space-between mt-5">
          <v-btn variant="text" :disabled="activeIndex === 0" prepend-icon="mdi-chevron-left" @click="go(activeIndex - 1)">
            Previous
          </v-btn>
          <v-btn
            variant="text"
            :disabled="activeIndex === questions.length - 1"
            append-icon="mdi-chevron-right"
            @click="go(activeIndex + 1)"
          >
            Next
          </v-btn>
        </div>
      </v-card>
    </template>
  </div>
</template>

<style scoped>
.nav-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  gap: 8px;
}
.nav-tile {
  min-width: 0;
  padding: 0;
}
.bg-success-subtle {
  background-color: rgba(var(--v-theme-success), 0.1);
}
.option-wrong-choice {
  background-color: rgba(var(--v-theme-error), 0.08);
}
</style>
