# Audit Sprint 21

Tanggal: 16 November 2026. Status: temuan 1 sampai 13, 15, dan 16 selesai di Tahap 2. Temuan 14 batal (FR-42 sudah memenuhi WCAG). Temuan 3 diperluas: 9 route JSON menjawab 413. Skill: ponytail (`/ponytail-audit`), anti-slop mode After (core, ui, human, copywriting, code), ui-ux-pro-max (design system, `--domain ux`, `--domain typography`, `--stack vue`).

Beban yang diasumsikan: situs company profile dengan pengunjung publik dan beberapa admin, satu proses backend. Data kecil: 11 tech, 21 link, puluhan foto dan testimoni.

## Perlu keputusan sebelum Tahap 2

- **Domain.** Brief Sprint 21 menyebut compro di `https://novoidminds.com`. Repo memakai `https://novoidminds.id` sesuai keputusan final 4 November 2026 (CLAUDE.md, README bagian Riwayat domain, `deploy/.env.example`, `servers` di `docs/openapi.yaml`). Audit ini tidak mengubah apa pun soal domain. Tolong pastikan mana yang benar sebelum Tahap 2.
- **`docs/design-system/nvm-compro/MASTER.md`** dibuat oleh `search.py --persist` atas permintaan brief. Lihat temuan 15.

## Temuan

Prioritas: TINGGI untuk Hard Gate anti-slop dan risiko keamanan, SEDANG untuk Purpose-Gate dan duplikasi yang membingungkan, RENDAH untuk konsistensi dan kerapian. Ukuran: S (kurang dari 30 baris), M (30 sampai 150), L (lebih dari 150).

