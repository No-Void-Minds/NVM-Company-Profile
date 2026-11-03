# nvm-company-profile

Website company profile No Void Minds (NVM). Kebutuhan ada di `docs/SRS-NVM-CompanyProfile-v1.2.docx`, rencana kerja di `docs/sprint.md`.

## Jalan di laptop dev

Butuh Go 1.27, Node 24, sqlc, golang-migrate, dan akses SSH ke `nvm-server`.

```bash
# Terminal 1: tunnel ke Postgres, tersedia di 127.0.0.1:15432
./scripts/dev-db-tunnel.sh

# Terminal 2: backend di 127.0.0.1:8082
cd backend
cp .env.example .env   # lalu isi DATABASE_URL dan IP_HASH_SALT
go run ./cmd/server

# Terminal 3: frontend di 127.0.0.1:5175
cd frontend
npm install
npm run dev
```

Pemeriksaan sebelum commit: `./scripts/check.sh`.

## Pengujian

```bash
./scripts/check.sh            # format, lint, tipe, go test, vitest
```

Uji browser memakai Chrome yang terpasang. Backend harus jalan, dan akun uji dibaca dari `UJI_ADMIN_PASSWORD`:

```bash
cd frontend
npx playwright test                                   # lawan server dev di 5175
npm run build && node e2e/serve-dist.mjs              # build produksi di 4180, meniru nginx.conf
E2E_BASE_URL=http://127.0.0.1:4180 npx playwright test
```

Rate limit tersimpan di memori backend, jadi restart backend sebelum mengulang suite. Data uji dihapus dengan `deploy/sql/90-cleanup-test-data.sql`.

## Database

Sekali di awal, sebagai superuser Postgres: jalankan `deploy/sql/00-bootstrap.sql` dengan `psql`.

Migrasi memakai role `compro_migrator`:

```bash
migrate -path backend/migrations -database "$MIGRATOR_URL" up
```

Setelah mengubah `backend/internal/db/queries/` jalankan `sqlc generate` dari folder `backend`.

## Deploy LAN di `nvm-server`

Jalankan dari folder repo di VM. Situs terbuka di `http://<IP VM>:8092`.

1. Isi konfigurasi:

   ```bash
   cp deploy/.env.example deploy/.env
   set -a; source deploy/.env; set +a
   ```

2. Buat role dan database, sekali saja. Superuser tidak selalu bernama `postgres` (di `nvm-server` namanya `nvm_internal`), jadi cek dulu dengan perintah pertama di bawah, lalu pakai hasilnya sebagai `<superuser>`. Password diminta interaktif:

   ```bash
   docker exec "$PG_CONTAINER" printenv POSTGRES_USER
   docker cp deploy/sql/00-bootstrap.sql "$PG_CONTAINER":/tmp/00-bootstrap.sql
   docker exec -it "$PG_CONTAINER" psql -U <superuser> -d postgres -f /tmp/00-bootstrap.sql
   docker exec "$PG_CONTAINER" rm /tmp/00-bootstrap.sql
   ```

3. Jalankan migrasi sebagai `compro_migrator`:

   ```bash
   docker run --rm --network "$PG_NETWORK" -v "$PWD/backend/migrations:/migrations:ro" \
     migrate/migrate -path=/migrations \
     -database "postgres://compro_migrator:PASSWORD@$PG_CONTAINER:5432/nvm_compro?sslmode=disable" up
   ```

4. Siapkan folder media. Image distroless berjalan sebagai uid 65532:

   ```bash
   sudo mkdir -p /srv/nvm-compro/media /srv/nvm-compro/backup
   sudo chown -R 65532:65532 /srv/nvm-compro/media
   sudo chown "$USER" /srv/nvm-compro/backup
   ```

5. Nyalakan dan buat akun admin pertama:

   ```bash
   docker compose -f deploy/docker-compose.yml up -d --build
   docker compose -f deploy/docker-compose.yml exec backend compro-admin create-user <username>
   ```

