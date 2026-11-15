<script setup>
// Public landing page (FUA4). Content only describes features that exist in
// the app; the hero illustration is decorative (no real data).
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const { isAuthenticated, homeRoute } = storeToRefs(authStore)

/** Decorative navigator state for the hero illustration (30 bubbles). */
const ANSWERED = new Set([1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 13, 14, 15, 17, 18, 20])
const CURRENT = 21
const heroBubbles = Array.from({ length: 30 }, (_, i) => {
  const n = i + 1
  return { n, filled: ANSWERED.has(n), current: n === CURRENT }
})

/** @type {{ n: number, title: string, text: string }[]} */
const steps = [
  { n: 1, title: 'Baca Materi', text: 'Pahami konsep dasar lewat materi yang disusun per topik.' },
  { n: 2, title: 'Kerjakan Latihan', text: 'Latih pemahaman tanpa batas waktu dan ulangi kapan saja.' },
  { n: 3, title: 'Uji dengan Try Out', text: 'Kerjakan paket soal berwaktu seperti di hari ujian.' },
  { n: 4, title: 'Pelajari dan pantau', text: 'Baca pembahasan tiap soal dan lihat perkembangan skormu.' }
]

const premiumBenefits = [
  'Semua Materi Premium terbuka',
  'Paket Latihan dan Try Out Premium',
  'Pembahasan lengkap tiap soal',
  'Progres Saya untuk memantau skor Try Out'
]
</script>

