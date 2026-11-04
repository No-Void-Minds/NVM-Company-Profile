# nvm-company-profile

Website company profile No Void Minds (NVM): brand, teknologi material, produk Core vs Graphic, B2B, galeri, testimoni, rekomendasi ukuran, plus panel admin minimal.

Acuan tunggal kebutuhan: `docs/SRS-NVM-CompanyProfile-v1.2.docx`. Kode FR, NFR, BR, AC di sprint dan commit merujuk ke dokumen itu. Bagian 14 (revisi v1.2) menggantikan 6.1, 6.2, dan 6.4 bila bertentangan.
Rencana kerja: `docs/sprint.md`. Kerjakan berurutan, satu sprint selesai baru lanjut.

## Aturan hemat kuota (wajib)

- Bangun semua fitur dulu. Pengujian hanya di Sprint 10.
- Sebelum Sprint 10: jangan menulis unit test, jangan menjalankan dev server, browser, Playwright, curl ke API, atau screenshot.
- Satu-satunya pemeriksaan sebelum Sprint 10 adalah `./scripts/check.sh`, dijalankan sekali di akhir tiap sprint, bukan setelah tiap file.
- Kalau `check.sh` gagal, perbaiki lalu jalankan ulang. Jangan memperbaiki hal di luar pesan gagalnya.
- Jangan membaca ulang file yang baru ditulis. Jangan menjelajah folder di luar repo ini.
- Laporan akhir sprint maksimal 10 baris: apa yang dibuat, keputusan yang diambil, hal yang menunggu user.
- Setelah sprint selesai: update tabel status di `docs/sprint.md`, lalu `git add -A && git commit -m "<tipe>: sprint N <ringkas>"`. Push hanya kalau remote sudah ada.
- Berhenti dan tanya user hanya bila keputusan tidak bisa dibatalkan atau SRS benar-benar tidak menjawab. Selain itu, ambil keputusan paling sederhana yang sesuai SRS dan tulis di laporan.

## Stack

- Backend (`backend/`): Go 1.27, Gin, pgx/v5, sqlc 1.31.1, golang-migrate, excelize (XLSX), encoding/csv, golang.org/x/crypto/argon2, gen2brain/webp atau chai2010/webp untuk konversi WebP (pilih yang build tanpa CGO bila bisa; kalau tidak ada, simpan JPEG/PNG hasil resize dengan `golang.org/x/image/draw` dan catat di laporan).
- Frontend (`frontend/`): Vue 3.5, TypeScript, Vite, Tailwind v4, Vue Router. Tanpa Pinia; state di composable.
- Font: D-DIN (file di `frontend/public/fonts/`, disiapkan user), fallback `@fontsource/space-grotesk`, label spec `@fontsource/jetbrains-mono`.
- Database: PostgreSQL 18 di container yang sudah ada di VM `nvm-server` (Ubuntu, `nvmadmin@192.168.68.144`). Database `nvm_compro`, role `compro_migrator` (DDL) dan `compro_app` (DML saja).
- Laptop dev: Windows + MSYS2 UCRT64. Postgres dicapai lewat SSH tunnel `127.0.0.1:15432`.

## Struktur repo

```
nvm-company-profile/
  backend/
    cmd/server/main.go
    cmd/compro-admin/main.go        create-user, reset-password, purge-inquiries
    internal/
      config/  db/queries/  db/sqlc/  db/seed/
      httpapi/  auth/  content/  inquiry/  media/  export/
    migrations/
    sqlc.yaml  .env.example  go.mod  Dockerfile
  frontend/
    src/ api/ components/ composables/ motion/ pages/ router/ styles/
    public/fonts/  public/brand/
    fonts-src/                      sumber OTF, tidak ikut dist
    nginx.conf  Dockerfile  package.json  vite.config.ts
  deploy/docker-compose.yml
  docs/sprint.md  docs/terjemahan.md  docs/SRS-NVM-CompanyProfile-v1.2.docx
  scripts/check.sh  scripts/dev-db-tunnel.sh
  .gitignore  .editorconfig  .gitattributes  README.md  CLAUDE.md
```

Pola dari NVM-Internal dan nvm-doomsday: paket `httpapi` (bukan `http`), `.env.example` hanya di backend, tidak ada file kosong atau `.gitkeep`, backend dan frontend tidak saling import. Kontrak keduanya hanya API di SRS 7.4.

## Port

| Layanan | Dev | Server |
|---|---|---|
| Backend | 127.0.0.1:8082 | internal container |
| Frontend | 127.0.0.1:5175 (proxy `/api`, `/media`, `/sitemap.xml`, `/robots.txt` ke 8082) | 0.0.0.0:8092 (Nginx) |
| Postgres | 127.0.0.1:15432 lewat SSH tunnel | container yang sudah ada |

Jangan pakai 8080, 8081, 8090, 5173, 5174 (dipakai NVM-Internal dan nvm-doomsday).