| No | Skill | File/halaman | Masalah | Usulan perbaikan | Risiko kalau diubah | Risiko kalau dibiarkan | Ukuran | Prioritas |
|---|---|---|---|---|---|---|---|---|
| 1 | antislop-human, antislop-ui (R-39) | `frontend/src/styles/app.css`, semua halaman publik, password, admin | Tidak ada aturan `cursor: pointer` di base layer. Preflight Tailwind mengubah `button` ke `cursor: default`, jadi sekitar 35 tombol (ThemeToggle, LangToggle, menu, tombol `.text-link`, tombol admin), `summary`, `select`, checkbox, dan `label` menampilkan panah biasa. Hanya `.btn` dan 6 tempat lain yang memasang pointer satu per satu. | Satu aturan di `@layer base`: `button, summary, select, label[for], [role='button'], input[type='checkbox'], input[type='radio'] { cursor: pointer }` dan `:disabled { cursor: not-allowed }`. Hapus 6 deklarasi `cursor: pointer` per komponen yang jadi berlebih. | Rendah. Hanya kursor mouse, tidak ada layout yang berubah. | Pengguna mouse ragu apakah tombol bisa diklik. Gagal Delivery Gate R-39. | S (+8, -6) | TINGGI |
| 2 | antislop-ui (R-40) | `frontend/src/pages/GalleryPage.vue:171` (lightbox) | Gambar lightbox tanpa `width` dan `height`, padahal data `item.image.width/height` tersedia. Saat foto berganti, ruangnya belum diketahui sampai gambar termuat, sehingga keterangan di bawahnya melompat. | Tambah `:width="current.image.width"` dan `:height="current.image.height"`. Kelas `max-h-full max-w-full object-contain` tetap menjaga ukuran tampil. | Rendah. | Lompatan layout di lightbox. Gagal Delivery Gate R-40. | S (+2) | TINGGI |
| 3 | ponytail (risk) | `backend/internal/httpapi/admin_data.go:153, 227, 322` | `PATCH /api/admin/techs/:key`, `/collabs/:key`, dan `/inquiries/:id` membaca JSON tanpa `http.MaxBytesReader`. Semua handler JSON lain membatasi ke `maxJSONBody` (64 KB). Di dev tanpa Nginx, sesi admin yang dicuri bisa mengirim body sangat besar ke tiga route ini. Di produksi Nginx membatasi 10 MB. | Tambah `c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxJSONBody)` di tiga handler itu, sama seperti handler lain. Body yang terlalu besar menjadi 400 VALIDATION, sudah tercatat di spec. | Rendah. Kontrak API tidak berubah, body normal di bawah 2 KB. | Aturan yang sama diterapkan berbeda di dua tempat. Risiko kecil karena perlu sesi admin. | S (+3) | SEDANG |
| 4 | ponytail (lean) | `backend/internal/db/queries/content.sql:1`, `db/sqlc/content.sql.go` | Query `ListTechs` tidak dipanggil di mana pun (dicek dengan grep di seluruh backend, termasuk test). Sejak Sprint 14 semua pembacaan tech memakai `ListTechsByLang`. | Hapus query lalu jalankan `sqlc generate`. | Rendah. Tidak ada pemanggil. | Kode mati yang ikut dibaca dan di-review. | S (-3 SQL, -35 hasil generate) | RENDAH |
| 5 | ponytail (test ganda) | `backend/internal/httpapi/rules_test.go:89-128` | `TestAdminGroupIsNoStore` dan `TestAdminRoutesAreNoStore` kini menguji hal yang sudah dijaga test Sprint 20. Spec mewajibkan `Cache-Control: no-store` di setiap respons admin, `TestAdminResponsesMatchSpec` memvalidasinya, dan `TestOpenAPIListsEveryRoute` memastikan route terdaftar. | Hapus kedua test. Tambah satu kasus `POST /api/admin/login` (400) ke `TestAdminResponsesMatchSpec`, karena hanya login yang belum ikut tervalidasi spec. | Rendah. Cakupan sama, karena header dan route tetap diperiksa lewat spec. | Dua test yang harus diubah bersamaan setiap kali perilaku admin berubah. | S (-38, +1) | RENDAH |
| 6 | ponytail (merge) | `AdminAudit.vue:15`, `AdminInquiries.vue:20`, `AdminSettings.vue:15` | Tiga salinan `new Intl.DateTimeFormat('id-ID', { ..., timeZone: 'Asia/Jakarta' })`. Satu salinan memakai `dateStyle: 'long'`, dua lainnya `'medium'`, jadi format waktu admin tidak seragam. | Satu fungsi `formatDateTime(value)` di `src/i18n/index.ts`, di samping `formatDate`, dengan `dateStyle: 'medium'` dan akhiran WIB. | Rendah. Teks waktu di Pengaturan berubah dari "16 November 2026" menjadi "16 Nov 2026". | Aturan zona waktu tersebar di tiga tempat. | S (-15) | RENDAH |
| 7 | ponytail (merge) | `AdminGallery.vue:106`, `AdminSizeCharts.vue:74`, `AdminTestimonials.vue:133` | `confirmDelete`, `deleting`, dan `listError` hampir identik di tiga halaman (13 baris masing-masing, beda di fungsi hapus dan cara mencocokkan baris yang sedang diedit). | Composable kecil `useDeleteConfirm(remove, onDeleted)` di `composables/`. Opsional: penghematannya kecil dan tiga halaman ikut berubah. | Sedang. Menyentuh tiga alur admin yang dijaga e2e. | Perbaikan di satu halaman bisa lupa diterapkan di dua lainnya. | M (-25) | RENDAH |
| 8 | ponytail (lean), antislop-code | `frontend/scripts/terjemahan.mjs:77-83` | `try/catch` menelan error kalau `techs_id.json` tidak ada, dengan komentar "Added in Sprint 14". File itu sudah ada sejak Sprint 14. Kalau file hilang, `docs/terjemahan.md` diam-diam kehilangan bagian tech dan `check.sh` tetap lolos. | Baca file langsung tanpa `try/catch` dan hapus `if (techsId)`, sehingga file yang hilang membuat skrip gagal. | Rendah. | Terjemahan tech bisa hilang tanpa ketahuan. | S (-6) | RENDAH |
| 9 | ponytail (test ganda) | `frontend/e2e/public.spec.ts:403`, `shopee.spec.ts:240-263`, `gate.spec.ts:124`, `flows.spec.ts:421` | Blok `new AxeBuilder({ page }).withTags([...]).analyze()` disalin 4 kali. Loop FR-132 di `shopee.spec` memeriksa ulang `/produk` dan `/en/produk` di 320 px di dua tema, yang sudah dicakup AC-13 di `public.spec`. | Helper `axeViolations(page)` di `e2e/support.ts`. Di `shopee.spec` sisakan hanya `#lab-aezy` dan `#lab-therco`, karena panel tech terbuka adalah keadaan yang tidak dicakup AC-13. | Rendah. Hanya test. | Tag WCAG yang diubah di satu tempat tidak ikut berubah di tiga tempat lain. Suite lebih lama 4 tes. | S (-20) | RENDAH |
| 10 | ponytail (docs ganda) | `docs/sprint.md` bagian Pekerjaan berikutnya, README Rilis publik dan Riwayat domain | Catatan domain dan DNS ditulis lengkap di README dan diulang di `docs/sprint.md`, padahal itu bukan pekerjaan berikutnya. | Ganti butir di `docs/sprint.md` dengan satu kalimat penunjuk ke README. | Rendah. | Dua salinan yang bisa saling bertentangan saat domain berubah lagi. | S (-1) | RENDAH |
| 11 | ponytail (docs basi), antislop-copywriting | `CLAUDE.md` | (a) Bagian "Aturan hemat kuota" masih melarang test dan Playwright sebelum Sprint 10, padahal Sprint 11 sampai 20 memakai test. (b) Contoh CTA "Lihat 11 material system" kini salah, jumlahnya 10 dan dihitung dari data. (c) Struktur repo belum memuat `docs/openapi.yaml`, `docs/swagger-ui/`, `frontend/brand-src/`, dan `frontend/scripts/`. | Perbarui tiga bagian itu. Usulan teks ditulis di Tahap 2 untuk kamu setujui, karena CLAUDE.md mengarahkan agen. | Sedang. Mengubah aturan kerja agen. | Agen berikutnya bisa membaca larangan test sebagai aturan yang berlaku. | S (±10) | SEDANG |
| 12 | antislop-code | `deploy/sql/90-cleanup-test-data.sql:1,13`, `frontend/e2e/shopee.spec.ts:13`, `v12.spec.ts:228,262`, `frontend/scripts/test-real-ip.mjs:1-6`, `frontend/src/motion/Swatch.ts:1-4`, `frontend/src/composables/useSystemCount.ts:4-6` | Komentar memuat riwayat sprint ("hasil Sprint 10", "Sprint 19:", "removed in Sprint 18"), atau satu fakta yang dipanjangkan menjadi 3 sampai 6 baris. | Hapus riwayat sprint dan potong ke fakta inti, maksimal dua baris. Hanya komentar yang berubah. | Rendah. | Komentar menyesatkan setelah sprint berikutnya. | S (-10) | RENDAH |
| 13 | antislop-ui (R-27), antislop-copywriting | `id.ts` dan `en.ts`: `home.labEmpty`, `tech.empty`, `product.techEmpty`, `product.collabEmpty`, `size.empty` | State kosong menyebut keadaan ("Daftar tech belum tersedia") tanpa langkah berikutnya. Galeri, testimoni, dan size chart sudah menyebut langkahnya. | Tambah kalimat yang mengarahkan ke WhatsApp, memakai teks Kontak yang sudah ada, tanpa fakta baru. Termasuk perbarui `docs/terjemahan.md`. | Rendah. Teks saja, muncul hanya bila API mengembalikan daftar kosong. | Pengunjung buntu di halaman kosong. | S (+10) | RENDAH |
| 14 | ui-ux-pro-max (ux: Focusable Error Summary) | `frontend/src/pages/B2BPage.vue` | Basis data ui-ux-pro-max menyarankan ringkasan error di atas formulir. Formulir B2B memakai pesan per field dengan `aria-describedby` dan memindahkan fokus ke field error pertama (FR-42). Itu sudah memenuhi WCAG 3.3.1. | Disarankan dibiarkan. Ringkasan tambahan menambah komponen tanpa alasan UX yang kuat untuk formulir 10 field. | Sedang. Menambah UI baru. | Tidak ada masalah yang terukur. | M | RENDAH (usul: batal) |
| 15 | ui-ux-pro-max, antislop (R-02) | `docs/design-system/nvm-compro/MASTER.md` (baru, belum dilacak git) | Hasil `--design-system --persist` menyarankan palet navy dan biru, huruf EB Garamond dan Crimson Text, ikon Lucide, serta pola Portfolio Grid. Semuanya bertentangan dengan identitas v1.2 dan CLAUDE.md. File itu menyebut dirinya "Global Source of Truth" dan memuat 6 em dash. | Hapus folder `docs/design-system/`. Perbandingannya sudah dicatat di bagian "Pembanding ui-ux-pro-max" di bawah. | Tidak ada. | Agen berikutnya bisa mengikuti file itu dan mendesain ulang situs. Melanggar R-02 di repo. | S (-215) | SEDANG |
| 16 | antislop-copywriting | `id.ts:133,181`, `en.ts:130,178` | Kalimat The Lab yang sama ditulis di dua kunci (`home.lead` dan `tech.lead`). | Satu kunci dipakai di dua halaman. | Rendah. | Dua salinan teks yang harus diubah bersama. | S (-4) | RENDAH |

