# Audit UX untuk Sprint 22

Tanggal: 16 November 2026, di akhir Sprint 21. Status Sprint 22: semua temuan selesai kecuali 9 (pagination Inquiry dan Log audit), yang ditunda karena butuh `limit` dan `offset` di API. Pedoman dari ui-ux-pro-max `--domain ux`, dipakai di dalam identitas v1.2 (Lab Notebook, token warna, D-DIN, swatch, Knit Field, Ruler).

Bahan:

- 80 screenshot di `docs/audit-sprint22/` dengan pola nama `<halaman>-<lebar>.jpg`. Lebar 375, 768, 1024, dan 1440. Tangkapan penuh dibuat di 375 dan 1440, sedangkan di 768 dan 1024 hanya layar pertama. Tema gelap ditambah untuk empat halaman di 375 (`-375-gelap.jpg`).
- Pengukuran otomatis per halaman: tinggi header, posisi H1 dan CTA, tinggi halaman, ukuran huruf terkecil, dan `aria-current`.
- Data dari `nvm_compro_test` lewat dev server (5175). Halaman admin dimuat dengan akun `uji-admin`, jadi daftarnya berisi data uji.

## Temuan

Prioritas: TINGGI bila menghambat jalur beli atau ukuran, SEDANG bila memperlambat tugas utama, RENDAH untuk kenyamanan. Ukuran: S (kurang dari 30 baris), M (30 sampai 150), L (lebih dari 150).

| No | Halaman | Lebar layar | Masalah | Pedoman ui-ux-pro-max yang dilanggar | Usulan | Dampak ke identitas v1.2 | Ukuran | Prioritas |
|---|---|---|---|---|---|---|---|---|
| 1 | Produk (`produk-375.jpg`) | 375, 768 | Kolom Fitted dan Polo di matriks Core terpotong, dan teks "Tanpa pilihan fit" hilang di tepi. Tabel bisa digeser, tetapi petunjuknya hanya untuk pembaca layar (`aria-label` "bisa digeser ke samping"). Pengunjung HP bisa mengira hanya ada fit Regular. | Table Handling (Do: horizontal scroll or card layout), Horizontal Scroll (Do: ensure content fits viewport width) | Di bawah 768 px, tampilkan satu blok per tech berisi fit dan link-nya. Alternatif lebih kecil: kolom tech menempel di kiri, ditambah teks kecil "Geser tabel untuk fit lain" yang terlihat. | Netral. Garis dan swatch tetap, tanpa warna baru. | M | TINGGI |
| 2 | Size (`size-375.jpg`) | 375 | Kolom kelima size chart (tinggi badan) terpotong tanpa petunjuk visual. Itu justru kolom yang dipakai rekomendasi "dari tinggi badan". | Table Handling, Horizontal Scroll | Kolom Size menempel di kiri, ditambah petunjuk geser yang terlihat. Atau di HP tampilkan baris terpilih sebagai kartu (S, M, L) dengan semua ukurannya. | Netral. Ruler dan grid ukur tetap. | M | TINGGI |
| 3 | Size | 375, 768 | Teks "Isi data di samping untuk melihat rekomendasi." salah arah di HP dan tablet, karena isian ada di atas, bukan di samping. | Error Placement dan Inline Validation (petunjuk harus menunjuk ke field yang benar) | Kalimat netral di dua bahasa, misalnya "Isi tinggi badan atau ukuran kaos untuk melihat rekomendasi." Perlu persetujuan teks. | Tidak ada. | S | SEDANG |
| 4 | Size | 375 | Setelah tinggi badan diisi, hasilnya (baris tabel dan jarum Ruler) ada 150 sampai 400 px di bawah isian. Saat keyboard HP terbuka, hasil itu tidak terlihat sama sekali. | Success Feedback (Do: show success message or visual change), Loading Indicators (preserve layout focus and accessible busy status) | Satu baris hasil tepat di bawah isian ("Rekomendasi: L") dengan `aria-live="polite"`. Tabel dan Ruler tetap di tempatnya. | Positif. Memakai label spec yang sudah ada. | S | SEDANG |
| 5 | Size, versi ID | semua | Catatan size chart tampil dua kali dalam dua bahasa: "Toleransi 1 sampai 2 cm. Tinggi badan hanya rekomendasi." dari kamus, lalu catatan asli toko berbahasa Inggris dari data. | Tidak ada padanan langsung di basis data (pencarian "consistency patterns" kosong). Dasarnya Truncation (Do: truncate with expand option) | Di versi ID, tampilkan catatan asli di dalam `<details>` berlabel "Catatan asli toko", atau hapus baris kamus yang isinya sama. | Tidak ada. | S | RENDAH |
| 6 | Beranda (`beranda-375.jpg`) | 375 | H1 "Fabric first." baru mulai di 383 px. Sepertiga atas layar pertama hanya kanvas Knit Field, sehingga pesan dan CTA turun ke area bawah. | Mobile First (Do: start with mobile styles). Ditambah "one focal point per screen" dari anti-slop, bukan dari ui-ux-pro-max | Kurangi tinggi hero di bawah 768 px supaya H1 mulai sekitar 200 px. Knit Field tetap mengisi latar di belakang teks. | Kecil. Motif tetap, hanya ruangnya yang berkurang. | S | RENDAH |
| 7 | B2B (`b2b-375.jpg`) | 375 | Halaman 3786 px. Daftar 10 tech dengan checkbox memakan sekitar 480 px dalam satu kolom. | Overwhelm upfront (anti-pattern Forms), Touch Spacing | Daftar tech dua kolom mulai 360 px. Target tetap 44 px, jarak antarbaris 8 px. | Tidak ada. | S | RENDAH |
| 8 | Admin, semua halaman (`admin-*-375.jpg`) | 375, 768 | Header admin setinggi 209 px di 375 dan 165 px di 768, karena tujuh link navigasi turun ke beberapa baris. Seperempat layar habis sebelum isi halaman. | Navigation Patterns (anti-pattern: overloaded nav), Touch Target Size | Di bawah 768 px, navigasi admin menjadi satu baris yang bisa digeser, atau satu `select` "Pindah ke". Link "Lihat situs" dan "Keluar" tetap terlihat. | Tidak ada. Admin memakai token yang sama. | M | SEDANG |
| 9 | Admin Inquiry dan Log audit (`admin-inquiry-375.jpg`, `admin-audit-375.jpg`) | semua | Semua baris dimuat sekaligus. Dengan data uji, Inquiry setinggi 8900 sampai 9100 px dan Log audit 12.600 sampai 18.800 px. Tidak ada jumlah total atau batas halaman. | virtualize-lists (Performance), Truncation (Do: truncate with expand option) | Tampilkan jumlah total dan 50 baris pertama dengan tombol "Muat 50 lagi". Perlu `limit` dan `offset` di API admin, jadi `docs/openapi.yaml` ikut berubah. | Tidak ada. | M | SEDANG |
| 10 | Admin Inquiry | 375 | Tabel sempit: kode "B2B-XXXXXX" pecah ke dua baris, nama terpotong. | Table Handling (card layout di layar kecil) | Di bawah 768 px, satu kartu per inquiry berisi kode, jenis, nama, waktu, dan status. | Tidak ada. | M | RENDAH |
| 11 | Admin Tech dan collab (`admin-katalog-375.jpg`) | 375, 768 | Halaman 5600 sampai 7500 px untuk 11 tech dan 10 collab, tanpa cara melompat ke tech tertentu. | Navigation Patterns (Deep linking, predictable orientation) | Daftar nama tech di atas sebagai link anchor ke baris masing-masing, atau baris yang bisa dilipat. | Tidak ada. | S | RENDAH |
| 12 | Size dan Produk | 375, 768 | Judul kolom tabel memakai label spec 12 px huruf besar mono, misalnya "WIDTH / LEBAR BADAN" yang pecah ke tiga baris. Di tabel, judul kolom adalah data, bukan hiasan. | Typography (anti-pattern: text < 12px body, line-height 1.5 untuk teks) | Judul kolom tabel 14 px huruf biasa. Label spec tetap untuk penanda bagian. | Kecil. Label spec sebagai motif tetap dipakai di tempat lain. | S | RENDAH |

