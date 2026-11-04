# Sprint nvm-company-profile

Acuan kebutuhan: SRS v1.2 (`docs/SRS-NVM-CompanyProfile-v1.2.docx`). Sprint 0 sampai 11 disusun dari v1.1, Sprint 12 sampai 17 dari revisi v1.2 (SRS 14.7). Aturan kerja: `CLAUDE.md`.

## Cara kerja

- Semua fitur dibangun dulu (Sprint 0 sampai 9). Pengujian menyeluruh hanya di Sprint 10.
- Revisi v1.2 mengikuti pola yang sama: Sprint 12 sampai 15 membangun, pengujian hanya di Sprint 16.
- Akhir tiap sprint: `./scripts/check.sh`, update tabel di bawah, `git commit`.
- Status: `belum`, `jalan`, `selesai`, `tertahan`.

## Ringkasan status

| Sprint | Isi | Prio | Status |
|---|---|---|---|
| 0 | Fondasi repo, tooling, token, font, check.sh | M | selesai |
| 1 | Database: migrasi, role, seed | M | selesai |
| 2 | API publik dan inquiry | M | selesai |
| 3 | Auth admin, API admin, media, ekspor, CLI | M | selesai |
| 4 | Kerangka frontend dan komponen state | M | selesai |
| 5 | Beranda (Knit Field), Brand, Teknologi | M | selesai |
| 6 | Produk, B2B, Size, Kontak, Privasi, 404 | M | selesai |
| 7 | Galeri, Testimoni, halaman admin | M | selesai |
| 8 | Fabric Probe, ticker, prerender, audit log, filter testimoni | S | selesai |
| 9 | Docker Compose dan deploy LAN | M | selesai |
| 10 | Pengujian menyeluruh dan Delivery Gate | M | selesai |
| 11 | Rilis publik lewat Cloudflare Tunnel | - | tertahan |
| 12 | Token semantik dua tema, tombol tema, anti-kedip + hash CSP, logo, kanvas ikut tema | M | selesai |
| 13 | Kerangka i18n: route /en, kamus, tombol bahasa, error dari kode, hreflang, prerender dua bahasa | M | selesai |
| 14 | Migrasi 0003 (tech_i18n, galeri en, lang testimoni), API ?lang, docs/terjemahan.md | M | selesai |
| 15 | Identitas: Swatch, Re-weave, Ruler, strip swatch Beranda, grid ukur | M | selesai |
| 16 | Pengujian kedua tema dan kedua bahasa, AC-01 sampai AC-23, Delivery Gate | M | selesai |
| 17 | Deploy ke VM: git pull, migrate, compose up --build, cek ulang | M | selesai |
| 18 | Halaman password (site gate), pengaturan admin, Beranda tanpa strip swatch, perbaikan swatch ANTSHELL | M | selesai |
| 19 | Shopify dihapus, tujuan beli ke Shopee, link per tech dan fit, MELTWRAP disembunyikan | M | selesai |

---

## Sprint 0: Fondasi

1. Root: `.gitignore` (node_modules, dist, .env, backend/var, *.exe), `.editorconfig`, `.gitattributes` (`* text=auto eol=lf`, `*.sh text eol=lf`), `README.md` singkat (cara jalan dev).
2. Backend: `go mod init github.com/No-Void-Minds/nvm-company-profile/backend`, `internal/config` (baca env), `internal/httpapi` (router Gin, middleware recover, request id, security headers NFR-08), `cmd/server/main.go` dengan `GET /api/health` (sementara tanpa cek DB), `.env.example`.
3. Frontend: Vite Vue TS di `frontend/`, Tailwind v4 (`@tailwindcss/vite`), Vue Router, ESLint flat config, Prettier, vue-tsc. Proxy dev sesuai CLAUDE.md. Port 5175.
4. `src/styles/tokens.css`: `@theme` warna, font, radius, jarak dari CLAUDE.md. `@font-face` D-DIN dari `/fonts/D-DIN.ttf` (dan `D-DIN-Bold.ttf` bila ada), `@fontsource/space-grotesk`, `@fontsource/jetbrains-mono`. Gaya fokus global dan `prefers-reduced-motion` global.
5. `scripts/check.sh`: `set -euo pipefail`; backend: `gofmt -l` harus kosong, `go vet ./...`, `go build ./...`, `go test ./...`; frontend: `npx vue-tsc --noEmit`, `npx eslint .`, `npx prettier --check .`.
6. `scripts/dev-db-tunnel.sh`: `ssh -N -L 15432:127.0.0.1:5432 nvmadmin@192.168.68.144` (port Postgres di VM dibaca dari env `NVM_PG_REMOTE_PORT`, default 5432).

## Sprint 1: Database

1. `deploy/sql/00-bootstrap.sql` (dijalankan user sekali sebagai superuser): buat role `compro_migrator` dan `compro_app` (password dari `\set` atau ganti manual), database `nvm_compro` milik `compro_migrator`, cabut hak `PUBLIC`, beri `compro_app` CONNECT dan USAGE skema, plus `ALTER DEFAULT PRIVILEGES FOR ROLE compro_migrator` agar tabel baru otomatis bisa DML oleh `compro_app`.
2. Migrasi golang-migrate di `backend/migrations/` sesuai SRS bagian 8: techs, collabs, size_charts, gallery_items, testimonials, inquiries, admin_users, sessions, audit_log. Pakai `CHECK` untuk enum (source, kind, status), index untuk filter (inquiries.status, inquiries.created_at, gallery_items.category, testimonials.published).
3. Migrasi seed: `0002_seed.up.sql` berisi INSERT dari `internal/db/seed/*.json` (tulis SQL-nya langsung, isi persis sama dengan JSON). JSON tetap disimpan sebagai sumber.
4. `sqlc.yaml` (engine postgresql, pgx/v5, output `internal/db/sqlc`), query awal di `internal/db/queries/`.
5. `GET /api/health` ikut cek `pool.Ping`.
6. Tulis di README perintah migrasi: `migrate -path backend/migrations -database "$MIGRATOR_URL" up`.

## Sprint 2: API publik

1. `content`: `GET /api/techs`, `/api/collabs`, `/api/lab-stats` (jumlah tech, jumlah on_rack, tahun 2021 dari config `BRAND_EST_YEAR`), `/api/gallery?category=`, `/api/testimonials?source=&tech=` (hanya published), `/api/size-charts/:key` (404 NOT_FOUND bila tidak ada).
2. `inquiry`: `POST /api/inquiries` dengan validasi FR-42, honeypot field `website` (isi = tolak diam-diam dengan 201 palsu tanpa simpan), header `Idempotency-Key` wajib (UUID), rate limit 5 per jam per IP (in-memory token bucket, kunci = hash IP dengan salt dari env), kode `B2B-` + 6 karakter Crockford base32. Simpan `consent_at`.
3. `GET /sitemap.xml` (semua route publik + deep link `/teknologi#...` tidak perlu) dan `GET /robots.txt` (disallow `/admin`). Base URL dari env `PUBLIC_BASE_URL`.
4. Cache-Control: data publik `max-age=60`, media `max-age=31536000, immutable`.