Tanpa temuan (sudah dicek):

- Tidak ada kunci i18n, komponen, composable, export, atau dependency npm dan Go yang tidak dipakai. Semua 268 kunci terpakai, sebagian lewat akses dinamis seperti `meta[page]` dan `apiErrors[code]`.
- Kontras token dihitung dengan rumus WCAG di dua tema. Terendah: teks `--signal` di atas `--raised` 4,80 (terang). Garis `--line-strong` di atas `--raised` 3,72 (gelap), cukup untuk ambang 3:1 non-teks.
- Tidak ada em dash atau emoji di sumber, kamus, README, CLAUDE.md, dan `docs/` selain file temuan 15.
- Tidak ada buzzword, CTA generik, atau klaim tanpa sumber di kamus. Klaim "biasanya dalam satu hari kerja" berasal dari SRS FR-81.
- Fokus terlihat lewat `:focus-visible` global di `tokens.css`. `outline: none` hanya untuk kontainer `tabindex="-1"` yang difokuskan dari kode.
- Route publik di-lazy-load. `:key="index"` hanya dipakai untuk daftar statis.
- Loading memakai `role="status"` dengan teks. Animasi berjalan terus (ticker) punya tombol jeda, dan semua animasi punya versi reduced motion.

## Duplikasi yang disengaja, tidak diubah