<template>
  <div class="landing">
    <!-- Hero -->
    <section class="app-content px-4 pt-8 pt-md-16 pb-12 pb-md-16">
      <v-row align="center">
        <v-col cols="12" md="6" class="pe-md-10">
          <h1 class="text-display-medium mb-5 landing__title">
            Siapkan tes seleksimu dengan latihan yang terukur.
          </h1>
          <p class="text-body-large text-medium-emphasis mb-8 landing__lead">
            Baca materi, kerjakan Latihan, lalu uji diri dengan Try Out berwaktu.
            Setiap soal punya pembahasan, dan skormu tercatat dari waktu ke waktu.
          </p>
          <div class="d-flex flex-wrap ga-3">
            <template v-if="isAuthenticated">
              <v-btn :to="homeRoute" color="primary" size="large">Buka dasbor</v-btn>
            </template>
            <template v-else>
              <v-btn to="/signup" color="primary" size="large">Daftar gratis</v-btn>
              <v-btn to="/login" size="large" variant="outlined" color="primary">Masuk ke akunmu</v-btn>
            </template>
          </div>
        </v-col>

        <v-col cols="12" md="6">
          <!-- Decorative: a Try Out screen reduced to its answer sheet. -->
          <div class="hero-sheet bg-surface rounded-xl pa-5 pa-sm-7" aria-hidden="true">
            <div class="d-flex align-center justify-space-between mb-5">
              <div>
                <p class="text-title-medium mb-0">Try Out</p>
                <p class="text-body-small text-medium-emphasis mb-0">16 dari 30 soal terjawab</p>
              </div>
              <div class="hero-sheet__timer d-flex align-center ga-2 px-3 py-2 rounded-lg bg-surface-light">
                <v-icon icon="mdi-timer-outline" size="18" color="primary" />
                <span class="app-figure text-title-medium">01:24:36</span>
              </div>
            </div>
            <v-progress-linear :model-value="53" height="8" class="mb-6" />
            <div class="hero-sheet__grid">
              <span
                v-for="b in heroBubbles"
                :key="b.n"
                class="app-bubble"
                :class="{ 'app-bubble--filled': b.filled, 'app-bubble--current': b.current }"
              >
                {{ b.n }}
              </span>
            </div>
            <div class="d-flex flex-wrap ga-4 mt-6 text-body-small text-medium-emphasis">
              <span class="d-inline-flex align-center ga-2">
                <span class="app-bubble app-bubble--sm app-bubble--filled" /> Terjawab
              </span>
              <span class="d-inline-flex align-center ga-2">
                <span class="app-bubble app-bubble--sm" /> Belum dijawab
              </span>
              <span class="d-inline-flex align-center ga-2">
                <span class="app-bubble app-bubble--sm app-bubble--current" /> Sedang dibuka
              </span>
            </div>
          </div>
        </v-col>
      </v-row>
    </section>

    <!-- Features -->
    <section id="fitur" class="landing__section bg-surface py-12 py-md-16">
      <div class="app-content px-4">
        <div class="text-center mx-auto mb-10 mb-md-12 landing__section-head">
          <h2 class="text-headline-large mb-3">Satu tempat untuk belajar dan berlatih</h2>
          <p class="text-body-large text-medium-emphasis mb-0">
            Mulai dari memahami materi sampai mengukur kesiapanmu sebelum hari ujian.
          </p>
        </div>

        <v-row>
          <v-col cols="12" md="7">
            <v-card color="primary" class="rounded-xl pa-6 pa-md-8 h-100 feature-lead">
              <v-icon icon="mdi-timer-outline" size="36" class="mb-6" />
              <h3 class="text-headline-small mb-3">Try Out berwaktu</h3>
              <p class="text-body-large mb-6 feature-lead__text">
                Kerjakan paket soal dengan timer yang berjalan seperti ujian sesungguhnya.
                Navigator soal membantumu berpindah soal dan melihat mana yang belum dijawab.
              </p>
              <div class="d-flex flex-wrap ga-2" aria-hidden="true">
                <span v-for="n in 7" :key="n" class="app-bubble feature-lead__bubble" :class="{ 'feature-lead__bubble--on': n < 5 }">
                  {{ n }}
                </span>
              </div>
            </v-card>
          </v-col>
          <v-col cols="12" md="5">
            <v-card class="rounded-xl pa-6 pa-md-8 h-100">
              <v-avatar color="surface-light" rounded="lg" size="48" class="mb-6">
                <v-icon icon="mdi-pencil-outline" color="primary" />
              </v-avatar>
              <h3 class="text-headline-small mb-3">Latihan tanpa tekanan waktu</h3>
              <p class="text-body-large text-medium-emphasis mb-0">
                Asah pemahaman dengan paket Latihan. Kerjakan pelan-pelan dan ulangi
                sampai kamu yakin.
              </p>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="4">
            <v-card variant="flat" class="pa-6 h-100">
              <v-icon icon="mdi-book-open-page-variant-outline" color="primary" size="28" class="mb-4" />
              <h3 class="text-title-large mb-2">Materi per topik</h3>
              <p class="text-body-medium text-medium-emphasis mb-0">
                Baca ringkasan materi sebelum mulai mengerjakan soal.
              </p>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <v-card variant="flat" class="pa-6 h-100">
              <v-icon icon="mdi-lightbulb-on-outline" color="primary" size="28" class="mb-4" />
              <h3 class="text-title-large mb-2">Pembahasan tiap soal</h3>
              <p class="text-body-medium text-medium-emphasis mb-0">
                Lihat jawaban yang benar beserta alasannya setelah selesai mengerjakan.
              </p>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card variant="flat" class="pa-6 h-100">
              <div class="d-flex align-center justify-space-between mb-4">
                <v-icon icon="mdi-chart-line" color="primary" size="28" />
                <v-chip size="small" color="premium-ink" variant="tonal" prepend-icon="mdi-crown-outline">Premium</v-chip>
              </div>
              <h3 class="text-title-large mb-2">Progres Saya</h3>
              <p class="text-body-medium text-medium-emphasis mb-0">
                Pantau perkembangan skor Try Out dari satu pengerjaan ke pengerjaan berikutnya.
              </p>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </section>

    <!-- Learning path: a real sequence, so the steps are numbered. -->
    <section id="alur" class="landing__section py-12 py-md-16">
      <div class="app-content px-4">
        <div class="text-center mx-auto mb-10 mb-md-14 landing__section-head">
          <h2 class="text-headline-large mb-3">Alur belajar yang rapi</h2>
          <p class="text-body-large text-medium-emphasis mb-0">
            Empat langkah yang bisa kamu ulangi untuk setiap topik.
          </p>
        </div>

        <ol class="steps">
          <li v-for="s in steps" :key="s.n" class="steps__item">
            <span class="app-bubble app-bubble--lg app-bubble--filled steps__bubble">{{ s.n }}</span>
            <h3 class="text-title-large mt-4 mb-2">{{ s.title }}</h3>
            <p class="text-body-medium text-medium-emphasis mb-0">{{ s.text }}</p>
          </li>
        </ol>
      </div>
    </section>

    <!-- Premium -->
    <section id="premium" class="landing__section pb-12 pb-md-16">
      <div class="app-content px-4">
        <v-card color="navy" class="rounded-xl pa-6 pa-sm-10 pa-md-12 premium-card">
          <v-row align="center">
            <v-col cols="12" md="6">
              <v-chip color="premium" variant="flat" size="small" prepend-icon="mdi-crown" class="mb-5">
                Premium
              </v-chip>
              <h2 class="text-headline-large mb-4">Buka semua paket soal dan pembahasannya</h2>
              <p class="text-body-large mb-8 premium-card__text">
                Mulai dengan akun Gratis, lalu upgrade saat kamu butuh akses penuh.
              </p>
              <template v-if="isAuthenticated">
                <v-btn :to="homeRoute" color="premium" size="large">Buka dasbor</v-btn>
              </template>
              <template v-else>
                <v-btn to="/signup" color="premium" size="large">Daftar sekarang</v-btn>
              </template>
            </v-col>
            <v-col cols="12" md="6">
              <ul class="premium-card__list">
                <li v-for="b in premiumBenefits" :key="b" class="d-flex align-center ga-3">
                  <v-icon icon="mdi-check-circle" color="premium" size="22" />
                  <span class="text-body-large">{{ b }}</span>
                </li>
              </ul>
            </v-col>
          </v-row>
        </v-card>
      </div>
    </section>
  </div>