## Sprint 3: Admin

1. `auth`: argon2id (m=64MB, t=3, p=2), sesi token 32 byte acak, disimpan sebagai hash SHA-256, cookie `nvm_compro_sid` HttpOnly, SameSite=Lax, Secure bila `COOKIE_SECURE=true`. Idle timeout 8 jam. CSRF token per sesi, dikirim lewat header `X-CSRF-Token`. Rate limit login 10 per 15 menit per IP.
2. Endpoint admin sesuai SRS 7.4. Testimoni tidak bisa `published=true` bila `blurred_confirmed=false` (409 CONFLICT, BR-02).
3. `media`: terima multipart, cek magic bytes (JPEG, PNG, WebP), maks 8MB, buang EXIF dengan decode ulang, simpan varian lebar 480, 960, 1600 ke `MEDIA_DIR` dengan nama UUID, layani di `/media/...`.
4. `export`: `GET /api/admin/inquiries/export?format=csv|xlsx`, kolom lengkap, waktu Asia/Jakarta, nama file `inquiries-YYYYMMDD.csv`.
5. `cmd/compro-admin`: `create-user <username>` (password dibaca dari stdin tanpa echo), `reset-password <username>`, `purge-inquiries` (hapus inquiry > 12 bulan, BR-03).

## Sprint 4: Kerangka frontend

1. `api/client.ts`: fetch wrapper, parsing format error, header CSRF untuk mutasi admin, tipe respons di `api/types.ts`.
2. Komponen state bersama: `StateLoading` (skeleton garis rajut), `StateEmpty`, `StateError` (tombol Coba lagi), dan composable `useAsync`.
3. Layout publik: skip link, header tetap (FR-01) dengan menu panel penuh di bawah 1024px (fokus terkunci, Escape menutup), footer (FR-04, link marketplace yang belum ada tidak ditampilkan).
4. Router: `/`, `/brand`, `/teknologi`, `/produk`, `/b2b`, `/galeri`, `/testimoni`, `/size`, `/kontak`, `/privasi`, `/admin/*`, 404. Lazy load selain Beranda. Judul dan meta per route (`useHead` sederhana sendiri, tanpa library).
5. Komponen dasar: Button (primer, sekunder, link), SpecLabel (mono kapital), SectionHeading dengan nomor, KnitDivider, IconSvg.
6. `composables/useReducedMotion.ts` dan `useInView.ts`.

## Sprint 5: Beranda, Brand, Teknologi

1. `motion/KnitField.ts`: Canvas 2D grid titik tersambung, jarak titik sekitar 22px desktop dan 28px mobile, batas 1.800 / 600 titik, DPR maks 2. Pointer menarik titik dalam radius sekitar 120px, titik kembali dengan pegas teredam (stretch and recovery). Sentuh juga didukung. Berhenti saat keluar viewport atau tab tersembunyi. Reduced motion: gambar diam satu frame. Warna garis `line`, titik dekat pointer `bone`.
2. Beranda (FR-10 sampai FR-13): hero "Fabric first." dengan kanvas, CTA "Lihat 11 material system" dan "Belanja di Shopify"; panel Lab index dari `/api/lab-stats` (sembunyikan angka on the rack bila 0); potongan Core vs Graphic, B2B; potongan Testimoni dan Galeri hanya bila ada data.
3. Brand (FR-15, FR-16): pernyataan brand, Engineered to perfection, tiga tahap (SRS 3.2), garis waktu hanya "2021, Bandung".
4. Teknologi (FR-20 sampai FR-24): index 01 sampai 11, panel kanan sticky di desktop (ganti saat hover, fokus, klik; transisi 240ms), accordion satu terbuka di bawah 1024px, filter Your day (role radiogroup atau tombol `aria-pressed`), ringkasan "NN fit", deep link `#lab-<key>`, tombol Shopify disembunyikan bila tidak on_rack.
5. Spec reveal untuk judul section (sekali, IntersectionObserver).

## Sprint 6: Produk, B2B, Size, Kontak

1. Produk (FR-30 sampai FR-32): matriks tech x fit untuk Core (tabel semantik, scroll horizontal di dalam wadah ber-`tabindex="0"` dan berlabel di layar kecil, bukan scroll halaman), daftar collab Graphic dengan status Coming soon.
2. B2B (FR-40 sampai FR-44): dua jalur, formulir dengan validasi sama seperti backend, pesan error per field terhubung lewat `aria-describedby`, Idempotency-Key dibuat sekali per isi formulir, layar sukses dengan kode dan tombol WhatsApp.
3. Size (FR-70 sampai FR-75): `composables/useSizeRecommendation.ts` berisi parser baris size chart, pencocokan tinggi (FR-71), pencocokan kaos favorit (FR-72), deteksi di antara dua ukuran. Halaman: pilih tech, pilih fit, tab Mode A dan B, tabel dengan baris terpilih ditandai (Size marker), catatan toleransi, tombol Shopify dan WhatsApp, state belum tersedia.
4. Kontak (FR-80, FR-81), halaman Kebijakan Privasi (NFR-10: data yang disimpan, tujuan, simpan 12 bulan, cara minta hapus lewat WhatsApp), halaman 404.

## Sprint 7: Galeri, Testimoni, Admin

1. Galeri (FR-50 sampai FR-53): masonry CSS columns, filter kategori dari data, lightbox dengan fokus terkunci, panah, keyboard, swipe, `srcset`.
2. Testimoni (FR-60, FR-61, FR-64): kartu tangkapan layar dengan sumber, tanggal, tech, rating, transkrip yang bisa dibuka.
3. Admin: login, layout admin, halaman Galeri, Testimoni (centang buram wajib sebelum publish), Size chart (editor baris + pratinjau tabel), Tech dan Collab (toggle), Inquiry (filter, detail, status, tombol ekspor CSV dan XLSX). Semua dengan state loading, kosong, error, dan konfirmasi hapus memakai dialog sendiri (bukan `window.confirm`).

## Sprint 8: Should