| Duplikasi | Alasan tetap ada |
|---|---|
| Validasi link Shopee: `frontend/src/composables/shopeeUrl.ts` dan `backend/internal/content/shopee.go` | Lapisan ganda. Frontend memberi pesan langsung, backend tetap menolak permintaan langsung ke API. |
| Validasi inquiry: `inquiryValidation.ts` dan `backend/internal/inquiry/inquiry.go` | Sama, lapisan ganda (FR-42). |
| Validasi `next`: `safeNext.ts` (halaman password) dan cek `/admin/` di `AdminLogin.vue` | Dua titik masuk berbeda. Keduanya hanya menerima path lokal. |
| Kamus `id.ts` dan `en.ts` | Dua bahasa (SRS 14.4). `vue-tsc` menjaga bentuknya sama. |
| `frontend/e2e/serve-dist.mjs` meniru `frontend/nginx.conf` | Pengganti Nginx di laptop dev untuk menguji build produksi. |
| Daftar route publik di `public.go` (sitemap) dan di `frontend/scripts/prerender.mjs` | Backend dan frontend tidak saling import. Sinkron dijaga e2e AC-21. |
| `docs/openapi.yaml` dan tipe Go | Kontrak tertulis. Kesesuaian dijaga test Sprint 20. |
| `GET /api/admin/techs` dan `/collabs` di samping route publiknya | Route admin tanpa cache, sehingga perubahan langsung terlihat setelah disimpan. |

