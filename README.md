# nvm-company-profile

Website company profile No Void Minds (NVM). Kebutuhan ada di `docs/SRS-NVM-CompanyProfile-v1.1.docx`, rencana kerja di `docs/sprint.md`.

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

2. Buat role dan database, sekali saja. Password diminta interaktif:

   ```bash
   docker cp deploy/sql/00-bootstrap.sql "$PG_CONTAINER":/tmp/00-bootstrap.sql
   docker exec -it "$PG_CONTAINER" psql -U postgres -f /tmp/00-bootstrap.sql
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

6. Pasang cron: backup harian (simpan 14 hari) dan pembersihan inquiry lebih dari 12 bulan (BR-03):

   ```cron
   0 2 * * * /path/ke/repo/deploy/backup.sh
   30 2 * * * cd /path/ke/repo && docker compose -f deploy/docker-compose.yml exec -T backend compro-admin purge-inquiries
   ```

7. Seed awal menandai semua tech `Belum tersedia`. Atur status on the rack di `/admin/katalog`, karena tombol Shopify di halaman Teknologi tersembunyi sampai statusnya on.

`COOKIE_SECURE` tetap `false` selama akses lewat HTTP LAN.