1. `motion/FabricProbe.ts` (FR-25) di panel detail tech, satu varian per kebutuhan, label "Ilustrasi, bukan hasil uji".
2. Ticker (FR-03) dengan tombol jeda, isi tanpa program member.
3. Prerender route publik saat build (NFR-12), pilih cara paling ringan (contoh script Node yang memakai `vite build --ssr` + render route ke HTML). Kalau memakan waktu lebih dari 45 menit, tandai `tertahan`.
4. Audit log admin (FR-96) dan filter sumber/tech di Testimoni (FR-62), ringkasan angka FR-63.

## Sprint 9: Docker dan deploy LAN

1. `backend/Dockerfile` multi-stage ke distroless, `frontend/Dockerfile` build lalu Nginx (`nginx.conf`: SPA fallback, proxy `/api`, `/media`, `/sitemap.xml`, `/robots.txt` ke backend, gzip, cache aset).
2. `deploy/docker-compose.yml`: service backend dan frontend, jaringan ke container Postgres yang sudah ada, volume `/srv/nvm-compro/media`, port 8092.
3. `deploy/.env.example` dan langkah deploy di README (bootstrap SQL, migrate, create-user, compose up, backup harian pg_dump + arsip media 14 hari).

## Sprint 10: Pengujian menyeluruh

1. Unit test Go: validasi inquiry, kode inquiry, rate limit, auth (hash, sesi, CSRF), aturan BR-02, parser size chart.
2. Unit test frontend (Vitest): `useSizeRecommendation` termasuk AC-04.
3. Uji API dengan curl terhadap database dev.
4. Uji browser Playwright: AC-01 sampai AC-16, lebar 320, 375, 768, 1024, 1440, keyboard-only, reduced motion, console bersih.
5. Lighthouse mobile Beranda (AC-14).
6. Delivery Gate: satu baris PASS/FAIL per poin AntiSlop beserta bukti. Ada FAIL berarti belum rilis.

## Sprint 11: Rilis publik

Tertahan sampai atasan menyetujui. Domain: `novoidminds.id`.

Rencana: tanpa service cloudflared di compose. Tunnel Cloudflare yang sudah ada berjalan sebagai service sistem di VM dan diarahkan ke `http://localhost:8092`. Nginx memercayai `CF-Connecting-IP` hanya dari gateway jaringan `compro` (`COMPRO_GATEWAY_IP`), `COOKIE_SECURE=true`, `PUBLIC_BASE_URL=https://novoidminds.id`. Langkahnya di README bagian Rilis publik.

## Sprint 12: Dua tema

1. `tokens.css`: token semantik `--bg`, `--surface`, `--raised`, `--fg`, `--muted`, `--line-strong`, `--line`, `--signal`. Nilai terang dari SRS 14.2 di `:root` (default, termasuk prerender), nilai gelap dari token v1.1 di `[data-theme='dark']`. `color-scheme` per tema (FR-105). Semua pemakaian warna lama diganti ke token semantik.
2. Tombol tema di header publik dan admin (FR-101, FR-106): ikon SVG matahari dan bulan, `aria-pressed`, simpan di localStorage dengan try/catch. Transisi warna 150 ms, tanpa transisi saat reduced motion.
3. Skrip inline anti-kedip di `index.html` (FR-102), hash sha256 di CSP `nginx-security-headers.conf`. Prerender gagal bila hash tidak cocok. `meta theme-color` ikut tema.
4. Logo tampil benar di kedua tema (FR-104).
5. Knit Field dan Fabric Probe membaca warna dari token dan menggambar ulang saat tema berganti (FR-103).

## Sprint 13: Kerangka i18n

1. Route `/en/...` untuk semua route publik (FR-110). Path adalah sumber bahasa, tanpa redirect dari browser.
2. Kamus `src/i18n/id.ts` (sumber tipe) dan `en.ts` (wajib memenuhi tipe itu, FR-112). Composable kecil tanpa library.
3. Tombol ID / EN di header, menjaga halaman dan hash (FR-111).
4. Pesan error API dari kode error lewat kamus (FR-116).
5. SEO (FR-117): `html lang`, hreflang id, en, x-default, canonical per bahasa, `og:locale`, sitemap dengan alternatif bahasa. Prerender kedua bahasa.
6. Admin tetap Indonesia (FR-118).

## Sprint 14: Konten dua bahasa

1. Migrasi `0003`: tabel `tech_i18n` (isi `en` dari kolom `techs` yang sudah ada, `id` dari terjemahan), kolom `alt_en` dan `caption_en` di galeri, kolom `lang` di testimoni (default `id`). Aman untuk database produksi yang sudah berisi data.
2. API `GET /api/techs?lang=id|en` (FR-113), galeri memakai versi Inggris bila diisi (FR-115). Admin galeri dan testimoni bisa mengisi kolom baru.
3. Elemen transkrip testimoni memakai atribut `lang`.
4. `docs/terjemahan.md`: kunci, teks EN, teks ID untuk semua terjemahan baru (FR-114).

## Sprint 15: Identitas Lab Notebook

1. Swatch (SRS 14.5): Canvas 2D prosedural dari data tech, di panel Teknologi, baris tech Produk, dan strip 11 swatch Beranda. Diam saat reduced motion, berhenti di luar viewport. Label Ilustrasi, bukan hasil uji.
2. Re-weave saat tech berganti di Teknologi (400 ms).
3. Ruler di Size: penggaris cm ke nilai yang diisi, lalu menunjuk baris ukuran.
4. Grid ukur di hero dan Size.

## Sprint 16: Pengujian revisi

AC-01 sampai AC-23 di kedua tema dan kedua bahasa, axe dan kontras di 17 halaman dan 5 lebar, Lighthouse mobile Beranda ID dan EN, Delivery Gate ulang.

## Sprint 17: Deploy revisi

Di VM: `git pull`, migrasi `0003`, `docker compose up -d --build`, cek ulang situs dan admin.

## Sprint 18: Halaman password

Permintaan user setelah v1.2, dengan kode FR-120 dan seterusnya (di luar SRS v1.2).