## Konten

- Fakta brand hanya dari SRS bagian 3 dan file `backend/internal/db/seed/*.json`. Jangan menambah statistik, testimoni, nama klien, logo mitra, harga, stok angka, atau klaim performa.
- Program member (NVM ALPHA dan ANGELS) tidak dipakai. Jangan muncul di ticker atau di mana pun.
- Tujuan beli hanya Shopee (Sprint 19, FR-130 dan seterusnya). Toko: `https://shopee.co.id/novoidminds`. Link produk per tech dan fit di tabel `tech_links`, link koleksi collab di `collabs.url`, diisi lewat admin. Validasi: hanya `https://shopee.co.id`, disimpan apa adanya.
- Nama tech di UI memakai simbol merek dagang di belakang nama (AEZY™). Di data dan URL tanpa simbol.
- Domain compro: `https://novoidminds.id` (keputusan final 4 November 2026). `novoidminds.com` milik toko Shopify, jangan dipakai sebagai alamat compro.
- WhatsApp: `6282111228700`, tampil `+62 821-1122-8700`.
- UI publik dua bahasa (SRS 14.4): Indonesia di path tanpa awalan, Inggris di `/en`. Teks UI di kamus `id.ts` dan `en.ts`. Versi Inggris memakai teks asli toko, versi Indonesia terjemahan setia tanpa menambah klaim, dicatat di `docs/terjemahan.md`. Admin tetap Indonesia.
- Data yang belum ada (galeri, testimoni, URL Shopee/TikTok Shop/Instagram, size chart selain aezy-regular) ditangani lewat state kosong, bukan placeholder palsu.

## Desain (SRS bagian 6 dan 14)

- Token warna semantik di `frontend/src/styles/tokens.css`: `--bg`, `--surface`, `--raised`, `--fg`, `--muted`, `--line-strong`, `--line`, `--signal`. Tema terang (default, SRS 14.2): `#F3F2EE`, `#FFFFFF`, `#E8E6E0`, `#111317`, `#4A505A`, `#5A606A`, `#D4D1CA`, `#B83218`. Tema gelap (`data-theme="dark"`, token v1.1): `#08090B`, `#0D0F12`, `#15181D`, `#E8EBEF`, `#9AA1AB`, `#6B7380`, `#2A2F36`, `#FF5A36`. `#FF5A36` dilarang di tema terang. Komponen memakai token, bukan hex. Jangan tambah warna lain.
- Radius 2px untuk kontrol, 0 untuk panel. Jarak kelipatan 8px. Skala huruf pakai `clamp()`.
- Motif: garis rajut (grid titik tersambung) di hero, pemisah section, panel tech, skeleton loading; ditambah swatch per tech dan garis ukur (SRS 14.1).
- Animasi: hanya yang ada di SRS 6.4 dan 14.5. Semua punya versi `prefers-reduced-motion`. Canvas berhenti lewat IntersectionObserver dan `visibilitychange`. Tanpa glow, glassmorphism, gradien neon, emoji, ikon sparkle atau robot. Ikon pakai SVG inline.

## Gerbang kualitas (AntiSlop)

- Tanpa em dash di teks UI, copy, komentar, dan commit. Pakai koma, titik, titik dua, atau kurung.
- Tanpa emoji di mana pun.
- Target sentuh minimal 44x44px. Tidak ada scroll horizontal dari 320px.
- Fokus terlihat lewat `:focus-visible` (outline 2px signal, offset 2px). Jangan `outline: none` tanpa pengganti.
- Keyboard penuh: Tab, Enter/Space, Escape untuk menu, dialog, lightbox.
- Setiap tampilan berbasis data punya state loading, kosong, error (komponen bersama di `components/state/`).
- CTA spesifik (contoh "Lihat 11 material system", "Kirim inquiry wholesale"). Jangan "Get Started" atau "Learn More".
- Hover selalu punya padanan tap dengan feedback `:active`.
- Komentar kode: pendek, sentence case, menjelaskan kenapa. Hapus banner dekoratif, label CAPS, komentar yang mengulang kode, TODO tanpa tugas.

## Catatan teknis

- sqlc: tulis `(@param::date) + 6` dengan kurung, karena `@` mengikat lebih lemah dari `+`.
- Format error API: `{"error":{"code":"VALIDATION","message":"...","fields":{"phone":"..."}}}`. Kode: VALIDATION, NOT_FOUND, UNAUTHORIZED, FORBIDDEN, RATE_LIMITED, CONFLICT, INTERNAL.
- Router group seperti NVM-Internal: `api` (publik), `admin` (requireSession), mutasi admin juga `requireCSRF`.
- Waktu memakai zona Asia/Jakarta untuk tampilan dan ekspor.
- Parser size chart menerima pemisah rentang `-` dan `–`, serta `<` dan `>`.
