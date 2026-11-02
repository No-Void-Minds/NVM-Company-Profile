<script setup lang="ts">
import AppButton from '@/components/AppButton.vue'
import SectionHeading from '@/components/SectionHeading.vue'
</script>

<template>
  <div class="wrap section">
    <SectionHeading
      level="h1"
      number="404"
      title="Halaman ini tidak ada"
      lead="Alamatnya mungkin salah ketik, atau halamannya sudah pindah."
    />
    <div class="mt-4 flex flex-wrap gap-2">
      <AppButton to="/">Kembali ke Beranda</AppButton>
      <AppButton to="/teknologi" variant="secondary">Lihat 11 material system</AppButton>
    </div>
  </div>
</template>