6. Pasang cron lewat `crontab -e` milik user yang ada di grup `docker`: backup harian (simpan 14 hari) dan pembersihan inquiry lebih dari 12 bulan (BR-03). VM memakai UTC, jadi jadwal ditulis dalam UTC:

   ```cron
   # 19.00 UTC = 02.00 WIB: backup database dan media
   0 19 * * * /srv/nvm-company-profile/deploy/backup.sh >>/srv/nvm-compro/backup/cron.log 2>&1
   # 19.30 UTC = 02.30 WIB: hapus inquiry lebih dari 12 bulan
   30 19 * * * cd /srv/nvm-company-profile && docker compose --env-file deploy/.env -f deploy/docker-compose.yml exec -T backend compro-admin purge-inquiries >>/srv/nvm-compro/backup/purge.log 2>&1
   ```

   Backup berisi data pribadi inquiry B2B (UU PDP). Skrip memakai `umask 077` dan membuat folder backup dengan izin 700, jadi hanya pemiliknya yang bisa membaca. File dari run sebelum perubahan ini dirapikan sekali dengan `chmod 600 /srv/nvm-compro/backup/*`.

   Setiap run backup menulis satu baris ke `/srv/nvm-compro/backup/backup.log`: waktu, `OK` atau `GAGAL`, ukuran file db dan media, dan pesan error bila gagal. `cron.log` menampung output lain, misalnya `.env` yang tidak terbaca. Cek dengan `tail /srv/nvm-compro/backup/backup.log`.

7. Link beli ke Shopee per tech dan fit, link koleksi per collab, saklar tampil di situs, dan status on the rack diatur di `/admin/katalog`. Link hanya boleh ke `https://shopee.co.id`. Kombinasi tanpa link tampil "-" di halaman Produk.

`COOKIE_SECURE` tetap `false` selama akses hanya lewat HTTP LAN. Untuk rilis publik lihat bagian berikut.

## Rilis publik

Situs dibuka lewat Cloudflare Tunnel yang sudah berjalan sebagai service sistem di `nvm-server` (bukan service di compose). Tunnel meneruskan ke `http://localhost:8092`.

DNS `novoidminds.id` dikelola di Cloudflare sejak 2 November 2026. Record di GoDaddy hanya cadangan dan tidak aktif, jadi perubahan DNS dilakukan di Cloudflare.

1. Isi `deploy/.env` (lihat `deploy/.env.example`):

   ```bash
   PUBLIC_BASE_URL=https://novoidminds.id
   COOKIE_SECURE=true
   COMPRO_SUBNET=172.30.92.0/24
   COMPRO_GATEWAY_IP=172.30.92.1
   ```

   Dengan `COOKIE_SECURE=true`, login admin hanya bisa lewat `https://novoidminds.id/admin`. Login lewat `http://<IP VM>:8092` tidak bisa lagi, karena browser tidak mengirim cookie Secure lewat HTTP.

2. Nyalakan ulang. Gateway jaringan `compro` kini ditetapkan di compose, jadi jaringan lama perlu dibuat ulang sekali dengan `down` lalu `up`:

   ```bash
   docker compose --env-file deploy/.env -f deploy/docker-compose.yml down
   docker compose --env-file deploy/.env -f deploy/docker-compose.yml up -d --build
   ```

3. Di dashboard Cloudflare (Zero Trust, Networks, Tunnels), buka tunnel `nvm-server` (dulu `NVM-ERP-Tunnel`), lalu tambahkan published application route: hostname `novoidminds.id`, service `http://localhost:8092`.

4. Arahkan `www.novoidminds.id` ke `https://novoidminds.id` lewat Redirect Rules di Cloudflare (301, path dan query ikut).

IP pengunjung: request dari tunnel masuk ke container frontend dari gateway jaringan `compro` (`COMPRO_GATEWAY_IP`). Nginx hanya memercayai header `CF-Connecting-IP` dari alamat itu, lalu meneruskannya ke backend sebagai `X-Real-IP` dan `X-Forwarded-For`. Request LAN langsung ke port 8092 tetap memakai alamat aslinya. Cek di VM setelah deploy:

```bash
# Dari VM sendiri (lewat gateway): log harus mencatat 203.0.113.7
curl -s -o /dev/null -H 'CF-Connecting-IP: 203.0.113.7' http://localhost:8092/api/health
docker compose --env-file deploy/.env -f deploy/docker-compose.yml logs --tail=1 frontend

# Dari komputer lain di LAN: log harus mencatat IP komputer itu, bukan 203.0.113.7
curl -s -o /dev/null -H 'CF-Connecting-IP: 203.0.113.7' http://<IP VM>:8092/api/health
```

Kalau uji LAN mencatat alamat gateway, Docker meneruskan port lewat userland proxy, dan header dari LAN ikut dipercaya. Periksa pengaturan `userland-proxy` dan iptables Docker di VM sebelum rilis.

Uji yang sama di laptop dev memakai nginx sungguhan: `NGINX_BIN=/path/ke/nginx node scripts/test-real-ip.mjs` dari folder `frontend`. Tanpa `NGINX_BIN`, `check.sh` hanya menjalankan pemeriksaan statis (satu `set_real_ip_from`, gateway sama di compose dan `.env.example`, berada di dalam subnet).