- FR-120 Data: migrasi `0004` menambah `site_settings` (key, value jsonb, updated_at, updated_by) dengan `password_gate` = `{"enabled": true}`. Default aktif. Aman untuk database berisi data.
- FR-121 Gate: `GET /api/gate` menjawab 204 bila gate mati atau ada sesi admin valid, 401 bila terkunci. Status di-cache di memori dan langsung diganti saat admin mengubahnya. Nginx `auth_request` untuk semua halaman HTML, semua `/api/*` publik (termasuk POST inquiry), dan `/media/`. Selalu lewat: aset build, font, logo, `/admin`, `/api/admin/*`, `/api/health`, `/api/gate`, halaman password.
- FR-122 Saat gate aktif: HTML dan API publik `Cache-Control: private, no-store` + `X-Robots-Tag: noindex`, robots `Disallow: /`, sitemap 404.
- FR-123 Halaman password `/password` dan `/en/password`: desain v1.2, dua tema, dua bahasa, logo, satu kalimat, form login admin, error dengan bahasa manusia, aria-live.
- FR-124 Tujuan setelah login hanya path relatif di situs ini (tolak URL absolut, `//`, backslash, skema lain).
- FR-125 Admin "Pengaturan": saklar halaman password, status, kapan dan oleh siapa terakhir diubah, dialog konfirmasi dua arah, tercatat di audit log.
- FR-126 Beranda tanpa strip swatch 11 tech. Swatch di Teknologi dan Produk tetap.
- FR-127 Swatch ANTSHELL: cangkang tampil sebagai lapisan luar bergaris di atas rajutan, bukan kotak polos.
- Pengujian di sprint ini: unit test Go, Vitest validasi tujuan, Playwright di `nvm_compro_test`, perintah curl di VM untuk Nginx.

## Sprint 19: Tujuan beli ke Shopee

Toko Shopify belum dibuka, jadi semua tujuan beli pindah ke Shopee. Kode FR-130 dan seterusnya (di luar SRS v1.2).

- FR-130 Tanpa Shopify: tombol belanja di header (desktop dan menu HP) dihapus. Tidak ada link, teks, atau konstanta Shopify di frontend, kamus id/en, footer, README, dan komentar kode.
- FR-131 Toko Shopee: tombol kedua hero Beranda "Belanja di Shopee" / "Shop on Shopee" ke `https://shopee.co.id/novoidminds`. Alamat yang sama di `VITE_SHOPEE_URL` (`deploy/.env.example`) dan di footer.
- FR-132 Matriks Produk: "Lihat" hanya bila ada link untuk tech dan fit itu. Fit yang ada tanpa link tampil "-". Collab dengan `url` tampil sebagai link ke koleksi Shopee, tanpa `url` sebagai teks biasa. Status Coming soon tetap.
- FR-133 Detail tech di Teknologi: daftar link per fit, atau satu link untuk tech tanpa fit. Tech tanpa link tidak menampilkan apa pun. Tombol Size tetap.
- FR-134 Tech tersembunyi (`techs.visible = false`, awalnya MELTWRAP) tidak tampil di Teknologi, Produk, filter Your day, Size, B2B, API publik, dan Lab index (10 material system, nomor 01 sampai 10). `#lab-meltwrap` tidak membuka apa pun.
- FR-135 Link ke Shopee buka tab baru dengan `rel="noopener noreferrer"` dan teks tersembunyi "(buka di tab baru)" / "(opens in a new tab)".
- FR-136 Validasi link di backend dan frontend: kosong, atau `https://` dengan host persis `shopee.co.id`. Tolak skema lain, userinfo (`@`), port, host mirip, spasi, dan backslash. Disimpan apa adanya, query tidak dibuang.
- FR-137 Admin "Tech dan collab": per tech saklar "Tampil di situs", status On the rack, link per fit (atau satu link untuk tech tanpa fit). Per collab status dan link koleksi. Semua perubahan masuk audit log, respons admin no-store.
- FR-138 Data: migrasi `0005` menambah `tech_links` (tech_key, fit nullable, url, sort), `collabs.url`, `techs.visible` default true, MELTWRAP false, dan 21 link awal. Aman untuk produksi: tidak menghapus data, tidak menyentuh on_rack.

## Pekerjaan berikutnya

- Kunci versi image `migrate/migrate` (sekarang `:latest`) di README, samakan dengan versi CLI `migrate` di laptop dev. Catatan: CLI dev mencetak `dev` pada `migrate -version` (dipasang dari source), jadi versinya perlu dipastikan dulu, misalnya dengan memasang ulang dari tag rilis.
- Evaluasi `style-src 'unsafe-inline'` di CSP (`frontend/nginx-security-headers.conf`) sebelum rilis publik.
- Domain final (4 November 2026, keputusan atasan): compro di `novoidminds.id`, toko Shopify di `novoidminds.com` (Primary), login pelanggan Shopify di `account.novoidminds.id`. Sempat ditukar pada 3 November lalu dikembalikan. Kondisi DNS dan riwayatnya di README.

## Laporan sprint

### Sprint 0

- Dibuat: file root, backend Gin dengan `/api/health`, frontend Vue + Tailwind v4, `tokens.css`, `check.sh`, `dev-db-tunnel.sh`.
- Keputusan: warna default Tailwind dikosongkan agar warna di luar SRS gagal dikompilasi. `--spacing` 8px agar utilitas tetap di grid 8px.
- Keputusan: hanya `@font-face` D-DIN regular, karena `D-DIN-Bold.ttf` tidak ada. Judul memakai weight 400.
- Keputusan: `docs/srs.txt` dibuat dengan skrip Node, karena pandoc tidak terpasang.
- Menunggu user: tidak ada.

### Sprint 1

- Dibuat: `deploy/sql/00-bootstrap.sql`, migrasi `0001_init` dan `0002_seed`, `sqlc.yaml`, query, `/api/health` dengan `pool.Ping`. Belum ada SQL yang dijalankan ke database.
- Keputusan: tambah kolom `techs.technology_label` (ada di seed, tidak di SRS 8) serta `testimonials.width` dan `height` (mencegah CLS).
- Keputusan: bootstrap juga memberi hak sequence ke `compro_app`, tanpa itu INSERT `audit_log` gagal. `schema_migrations` dicabut dari `compro_app`.
- Keputusan: BR-02 juga dijaga CHECK di database.
- Catatan: seed `on_rack` semua `false`, sesuai JSON. Tombol Shopify di Teknologi tersembunyi sampai admin mengubahnya.
- Menunggu user: jalankan bootstrap dan migrasi.

### Sprint 2

- Dibuat: endpoint publik SRS 7.4, `POST /api/inquiries` (validasi FR-42, honeypot, Idempotency-Key, rate limit, kode B2B), sitemap, robots, Cache-Control.
- Keputusan: paket baru `internal/ratelimit`, karena inquiry dan login sama-sama butuh.
- Keputusan: `org` dan `city` wajib (FR-41 tidak menandainya opsional). Kiriman ulang dengan key sama dan kiriman tidak valid tidak memakai kuota.
- Keputusan: sumber IP dibaca lewat `TRUSTED_PROXIES`, agar di balik Nginx rate limit tetap per pengunjung.
- Menunggu user: tidak ada.

### Sprint 3