</template>

<style scoped>
.landing__title {
  max-width: 16ch;
}

.landing__lead {
  max-width: 52ch;
}

.landing__section {
  scroll-margin-top: 96px;
}

.landing__section-head {
  max-width: 40rem;
}

/* Hero answer sheet */
.hero-sheet {
  border: 1px solid rgb(var(--app-line));
  box-shadow: var(--app-shadow-raised);
}

.hero-sheet__grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  justify-items: center;
}

.hero-sheet__grid .app-bubble {
  --app-bubble-size: clamp(32px, 9vw, 42px);
}

@media (min-width: 960px) {
  .hero-sheet__grid .app-bubble {
    --app-bubble-size: 40px;
  }
}

/* Lead feature (Try Out) */
.feature-lead__text {
  max-width: 48ch;
  color: rgb(255 255 255 / 0.88);
}

.feature-lead__bubble {
  background: transparent;
  border-color: rgb(255 255 255 / 0.55);
  color: #fff;
}

.feature-lead__bubble--on {
  background: #fff;
  border-color: #fff;
  color: rgb(var(--v-theme-primary));
}

/* Steps */
.steps {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 32px;
  grid-template-columns: 1fr;
}

.steps__item {
  position: relative;
}

.steps__item p {
  max-width: 34ch;
}

@media (min-width: 600px) {
  .steps {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 960px) {
  .steps {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 24px;
  }

  /* Connector line between bubbles. */
  .steps__item:not(:last-child)::after {
    content: '';
    position: absolute;
    top: 20px;
    left: 56px;
    right: -12px;
    border-top: 2px dashed rgb(var(--app-line-strong) / 0.6);
  }
}

/* Premium */
.premium-card__text {
  color: rgb(255 255 255 / 0.78);
  max-width: 44ch;
}

.premium-card__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 16px;
}
</style>