## Halaman password

Seperti halaman password toko online: selama aktif, pengunjung hanya melihat `/password` (atau `/en/password`), dan tim masuk dengan akun admin. Nginx menanyakan `/api/gate` sebelum setiap halaman HTML, API publik, dan foto. Aset build, font, logo, `/admin`, `/api/admin/*`, `/api/health`, dan halaman password selalu lewat. Saklarnya ada di `/admin/pengaturan`.

Migrasi `0004` memasang halaman password dalam keadaan **aktif**. Setelah deploy, situs terkunci sampai dimatikan dari `/admin/pengaturan`.

Deploy di VM:

```bash
cd /srv/nvm-company-profile
./deploy/backup.sh && tail -1 /srv/nvm-compro/backup/backup.log   # harus OK
git pull
set -a; source deploy/.env; set +a
docker run --rm --network "$PG_NETWORK" -v "$PWD/backend/migrations:/migrations:ro" \
  migrate/migrate -path=/migrations \
  -database "postgres://compro_migrator:PASSWORD@$PG_CONTAINER:5432/nvm_compro?sslmode=disable" up
docker compose --env-file deploy/.env -f deploy/docker-compose.yml up -d --build
```

Cek di VM saat halaman password aktif. Angka di komentar adalah hasil yang benar:

```bash
B=http://localhost:8092
code() { curl -s -o /dev/null -w '%{http_code}\n' "$@"; }

# HTML terkunci: 401, halaman password, tidak disimpan cache, tidak diindeks
code $B/teknologi                                           # 401
curl -s $B/teknologi | grep -c 'name="nvm-gate"'            # 1
curl -s $B/en/teknologi | grep -o '<html lang="en">'        # <html lang="en">
curl -sI $B/teknologi | grep -iE '^(cache-control|x-robots-tag):'
#   Cache-Control: private, no-store
#   X-Robots-Tag: noindex

# API publik terkunci, termasuk POST inquiry
code "$B/api/techs?lang=id"                                 # 401
code -X POST $B/api/inquiries -H 'Content-Type: application/json' -d '{}'   # 401
curl -sI "$B/api/techs?lang=id" | grep -iE '^(cache-control|x-robots-tag):'

# Tetap lewat
asset=$(curl -s $B/password | grep -o '/assets/[^"]*\.js' | head -1)
code "$B$asset"                                             # 200
code $B/fonts/D-DIN.woff2                                   # 200
code $B/brand/nvm-logo.png                                  # 200
code $B/admin/login                                         # 200
code $B/api/health                                          # 200
code $B/password                                            # 200
code $B/en/password                                         # 200

# Favicon, dengan cache 30 hari
for f in favicon.ico favicon-32.png apple-touch-icon.png icon-192.png icon-512.png; do
  echo "$f $(code $B/$f)"                                   # 200
done
curl -sI $B/favicon-32.png | grep -i '^cache-control:'      # public, max-age=2592000

# Robots dan sitemap
curl -s $B/robots.txt                                       # User-agent: * / Disallow: /
code $B/sitemap.xml                                         # 404

# Dengan sesi admin, halaman terbuka tapi tetap private dan noindex.
# Password dibaca tanpa tampil dan tidak masuk riwayat shell.
read -rs -p 'Password admin: ' PW; echo
printf '{"username":"%s","password":"%s"}' "<username>" "$PW" > /tmp/login.json; unset PW
curl -s -c /tmp/jar -H 'Content-Type: application/json' -d @/tmp/login.json $B/api/admin/login >/dev/null
rm /tmp/login.json
code -b /tmp/jar $B/teknologi                               # 200
curl -sI -b /tmp/jar $B/teknologi | grep -iE '^(cache-control|x-robots-tag):'   # private, no-store / noindex
rm /tmp/jar
```

Setelah halaman password dimatikan di `/admin/pengaturan`: `code $B/teknologi` menjadi 200, `Cache-Control` kembali `no-cache` tanpa `X-Robots-Tag`, dan sitemap kembali 200.

POST inquiry di kedua keadaan gate. Payload mengisi field honeypot `website`, yang dijawab backend dengan 201 palsu tanpa menyimpan apa pun, jadi uji ini tidak menambah inquiry di produksi. Subrequest gate tidak membawa body (`proxy_pass_request_body off`), jadi isi formulir hanya sampai ke backend kalau gate mengizinkan:

```bash
probe='{"website":"http://uji","name":"Uji gate"}'
post() { curl -s -o /dev/null -w '%{http_code}\n' -X POST $B/api/inquiries -H 'Content-Type: application/json' -d "$probe"; }

post    # gate aktif: 401, berhenti di Nginx dan tidak sampai ke backend
# Matikan halaman password di /admin/pengaturan, lalu:
post    # gate mati: 201, sampai ke backend
# Nyalakan lagi bila situs memang masih harus terkunci.
```

Lewat domain, setelah route tunnel aktif: `curl -sI https://novoidminds.id/teknologi | grep -iE '^(cache-control|x-robots-tag|cf-cache-status):'`. Selama terkunci, `cf-cache-status` tidak boleh `HIT`.

## Pulihkan dari backup

Cara ini sudah terbukti di `nvm-server`. Pemulihan diuji ke database terpisah, jadi `nvm_compro` tidak tersentuh. Ganti `<superuser>` (di `nvm-server`: `nvm_internal`, lihat langkah 2 Deploy LAN) dan `<stamp>` dengan nama file di `/srv/nvm-compro/backup`. Dump dikirim lewat stdin dengan `docker exec -i`, jadi file tidak perlu disalin ke container:

```bash
set -a; source deploy/.env; set +a
docker exec "$PG_CONTAINER" createdb -U <superuser> nvm_compro_restore
docker exec -i "$PG_CONTAINER" pg_restore -U <superuser> -d nvm_compro_restore \
  --no-owner --no-privileges --exit-on-error <"/srv/nvm-compro/backup/db-<stamp>.dump"
```

Bandingkan jumlah baris tiap tabel dan versi `schema_migrations`. Jalankan query yang sama dengan `-d nvm_compro`, angkanya harus sama atau hanya selisih data sejak backup dibuat:

```bash
docker exec "$PG_CONTAINER" psql -U <superuser> -d nvm_compro_restore -c '\dt'
docker exec "$PG_CONTAINER" psql -U <superuser> -d nvm_compro_restore -c "
  SELECT (SELECT version FROM schema_migrations) AS migrasi,
         (SELECT count(*) FROM techs) AS techs,
         (SELECT count(*) FROM collabs) AS collabs,
         (SELECT count(*) FROM size_charts) AS size_charts,
         (SELECT count(*) FROM gallery_items) AS galeri,
         (SELECT count(*) FROM testimonials) AS testimoni,
         (SELECT count(*) FROM inquiries) AS inquiry,
         (SELECT count(*) FROM admin_users) AS admin,
         (SELECT count(*) FROM sessions) AS sesi,
         (SELECT count(*) FROM audit_log) AS audit;"
```

Media: buka arsip di folder sementara, lalu cocokkan sha256 setiap file dengan folder asli. Tanpa output selain `media cocok` berarti semua file sama. File yang diunggah setelah backup dibuat akan muncul sebagai `No such file`:

```bash
mkdir -m 700 /tmp/media-restore
tar -xzf "/srv/nvm-compro/backup/media-<stamp>.tar.gz" -C /tmp/media-restore
(cd /srv/nvm-compro/media && find . -type f -exec sha256sum {} +) >/tmp/media-restore.sha256
(cd /tmp/media-restore && sha256sum --quiet -c /tmp/media-restore.sha256) && echo "media cocok"
find /tmp/media-restore -type f | wc -l
find /srv/nvm-compro/media -type f | wc -l
```

Bersihkan setelah selesai:

```bash
docker exec "$PG_CONTAINER" dropdb -U <superuser> nvm_compro_restore
rm -rf /tmp/media-restore /tmp/media-restore.sha256
```

Bila container backend restart terus, baca lognya lalu periksa binary di dalam image. Image distroless tidak punya shell, jadi binary disalin keluar dulu:

```bash
docker compose -f deploy/docker-compose.yml logs --tail=20 backend
id=$(docker create nvm-compro-backend)
docker cp "$id":/usr/local/bin/server /tmp/server-cek
docker rm "$id"
file /tmp/server-cek
rm /tmp/server-cek
```

Hasil yang benar memuat `statically linked`. Kalau log berisi `no such file or directory` dan `file` menampilkan `dynamically linked`, periksa perintah build di `backend/Dockerfile`: harus memakai `CGO_ENABLED=0` dan `-tags nodynamic`.

## Kredit

Font [D-DIN](https://www.datto.com/fonts/d-din) oleh Datto, dengan lisensi SIL Open Font License 1.1. Salinan lisensinya ada di `frontend/public/fonts/OFL.txt`.
