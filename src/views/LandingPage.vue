<template>
  <section class="hero-section">
    <div class="hero-copy">
      <v-chip color="secondary" variant="tonal" prepend-icon="mdi-school-outline">Persiapan ujian lebih terarah</v-chip>
      <h1>Siap menghadapi <span>langkah berikutnya?</span></h1>
      <p>Ruang belajar dan latihan yang membantu kamu membangun kebiasaan belajar dengan lebih teratur.</p>
      <div class="hero-actions">
        <v-btn color="primary" size="large" to="/signup" append-icon="mdi-arrow-right">Buat akun gratis</v-btn>
        <span class="hero-note">Latihan kapan saja, dari mana saja.</span>
      </div>
    </div>
    <div class="hero-visual" aria-hidden="true">
      <div class="visual-orbit orbit-one"></div><div class="visual-orbit orbit-two"></div>
      <v-card class="study-card" elevation="8">
        <div class="study-card-icon"><v-icon icon="mdi-book-open-page-variant-outline" /></div>
        <div class="study-card-title">Rencana belajar</div>
        <div class="study-line wide"></div><div class="study-line"></div>
        <div class="study-progress"><span></span></div>
        <div class="study-card-caption">Satu langkah setiap hari</div>
      </v-card>
      <div class="floating-dot dot-one"></div><div class="floating-dot dot-two"></div>
    </div>
  </section>
  <section class="value-strip" aria-label="Manfaat Tryout App">
    <div><v-icon icon="mdi-book-open-variant" color="primary" /><span>Akses materi belajar</span></div>
    <div><v-icon icon="mdi-pencil-ruler-outline" color="primary" /><span>Latihan dan Try Out</span></div>
    <div><v-icon icon="mdi-chart-box-outline" color="primary" /><span>Lihat hasil dan statistik Try Out</span></div>
  </section>
  <section class="landing-details">
    <div class="page-eyebrow">BELAJAR DALAM SATU ALUR</div>
    <h2>Persiapkan diri dengan lebih terstruktur</h2>
    <div class="landing-feature-grid">
      <v-card class="landing-feature" variant="flat"><v-icon icon="mdi-book-multiple-outline" color="primary" size="28" /><h3>Materi belajar</h3><p>Buka materi yang tersedia untuk akunmu dan pelajari sesuai kebutuhan.</p></v-card>
      <v-card class="landing-feature" variant="flat"><v-icon icon="mdi-clipboard-text-outline" color="secondary" size="28" /><h3>Latihan dan Try Out</h3><p>Kerjakan latihan dan Try Out, lalu lihat hasil pengerjaanmu.</p></v-card>
      <v-card class="landing-feature" variant="flat"><v-icon icon="mdi-chart-line" color="primary" size="28" /><h3>Perkembangan</h3><p>Tinjau hasil dan statistik Try Out yang tercatat pada akunmu.</p></v-card>
    </div>
  </section>
</template>