## Pembanding ui-ux-pro-max

Query design system: "technical apparel brand company profile, material science, lab notebook, light theme".

| Rekomendasi | Desain sekarang | Diadopsi? | Alasan |
|---|---|---|---|
| Pola Portfolio Grid (Hero, grid proyek masonry, tentang, kontak) | Beranda, Brand, Teknologi (Lab index), Produk, B2B, Galeri, Testimoni, Size | Tidak | Konten NVM berpusat pada material system, bukan portofolio proyek. |
| Gaya Swiss Modernism 2.0 (grid, modular, spasi matematis) | Lab Notebook dengan grid 8 px dan label spec | Sudah sejalan | Tidak ada selisih yang perlu diubah. |
| Palet navy `#1E3A5F`, biru `#2563EB`, aksen `#A16207` | Token v1.2: `#F3F2EE`, `#111317`, signal `#B83218` | Tidak | Menambah warna di luar token (dilarang CLAUDE.md). Kontras sekarang sudah lolos AA. |
| Huruf EB Garamond dan Crimson Text (akademik) | D-DIN, fallback Space Grotesk, label JetBrains Mono | Tidak | Serif akademik tidak cocok untuk technical apparel. Pencarian `--domain typography` sendiri menyarankan sans geometris atau teknis, sejalan dengan D-DIN. |
| Ikon SVG (Heroicons atau Lucide) | SVG inline sendiri (`IconSvg.vue`) | Sudah sejalan | Tanpa library ikon, sesuai CLAUDE.md. |
| Checklist: cursor-pointer di semua elemen yang bisa diklik | Belum ada di base layer | Ya | Temuan 1. |
| Checklist: hover 150 sampai 300 ms, kontras 4,5:1, fokus terlihat, reduced motion | `.btn` 160 ms, kontras lolos, `:focus-visible` global, reduced motion lengkap | Sudah sejalan | Tidak ada selisih. |
| ux: ruang dicadangkan untuk media (CLS) | Semua gambar bersize kecuali lightbox | Ya | Temuan 2. |
| ux: ringkasan error formulir | Error per field dan fokus ke field pertama | Tidak | Temuan 14. |
| vue: lazy route, `key` unik di `v-for` | Sudah | Sudah sejalan | Tidak ada selisih. |

Checklist pre-delivery di 375, 768, 1024, dan 1440 px belum dijalankan di browser pada tahap ini, karena tunnel database uji mati dan halaman data hanya akan menampilkan state error. Bukti terakhir: Playwright Sprint 19 (7edcee1) memeriksa overflow, target 44 px, dan axe di 320, 375, 768, 1024, dan 1440 px di dua tema (dev 137 lolos, produksi 166/166). Checklist dijalankan ulang di Tahap 2 langkah 3.

## Perkiraan baris

| Kelompok | Baris hilang |
|---|---|
| Penghapusan duplikasi dan kode mati (4, 5, 6, 7, 8, 9, 10, 16) | sekitar 140 (termasuk sekitar 35 baris hasil `sqlc generate`) |
| Komentar (12) | sekitar 10 |
| File design system hasil generate (15) | 215 (belum dilacak git) |
| Penambahan (1, 2, 3, 13) | sekitar 23 |

Baseline baris (tanpa file hasil generate, vendor, dan aset biner): backend 5811, frontend/src 8326, frontend/e2e 2343, frontend/scripts 513, scripts 39, deploy 252, docs 1903, README.md 352, CLAUDE.md 98.

## Tidak dicek

- Tampilan langsung di browser per lebar layar, karena tunnel database uji mati dan aku tidak menyalakannya sendiri.
- Lighthouse belum diukur di tahap ini, jadi tidak ada angka yang dilaporkan.
- Isi SRS `.docx` tidak dibaca ulang. Klaim teks dicek terhadap `docs/srs.txt`.
- `deploy/sql/90-cleanup-test-data.sql` tidak dicocokkan dengan semua data uji Sprint 19 dan 20.