- Dibuat: auth argon2id, sesi, CSRF, endpoint admin SRS 7.4, media, ekspor CSV dan XLSX, CLI `compro-admin`.
- Keputusan: WebP memakai `gen2brain/webp` (tanpa CGO). Orientasi EXIF JPEG diterapkan ke piksel sebelum metadata dibuang, agar foto ponsel tidak miring.
- Keputusan: batas 50 MP untuk gambar. Sumber yang lebih sempit dari varian tidak diperbesar.
- Keputusan: ekspor tidak memuat `ip_hash` dan `idempotency_key` (SRS 8: hash hanya untuk rate limit). Sel CSV dinetralkan dari injeksi formula. WhatsApp ditulis `="0812..."` agar nol di depan tidak hilang di Excel.
- Keputusan: CSV memakai koma + BOM. Excel berlocale Indonesia bisa jadi memakai `;`, cek saat AC-09. XLSX tidak terpengaruh.
- Keputusan: `purge-inquiries` dijalankan lewat cron (Sprint 9). `reset-password` juga mengakhiri sesi aktif.
- Menunggu user: tidak ada.

### Sprint 4

- Dibuat: `api/client.ts`, `api/types.ts`, komponen state, `useAsync`, `useHead`, `useFocusTrap`, `useReducedMotion`, `useInView`, header, footer, layout publik, router dengan meta per route, komponen dasar.
- Keputusan: helper link dan konstanta brand di `composables/site.ts`. URL Shopee, TikTok Shop, Instagram dibaca dari `VITE_*`, kosong berarti link tidak tampil.
- Keputusan: UUID memakai `crypto.getRandomValues`, karena `crypto.randomUUID` tidak ada di HTTP LAN.
- Keputusan: ikut memperbaiki Sprint 3: multipart kini diparse dengan batas ukuran sebelum `PostForm`.
- Sementara: route selain Beranda memakai `PendingPage`, diganti di Sprint 5 sampai 7.
- Menunggu user: tidak ada.

### Sprint 5

- Dibuat: `motion/KnitField.ts`, Beranda, Brand, Teknologi (index, panel sticky, accordion, filter, deep link), spec reveal di `SectionHeading`.
- Keputusan: Knit Field berhenti meminta frame saat titik sudah diam, jadi tidak ada animasi tanpa pemicu (NFR-04).
- Keputusan: `@theme static`, agar semua token tersedia sebagai variabel CSS untuk `app.css` dan kanvas.
- Temuan: `public/fonts/D-DIN.ttf` isinya WOFF2 (signature `wOF2`, 20 KB). `@font-face` memakai `format('woff2')`. Cakupan glyph perlu dilihat di Sprint 10.
- Catatan: FR-16 hanya menampilkan "2021, Bandung". SRS 8 tidak punya tabel garis waktu, jadi entri tambahan lewat data belum bisa.
- Menunggu user: tidak ada.

### Sprint 6

- Dibuat: Produk (matriks dan daftar collab), B2B (formulir dan layar sukses), Size (`useSizeRecommendation.ts`, Mode A dan B, Size marker), Kontak, Privasi, 404.
- Keputusan: tinggi tepat di batas (contoh 170) dianggap di antara dua ukuran (M dan L). Seri selisih di Mode B juga.
- Keputusan: tech tanpa fit tampil di matriks sebagai satu sel "Tanpa pilihan fit" ke `core+<tech>`. Link matriks tidak bergantung on_rack (FR-31).
- Catatan: foto collab (FR-32) belum tampil, SRS 8 tidak punya kolom gambar di `collabs`.
- Koreksi proses: commit `6612287` masuk saat `check.sh` gagal (error tipe `aria-invalid`), karena commit dirangkai setelah pipeline `tail`. Tipe diperbaiki di `bb7c02e`. Route Sprint 6 baru benar-benar tersambung di commit sesudahnya, walau pesan `bb7c02e` menyebut sudah. Commit kini mengecek exit code `check.sh`.
- Menunggu user: tidak ada.

### Sprint 7

- Dibuat: Galeri (masonry, filter, lightbox), Testimoni, login, layout admin, halaman Inquiry, Galeri, Testimoni, Size chart, Tech dan collab, `ConfirmDialog`, `useSession`, guard route admin.
- Keputusan: `/admin` membuka Inquiry dulu, karena itu pekerjaan harian admin.
- Keputusan: filter dan ringkasan Testimoni (FR-62, FR-63) sekalian dibuat di halaman ini, dihitung di sisi klien.
- Keputusan: `PendingPage` dihapus, semua route sudah tersambung ke halaman asli.
- Menunggu user: tidak ada.

### Sprint 8

- Dibuat: `motion/FabricProbe.ts` dan tampilannya, ticker dengan tombol jeda, `entry-server.ts` + `scripts/prerender.mjs`, audit log (`GET /api/admin/audit-log`, halaman admin).
- Keputusan: Fabric Probe diputar sekali lewat tombol, bukan berulang, sesuai NFR-04. Tech dengan kebutuhan hot memakai varian hot.
- Keputusan: bagian berbasis data di HTML prerender tampil sebagai skeleton, karena API tidak tersedia saat build. Teks statis dan meta tetap ada di HTML.
- Keputusan: Nginx memakai `spa.html` (tanpa markup) untuk `/admin` dan alamat lain, agar tidak terjadi hydration mismatch.
- Belum diverifikasi: `npm run build` dan prerender belum pernah dijalankan, karena `check.sh` tidak memuat build. Pertama dijalankan di Sprint 10.
- Menunggu user: tidak ada.

### Sprint 9

- Dibuat: `backend/Dockerfile`, `frontend/Dockerfile`, `nginx.conf`, `deploy/docker-compose.yml`, `deploy/.env.example`, `deploy/backup.sh`, langkah deploy di README.
- Keputusan: `TRUSTED_PROXIES` diisi subnet jaringan compose, dan Nginx menimpa `X-Forwarded-For`, agar rate limit per pengunjung dan IP tidak bisa dipalsukan.
- Keputusan: header keamanan halaman dipasang di Nginx lewat file include, karena `add_header` per location memutus pewarisan dari server.
- Keputusan: `client_max_body_size 10m`. Backend memakai `read_only`, `cap_drop: ALL`, media di-chown ke uid 65532.
- Belum diverifikasi: image Docker, `nginx.conf`, compose, dan `backup.sh` belum pernah dijalankan.
- Menunggu user: nilai `PG_NETWORK` dan `PG_CONTAINER` dari VM, lalu deploy.

### Sprint 10

