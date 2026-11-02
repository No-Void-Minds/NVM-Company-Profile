<script setup lang="ts">
import AppButton from '@/components/AppButton.vue'
import SectionHeading from '@/components/SectionHeading.vue'
import { WHATSAPP_DISPLAY, whatsappUrl } from '@/composables/site'
</script>

<template>
  <div class="wrap section">
    <SectionHeading
      level="h1"
      number="Privasi"
      title="Kebijakan privasi"
      lead="Halaman ini menjelaskan data yang kami simpan dari formulir B2B dan hak kamu atas data itu, sesuai UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi."
    />

    <div class="mt-6 grid max-w-[720px] gap-6">
      <section>
        <h2 class="text-h3">Data yang disimpan</h2>
        <p class="mt-2 text-muted">
          Dari formulir inquiry B2B: jenis kerja sama, nama, nama usaha atau komunitas, kota,
          WhatsApp, email, kanal penjualan, tech yang diminati, perkiraan jumlah, pesan, dan waktu
          persetujuan. Alamat IP tidak disimpan apa adanya, hanya dalam bentuk hash, dan dipakai
          untuk membatasi kiriman berlebihan.
        </p>
      </section>

      <section>
        <h2 class="text-h3">Tujuan</h2>
        <p class="mt-2 text-muted">
          Data hanya dipakai untuk menjawab inquiry yang kamu kirim. Kami tidak memakainya untuk
          tujuan lain.
        </p>
      </section>

      <section>
        <h2 class="text-h3">Lama penyimpanan</h2>
        <p class="mt-2 text-muted">Data inquiry disimpan 12 bulan, lalu dihapus.</p>
      </section>

      <section>
        <h2 class="text-h3">Testimoni</h2>
        <p class="mt-2 text-muted">
          Tangkapan layar ulasan dari Shopee dan TikTok Shop hanya kami tampilkan setelah nama akun
          dan foto profil pembeli diburamkan, kecuali pembeli memberi izin.
        </p>
      </section>

      <section>
        <h2 class="text-h3">Meminta penghapusan</h2>
        <p class="mt-2 text-muted">
          Hubungi kami lewat WhatsApp {{ WHATSAPP_DISPLAY }}. Sertakan kode inquiry bila masih ada.
        </p>
        <AppButton
          variant="secondary"
          :href="whatsappUrl('Halo NVM, saya ingin meminta penghapusan data inquiry saya.')"
          class="mt-3"
        >
          Minta penghapusan data
        </AppButton>
      </section>
    </div>
  </div>
</template>
