# Sprint nvm-company-profile

Acuan kebutuhan: SRS v1.1 (`docs/SRS-NVM-CompanyProfile-v1.1.docx`). Aturan kerja: `CLAUDE.md`.

## Cara kerja

- Semua fitur dibangun dulu (Sprint 0 sampai 9). Pengujian menyeluruh hanya di Sprint 10.
- Akhir tiap sprint: `./scripts/check.sh`, update tabel di bawah, `git commit`.
- Status: `belum`, `jalan`, `selesai`, `tertahan`.

## Ringkasan status

| Sprint | Isi | Prio | Status |
|---|---|---|---|
| 0 | Fondasi repo, tooling, token, font, check.sh | M | selesai |
| 1 | Database: migrasi, role, seed | M | selesai |
| 2 | API publik dan inquiry | M | selesai |
| 3 | Auth admin, API admin, media, ekspor, CLI | M | belum |
| 4 | Kerangka frontend dan komponen state | M | belum |
| 5 | Beranda (Knit Field), Brand, Teknologi | M | belum |
| 6 | Produk, B2B, Size, Kontak, Privasi, 404 | M | belum |
| 7 | Galeri, Testimoni, halaman admin | M | belum |
| 8 | Fabric Probe, ticker, prerender, audit log, filter testimoni | S | belum |
| 9 | Docker Compose dan deploy LAN | M | belum |
| 10 | Pengujian menyeluruh dan Delivery Gate | M | belum |
| 11 | Rilis publik lewat Cloudflare Tunnel | - | tertahan |

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

Tertahan sampai atasan menyetujui dan domain ditentukan.

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