- Hasil: build + prerender lolos, `go test` dan Vitest lolos, curl API 155/155, Playwright 65/65 di dev dan di build produksi (Chrome), Lighthouse mobile Beranda 100/100 tiga kali.
- Diperbaiki: scroll horizontal Produk dan Size, target di bawah 44 px, nama aksesibel, CSV satu kolom di Excel, posisi deep link dan panel Teknologi, tabel Size di 1024, tombol header, `color-scheme`, state kosong Teknologi dan Lab index, location `/brand/` di Nginx.
- Keputusan: CSV memakai BOM + `;`. Excel berpemisah koma memakai XLSX. `sep=` ditolak karena merusak huruf beraksen (diuji di Excel 16).
- Keputusan: `check.sh` ikut menjalankan Vitest. `e2e/serve-dist.mjs` meniru `nginx.conf` untuk menguji build produksi tanpa Docker.
- Belum diverifikasi: image Docker, `nginx.conf` asli, compose, `backup.sh` (dicek saat deploy di VM), Firefox, Safari, perangkat fisik, dan `90-cleanup-test-data.sql`.
- Menunggu user: jalankan cleanup SQL, lalu deploy.

#### Delivery Gate

| Poin AntiSlop | Hasil | Bukti |
|---|---|---|
| Tanpa em dash | PASS | Pindai 41 berkas teks `dist`, 112 berkas sumber, dan pesan commit: 0 temuan |
| Tanpa emoji | PASS | Pindai rentang Unicode emoji pada `dist` dan sumber: 0 temuan |
| Target sentuh 44 px | PASS | `smallTargets` di 17 halaman, 5 lebar: 0 temuan. Link di dalam kalimat dikecualikan seperti WCAG 2.5.8 |
| Tanpa scroll horizontal dari 320 | PASS | `scrollWidth` di 5 lebar, publik dan admin: 0 |
| Fokus terlihat | PASS | Outline 2px signal dicek per Tab. Satu-satunya `outline: none` untuk kontainer `tabindex="-1"` yang difokuskan kode, bukan kontrol |
| Keyboard penuh | PASS | Skip link, menu, panel Teknologi, tab Size, formulir B2B, lightbox, dialog, login admin diselesaikan dengan keyboard |
| State loading, kosong, error | PASS | Semua halaman data memuat ketiganya. Skeleton, kosong, dan Coba lagi diuji di 6 route publik |
| CTA spesifik | PASS | Grep Get Started, Learn More, Selengkapnya, Submit: 0 temuan |
| Hover punya padanan tap | PASS | Hover hanya di `@media (hover: hover)` dan tiap aturan punya `:active` (tinjauan kode, bukan uji otomatis) |
| Komentar kode | PASS | Grep TODO, FIXME, banner, label CAPS: 0 temuan nyata (tinjauan otomatis, kualitas isi tidak diukur) |
| Satu motif, warna, gerak | PASS | Warna di luar token tidak ada di sumber. Glow, shadow, gradien neon: 0 temuan. Hanya ticker yang berjalan saat diam |

### Sprint 12

- Dibuat: token semantik dua tema (terang default), `useTheme` + `ThemeToggle` di header publik dan admin, skrip anti-kedip dengan hash di CSP, `BrandLogo`, `motion/theme.ts` (Knit Field dan Fabric Probe menggambar ulang saat tema berganti).
- Keputusan: utilitas Tailwind memakai `@theme inline`, jadi kelas seperti `bg-surface` langsung merujuk `var(--surface)`. `void` dan `bone` berganti nama jadi `bg` dan `fg` (`bg-bg`, `text-fg`).
- Keputusan: `nvm-logo.png` (bukan webp) ternyata putih murni di atas transparan. Logo dipakai sebagai CSS mask yang diisi `--fg`, jadi bentuknya utuh dan warnanya ikut tema tanpa filter invert atau salinan yang diwarnai ulang.
- Keputusan: `prerender.mjs` menghitung sha256 setiap skrip inline dan menggagalkan build bila hash tidak ada di `nginx-security-headers.conf`. Build sekali dijalankan untuk memastikan ini, tanpa server atau browser.
- Catatan: favicon masih logo putih, sehingga hampir tak terlihat di tab browser bertema terang.
- Menunggu user: file logo resmi versi gelap atau SVG satu warna (untuk favicon dan pengganti mask).

### Sprint 13

- Dibuat: `src/i18n` (`id.ts` sumber tipe, `en.ts` bertipe `Messages`, `useI18n`, `localePath`, `apiErrorText`), route `/en` dari satu daftar halaman, `LangToggle` (menjaga path, query, dan hash), `routeHead` untuk canonical, hreflang id/en/x-default, `og:locale`, `html lang`. Prerender 20 halaman. Sitemap backend memuat kedua bahasa dengan `xhtml:link`.
- Keputusan: slug path sama di dua bahasa (`/en/teknologi`, contoh di FR-110). Halaman diberi key bahasa di `PublicLayout`, agar ganti bahasa memuat ulang data.
- Keputusan: slogan brand (Fabric first., Engineered to perfection., The Lab), nama tech, fit, Wholesale, Collaboration, dan On the rack tidak diterjemahkan. Validasi formulir mengembalikan kunci kamus, error API dan field dari backend ditampilkan lewat kode (FR-116). Admin tetap memakai teks backend.
- Keputusan: `docs/terjemahan.md` dibuat otomatis oleh `frontend/scripts/terjemahan.mjs` dari kamus, dan `check.sh` gagal bila file itu tertinggal. Bisa dibuat dari Sprint 13 karena teks UI sudah diterjemahkan sekarang.
- Keputusan: `VITE_PUBLIC_BASE_URL` (dari `PUBLIC_BASE_URL` di compose) membuat canonical dan hreflang absolut. Tanpa itu, misalnya di laptop dev, URL tetap relatif.
- Catatan: teks tech (tagline, sub, deskripsi, chip) masih Inggris di kedua bahasa sampai Sprint 14.
- Menunggu user: cek isi `docs/terjemahan.md`.

### Sprint 14