## Checklist pre-delivery ui-ux-pro-max

| Butir | 375 | 768 | 1024 | 1440 | Bukti |
|---|---|---|---|---|---|
| Tanpa emoji sebagai ikon (SVG) | PASS | PASS | PASS | PASS | Ikon dari `IconSvg.vue`. Grep emoji di sumber: 0. |
| `cursor: pointer` di semua elemen yang bisa diklik | PASS | PASS | PASS | PASS | Aturan base layer di `tokens.css` (Sprint 21 temuan 1). |
| Hover dengan transisi 150 sampai 300 ms | PASS | PASS | PASS | PASS | `.btn` dan baris index 160 ms. Hover hanya di `@media (hover: hover)` dan punya padanan `:active`. |
| Kontras teks 4,5:1 di tema terang | PASS | PASS | PASS | PASS | Dihitung dari token: terendah 4,80. axe di Playwright: 0 pelanggaran. |
| Fokus terlihat untuk keyboard | PASS | PASS | PASS | PASS | `:focus-visible` global, diuji `focusRing` di Playwright. |
| `prefers-reduced-motion` dihormati | PASS | PASS | PASS | PASS | Suite AC-11 lolos di semua route publik. |
| Responsif tanpa scroll horizontal halaman | PASS | PASS | PASS | PASS | `horizontalOverflow` 0 di semua route. Scroll di dalam tabel Produk dan Size dicatat di temuan 1 dan 2. |

## Yang sudah sesuai pedoman

- `aria-current="page"` di menu desktop dan HP pada setiap halaman publik dan admin (Active State).
- `scroll-padding-top: 96px` untuk anchor seperti `#lab-aezy` di bawah header lengket, dan `scroll-behavior: smooth` yang dimatikan saat reduced motion (Smooth Scroll, Sticky Navigation).
- Isian memakai `type="tel"`, `type="email"`, `type="number"` dengan `inputmode="decimal"` (Input Types, Mobile Keyboards).
- Teks isi dengan line-height 1.6 (Line Height).
- Error formulir per field dengan `aria-describedby` dan fokus ke error pertama (Error Placement).
- State kosong kini memberi langkah berikutnya (Empty States, Sprint 21 temuan 13).
- Halaman password: satu tugas, tanpa header publik, CTA di layar pertama di semua lebar.

## Tidak dicek

- Perangkat HP sungguhan dan keyboard virtual asli. Temuan 4 disimpulkan dari tinggi tata letak.
- Tema gelap hanya di 375 untuk empat halaman.
- Zoom 200%.