- Dibuat: migrasi `0003_i18n` (tabel `tech_i18n`, `gallery_items.alt_en` dan `caption_en`, `testimonials.lang`), seed `techs_id.json`, query `ListTechsByLang`, `GET /api/techs?lang` dan `/api/gallery?lang`, kolom baru di admin Galeri dan Testimoni, atribut `lang` pada transkrip.
- Keputusan: migrasi aman untuk produksi. Tidak ada yang dihapus. Baris `en` disalin dari kolom `techs`, baris `id` hanya untuk tech yang masih ada (JOIN), dan semua INSERT memakai `ON CONFLICT DO NOTHING`. Kolom baru punya default. Belum dijalankan ke database mana pun.
- Keputusan: kolom tech di `techs` tetap ada sebagai cadangan, query memakai COALESCE. `?lang` kosong berarti `id`, nilai lain ditolak 400. Hak `compro_app` atas `tech_i18n` datang dari default privileges di bootstrap.
- Keputusan: admin belum bisa mengubah teks tech per bahasa. SRS tidak meminta editor, jadi perubahan teks tech lewat migrasi seperti seed.
- Koreksi proses: laporan ini sempat ter-commit rusak di `b68261a`, karena backtick di string shell ikut dijalankan. Salah satunya `migrate up` tanpa `-database`, yang hanya mencetak bantuan, jadi tidak ada migrasi yang berjalan.
- Menunggu user: cek terjemahan tech di `docs/terjemahan.md` (bagian tech (seed)), lalu `migrate up` di VM saat Sprint 17.

### Sprint 15

- Dibuat: `motion/Swatch.ts` + `SwatchView` (panel Teknologi dengan Re-weave 400 ms, baris tech di Produk, strip 11 swatch di Beranda), `SizeRuler` di Size (jarum ke tinggi badan di Mode A, lebar kaos di Mode B), utilitas `.measure-grid` di hero dan ruler.
- Keputusan: kerapatan dari generasi, pola dari kebutuhan (hot berpori dengan aliran udara, shape berusuk kaku, move bergelombang melar 4 arah, soft simpul mengembang, cold lapisan belakang, layer cangkang). Variasi kecil dari hash key agar CURFLEX dan FLEXE, serta PUFFMAX dan MELTWRAP, tetap berbeda.
- Keputusan: swatch menggambar satu frame diam. Peragaan hanya sekali saat hover atau fokus pada link atau baris pembungkusnya (`data-swatch-host`). Berhenti di luar viewport dan saat tab tersembunyi, diam saat reduced motion, dan menggambar ulang saat tema berganti. Semua swatch diberi label "Ilustrasi, bukan hasil uji".
- Keputusan: ruler disembunyikan dari pembaca layar, karena nilainya sudah ada di input. Size marker menunggu 400 ms sampai jarum tiba, tanpa jeda saat reduced motion.
- Catatan: build dan prerender 20 halaman lolos. Perbedaan visual 11 swatch, kontras, dan Lighthouse baru dicek di Sprint 16 (AC-22, AC-23).
- Menunggu user: tidak ada.

### Sprint 16

- Hasil: build dan prerender 20 halaman lolos. `go test` dan Vitest lolos (Vitest 50). curl API 196/196 terhadap `nvm_compro_test`. Playwright di dev: 105 lolos, 23 dilewati karena hanya berlaku di build produksi. Di build produksi: 128/128. Lighthouse mobile Beranda ID dan EN, tema terang, tiga kali masing-masing: 100/100/100/100 (LCP 0,8 s, CLS 0, TBT 0 ms).
- Migrasi 0003 di `nvm_compro_test` (dicek read-only): `tech_i18n` 22 baris (en 11, id 11), baris en sama dengan kolom `techs`, kolom baru punya default, `compro_app` bisa SELECT dan INSERT.
- AC-20: `darkTheme` dihapus sementara dari `en.ts`, `vue-tsc` gagal dengan TS2741, file dipulihkan tanpa diff. Ditambah test Vitest kunci kamus sama dan tanpa teks kosong.
- Diperbaiki: nama aksesibel tombol ID / EN tidak memuat teks yang terlihat (axe label-content-name-mismatch di semua halaman). Peragaan swatch berakhir dengan partikel udara tersisa, bukan frame diam.
- Disesuaikan: test lama untuk teks Indonesia baru, cincin fokus `--signal` tema aktif, `color-scheme` terang default, pola route dengan `?lang`, label admin yang kini ambigu.
- Keputusan: `swatchPattern` dipisah dari kanvas agar 11 pola bisa diuji di Vitest. Perbedaan pikselnya diuji di Playwright pada kedua tema.
- Keputusan: test storage diblokir hanya dinilai di build produksi, karena klien dev Vite ikut membaca localStorage dan memunculkan error yang tidak ada di situs.
- Temuan: tanpa `VITE_PUBLIC_BASE_URL`, canonical dan hreflang relatif sehingga SEO Lighthouse 83. Dengan variabel itu (diwajibkan compose di VM) SEO 100. Test AC-21 menerima keduanya.
- Belum diverifikasi: image Docker dan Nginx asli untuk v1.2 (Sprint 17), Firefox, Safari, perangkat fisik.
- Menunggu user: cek `docs/terjemahan.md`, logo resmi versi gelap atau SVG (favicon), lalu deploy Sprint 17.

#### Delivery Gate v1.2

| Poin AntiSlop | Hasil | Bukti |
|---|---|---|
| Tanpa em dash | PASS | Pindai `dist`, sumber, dokumen, dan pesan commit sejak Sprint 12: 0 temuan |
| Tanpa emoji | PASS | Pindai rentang Unicode emoji di 176 berkas: 0 temuan |
| Target sentuh 44 px | PASS | `smallTargets` di 11 halaman publik ID, 11 EN (320 dan 1440), 6 admin, 5 lebar, 2 tema: 0 temuan |
| Tanpa scroll horizontal dari 320 | PASS | `scrollWidth` di set yang sama: 0 |
| Fokus terlihat | PASS | Outline 2px `--signal` tema aktif dicek per Tab di Beranda dan formulir B2B |
| Keyboard penuh | PASS | Skip link, menu, tombol tema dan bahasa, panel Teknologi, tab Size, formulir B2B, lightbox, dialog, login admin |
| State loading, kosong, error | PASS | Termasuk strip swatch Beranda. Error dari kode diuji di ID dan EN (FR-116) |
| CTA spesifik | PASS | Grep Get Started, Learn More, Selengkapnya, Read more, Submit: 0 temuan |
| Hover punya padanan tap | PASS | Aturan hover baru (swatch, tombol) ada di `@media (hover: hover)` dengan `:active` (tinjauan kode) |
| Komentar kode | PASS | Grep TODO, FIXME, banner, label CAPS: 0 temuan (kualitas isi tidak diukur) |
| Warna, motif, gerak | PASS | Hex di luar `tokens.css` hanya dua nilai `--bg` di skrip anti-kedip. `#FF5A36` di tema terang: 0 elemen di 17 halaman. Shadow, blur, glow: 0. Gradien hanya pola rajut dan grid ukur. Swatch, ruler, dan kanvas diam saat reduced motion |
| Axe dan kontras dua tema (AC-18) | PASS | Axe wcag2a sampai wcag22aa termasuk color-contrast: 0 pelanggaran di semua kombinasi di atas |

### Sprint 17

Dikerjakan user di `nvm-server`, laporan dicatat dari keterangan user.

- Backup manual sebelum deploy: `db-20261102-091358.dump`, OK.
- `git pull` ke `cc52692`. Perubahan di `deploy/` hanya `VITE_PUBLIC_BASE_URL` dari `PUBLIC_BASE_URL`, `deploy/.env` tidak diubah.
- Migrasi `0003` ke `nvm_compro` lewat container `migrate/migrate`: `3/u i18n`, versi 3, dirty false. `tech_i18n` en 11, id 11. Status on_rack yang diatur tim (aezy, aezy-cotton) tidak berubah.
- `docker compose up -d --build`: pengaman binary statis lolos, health ok, `/teknologi` dan `/en/teknologi` 200, canonical dan hreflang memakai URL penuh, `/api/techs?lang=id` mengembalikan teks Indonesia, CSP memuat hash skrip anti-kedip.
- Cek browser: belum dilaporkan.

### Sprint 18

- Dibuat: migrasi `0004_site_settings`, `gate.go` (cache memori, fail closed bila setting tidak terbaca), `GET /api/gate`, `GET /api/admin/settings`, `PUT /api/admin/settings/password-gate`, robots dan sitemap mengikuti gate, `nginx.conf` dengan `auth_request`, `PasswordPage`, `safeNext`, `AdminSettings`, gate di `serve-dist.mjs`. Strip swatch Beranda dihapus, cangkang ANTSHELL kini bergaris.
- Keputusan: Nginx menyajikan halaman password langsung di alamat yang terkunci (status 401, bahasa dari awalan `/en`). `main.ts` mengganti alamat menjadi `/password?next=...` sebelum router jalan, agar hydration cocok, lalu login memuat ulang halaman tujuan.
- Keputusan: API publik yang terkunci menjawab JSON 401 `UNAUTHORIZED`, bukan HTML. Header no-store dan noindex untuk API dipasang backend, untuk HTML oleh Nginx lewat header `X-Gate` dari `/api/gate`, jadi pengunjung yang sudah login pun tidak membuat versi terbuka masuk cache.
- Keputusan: subrequest gate memakai `proxy_method GET`, karena tanpa itu POST inquiry akan mengirim POST ke `/api/gate`.
- Keputusan: `newServer` dan `routes` dipisah dari `NewRouter`, dan pencarian sesi bisa diganti, agar gate diuji tanpa database.
- Hasil: `go test` lolos (gate 5 kombinasi, fail closed, perubahan seketika, PUT butuh sesi dan CSRF, robots dan sitemap, header, migrasi 0004). Vitest lolos, termasuk 30 kasus `safeNext`. `check.sh` dan build 22 halaman lolos. Playwright di dev: 117 lolos, 27 dilewati karena khusus build produksi. Di build produksi lewat `serve-dist` yang meniru gate Nginx: 144/144.
- Diperbaiki saat pengujian: `safeNext` meloloskan bentuk ter-encode (`/%5Cevil.com`, `/%2F%2Fevil.com`, encode ganda, tab dan null ter-encode); kini setiap lapis decoding diperiksa. `check.sh` memastikan subrequest gate tanpa body. `serve-dist` tidak lagi mati saat backend putus di tengah respons.
- Catatan: run produksi pertama gagal karena timeout, saat ping database lewat tunnel mencapai batas 3 detik. Setelah tunnel direstart (health 8 sampai 149 ms) semua lolos. `scripts/dev-db-tunnel.sh` kini memakai ServerAliveInterval, ServerAliveCountMax, dan ExitOnForwardFailure, agar tunnel yang putus langsung berhenti.
- Belum diverifikasi: Nginx asli (binary tidak bisa dipakai di PC ini). Perintah curl untuk VM ada di README bagian Halaman password, termasuk POST inquiry saat gate aktif dan mati.
- Menunggu user: deploy produksi sesuai README bagian Halaman password, lalu curl di VM. Setelah migrasi 0004 situs langsung terkunci sampai dimatikan di `/admin/pengaturan`.

### Sprint 19

- Dibuat: migrasi `0005_shopee_links` (`tech_links`, `collabs.url`, `techs.visible`, MELTWRAP tersembunyi, 21 link awal dari `seed/tech_links.json`), validasi `ValidateShopeeURL` di backend dan `shopeeUrlError` di frontend, `PATCH /api/admin/techs/:key` menerima `on_rack`, `visible`, `links` dalam satu transaksi, `PATCH /api/admin/collabs/:key` menerima `available` dan `url`, `ExternalLink`, matriks Produk dan link per fit di Teknologi, halaman admin Tech dan collab yang baru.
- Keputusan: link tanpa fit hanya untuk tech yang memang tidak punya fit. Tech dengan fit mendapat satu kolom per fit.
- Keputusan: link beli tampil berdasarkan ada tidaknya link, tidak lagi menunggu status on the rack. Status tetap tampil sebagai label.
- Keputusan: tautan "Lihat semua Core" dan "Lihat semua Graphic" dihapus karena Shopee tidak punya halaman koleksi untuk keduanya. Toko Shopee ada di hero dan footer.
- Keputusan: `VITE_SHOPEE_URL` kosong jatuh ke `https://shopee.co.id/novoidminds`, agar tombol hero tidak hilang.
- Keputusan: jumlah material system di meta Beranda dan Teknologi serta CTA dihitung dari `/api/lab-stats` (tech yang tampil). HTML prerender memakai kalimat tanpa angka ("Lihat semua material system"), karena build tidak bisa tahu jumlah yang nanti diubah admin. Kalimat "dari AEZY sampai ..." dihapus.
- Hasil: `go test` lolos (validasi URL 26 kasus, link per fit, PATCH collab menolak link asing tanpa database, migrasi 0005). Vitest lolos (26 kasus URL). `check.sh` dan build 22 halaman lolos, `dist` tanpa kata shopify. Playwright di `nvm_compro_test`: dev 137 lolos, 29 dilewati karena khusus build produksi. Build produksi lewat `serve-dist`: 166/166.
- Diperbaiki saat pengujian: client membawa setiap 401 ke login admin, termasuk 401 API publik saat situs terkunci, sehingga halaman password berpindah ke `/admin/login`. Kini hanya 401 dari `/api/admin/*`. Test admin memakai selector per baris karena tombol "Simpan link" ikut memuat nama tech.
- Menunggu user: deploy produksi (backup, migrasi 0005 ke `nvm_compro`, compose up --build), lalu isi link koleksi collab di `/admin/katalog`.
